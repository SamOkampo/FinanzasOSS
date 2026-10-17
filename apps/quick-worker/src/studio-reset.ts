import type { QuickD1 } from "./index.js";

// Destructive actions are intentionally staging-only and off by default.
// They always require a Cloudflare Access human principal; never a device token.
export class ResetInputError extends Error {
  constructor(message: string, public readonly status = 422) { super(message); }
}
type Totals = { manualEntries: number; directExpenses: number; manualAccounts: number; shortcutDevices: number };
type RawCounts = { manual_entries: number; direct_expenses: number; manual_accounts: number; shortcut_devices: number };
type ChallengeRow = RawCounts & { id: string; owner_id: string; expires_at: string };
const REQUIRED_PHRASE = "RESTABLECER TODO";
const EXPIRES_MS = 5 * 60 * 1000;

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: {
    "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store, private",
    "X-Content-Type-Options": "nosniff", "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
  } });
}
function requireRecord(value: unknown, allowed: string[]): Record<string, unknown> {
  if (!value || Array.isArray(value) || typeof value !== "object") throw new ResetInputError("Invalid request");
  const record = value as Record<string, unknown>;
  if (Object.keys(record).some((k) => !allowed.includes(k))) throw new ResetInputError("Unsupported field");
  return record;
}
const normalizeCounts = (row: RawCounts): Totals => ({
  manualEntries: Number(row.manual_entries),
  directExpenses: Number(row.direct_expenses),
  manualAccounts: Number(row.manual_accounts),
  shortcutDevices: Number(row.shortcut_devices),
});
async function counts(db: QuickD1, owner: string): Promise<Totals> {
  const row = await db.prepare(
    "SELECT (SELECT COUNT(*) FROM quick_manual_entries WHERE owner_id=?) AS manual_entries," +
    "(SELECT COUNT(*) FROM quick_shortcut_expenses WHERE owner_id=?) AS direct_expenses," +
    "(SELECT COUNT(*) FROM quick_manual_accounts WHERE owner_id=?) AS manual_accounts," +
    "(SELECT COUNT(*) FROM quick_shortcut_devices WHERE owner_id=? AND revoked_at IS NULL) AS shortcut_devices",
  ).bind(owner, owner, owner, owner).first<RawCounts>();
  if (!row) throw new ResetInputError("Unable to check account", 503);
  return normalizeCounts(row);
}

export async function prepareReset(db: QuickD1, owner: string, input: unknown): Promise<Response> {
  const data = requireRecord(input, ["acknowledged"]);
  if (data.acknowledged !== true) throw new ResetInputError("Start confirmation required");
  const snapshot = await counts(db, owner);
  const id = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + EXPIRES_MS).toISOString();
  await db.prepare(
    "DELETE FROM quick_reset_challenges WHERE owner_id=? RETURNING id",
  ).bind(owner).all();
  await db.prepare(
    "INSERT INTO quick_reset_challenges(id,owner_id,expires_at,expected_manual_entries," +
    "expected_shortcut_expenses,expected_accounts,expected_devices) VALUES(?,?,?,?,?,?,?) RETURNING id",
  ).bind(id, owner, expiresAt, snapshot.manualEntries, snapshot.directExpenses,
    snapshot.manualAccounts, snapshot.shortcutDevices).first();
  return json({
    challengeId: id, expiresAt, counts: snapshot, confirmationPhrase: REQUIRED_PHRASE,
    affects: "only_authenticated_users_quick_staging_data",
    revokesShortcuts: true, removesManualAccounts: true,
    restoresAccess: false,
  });
}

export async function confirmReset(db: QuickD1, owner: string, input: unknown): Promise<Response> {
  const data = requireRecord(input, ["challengeId", "phrase", "confirmed"]);
  if (data.confirmed !== true || data.phrase !== REQUIRED_PHRASE) {
    throw new ResetInputError("Explicit typed confirmation required");
  }
  if (typeof data.challengeId !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.challengeId)) {
    throw new ResetInputError("Invalid confirmation");
  }
  const challenge = await db.prepare(
    "SELECT id,owner_id,expires_at,expected_manual_entries,expected_shortcut_expenses," +
    "expected_accounts,expected_devices FROM quick_reset_challenges WHERE id=? AND owner_id=? LIMIT 1",
  ).bind(data.challengeId, owner).first<ChallengeRow>();
  const now = new Date().toISOString();
  if (!challenge || challenge.expires_at <= now) {
    throw new ResetInputError("Confirmation expired. Review the counts again.", 409);
  }
  const existing = await counts(db, owner);
  const prior = {
    manualEntries: challenge.expected_manual_entries,
    directExpenses: challenge.expected_shortcut_expenses,
    manualAccounts: challenge.expected_accounts,
    shortcutDevices: challenge.expected_devices,
  };
  if (Object.keys(existing).some((key) =>
    existing[key as keyof Totals] !== prior[key as keyof Totals])) {
    throw new ResetInputError("Account changed. Review the updated counts before reset.", 409);
  }
  if (typeof db.batch !== "function") {
    throw new ResetInputError("Atomic reset is not available", 503);
  }
  // Every DELETE is guarded by the still-valid one-time challenge. All
  // statements execute in one atomic D1 batch/SQLite transaction.
  const guard = " AND EXISTS(SELECT 1 FROM quick_reset_challenges WHERE id=? AND owner_id=? AND expires_at>?)";
  const deletion = [
    "DELETE FROM quick_manual_entries WHERE owner_id=?" + guard,
    "DELETE FROM quick_shortcut_expenses WHERE owner_id=?" + guard,
    "DELETE FROM quick_manual_accounts WHERE owner_id=?" + guard,
    "DELETE FROM quick_shortcut_devices WHERE owner_id=?" + guard,
  ].map((sql) =>
    db.prepare(sql).bind(owner, data.challengeId as string, owner, now));
  deletion.push(db.prepare(
    "DELETE FROM quick_reset_challenges WHERE id=? AND owner_id=? AND expires_at>?",
  ).bind(data.challengeId, owner, now));
  const result = await db.batch(deletion);
  if (result.length !== 5 || result[4]?.meta?.changes !== 1) {
    // No owner data is deleted if the challenge is absent. If another caller
    // consumed it first, this request must not report another successful reset.
    throw new ResetInputError("Confirmation already used or expired", 409);
  }
  return json({ reset: true, cleared: prior, shortcutAuthorizationRevoked: true,
    accessLoginRetained: true });
}
