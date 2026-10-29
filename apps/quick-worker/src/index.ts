import { prepareQuickEntry } from "../../../packages/finance-core/src/quick-entry.js";
import { QUICK_HTML, QUICK_CSS, QUICK_JS } from "./quick-ui.js";
import {
  categorizeMerchant, isExpenseCategory, merchantKey, protectedDecision,
  type AIBinding, type CategoryDecision, type ExpenseCategory,
} from "./category-intelligence.js";
import {
  PUSH_SW, pushEnabled, pushEndpoint, sendCategoryPush, type PushConfig,
} from "./push-notifications.js";

// Narrow structural definitions avoid requiring a Cloudflare SDK in Finance Core.
type SqlValue = string | number | null;
interface PreparedStatement {
  bind(...values: SqlValue[]): PreparedStatement;
  first<T extends object>(): Promise<T | null>;
  all<T extends object>(): Promise<{ results: T[] }>;
}
export interface QuickD1 {
  prepare(query: string): PreparedStatement;
}
export interface QuickWorkerEnv extends PushConfig {
  readonly DB: QuickD1;
  readonly AI?: AIBinding;
  readonly ACCESS_AUD?: string;
  readonly ALLOW_WRITES?: string;
}
export interface QuickWorkerContext {
  readonly access?: {
    readonly aud?: string;
    getIdentity(): Promise<{ user_uuid?: string; id?: string; email?: string } | null>;
  };
}

type JsonRecord = Record<string, unknown>;
type ManualAccount = {
  id: string; label: string; account_kind: string; currency: string; bank_label: string | null;
};
type ManualEntry = {
  id: string; account_id: string; client_entry_id: string; amount_minor: number; currency: string;
  payment_method: string; kind: string; occurred_at: string; merchant: string | null;
  bank_label: string | null; created_at: string;
  category?: string | null; category_source?: string | null;
  needs_review?: number | null; question?: string | null;
};

const ID_RE = /^[A-Za-z0-9][A-Za-z0-9_-]{11,95}$/;
const OWNER_RE = /^[A-Za-z0-9][A-Za-z0-9:_-]{0,127}$/;
const KINDS = new Set(["cash", "bank_manual", "credit_manual", "wallet_manual"]);

class InputError extends Error {
  constructor(message: string, readonly status = 422) { super(message); }
}

function respond(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store, private",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
      "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
    },
  });
}

function respondAsset(body: string, mediaType: string): Response {
  const csp = mediaType === "text/html"
    ? "default-src 'none'; script-src 'self'; worker-src 'self'; manifest-src 'self'; style-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'"
    : "default-src 'none'; frame-ancestors 'none'";
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": mediaType + "; charset=utf-8",
      "Cache-Control": "no-store, private",
      "Content-Security-Policy": csp,
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
      "X-Frame-Options": "DENY",
    },
  });
}

function textField(value: unknown, label: string, max: number): string {
  if (typeof value !== "string") throw new InputError(label + " is invalid");
  const s = value.trim();
  if (!s || s.length > max || /[\u0000-\u001f\u007f]/.test(s)) {
    throw new InputError(label + " is invalid");
  }
  return s;
}
function optionalText(value: unknown, label: string, max: number): string | null {
  if (value === undefined || value === null || value === "") return null;
  return textField(value, label, max);
}
function key(value: unknown, label: string): string {
  if (typeof value !== "string" || !ID_RE.test(value)) throw new InputError(label + " is invalid");
  return value;
}
function mustUuid(value: unknown, label: string): string {
  if (typeof value !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
    throw new InputError(label + " must be a UUID");
  }
  return value.toLowerCase();
}
function strictObject(value: unknown, allowed: readonly string[]): JsonRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new InputError("Expected a JSON object");
  }
  const obj = value as JsonRecord;
  for (const k of Object.keys(obj)) {
    if (!allowed.includes(k)) throw new InputError("Unsupported field: " + k);
  }
  return obj;
}
async function parseJson(request: Request): Promise<unknown> {
  if (request.headers.get("Content-Type")?.split(";")[0]?.trim().toLowerCase() !== "application/json") {
    throw new InputError("Content-Type must be application/json", 415);
  }
  const length = Number(request.headers.get("Content-Length") ?? "0");
  if (!Number.isFinite(length) || length < 0 || length > 4096) {
    throw new InputError("Request body exceeds limit", 413);
  }
  const raw = await request.text();
  if (raw.length > 4096) throw new InputError("Request body exceeds limit", 413);
  try { return JSON.parse(raw); } catch { throw new InputError("Invalid JSON"); }
}
function requireSameOrigin(request: Request): void {
  const url = new URL(request.url);
  if (request.headers.get("Origin") !== url.origin) {
    throw new InputError("Same-origin request required", 403);
  }
  const fetchSite = request.headers.get("Sec-Fetch-Site");
  if (fetchSite && fetchSite !== "same-origin") {
    throw new InputError("Cross-site request denied", 403);
  }
}

async function principal(ctx: QuickWorkerContext, env: QuickWorkerEnv): Promise<string | null> {
  if (!ctx.access || !env.ACCESS_AUD || ctx.access.aud !== env.ACCESS_AUD) return null;
  try {
    // Cloudflare's full Access identity uses user_uuid for the stable user
    // identifier. The prior implementation only read "id", so an authorized
    // user with user_uuid (but no id) was rejected with HTTP 401.
    // Use only an Access-authenticated stable ID; never substitute email,
    // browser headers, or an ownerId from the request body.
    const identity = await ctx.access.getIdentity();
    const ownerId = identity?.user_uuid ?? identity?.id;
    return typeof ownerId === "string" && OWNER_RE.test(ownerId) ? ownerId : null;
  } catch { return null; }
}
async function listAccounts(db: QuickD1, owner: string): Promise<Response> {
  const query = await db.prepare(
    "SELECT id,label,account_kind,currency,bank_label FROM quick_manual_accounts WHERE owner_id=? ORDER BY created_at DESC LIMIT 100",
  ).bind(owner).all<ManualAccount>();
  return respond({ accounts: query.results });
}
async function createAccount(db: QuickD1, owner: string, body: unknown): Promise<Response> {
  const data = strictObject(body, ["clientAccountId", "label", "accountKind", "currency", "bankLabel"]);
  const clientAccountId = key(data.clientAccountId, "clientAccountId");
  const label = textField(data.label, "label", 100);
  const accountKind = data.accountKind;
  if (typeof accountKind !== "string" || !KINDS.has(accountKind)) {
    throw new InputError("Invalid manual account kind");
  }
  if (data.currency !== "COP" && data.currency !== "USD") {
    throw new InputError("Only COP and USD are supported");
  }
  const currency = data.currency;
  const bankLabel = optionalText(data.bankLabel, "bankLabel", 80);
  const id = crypto.randomUUID();
  const inserted = await db.prepare(
    "INSERT INTO quick_manual_accounts(id,owner_id,client_account_id,label,account_kind,currency,bank_label) " +
    "VALUES(?,?,?,?,?,?,?) ON CONFLICT(owner_id,client_account_id) DO NOTHING RETURNING id",
  ).bind(id, owner, clientAccountId, label, accountKind, currency, bankLabel).first<{ id: string }>();
  if (inserted) return respond({ accountId: inserted.id, replayed: false }, 201);
  const prior = await db.prepare(
    "SELECT id,label,account_kind,currency,bank_label FROM quick_manual_accounts WHERE owner_id=? AND client_account_id=?",
  ).bind(owner, clientAccountId).first<ManualAccount>();
  if (!prior) return respond({ error: "Account creation could not be confirmed" }, 503);
  if (prior.label !== label || prior.account_kind !== accountKind ||
      prior.currency !== currency || prior.bank_label !== bankLabel) {
    return respond({ error: "Account idempotency key was already used for different data" }, 409);
  }
  return respond({ accountId: prior.id, replayed: true });
}
async function listEntries(db: QuickD1, owner: string): Promise<Response> {
  const data = await db.prepare(
    "SELECT e.id,e.account_id,e.client_entry_id,e.amount_minor,e.currency,e.payment_method," +
    "e.kind,e.occurred_at,e.merchant,e.bank_label,e.created_at," +
    "c.category,c.source AS category_source,c.needs_review,c.question " +
    "FROM quick_manual_entries e LEFT JOIN quick_entry_categories c " +
    "ON c.entry_id=e.id AND c.owner_id=e.owner_id WHERE e.owner_id=? " +
    "ORDER BY e.occurred_at DESC,e.id DESC LIMIT 100",
  ).bind(owner).all<ManualEntry>();
  return respond({ entries: data.results.map(x => ({ ...x, amount_minor: String(x.amount_minor) })) });
}

async function categorizeEntry(
  db: QuickD1, owner: string, entry: Pick<ManualEntry,"id"|"kind"|"merchant">,
  env: QuickWorkerEnv,
): Promise<CategoryDecision> {
  let result = protectedDecision(entry.kind);
  if (!result) {
    const key = merchantKey(entry.merchant);
    const learned = key ? await db.prepare(
      "SELECT category FROM quick_category_preferences WHERE owner_id=? AND merchant_key=?",
    ).bind(owner, key).first<{ category: ExpenseCategory }>() : null;
    result = await categorizeMerchant(entry.merchant, env.AI, learned?.category);
  }
  // A user's explicit correction is authoritative even if the AI finished late.
  await db.prepare(
    "INSERT INTO quick_entry_categories(entry_id,owner_id,category,source,confidence,needs_review,question) " +
    "VALUES(?,?,?,?,?,?,?) ON CONFLICT(entry_id) DO UPDATE SET " +
    "category=excluded.category,source=excluded.source,confidence=excluded.confidence," +
    "needs_review=excluded.needs_review,question=excluded.question," +
    "updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') " +
    "WHERE quick_entry_categories.owner_id=excluded.owner_id AND quick_entry_categories.source!='user' " +
    "RETURNING entry_id",
  ).bind(entry.id, owner, result.category, result.source, result.confidence,
    result.needsReview ? 1 : 0, result.question).first<{ entry_id: string }>();
  return result;
}

async function notifyCategoryQuestion(db: QuickD1, owner: string, env: QuickWorkerEnv): Promise<void> {
  if (!pushEnabled(env)) return;
  const subscriptions = await db.prepare(
    "SELECT endpoint FROM quick_push_subscriptions WHERE owner_id=? ORDER BY created_at DESC LIMIT 3",
  ).bind(owner).all<{ endpoint: string }>();
  await Promise.allSettled(subscriptions.results.map(s => sendCategoryPush(env, s.endpoint)));
}

async function reviewCategory(db: QuickD1, owner: string, body: unknown): Promise<Response> {
  const data = strictObject(body, ["entryId","category","applyToMerchant"]);
  const id = mustUuid(data.entryId, "entryId");
  if (!isExpenseCategory(data.category)) throw new InputError("Invalid expense category");
  if (data.applyToMerchant !== undefined && typeof data.applyToMerchant !== "boolean") {
    throw new InputError("Invalid merchant preference");
  }
  const existing = await db.prepare(
    "SELECT id,kind,merchant FROM quick_manual_entries WHERE id=? AND owner_id=?",
  ).bind(id, owner).first<Pick<ManualEntry,"id"|"kind"|"merchant">>();
  if (!existing) return respond({ error: "Entry unavailable" }, 404);
  if (existing.kind !== "purchase") return respond({ error: "Protected transfers cannot be recategorized" }, 409);
  await db.prepare(
    "INSERT INTO quick_entry_categories(entry_id,owner_id,category,source,confidence,needs_review,question) " +
    "VALUES(?,?,?,'user',1,0,NULL) ON CONFLICT(entry_id) DO UPDATE SET " +
    "category=excluded.category,source='user',confidence=1,needs_review=0,question=NULL," +
    "updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') " +
    "WHERE quick_entry_categories.owner_id=excluded.owner_id RETURNING entry_id",
  ).bind(id, owner, data.category).first<{ entry_id: string }>();
  const key = merchantKey(existing.merchant);
  if (data.applyToMerchant && key) {
    await db.prepare(
      "INSERT INTO quick_category_preferences(owner_id,merchant_key,category) VALUES(?,?,?) " +
      "ON CONFLICT(owner_id,merchant_key) DO UPDATE SET category=excluded.category," +
      "updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') RETURNING owner_id",
    ).bind(owner, key, data.category).first<{ owner_id: string }>();
    // Reconcile earlier entries from the same exact concept; preserve explicit corrections.
    await db.prepare(
      "INSERT INTO quick_entry_categories(entry_id,owner_id,category,source,confidence,needs_review,question) " +
      "SELECT e.id,e.owner_id,?,'learned',1,0,NULL FROM quick_manual_entries e " +
      "WHERE e.owner_id=? AND e.kind='purchase' AND lower(trim(e.merchant))=? " +
      "ON CONFLICT(entry_id) DO UPDATE SET category=excluded.category,source='learned',confidence=1," +
      "needs_review=0,question=NULL,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') " +
      "WHERE quick_entry_categories.source!='user' RETURNING entry_id",
    ).bind(data.category, owner, key).all<{ entry_id: string }>();
  }
  return respond({ updated: true, category: data.category, learnedMerchant: Boolean(data.applyToMerchant && key) });
}

async function reconcileCategories(db: QuickD1, owner: string, env: QuickWorkerEnv): Promise<Response> {
  // Recheck a small batch; never touch manually confirmed classification or financial facts.
  const entries = await db.prepare(
    "SELECT e.id,e.kind,e.merchant FROM quick_manual_entries e " +
    "LEFT JOIN quick_entry_categories c ON c.entry_id=e.id AND c.owner_id=e.owner_id " +
    "WHERE e.owner_id=? AND (c.entry_id IS NULL OR c.source NOT IN ('user','protected','learned')) " +
    "ORDER BY e.occurred_at DESC LIMIT 10",
  ).bind(owner).all<Pick<ManualEntry,"id"|"kind"|"merchant">>();
  let reviewed = 0, pending = 0;
  for (const entry of entries.results) {
    const result = await categorizeEntry(db, owner, entry, env);
    reviewed++;
    if (result.needsReview) pending++;
  }
  if (pending) await notifyCategoryQuestion(db, owner, env);
  return respond({ reviewed, pending, batchLimit: 10 });
}

async function subscribePush(db: QuickD1, owner: string, body: unknown, env: QuickWorkerEnv): Promise<Response> {
  if (!pushEnabled(env)) return respond({ error: "Push not configured" }, 503);
  const data = strictObject(body, ["endpoint"]);
  let endpoint: string;
  try { endpoint = pushEndpoint(data.endpoint); } catch { throw new InputError("Invalid push subscription"); }
  await db.prepare(
    "INSERT INTO quick_push_subscriptions(owner_id,endpoint) VALUES(?,?) " +
    "ON CONFLICT(owner_id,endpoint) DO NOTHING RETURNING owner_id",
  ).bind(owner, endpoint).first<{ owner_id: string }>();
  return respond({ subscribed: true });
}
async function unsubscribePush(db: QuickD1, owner: string, body: unknown): Promise<Response> {
  const data = strictObject(body, ["endpoint"]);
  let endpoint: string;
  try { endpoint = pushEndpoint(data.endpoint); } catch { throw new InputError("Invalid push subscription"); }
  await db.prepare(
    "DELETE FROM quick_push_subscriptions WHERE owner_id=? AND endpoint=? RETURNING owner_id",
  ).bind(owner, endpoint).first<{ owner_id: string }>();
  return respond({ unsubscribed: true });
}
async function confirmEntry(db: QuickD1, owner: string, body: unknown, env: QuickWorkerEnv): Promise<Response> {
  const data = strictObject(body, [
    "accountId", "clientEntryId", "amount", "currency", "paymentMethod", "classification",
    "occurredAt", "merchant", "bankLabel", "confirmed",
  ]);
  if (data.confirmed !== true) throw new InputError("Explicit confirmation required");
  const accountId = mustUuid(data.accountId, "accountId");
  const draft = prepareQuickEntry({
    tenantId: owner,
    actorId: owner,
    clientEntryId: data.clientEntryId as string,
    amount: data.amount as string,
    currency: data.currency as "COP" | "USD",
    paymentMethod: data.paymentMethod as "cash",
    classification: data.classification as "expense",
    occurredAt: data.occurredAt as string,
    ...(data.merchant === undefined ? {} : { merchant: data.merchant as string }),
    ...(data.bankLabel === undefined ? {} : { bankLabel: data.bankLabel as string }),
  });
  // Bank selection is a property of card / bank transfer payment method,
  // not a login or bank integration. Fail closed if submitted mismatched.
  const methodRequiresBank = draft.paymentMethod === "debit_card" ||
    draft.paymentMethod === "credit_card" ||
    draft.paymentMethod === "bank_transfer";
  if (methodRequiresBank && !draft.bankLabel) {
    return respond({ error: "Bank name required for card or bank transfer" }, 422);
  }
  if (!methodRequiresBank && draft.bankLabel !== null) {
    return respond({ error: "Bank name only allowed for card or bank transfer" }, 422);
  }
  // D1 integers are safely representable here because the domain maximum is 1e12.
  const minor = Number(draft.money.amountMinor);
  if (!Number.isSafeInteger(minor)) throw new InputError("Amount exceeds supported integer range");
  const account = await db.prepare(
    "SELECT id FROM quick_manual_accounts WHERE id=? AND owner_id=? AND currency=?",
  ).bind(accountId, owner, draft.money.currency).first<{ id: string }>();
  if (!account) return respond({ error: "Manual account unavailable or currency mismatch" }, 403);

  // One atomic SQLite statement wins conflicting requests. It never changes
  // an existing entry; reading the existing key distinguishes replay/conflict.
  const inserted = await db.prepare(
    "INSERT INTO quick_manual_entries(id,owner_id,account_id,client_entry_id,amount_minor," +
    "currency,payment_method,kind,occurred_at,merchant,bank_label) " +
    "VALUES(?,?,?,?,?,?,?,?,?,?,?) " +
    "ON CONFLICT(owner_id,client_entry_id) DO NOTHING RETURNING id",
  ).bind(
    crypto.randomUUID(), owner, accountId, draft.clientEntryId, minor,
    draft.money.currency, draft.paymentMethod, draft.kind, draft.occurredAt,
    draft.merchant, draft.bankLabel,
  ).first<{ id: string }>();
  if (inserted) {
    // Classification metadata is separate from immutable transaction facts.
    try {
      const decision = await categorizeEntry(db, owner, {
        id: inserted.id, kind: draft.kind, merchant: draft.merchant,
      }, env);
      if (decision.needsReview) await notifyCategoryQuestion(db, owner, env);
    } catch { /* The successful financial save must not become an ambiguous retry. */ }
    return respond({ entryId: inserted.id, replayed: false }, 201);
  }
  const prior = await db.prepare(
    "SELECT id,account_id,client_entry_id,amount_minor,currency,payment_method,kind,occurred_at,merchant,bank_label " +
    "FROM quick_manual_entries WHERE owner_id=? AND client_entry_id=?",
  ).bind(owner, draft.clientEntryId).first<ManualEntry>();
  if (!prior) return respond({ error: "Unable to verify write" }, 503);
  if (prior.account_id !== accountId || prior.amount_minor !== minor ||
      prior.currency !== draft.money.currency || prior.payment_method !== draft.paymentMethod ||
      prior.kind !== draft.kind || prior.occurred_at !== draft.occurredAt ||
      prior.merchant !== draft.merchant || prior.bank_label !== draft.bankLabel) {
    return respond({ error: "Entry idempotency key reused with different data" }, 409);
  }
  return respond({ entryId: prior.id, replayed: true });
}

export async function handleQuickRequest(
  request: Request, env: QuickWorkerEnv, ctx: QuickWorkerContext,
): Promise<Response> {
  const { pathname } = new URL(request.url);
  if (pathname === "/healthz" && request.method === "GET") {
    return respond({ status: "ok", service: "finanzasoss-quick-staging", writesConfigured: env.ALLOW_WRITES === "true" });
  }
  const isUiPath = pathname === "/" || pathname === "/quick.css" ||
    pathname === "/quick.js" || pathname === "/sw.js" || pathname === "/manifest.webmanifest";
  if (!isUiPath && !pathname.startsWith("/api/quick/")) {
    return respond({ error: "Not found" }, 404);
  }
  const owner = await principal(ctx, env);
  if (!owner) return respond({ error: "Cloudflare Access required" }, 401);
  if (!env.DB) return respond({ error: "Database not configured" }, 503);
  if (request.method === "GET" && isUiPath) {
    if (pathname === "/") return respondAsset(QUICK_HTML, "text/html");
    if (pathname === "/quick.css") return respondAsset(QUICK_CSS, "text/css");
    if (pathname === "/quick.js") return respondAsset(QUICK_JS, "application/javascript");
    if (pathname === "/sw.js") return respondAsset(PUSH_SW, "application/javascript");
    return respondAsset(JSON.stringify({
      name: "FinanzasOSS", short_name: "FinanzasOSS", start_url: "/",
      scope: "/", display: "standalone", background_color: "#f4f3f0", theme_color: "#111c25",
    }), "application/manifest+json");
  }
  try {
    if (request.method === "POST") {
      if (env.ALLOW_WRITES !== "true") return respond({ error: "Staging writes disabled" }, 503);
      requireSameOrigin(request);
      const data = await parseJson(request);
      if (pathname === "/api/quick/accounts") return await createAccount(env.DB, owner, data);
      if (pathname === "/api/quick/entries") return await confirmEntry(env.DB, owner, data, env);
      if (pathname === "/api/quick/categories/review") return await reviewCategory(env.DB, owner, data);
      if (pathname === "/api/quick/categories/reconcile") return await reconcileCategories(env.DB, owner, env);
      if (pathname === "/api/quick/push/subscribe") return await subscribePush(env.DB, owner, data, env);
      if (pathname === "/api/quick/push/unsubscribe") return await unsubscribePush(env.DB, owner, data);
    } else if (request.method === "GET") {
      if (pathname === "/api/quick/accounts") return await listAccounts(env.DB, owner);
      if (pathname === "/api/quick/entries") return await listEntries(env.DB, owner);
      if (pathname === "/api/quick/push/config") return respond({
        enabled: pushEnabled(env), publicKey: pushEnabled(env) ? env.VAPID_PUBLIC_KEY : null,
      });
    }
    return respond({ error: "Not found" }, 404);
  } catch (error) {
    if (error instanceof InputError) return respond({ error: error.message }, error.status);
    // prepareQuickEntry rejects untrusted fields: never leak DB internals
    // or the submitted financial body to logs.
    if (error instanceof Error && /^(Amount |occurredAt |Classification |Payment method |clientEntryId |Only explicitly supported currencies|merchant |bankLabel |tenantId |actorId )/.test(error.message)) {
      return respond({ error: "Invalid financial entry" }, 422);
    }
    return respond({ error: "Unable to process request" }, 500);
  }
}

export default {
  fetch(request: Request, env: QuickWorkerEnv, ctx: QuickWorkerContext) {
    return handleQuickRequest(request, env, ctx);
  },
};
