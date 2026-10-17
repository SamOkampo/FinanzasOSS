import type { QuickD1 } from "./index.js";

// Reset applies ONLY to authenticated staging ledger entries. It does not
// delete financial account definitions, bank credentials or iPhone permissions.
// No other database (main app, portfolio brokers, imports) is modified.
export class ResetInputError extends Error {
  constructor(message: string, public readonly status = 422) { super(message); }
}

type Scope = "month" | "all";
type Counts = { manualEntries: number; directExpenses: number };
type CountRow = { manual_entries: number; direct_expenses: number };
type ChallengeRow = {
  id: string; owner_id: string; scope: Scope; month_key: string | null;
  expires_at: string; expected_manual_entries: number;
  expected_shortcut_expenses: number; confirmation_nonce: string | null;
};
const EXPIRES_MS = 5 * 60 * 1000;
const PHRASES: Record<Scope, string> = {
  month: "BORRAR ESTE MES",
  all: "BORRAR TODOS LOS MESES",
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: {
    "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store, private",
    "X-Content-Type-Options": "nosniff", "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
  } });
}
function record(value: unknown, allowed: string[]): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ResetInputError("Invalid reset request");
  }
  const data = value as Record<string, unknown>;
  if (Object.keys(data).some((key) => !allowed.includes(key))) {
    throw new ResetInputError("Unsupported reset field");
  }
  return data;
}
function bogotaMonth(now = new Date()): string {
  const fields = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Bogota", year: "numeric", month: "2-digit",
  }).formatToParts(now);
  const parts = Object.fromEntries(fields.map((p) => [p.type, p.value]));
  return parts.year + "-" + parts.month;
}
function sqlMonthFilter(scope: Scope): string {
  return scope === "month" ? " AND substr(datetime(occurred_at,'-5 hours'),1,7)=?" : "";
}
function countValues(row: CountRow | null): Counts {
  if (!row) throw new ResetInputError("Could not read movement counts", 503);
  return { manualEntries: Number(row.manual_entries), directExpenses: Number(row.direct_expenses) };
}
async function counts(db: QuickD1, owner: string, scope: Scope, monthKey: string | null): Promise<Counts> {
  const where = sqlMonthFilter(scope);
  const stmt = db.prepare(
    "SELECT (SELECT COUNT(*) FROM quick_manual_entries WHERE owner_id=?" + where + ") AS manual_entries," +
    "(SELECT COUNT(*) FROM quick_shortcut_expenses WHERE owner_id=?" + where + ") AS direct_expenses",
  );
  return countValues(await stmt.bind(
    ...scope === "month" ? [owner, monthKey, owner, monthKey] : [owner, owner],
  ).first<CountRow>());
}

export async function prepareReset(db: QuickD1, owner: string, input: unknown): Promise<Response> {
  const data = record(input, ["acknowledged", "scope"]);
  if (data.acknowledged !== true || (data.scope !== "month" && data.scope !== "all")) {
    throw new ResetInputError("Choose monthly or all-month reset explicitly");
  }
  const scope: Scope = data.scope;
  const monthKey = scope === "month" ? bogotaMonth() : null;
  const snapshot = await counts(db, owner, scope, monthKey);
  const id = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + EXPIRES_MS).toISOString();
  // Starting a new review invalidates the previous confirmation. Harmless
  // to other users, shortcut authorization and account definitions.
  await db.prepare("DELETE FROM quick_reset_challenges WHERE owner_id=? RETURNING id").bind(owner).all();
  await db.prepare(
    "INSERT INTO quick_reset_challenges(" +
    "id,owner_id,expires_at,expected_manual_entries,expected_shortcut_expenses," +
    "expected_accounts,expected_devices,scope,month_key) VALUES(?,?,?,?,?,?,?,?,?) RETURNING id",
  ).bind(
    id, owner, expiresAt, snapshot.manualEntries, snapshot.directExpenses,
    0, 0, scope, monthKey,
  ).first();
  return json({
    challengeId: id, expiresAt, scope, monthKey, counts: snapshot,
    confirmationPhrase: PHRASES[scope],
    preservesAccounts: true, preservesShortcuts: true,
    externalBankBalancesUnaffected: true,
  });
}

export async function confirmReset(db: QuickD1, owner: string, input: unknown): Promise<Response> {
  const data = record(input, ["challengeId", "phrase", "scope", "confirmed"]);
  if (data.confirmed !== true || (data.scope !== "month" && data.scope !== "all") ||
    data.phrase !== PHRASES[data.scope]) {
    throw new ResetInputError("Typed confirmation must match the chosen period");
  }
  if (typeof data.challengeId !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.challengeId)) {
    throw new ResetInputError("Invalid reset confirmation");
  }
  const challenge = await db.prepare(
    "SELECT id,owner_id,scope,month_key,expires_at,expected_manual_entries," +
    "expected_shortcut_expenses,confirmation_nonce FROM quick_reset_challenges " +
    "WHERE id=? AND owner_id=? LIMIT 1",
  ).bind(data.challengeId, owner).first<ChallengeRow>();
  const now = new Date().toISOString();
  if (!challenge || challenge.expires_at <= now || challenge.confirmation_nonce !== null ||
    challenge.scope !== data.scope || (challenge.scope === "month" &&
    challenge.month_key !== bogotaMonth())) {
    throw new ResetInputError("Confirmation expired or scope changed; review totals again", 409);
  }
  // Check for a changed count before the transaction to give a useful error.
  const snapshot = await counts(db, owner, challenge.scope, challenge.month_key);
  if (snapshot.manualEntries !== challenge.expected_manual_entries ||
    snapshot.directExpenses !== challenge.expected_shortcut_expenses) {
    throw new ResetInputError("Movements changed since review; refresh the confirmation", 409);
  }
  if (typeof db.batch !== "function") {
    throw new ResetInputError("Atomic reset unavailable", 503);
  }
  // Check counts AGAIN, atomically inside the same transaction as deletion.
  // A unique nonce marks the confirmation only if it is still unexpired,
  // belongs to this owner and scope, and the snapshot still matches.
  // Each deletion is protected by that nonce; no proof = no deletes.
  const proof = crypto.randomUUID();
  const where = sqlMonthFilter(challenge.scope);
  const confirmation = db.prepare(
    "UPDATE quick_reset_challenges SET confirmation_nonce=? " +
    "WHERE id=? AND owner_id=? AND scope=? AND expires_at>? AND confirmation_nonce IS NULL " +
    "AND expected_manual_entries=(SELECT COUNT(*) FROM quick_manual_entries WHERE owner_id=?" + where + ")" +
    "AND expected_shortcut_expenses=(SELECT COUNT(*) FROM quick_shortcut_expenses WHERE owner_id=?" + where + ")",
  ).bind(
    proof, challenge.id, owner, challenge.scope, now,
    ...challenge.scope === "month"
      ? [owner, challenge.month_key, owner, challenge.month_key] : [owner, owner],
  );
  const proofGuard = " AND EXISTS (SELECT 1 FROM quick_reset_challenges " +
    "WHERE id=? AND owner_id=? AND confirmation_nonce=?)";
  const deleteManual = db.prepare(
    "DELETE FROM quick_manual_entries WHERE owner_id=?" + where + proofGuard,
  ).bind(
    ...challenge.scope === "month"
      ? [owner, challenge.month_key, challenge.id, owner, proof]
      : [owner, challenge.id, owner, proof],
  );
  const deleteShortcut = db.prepare(
    "DELETE FROM quick_shortcut_expenses WHERE owner_id=?" + where + proofGuard,
  ).bind(
    ...challenge.scope === "month"
      ? [owner, challenge.month_key, challenge.id, owner, proof]
      : [owner, challenge.id, owner, proof],
  );
  const consume = db.prepare(
    "DELETE FROM quick_reset_challenges WHERE id=? AND owner_id=? AND confirmation_nonce=?",
  ).bind(challenge.id, owner, proof);
  // Cloudflare D1 batch is an atomic transaction; the SQLite E2E mock
  // provides the same rollback-on-error property.
  const results = await db.batch([confirmation, deleteManual, deleteShortcut, consume]);
  if (results.length !== 4 || results[0]?.meta?.changes !== 1 ||
    results[3]?.meta?.changes !== 1) {
    throw new ResetInputError("Confirmation already used, expired or data changed", 409);
  }
  return json({
    reset: true, scope: challenge.scope, monthKey: challenge.month_key,
    cleared: snapshot, shortcutAuthorizationRevoked: false,
    accountsRetained: true, externalBankBalancesUnaffected: true,
  });
}
