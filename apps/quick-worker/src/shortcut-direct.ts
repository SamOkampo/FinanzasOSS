// Personal iPhone Shortcut endpoint. Deliberately disabled without explicit flags.
// Requires Cloudflare Access Service Auth at the edge AND a separate, revocable device token.
import type { QuickD1, QuickWorkerEnv, QuickWorkerContext } from "./index.js";

type Account = { id: string; label: string; account_kind: string; bank_label: string | null };
type Confirm = (db: QuickD1, owner: string, body: unknown, ignoreReplayTime?: boolean) => Promise<Response>;
const TOKEN_RE = /^fosq_[0-9a-f]{64}$/;
const ID_RE = /^[A-Za-z0-9][A-Za-z0-9_-]{11,95}$/;
const METHODS = new Set(["cash", "debit_card", "credit_card", "bank_transfer", "digital_wallet", "other"]);
const BANK_METHODS = new Set(["debit_card", "credit_card", "bank_transfer"]);

export class ShortcutInputError extends Error {
  constructor(message: string, readonly status = 422) { super(message); }
}

function reply(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store, private",
      "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer",
      "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
    },
  });
}
function strict(body: unknown, allowed: readonly string[]): Record<string, unknown> {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new ShortcutInputError("JSON object required");
  }
  const obj = body as Record<string, unknown>;
  if (Object.keys(obj).some((k) => !allowed.includes(k))) {
    throw new ShortcutInputError("Unsupported field");
  }
  return obj;
}
function requiredText(input: unknown, max: number, label: string): string {
  if (typeof input !== "string") throw new ShortcutInputError(label + " must be text");
  const normalized = input.trim();
  if (!normalized || normalized.length > max || /[\u0000-\u001f\u007f]/.test(normalized)) {
    throw new ShortcutInputError(label + " is invalid");
  }
  return normalized;
}
function optionalText(input: unknown, max: number, label: string): string | null {
  if (input === null || input === undefined || input === "") return null;
  return requiredText(input, max, label);
}
async function json(request: Request): Promise<unknown> {
  if (request.headers.get("Content-Type")?.split(";")[0]?.trim().toLowerCase() !== "application/json") {
    throw new ShortcutInputError("Content-Type must be application/json", 415);
  }
  const len = Number(request.headers.get("Content-Length") ?? "0");
  if (!Number.isFinite(len) || len < 0 || len > 4096) throw new ShortcutInputError("Body too large", 413);
  const raw = await request.text();
  if (raw.length > 4096) throw new ShortcutInputError("Body too large", 413);
  try { return JSON.parse(raw); } catch { throw new ShortcutInputError("Invalid JSON"); }
}
function uniqueToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return "fosq_" + Array.from(bytes, (n) => n.toString(16).padStart(2, "0")).join("");
}
async function digestToken(token: string): Promise<string> {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Array.from(new Uint8Array(bytes), (n) => n.toString(16).padStart(2, "0")).join("");
}
function requiresBank(method: string): boolean { return BANK_METHODS.has(method); }
function acceptsKind(kind: string, method: string): boolean {
  if (method === "cash") return kind === "cash";
  if (method === "credit_card") return kind === "credit_manual";
  if (method === "debit_card" || method === "bank_transfer") return kind === "bank_manual" || kind === "wallet_manual";
  if (method === "digital_wallet") return kind === "wallet_manual";
  return true;
}
function normalized(value: string): string { return value.trim().toLocaleLowerCase("es-CO"); }

export async function enrollShortcut(db: QuickD1, owner: string, body: unknown): Promise<Response> {
  const data = strict(body, ["label", "confirmed"]);
  if (data.confirmed !== true) throw new ShortcutInputError("Enrollment confirmation required");
  const label = requiredText(data.label, 50, "Device label");
  const token = uniqueToken();
  const expiresAt = new Date(Date.now() + 90 * 86400000).toISOString();
  const id = crypto.randomUUID();
  // Rotate all previous device tokens, so forgotten tokens cannot remain active.
  await db.prepare(
    "UPDATE quick_shortcut_devices SET revoked_at=? WHERE owner_id=? AND revoked_at IS NULL RETURNING id",
  ).bind(new Date().toISOString(), owner).all();
  await db.prepare(
    "INSERT INTO quick_shortcut_devices(id,owner_id,token_hash,label,expires_at) VALUES(?,?,?,?,?) RETURNING id",
  ).bind(id, owner, await digestToken(token), label, expiresAt).first();
  return reply({ deviceId: id, token, expiresAt }, 201); // one-time display only
}
export async function shortcutStatus(db: QuickD1, owner: string): Promise<Response> {
  const result = await db.prepare(
    "SELECT id,label,expires_at FROM quick_shortcut_devices WHERE owner_id=? " +
    "AND revoked_at IS NULL ORDER BY created_at DESC LIMIT 5",
  ).bind(owner).all<{ id: string; label: string; expires_at: string }>();
  return reply({ devices: result.results });
}
export async function revokeShortcut(db: QuickD1, owner: string, body: unknown): Promise<Response> {
  const data = strict(body, ["confirmed"]);
  if (data.confirmed !== true) throw new ShortcutInputError("Revocation confirmation required");
  await db.prepare(
    "UPDATE quick_shortcut_devices SET revoked_at=? WHERE owner_id=? AND revoked_at IS NULL RETURNING id",
  ).bind(new Date().toISOString(), owner).all();
  return reply({ revoked: true });
}

export async function shortcutExpense(
  request: Request, env: QuickWorkerEnv, ctx: QuickWorkerContext, confirm: Confirm,
): Promise<Response> {
  // A Cloudflare Access *Service Auth* policy must validate the separate
  // CF-Access-Client-Id/Secret headers. Never configure a Bypass policy here.
  if (!env.ACCESS_AUD || ctx.access?.aud !== env.ACCESS_AUD) {
    return reply({ error: "Cloudflare Access required" }, 401);
  }
  if (env.ALLOW_WRITES !== "true" || env.ALLOW_SHORTCUT_WRITES !== "true") {
    return reply({ error: "Direct shortcuts disabled" }, 503);
  }
  const auth = request.headers.get("Authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice("Bearer ".length) : "";
  if (!TOKEN_RE.test(token)) return reply({ error: "Device authorization required" }, 401);
  const row = await env.DB.prepare(
    "SELECT owner_id FROM quick_shortcut_devices WHERE token_hash=? AND revoked_at IS NULL " +
    "AND expires_at>? LIMIT 1",
  ).bind(await digestToken(token), new Date().toISOString()).first<{ owner_id: string }>();
  if (!row) return reply({ error: "Device authorization expired or revoked" }, 401);
  const data = strict(await json(request), ["clientEntryId", "amount", "concept", "paymentMethod", "bankLabel"]);
  const key = requiredText(data.clientEntryId, 96, "clientEntryId");
  if (!ID_RE.test(key)) throw new ShortcutInputError("Invalid clientEntryId");
  const concept = requiredText(data.concept, 120, "Concept");
  if (typeof data.amount !== "string") throw new ShortcutInputError("Amount must be text");
  const method = data.paymentMethod;
  if (typeof method !== "string" || !METHODS.has(method)) throw new ShortcutInputError("Invalid payment method");
  const bankLabel = optionalText(data.bankLabel, 80, "Bank");
  if ((requiresBank(method) && !bankLabel) || (!requiresBank(method) && bankLabel !== null)) {
    throw new ShortcutInputError("Bank is required for cards/transfers only");
  }

  const accounts = await env.DB.prepare(
    "SELECT id,label,account_kind,bank_label FROM quick_manual_accounts WHERE owner_id=? " +
    "AND currency='COP' LIMIT 100",
  ).bind(row.owner_id).all<Account>();
  const candidates = accounts.results.filter((account) =>
    acceptsKind(account.account_kind, method) &&
    (!requiresBank(method) || normalized(account.label) === normalized(bankLabel!) ||
      (account.bank_label !== null && normalized(account.bank_label) === normalized(bankLabel!))));
  if (candidates.length !== 1) {
    return reply({ error: "No unique matching COP account. Configure a matching account in FinanzasOSS." }, 409);
  }
  // Explicit invocation of the Shortcut is authorization to add an EXPENSE.
  // The caller cannot choose a transfer/investment classification or owner.
  // Server timestamp is ignored only on idempotent replay with identical fields.
  return confirm(env.DB, row.owner_id, {
    accountId: candidates[0]!.id, clientEntryId: key, amount: data.amount,
    currency: "COP", paymentMethod: method, classification: "expense",
    occurredAt: new Date().toISOString(), merchant: concept, bankLabel, confirmed: true,
  }, true);
}

export function shortcutFailure(error: unknown): Response {
  if (error instanceof ShortcutInputError) return reply({ error: error.message }, error.status);
  // Do not leak financial payload, hashed token, SQL errors or D1 internals.
  if (error instanceof Error && /^(Amount |occurredAt |Classification |Payment method |clientEntryId |Only explicitly supported currencies|merchant |bankLabel |tenantId |actorId )/.test(error.message)) {
    return reply({ error: "Invalid financial entry" }, 422);
  }
  return reply({ error: "Unable to process request" }, 500);
}
