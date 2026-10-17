// Personal iPhone Shortcut endpoint. Deliberately disabled without explicit flags.
// Requires Cloudflare Access Service Auth at the edge AND a separate, revocable device token.
import type { QuickD1, QuickWorkerEnv, QuickWorkerContext } from "./index.js";
import { prepareQuickEntry } from "../../../packages/finance-core/src/quick-entry.js";

type StoredExpense = {
  id: string;
  amount_minor: number;
  currency: string;
  payment_method: string;
  kind: string;
  merchant: string | null;
  bank_label: string | null;
};
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

function replayOrConflict(
  prior: StoredExpense,
  expected: {
    amountMinor: number; paymentMethod: string; kind: string;
    merchant: string | null; bankLabel: string | null;
  },
): Response {
  if (prior.amount_minor !== expected.amountMinor || prior.currency !== "COP" ||
    prior.payment_method !== expected.paymentMethod || prior.kind !== expected.kind ||
    prior.merchant !== expected.merchant || prior.bank_label !== expected.bankLabel) {
    return reply({ error: "Entry idempotency key reused with different data" }, 409);
  }
  return reply({ entryId: prior.id, replayed: true });
}

export async function shortcutExpense(
  request: Request, env: QuickWorkerEnv, ctx: QuickWorkerContext,
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
  return saveAccountlessExpense(env.DB, row.owner_id, data);
}

// The browser flow reuses the SAME append-only write routine as iOS Atajos.
// Human Access authentication, feature flag and same-origin CSRF gate live in index.ts.
export async function browserExpense(db: QuickD1, owner: string, body: unknown): Promise<Response> {
  const data = strict(body, ["clientEntryId", "amount", "concept", "paymentMethod", "bankLabel", "confirmed"]);
  if (data.confirmed !== true) throw new ShortcutInputError("Expense confirmation required");
  return saveAccountlessExpense(db, owner, data);
}

async function saveAccountlessExpense(
  db: QuickD1, owner: string, data: Record<string, unknown>,
): Promise<Response> {
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


  // Do not require, infer or secretly create an account: the user explicitly
  // wants account-free expense capture. Keep the method and optional bank.
  const draft = prepareQuickEntry({
    tenantId: owner, actorId: owner,
    clientEntryId: key, amount: data.amount,
    currency: "COP", paymentMethod: method as "cash" | "debit_card" | "credit_card" | "bank_transfer" | "digital_wallet" | "other",
    classification: "expense", occurredAt: new Date().toISOString(), merchant: concept,
    ...(bankLabel === null ? {} : { bankLabel }),
  });
  const minor = Number(draft.money.amountMinor);
  if (!Number.isSafeInteger(minor)) throw new ShortcutInputError("Invalid amount");
  const fields = {
    ownerId: owner, clientEntryId: key,
    amountMinor: minor, paymentMethod: draft.paymentMethod,
    kind: draft.kind, merchant: draft.merchant, bankLabel: draft.bankLabel,
  };
  // Compatibility for retrying an expense sent before the account-free
  // migration: return the existing entry rather than creating a duplicate.
  const legacy = await db.prepare(
    "SELECT id,amount_minor,currency,payment_method,kind,merchant,bank_label " +
    "FROM quick_manual_entries WHERE owner_id=? AND client_entry_id=? LIMIT 1",
  ).bind(fields.ownerId, key).first<StoredExpense>();
  if (legacy) return replayOrConflict(legacy, fields);

  // Append-only, account-free table; owner-scoped idempotency is enforced in
  // SQLite atomically, not with a preflight race-prone SELECT.
  const inserted = await db.prepare(
    "INSERT INTO quick_shortcut_expenses(" +
    "id,owner_id,client_entry_id,amount_minor,currency,payment_method,kind,occurred_at,merchant,bank_label) " +
    "VALUES(?,?,?,?,?,?,?,?,?,?) " +
    "ON CONFLICT(owner_id,client_entry_id) DO NOTHING RETURNING id",
  ).bind(
    crypto.randomUUID(), fields.ownerId, key, minor, "COP", draft.paymentMethod,
    draft.kind, draft.occurredAt, draft.merchant, draft.bankLabel,
  ).first<{ id: string }>();
  if (inserted) return reply({ entryId: inserted.id, replayed: false }, 201);
  const prior = await db.prepare(
    "SELECT id,amount_minor,currency,payment_method,kind,merchant,bank_label " +
    "FROM quick_shortcut_expenses WHERE owner_id=? AND client_entry_id=? LIMIT 1",
  ).bind(fields.ownerId, key).first<StoredExpense>();
  if (!prior) return reply({ error: "Unable to verify write" }, 503);
  return replayOrConflict(prior, fields);
}


export function shortcutFailure(error: unknown): Response {
  if (error instanceof ShortcutInputError) return reply({ error: error.message }, error.status);
  // Do not leak financial payload, hashed token, SQL errors or D1 internals.
  if (error instanceof Error && /^(Amount |occurredAt |Classification |Payment method |clientEntryId |Only explicitly supported currencies|merchant |bankLabel |tenantId |actorId )/.test(error.message)) {
    return reply({ error: "Invalid financial entry" }, 422);
  }
  return reply({ error: "Unable to process request" }, 500);
}
