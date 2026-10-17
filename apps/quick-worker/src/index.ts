import { prepareQuickEntry } from "../../../packages/finance-core/src/quick-entry.js";
import { QUICK_HTML, QUICK_CSS, QUICK_JS } from "./quick-ui.js";
import { DASH_HTML } from "./dashboard-html.js";
import { DASH_CSS } from "./dashboard-css.js";
import { DASH_JS } from "./dashboard-js.js";
import { DASH_MANIFEST, DASH_ICON_SVG, DASH_ICON_180_PNG_BASE64, DASH_SW } from "./dashboard-assets.js";
import { dashboardOverview, dashboardMovements } from "./dashboard-data.js";
import { enrollShortcut, shortcutStatus, revokeShortcut, shortcutExpense, shortcutFailure, ShortcutInputError } from "./shortcut-direct.js";

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
export interface QuickWorkerEnv {
  readonly DB: QuickD1;
  readonly ACCESS_AUD?: string;
  readonly ALLOW_WRITES?: string;
  readonly ALLOW_SHORTCUT_WRITES?: string;
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
    ? "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; manifest-src 'self'; img-src 'self'; worker-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'"
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
  // Combine legacy manually-accounted records and new account-free Shortcut
  // expenses, without assigning a fake bank/cash account to the latter.
  const data = await db.prepare(
    "SELECT id,account_id,client_entry_id,amount_minor,currency,payment_method,kind,occurred_at," +
    "merchant,bank_label,created_at FROM quick_manual_entries WHERE owner_id=? " +
    "UNION ALL SELECT id,NULL AS account_id,client_entry_id,amount_minor,currency," +
    "payment_method,kind,occurred_at,merchant,bank_label,created_at " +
    "FROM quick_shortcut_expenses WHERE owner_id=? " +
    "ORDER BY occurred_at DESC,id DESC LIMIT 100",
  ).bind(owner, owner).all<ManualEntry>();
  return respond({ entries: data.results.map((x) => ({ ...x, amount_minor: String(x.amount_minor) })) });
}
async function confirmEntry(db: QuickD1, owner: string, body: unknown, ignoreReplayTime = false): Promise<Response> {
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
  if (inserted) return respond({ entryId: inserted.id, replayed: false }, 201);
  const prior = await db.prepare(
    "SELECT id,account_id,client_entry_id,amount_minor,currency,payment_method,kind,occurred_at,merchant,bank_label " +
    "FROM quick_manual_entries WHERE owner_id=? AND client_entry_id=?",
  ).bind(owner, draft.clientEntryId).first<ManualEntry>();
  if (!prior) return respond({ error: "Unable to verify write" }, 503);
  if (prior.account_id !== accountId || prior.amount_minor !== minor ||
      prior.currency !== draft.money.currency || prior.payment_method !== draft.paymentMethod ||
      prior.kind !== draft.kind || (!ignoreReplayTime && prior.occurred_at !== draft.occurredAt) ||
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
    return respond({ status: "ok", service: "finanzasoss-quick-staging", writesConfigured: env.ALLOW_WRITES === "true", shortcutsConfigured: env.ALLOW_SHORTCUT_WRITES === "true" });
  }
  const isUiPath = new Set([
    "/", "/quick.css", "/quick.js", "/dashboard", "/dashboard.css", "/dashboard.js",
    "/dashboard.webmanifest", "/dashboard-icon.svg", "/dashboard-icon-180.png",
    "/dashboard-sw.js",
  ]).has(pathname);
  if (!isUiPath && !pathname.startsWith("/api/quick/")) {
    return respond({ error: "Not found" }, 404);
  }
  // Separate bearer+Cloudflare Access service authentication, never a browser cookie.
  if (pathname === "/api/quick/shortcut/expense" && request.method === "POST") {
    try { return await shortcutExpense(request, env, ctx); }
    catch (error) { return shortcutFailure(error); }
  }
  const owner = await principal(ctx, env);
  if (!owner) return respond({ error: "Cloudflare Access required" }, 401);
  if (!env.DB) return respond({ error: "Database not configured" }, 503);
  if (request.method === "GET" && isUiPath) {
    if (pathname === "/") return respondAsset(QUICK_HTML, "text/html");
    if (pathname === "/quick.css") return respondAsset(QUICK_CSS, "text/css");
    if (pathname === "/quick.js") return respondAsset(QUICK_JS, "application/javascript");
    if (pathname === "/dashboard") return respondAsset(DASH_HTML, "text/html");
    if (pathname === "/dashboard.css") return respondAsset(DASH_CSS, "text/css");
    if (pathname === "/dashboard.js") return respondAsset(DASH_JS, "application/javascript");
    if (pathname === "/dashboard.webmanifest") return respondAsset(DASH_MANIFEST, "application/manifest+json");
    if (pathname === "/dashboard-icon.svg") return respondAsset(DASH_ICON_SVG, "image/svg+xml");
    if (pathname === "/dashboard-sw.js") return respondAsset(DASH_SW, "application/javascript");
    // An iOS home-screen icon requires PNG, not only a manifest SVG.
    return new Response(Uint8Array.from(atob(DASH_ICON_180_PNG_BASE64), (c) => c.charCodeAt(0)), {
      headers: { "Content-Type": "image/png", "Cache-Control": "no-store, private",
        "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer" },
    });
  }
  try {
    if (request.method === "POST") {
      if (env.ALLOW_WRITES !== "true") return respond({ error: "Staging writes disabled" }, 503);
      requireSameOrigin(request);
      const data = await parseJson(request);
      if (pathname === "/api/quick/accounts") return await createAccount(env.DB, owner, data);
      if (pathname === "/api/quick/entries") return await confirmEntry(env.DB, owner, data);
      if (pathname === "/api/quick/shortcut/enroll") {
        if (env.ALLOW_SHORTCUT_WRITES !== "true") return respond({ error: "Direct shortcuts disabled" }, 503);
        return await enrollShortcut(env.DB, owner, data);
      }
      if (pathname === "/api/quick/shortcut/revoke") return await revokeShortcut(env.DB, owner, data);
    } else if (request.method === "GET") {
      if (pathname === "/api/quick/accounts") return await listAccounts(env.DB, owner);
      if (pathname === "/api/quick/entries") return await listEntries(env.DB, owner);
      if (pathname === "/api/quick/dashboard/overview") return await dashboardOverview(env.DB, owner);
      if (pathname === "/api/quick/dashboard/movements") {
        return await dashboardMovements(env.DB, owner, new URL(request.url));
      }
      if (pathname === "/api/quick/shortcut/devices") return await shortcutStatus(env.DB, owner);
    }
    return respond({ error: "Not found" }, 404);
  } catch (error) {
    if (error instanceof InputError || error instanceof ShortcutInputError) return respond({ error: error.message }, error.status);
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
