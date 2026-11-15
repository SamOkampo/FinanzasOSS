import {inspectStatementPage,STATEMENT_VISION_PATH} from "./statement-vision.js";
import { prepareQuickEntry } from "../../../packages/finance-core/src/quick-entry.js";
import { QUICK_HTML, QUICK_CSS, QUICK_JS } from "./quick-ui.js";
import { DASH_HTML } from "./dashboard-html.js";
import { DASH_CSS } from "./dashboard-css.js";
import { DASH_JS } from "./dashboard-js.js";
import { INCOME_JS } from "./dashboard-income-js.js";
import { BALANCES_JS } from "./dashboard-balances-js.js";
import { saveVerifiedBalance, verifiedBalances, BalanceInputError } from "./bank-reconciliation.js";
import { MOBILE_INPUT_JS } from "./dashboard-mobile-input-js.js";
import { BANK_BENEFITS_JS } from "./dashboard-bank-benefits-js.js";
import { STUDIO_JS } from "./dashboard-studio-js.js";
import { BUDGET_JS } from "./dashboard-budgets-js.js";
import { MOVEMENT_EDITOR_JS } from "./dashboard-movement-editor-js.js";
import { IMPORT_JS } from "./dashboard-import-js.js";
import { DOCUMENT_INSPECT_JS } from "./dashboard-document-inspect-js.js";
import { STATEMENT_PDF_WORKER_JS, STATEMENT_PDF_WASM_BASE64, PDFJS_RENDERER_JS, PDFJS_WORKER_JS } from "../.generated/statement-pdf-worker-asset.js";
import { REVIEW_CONFIRM_JS } from "./dashboard-review-confirm-v41-js.js";
import { DASH_MANIFEST, DASH_ICON_SVG, DASH_ICON_180_PNG_BASE64, DASH_SW } from "./dashboard-assets.js";
import { dashboardOverview, dashboardMovements } from "./dashboard-data.js";
import { studioCapabilities } from "./studio-capabilities.js";
import { readBudgets, writeBudget, BudgetInputError } from "./spending-limits.js";
import { changeMovement, MovementInputError } from "./movement-edit.js";
import { prepareReset, confirmReset, ResetInputError } from "./studio-reset.js";
import { pushConfig, subscribe, unsubscribe, subscriptionStatus, sendDailyReminders, sendOwnerTestPush, PushInputError } from "./push.js";
import { previewStatement, commitStatement, StatementInputError } from "./statement-csv.js";
import { previewReconciliationV41, ReconcileInputError } from "./statement-reconcile-v41.js";
import { confirmReviewedStatementV41, statementReviewHistoryV41, ReviewConfirmationError } from "./statement-confirm-v41.js";
import { documentAnalysisAvailable,inspectFinancialDocument,DocumentInspectionError } from "./document-inspection-v41.js";
import { categoryReview, setCategory, qwenSuggestions, CategoryInputError } from "./categorization.js";
import { runCategoryAutomation, categoryAutomationStatus, setCategoryAutomation, runScheduledCategoryBackfill, answerCategoryQuestion } from "./category-automation.js";
import { excelExport } from "./excel-export.js";
import { INSIGHTS_JS } from "./dashboard-insights-js.js";
import { ASSISTANT_CSS, ASSISTANT_JS } from "./dashboard-assistant.js";
import { answerAssistant, assistantInbox, confirmAssistant, sendAssistantDigest, setAssistantNotices } from "./financial-assistant.js";
import { HAPI_JS } from "./dashboard-hapi.js";
import { listHapiDeposits, saveHapiDeposit, confirmHapiCredit } from "./hapi-deposits.js";
import { DEVICE_QA_JS } from "./dashboard-device-qa-js.js";
import { enrollShortcut, shortcutStatus, revokeShortcut, shortcutExpense, browserExpense, shortcutFailure, ShortcutInputError, authenticatedShortcutOwner, parseShortcutJson } from "./shortcut-direct.js";
import { saveIncome } from "./income-capture.js";

// Narrow structural definitions avoid requiring a Cloudflare SDK in Finance Core.
type SqlValue = string | number | null;
interface PreparedStatement {
  bind(...values: SqlValue[]): PreparedStatement;
  first<T extends object>(): Promise<T | null>;
  all<T extends object>(): Promise<{ results: T[] }>;
}
export interface QuickD1 {
  prepare(query: string): PreparedStatement;
  batch?(statements: PreparedStatement[]): Promise<Array<{ meta?: { changes?: number } }>>;
}
export interface QuickWorkerEnv {
  readonly DB: QuickD1;
  readonly ACCESS_AUD?: string;
  readonly ALLOW_WRITES?: string;
  readonly ALLOW_V41_CONFIRM_WRITES?: string;
  readonly ALLOW_SHORTCUT_WRITES?: string;
  readonly ALLOW_RESET_WRITES?: string;
  readonly ALLOW_PUSH_SUBSCRIPTIONS?: string;
  readonly ALLOW_PUSH_SEND?: string;
  readonly ALLOW_CATEGORY_PUSH_SEND?: string;
  readonly ALLOW_DAILY_REMINDERS?: string;
  readonly VAPID_PUBLIC_KEY?: string;
  readonly VAPID_PRIVATE_JWK?: string;
  readonly VAPID_SUBJECT?: string;
  readonly ALLOW_AI_SUGGESTIONS?: string;
  readonly ALLOW_V41_ASSISTANT?: string;
  readonly ALLOW_V41_ASSISTANT_AI?: string;
  readonly ALLOW_V41_HAPI?: string;
  readonly ALLOW_DOCUMENT_ANALYSIS?: string;
  readonly ALLOW_STATEMENT_VISION?: string;
  readonly AI?: {
    run(model:string,input:{messages:{role:string;content:string|Array<
      {type:"text";text:string}|{type:"image_url";image_url:{url:string}}
    >}[];
      max_tokens?:number;max_completion_tokens?:number;
      reasoning_effort?:"low"|"medium"|"xhigh";temperature:number;stream:boolean}):Promise<unknown>;
    toMarkdown?(document:{name:string;blob:Blob}):Promise<unknown>;
  };
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
async function parseJson(request: Request, maxChars=4096): Promise<unknown> {
  if (request.headers.get("Content-Type")?.split(";")[0]?.trim().toLowerCase() !== "application/json") {
    throw new InputError("Content-Type must be application/json", 415);
  }
  const length = Number(request.headers.get("Content-Length") ?? "0");
  if (!Number.isFinite(length) || length < 0 || length > maxChars) {
    throw new InputError("Request body exceeds limit", 413);
  }
  const raw = await request.text();
  if (raw.length > maxChars) throw new InputError("Request body exceeds limit", 413);
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
    "merchant,bank_label,created_at FROM quick_manual_entries WHERE owner_id=? AND deleted_at IS NULL " +
    "UNION ALL SELECT id,NULL AS account_id,client_entry_id,amount_minor,currency," +
    "payment_method,kind,occurred_at,merchant,bank_label,created_at " +
    "FROM quick_shortcut_expenses WHERE owner_id=? AND deleted_at IS NULL " +
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

async function categorizedResponse(
 response:Response,db:QuickD1,owner:string,env:QuickWorkerEnv,
 source:"manual"|"accountless" | null,
):Promise<Response>{
 if(response.status!==201)return response;
 try{
   const body=await response.clone().json() as {entryId?:string;inserted?:number;replayed?:boolean};
   if(source && typeof body.entryId==="string"){
     await runCategoryAutomation(db,owner,env,{source,id:body.entryId});
     // The user sees a verified AI/rule classification immediately after
     // saving, without a second client POST or speculative financial claims.
     const all=await (await categoryReview(db,owner)).json() as
       {entries?:Array<{id:string;source:string;category:string;subcategory:string;
         economicGroup:string;needsReview:boolean;automatic:string|null}>};
     const found=all.entries?.find(x=>x.id===body.entryId&&x.source===source);
     if(found)return new Response(JSON.stringify({...body,
       classification:{category:found.category,subcategory:found.subcategory,
         economicGroup:found.economicGroup,needsReview:found.needsReview,
         source:found.automatic || "reglas"}}),{
       status:201,headers:response.headers
     });
   } else if(!source && typeof body.inserted==="number" && body.inserted>0){
     await runCategoryAutomation(db,owner,env);
   }
 }catch{ /* Successful financial writes must never become retries if AI fails. */ }
 return response;
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
    "/dashboard-sw.js", "/studio.js", "/income.js", "/balances.js", "/bank-benefits.js", "/mobile-input.js", "/budgets.js", "/movement-editor.js", "/statement-import.js", "/document-inspect.js", "/statement-pdf-worker.js", "/statement-pdf-engine.wasm", "/statement-pdf-renderer.mjs", "/statement-pdf-render-worker.mjs", "/review-confirm-v41.js", "/insights.js", "/device-qa.js",
    "/assistant.js", "/hapi.js",
  ]).has(pathname);
  if (!isUiPath && !pathname.startsWith("/api/quick/")) {
    return respond({ error: "Not found" }, 404);
  }
  // Separate bearer+Cloudflare Access service authentication, never a browser cookie.
  if ((pathname === "/api/quick/shortcut/expense" || pathname === "/api/quick/shortcut/income") &&
      request.method === "POST") {
    try {
      if(pathname === "/api/quick/shortcut/expense")return await shortcutExpense(request, env, ctx);
      const owner=await authenticatedShortcutOwner(request,env,ctx);
      return await saveIncome(env.DB,owner,await parseShortcutJson(request),false);
    } catch (error) { return shortcutFailure(error); }
  }
  const owner = await principal(ctx, env);
  if (!owner) {
    // A browser with an expired Access cookie should see a usable sign-in
    // page, never a raw JSON error. This does NOT bypass authentication:
    // all routes and data access continue requiring ctx.access identity.
    if (request.method === "GET" && (pathname === "/" || pathname === "/dashboard") &&
        request.headers.get("Accept")?.includes("text/html")) {
      const loginPage = respondAsset(
        '<!doctype html><html lang="es"><head><meta charset="utf-8">' +
        '<meta name="viewport" content="width=device-width,initial-scale=1">' +
        '<meta name="theme-color" content="#111b1d"><title>Iniciar sesión · FinanzasOSS</title>' +
        '<style>body{background:#111b1d;color:#edf1ea;font:16px system-ui,sans-serif;' +
        'min-height:100dvh;display:grid;place-items:center;margin:0;padding:20px;' +
        'box-sizing:border-box}main{width:min(100%,400px);padding:32px;' +
        'background:#1d2c2a;border:1px solid #3c5149;border-radius:16px}' +
        'h1{font-size:26px;margin:0 0 12px}p{color:#cfddd3;line-height:1.6}' +
        'a{display:block;background:#d8e7da;color:#19352c;padding:15px 20px;' +
        'border-radius:8px;text-align:center;font-weight:750;margin-top:24px;' +
        'text-decoration:none}a:focus-visible{outline:3px solid #e1ae8c;' +
        'outline-offset:4px}</style></head><body><main><h1>FinanzasOSS</h1>' +
        '<p>Tu sesión necesita una nueva verificación. Tus gastos y presupuestos siguen guardados.</p>' +
        '<a href="/cdn-cgi/access/login?redirect_url=%2Fdashboard">' +
        'Iniciar sesión de forma segura</a><p>Vuelve a abrir FinanzasOSS desde el icono de tu iPhone después de entrar.</p>' +
        '</main></body></html>',
        "text/html"
      );
      loginPage.headers.set("Content-Security-Policy",
        "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; " +
        "form-action 'none'; frame-ancestors 'none'");
      return loginPage;
    }
    return respond({ error: "Cloudflare Access required" }, 401);
  }
  if (!env.DB) return respond({ error: "Database not configured" }, 503);
  if (request.method === "GET" && isUiPath) {
    if (pathname === "/") return respondAsset(QUICK_HTML, "text/html");
    if (pathname === "/quick.css") return respondAsset(QUICK_CSS, "text/css");
    if (pathname === "/quick.js") return respondAsset(QUICK_JS, "application/javascript");
    if (pathname === "/dashboard") {
      const html=DASH_HTML.replace('data-analysis-available="false"',
        'data-analysis-available="'+String(documentAnalysisAvailable(env))+'"')
        .replace('data-vision-available="false"',
          'data-vision-available="'+String(env.ALLOW_STATEMENT_VISION==="true"&&Boolean(env.AI))+'"');
      return respondAsset(html
        .replace('data-assistant-enabled="false"','data-assistant-enabled="'+String(env.ALLOW_V41_ASSISTANT==="true")+'"')
        .replace('data-hapi-enabled="false"','data-hapi-enabled="'+String(env.ALLOW_V41_HAPI==="true")+'"'),"text/html");
    }
    if (pathname === "/dashboard.css") return respondAsset(DASH_CSS+ASSISTANT_CSS, "text/css");
    if (pathname === "/assistant.js") {
      return env.ALLOW_V41_ASSISTANT==="true"?respondAsset(ASSISTANT_JS,"application/javascript"):
        respondAsset("", "application/javascript");
    }
    if (pathname === "/hapi.js") return respondAsset(env.ALLOW_V41_HAPI==="true"?HAPI_JS:"","application/javascript");
    if (pathname === "/dashboard.js") return respondAsset(DASH_JS, "application/javascript");
    if (pathname === "/bank-benefits.js") return respondAsset(BANK_BENEFITS_JS, "application/javascript");
    if (pathname === "/mobile-input.js") return respondAsset(MOBILE_INPUT_JS, "application/javascript");
    if (pathname === "/studio.js") return respondAsset(STUDIO_JS, "application/javascript");
    if (pathname === "/income.js") return respondAsset(INCOME_JS, "application/javascript");
    if (pathname === "/balances.js") return respondAsset(BALANCES_JS, "application/javascript");
    if (pathname === "/budgets.js") return respondAsset(BUDGET_JS, "application/javascript");
    if (pathname === "/movement-editor.js") return respondAsset(MOVEMENT_EDITOR_JS, "application/javascript");
    if (pathname === "/statement-import.js") return respondAsset(IMPORT_JS, "application/javascript");
    if (pathname === "/review-confirm-v41.js") return respondAsset(REVIEW_CONFIRM_JS,"application/javascript");
    if (pathname === "/document-inspect.js") return respondAsset(DOCUMENT_INSPECT_JS, "application/javascript");
    if (pathname === "/statement-pdf-worker.js") {
      const worker = respondAsset(STATEMENT_PDF_WORKER_JS, "application/javascript");
      const engineUrl = new URL("/statement-pdf-engine.wasm", request.url);
      worker.headers.set("Content-Security-Policy",
        "default-src 'none'; script-src 'wasm-unsafe-eval'; connect-src " + engineUrl.href);
      return worker;
    }
    if(pathname==="/statement-pdf-renderer.mjs")
      return respondAsset(PDFJS_RENDERER_JS,"application/javascript");
    if(pathname==="/statement-pdf-render-worker.mjs")
      return respondAsset(PDFJS_WORKER_JS,"application/javascript");
    if (pathname === "/statement-pdf-engine.wasm") {
      return new Response(Uint8Array.from(atob(STATEMENT_PDF_WASM_BASE64), c=>c.charCodeAt(0)), {
        headers: {"Content-Type":"application/wasm","Cache-Control":"no-store, private",
          "X-Content-Type-Options":"nosniff"},
      });
    }
    if (pathname === "/insights.js") return respondAsset(INSIGHTS_JS, "application/javascript");
    if (pathname === "/device-qa.js") return respondAsset(DEVICE_QA_JS, "application/javascript");
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
    if(pathname.startsWith("/api/quick/v41/agent/")&&env.ALLOW_V41_ASSISTANT!=="true")
      return respond({error:"El asistente no está habilitado en este entorno."},503);
    if(pathname.startsWith("/api/quick/v41/hapi/")&&env.ALLOW_V41_HAPI!=="true")
      return respond({error:"Hapi todavía no está habilitado en este entorno."},503);
    if (request.method === "POST") {
      if (env.ALLOW_WRITES !== "true" && pathname !== "/api/quick/v41/reconcile/preview" &&
          pathname !== "/api/quick/v41/ai/document/inspect" && pathname !== STATEMENT_VISION_PATH)
        return respond({ error: "Staging writes disabled" }, 503);
      requireSameOrigin(request);
      if(pathname===STATEMENT_VISION_PATH)return await inspectStatementPage(request,env.DB,owner,env);
      if(pathname==="/api/quick/v41/ai/document/inspect")
        return await inspectFinancialDocument(request,env.DB,owner,env);
      const data = await parseJson(request, (pathname.startsWith("/api/quick/import/")||pathname.startsWith("/api/quick/v41/reconcile/"))?85000:4096);
      if (pathname === "/api/quick/v41/agent/answer") return await answerAssistant(env.DB,owner,env,data);
      if (pathname === "/api/quick/v41/agent/confirm") return await confirmAssistant(env.DB,owner,data);
      if (pathname === "/api/quick/v41/agent/preferences") return await setAssistantNotices(env.DB,owner,data);
      if (pathname === "/api/quick/v41/hapi/deposits") return await saveHapiDeposit(env.DB,owner,data);
      if (pathname === "/api/quick/v41/hapi/credit") return await confirmHapiCredit(env.DB,owner,data);
      if (pathname === "/api/quick/accounts") return await createAccount(env.DB, owner, data);
      if (pathname === "/api/quick/entries") return await categorizedResponse(
        await confirmEntry(env.DB, owner, data),env.DB,owner,env,"manual");
      if (pathname === "/api/quick/studio/expense") return await categorizedResponse(
        await browserExpense(env.DB, owner, data),env.DB,owner,env,"accountless");
      if (pathname === "/api/quick/studio/income") return await saveIncome(env.DB,owner,data,true);
      if (pathname === "/api/quick/balances/verify") return await saveVerifiedBalance(env.DB,owner,data);
      if (pathname === "/api/quick/budgets") return await writeBudget(env.DB, owner, data);
      if (pathname === "/api/quick/studio/movement/change") return await changeMovement(env.DB, owner, data);
      if (pathname === "/api/quick/push/subscribe") return await subscribe(env.DB, owner, env, data);
      if (pathname === "/api/quick/push/unsubscribe") return await unsubscribe(env.DB, owner, data);
      if (pathname === "/api/quick/push/status") return await subscriptionStatus(env.DB, owner, data);
      if (pathname === "/api/quick/push/test") return await sendOwnerTestPush(env.DB, owner, env, data);
      if (pathname === "/api/quick/import/preview") return await previewStatement(env.DB, owner, data);
      if (pathname === "/api/quick/v41/reconcile/preview") return await previewReconciliationV41(env.DB,owner,data);
       if (pathname === "/api/quick/v41/reconcile/confirm") {
         if(env.ALLOW_V41_CONFIRM_WRITES!=="true") return respond({error:"La confirmación v41 aún no está habilitada en este entorno"},503);
         return await confirmReviewedStatementV41(env.DB,owner,data);
       }
      if (pathname === "/api/quick/import/commit") return await categorizedResponse(
        await commitStatement(env.DB, owner, data),env.DB,owner,env,null);
      if (pathname === "/api/quick/categories/set") return await setCategory(env.DB, owner, data);
      if (pathname === "/api/quick/ai/suggest") return await qwenSuggestions(env.DB, owner, env, data);
      if (pathname === "/api/quick/categories/automation/setting")
        return await setCategoryAutomation(env.DB,owner,data);
      if (pathname === "/api/quick/categories/automation/run")
        return await runCategoryAutomation(env.DB,owner,env);
      if (pathname === "/api/quick/categories/answer")
        return await answerCategoryQuestion(env.DB,owner,env,data);
      if (pathname === "/api/quick/studio/reset/prepare" || pathname === "/api/quick/studio/reset/confirm") {
        // This feature must never run outside the explicitly configured private
        // staging Worker. A typed phrase and Access-authenticated owner required.
        if (env.ALLOW_RESET_WRITES !== "true" ||
          new URL(request.url).hostname !== "finanzasoss-quick-staging.socampoecheverry.workers.dev") {
          return respond({ error: "Account reset unavailable outside private staging" }, 403);
        }
        return pathname.endsWith("/prepare") ?
          await prepareReset(env.DB, owner, data) : await confirmReset(env.DB, owner, data);
      }
      if (pathname === "/api/quick/shortcut/enroll") {
        if (env.ALLOW_SHORTCUT_WRITES !== "true") return respond({ error: "Direct shortcuts disabled" }, 503);
        return await enrollShortcut(env.DB, owner, data);
      }
      if (pathname === "/api/quick/shortcut/revoke") return await revokeShortcut(env.DB, owner, data);
    } else if (request.method === "GET") {
      if (pathname === "/api/quick/v41/agent/inbox") return await assistantInbox(env.DB,owner,env);
      if (pathname === "/api/quick/v41/hapi/deposits") return await listHapiDeposits(env.DB,owner);
      if (pathname === "/api/quick/profile") {
        // Cloudflare Access supplies the authenticated identity. Never trust
        // an email or owner ID from URL parameters, headers or request bodies.
        const identity = await ctx.access?.getIdentity();
        if (!identity || typeof identity.email !== "string" ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identity.email)) {
          return respond({ error: "Authenticated email unavailable" }, 401);
        }
        return respond({ email: identity.email, profile: "personal" });
      }
      if (pathname === "/api/quick/v41/reconcile/history") return await statementReviewHistoryV41(env.DB,owner);
       if (pathname === "/api/quick/accounts") return await listAccounts(env.DB, owner);
      if (pathname === "/api/quick/entries") return await listEntries(env.DB, owner);
      if (pathname === "/api/quick/dashboard/overview") return await dashboardOverview(env.DB, owner);
      if (pathname === "/api/quick/balances") return await verifiedBalances(env.DB,owner);
      if (pathname === "/api/quick/categories") return await categoryReview(env.DB, owner);
      if (pathname === "/api/quick/categories/automation/status")
        return await categoryAutomationStatus(env.DB,owner);
      if (pathname === "/api/quick/export.xlsx") return await excelExport(env.DB, owner);
      if (pathname === "/api/quick/budgets") return await readBudgets(env.DB, owner);
      if (pathname === "/api/quick/studio/capabilities") return studioCapabilities();
      if (pathname === "/api/quick/push/config") return pushConfig(env);
      if (pathname === "/api/quick/dashboard/movements") {
        return await dashboardMovements(env.DB, owner, new URL(request.url));
      }
      if (pathname === "/api/quick/shortcut/devices") return await shortcutStatus(env.DB, owner);
    }
    return respond({ error: "Not found" }, 404);
  } catch (error) {
    if (error instanceof InputError || error instanceof ShortcutInputError || error instanceof ResetInputError || error instanceof PushInputError || error instanceof BudgetInputError || error instanceof BalanceInputError || error instanceof MovementInputError || error instanceof StatementInputError || error instanceof ReconcileInputError || error instanceof ReviewConfirmationError || error instanceof DocumentInspectionError || error instanceof CategoryInputError) return respond({ error: error.message }, error.status);
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
  async scheduled(controller:{cron:string;scheduledTime:number}, env:QuickWorkerEnv) {
    if(controller.cron!=="30 1 * * *") return;
    try{await runScheduledCategoryBackfill(env);}
    catch{ /* Existing financial reminders must still execute after any AI failure. */ }
    if(env.ALLOW_V41_ASSISTANT==="true"){
      try{await sendAssistantDigest(env,controller.scheduledTime);}
      catch{ /* A digest failure does not interrupt other reminders. */ }
    }
    // Daily expense reminders are separate from Qwen's opt-in category questions.
    if(env.ALLOW_DAILY_REMINDERS==="true")
      await sendDailyReminders(env,controller.scheduledTime);
  },
};
