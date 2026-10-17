import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import { handleQuickRequest } from "../dist/apps/quick-worker/src/index.js";

// Real SQLite with a D1-shaped binding. It does NOT simulate Cloudflare Access
// middleware, so deployment requires independent Access policy validation.
const sql = readFileSync(
  new URL("../apps/quick-worker/migrations/0001_quick_d1.sql", import.meta.url), "utf8",
);
const sqlite = new DatabaseSync(":memory:");
sqlite.exec(sql);
sqlite.exec(readFileSync(new URL("../apps/quick-worker/migrations/0002_shortcut_devices.sql", import.meta.url), "utf8"));
sqlite.exec(readFileSync(new URL("../apps/quick-worker/migrations/0003_accountless_shortcut_expenses.sql", import.meta.url), "utf8"));
sqlite.exec(readFileSync(new URL("../apps/quick-worker/migrations/0004_staging_reset_challenges.sql", import.meta.url), "utf8"));
const db = {
  prepare(query) {
    let args = [];
    return {
      _query:query,
      get _args(){return args;},
      bind(...values) { args = values; return this; },
      async first() { return sqlite.prepare(query).get(...args) ?? null; },
      async all() { return { results: sqlite.prepare(query).all(...args) }; },
    };
  },
  async batch(statements) {
    sqlite.exec("BEGIN IMMEDIATE");
    try {
      const result = statements.map((statement) => ({
        meta:{changes:sqlite.prepare(statement._query).run(...statement._args).changes},
      }));
      sqlite.exec("COMMIT");
      return result;
    } catch(error) {
      sqlite.exec("ROLLBACK");
      throw error;
    }
  },
};
const env = { DB: db, ACCESS_AUD: "finanzasoss-staging-access-test", ALLOW_WRITES: "true" };
const disabledEnv = { ...env, ALLOW_WRITES: "false" };
const identity = (id, aud = env.ACCESS_AUD) => ({
  access: { aud, async getIdentity() { return { id }; } },
});
// Production Cloudflare Access identity has user_uuid rather than guaranteed id.
const A = { access: { aud: env.ACCESS_AUD, async getIdentity() {
  return { user_uuid: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", email: "redacted@example.invalid" };
} } };
const B = { access: { aud: env.ACCESS_AUD, async getIdentity() {
  return { user_uuid: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb" };
} } };
const LEGACY = identity("access-user-a");
const missing = {};
const origin = "https://finanzasoss-quick-staging.socampoecheverry.workers.dev";
const account = {
  clientAccountId: "cash-account-00000001",
  label: "Efectivo de pruebas",
  accountKind: "cash",
  currency: "COP",
  bankLabel: null,
};
const entry = {
  accountId: null,
  clientEntryId: "quick-charge-00000001",
  amount: "25000.50",
  currency: "COP",
  paymentMethod: "debit_card",
  classification: "expense",
  occurredAt: "2026-10-15T12:30:00.000Z",
  merchant: "Almuerzo",
  bankLabel: "Banco de prueba",
  confirmed: true,
};
async function call(path, method = "GET", payload, user = A, options = {}) {
  const headers = new Headers();
  if (method === "POST") {
    headers.set("Content-Type", options.contentType ?? "application/json");
    headers.set("Origin", options.origin ?? origin);
    if (options.fetchSite) headers.set("Sec-Fetch-Site", options.fetchSite);
  }
  const request = new Request(origin + path, {
    method, headers, ...(method === "POST" ? { body: JSON.stringify(payload) } : {}),
  });
  const response = await handleQuickRequest(request, options.env ?? env, user);
  return { status: response.status, body: await response.json(), headers: response.headers };
}

// UI and assets must be gated by the authenticated Access principal.
for (const path of ["/", "/quick.js", "/quick.css"]) {
  const denied = await call(path, "GET", undefined, missing);
  assert.equal(denied.status, 401);
  const allowed = await handleQuickRequest(
    new Request(origin + path), disabledEnv, A,
  );
  assert.equal(allowed.status, 200);
  assert.equal(allowed.headers.get("Cache-Control"), "no-store, private");
  assert.equal(allowed.headers.get("X-Content-Type-Options"), "nosniff");
  const body = await allowed.text();
  assert.ok(body.length > 100);
  if (path === "/") {
    assert.match(body, /<title>Quick · FinanzasOSS<\/title>/);
    assert.match(body, /id="entry-form"/);
    assert.match(body, /id="bank-field" hidden/);
    assert.match(body, /¿Qué banco es\?/);
    assert.match(allowed.headers.get("Content-Security-Policy"), /script-src 'self'/);
    assert.doesNotMatch(body, /<script(?:\s|>)(?![^>]*src=)/i);
  } else if (path === "/quick.js") {
    assert.match(body, /\/api\/quick\/entries/);
    assert.match(body, /TRANSFERENCIA PROPIA/);
    assert.match(body, /BANK_METHODS/);
    assert.match(body, /bankLabel/);
    assert.match(body, /APORTE A INVERSIÓN/);
    assert.match(body, /window\.confirm/);
    assert.match(body, /¿Es correcto el tipo de movimiento\?/);
    // The browser receives a JS string embedded in a TypeScript template;
    // compile it as source too, catching accidental escaped newline syntax.
    assert.doesNotThrow(() => new Function(body));
    assert.doesNotMatch(body, /localStorage|sessionStorage|innerHTML/);
  } else {
    assert.match(body, /prefers-reduced-motion/);
  }
}
assert.equal((await call("/", "POST", {}, A)).status, 404);
assert.equal((await call("/healthz", "GET", undefined, missing)).status, 200);
assert.equal((await call("/api/quick/accounts", "GET", undefined, missing)).status, 401);
assert.equal((await call("/api/quick/accounts", "GET", undefined, A)).status, 200);
assert.equal((await call("/api/quick/accounts", "GET", undefined, B)).status, 200);
assert.equal((await call("/api/quick/accounts", "GET", undefined, LEGACY)).status, 200);
assert.equal((await call("/api/quick/accounts", "GET", undefined, {
  access: { aud: env.ACCESS_AUD, async getIdentity() { return { user_uuid: "bad user!" }; } },
})).status, 401);
assert.equal((await call("/api/quick/accounts", "GET", undefined, {
  access: { aud: env.ACCESS_AUD, async getIdentity() { return { email: "only-email@example.invalid" }; } },
})).status, 401);
assert.equal((await call("/api/quick/accounts", "GET", undefined, identity("u", "wrong-aud"))).status, 401);
assert.equal((await call("/api/quick/accounts", "GET", undefined, identity(""))).status, 401);
assert.equal((await call("/api/quick/accounts", "GET", undefined, {
  access: { aud: env.ACCESS_AUD, async getIdentity() { return { email: "forged@example.com" }; } },
})).status, 401);

// Mutations need verified identity, exact Origin and opt-in staging writes.
assert.equal((await call("/api/quick/accounts", "POST", account, missing)).status, 401);
assert.equal((await call("/api/quick/accounts", "POST", account, A, { env: disabledEnv })).status, 503);
assert.equal((await call("/api/quick/accounts", "POST", account, A, { origin: "https://evil.invalid" })).status, 403);
assert.equal((await call("/api/quick/accounts", "POST", account, A, { fetchSite: "cross-site" })).status, 403);
assert.equal((await call("/api/quick/accounts", "POST", account, A, { contentType: "text/plain" })).status, 415);
assert.equal((await call("/api/quick/accounts", "POST", { ...account, owner_id: "access-user-b" })).status, 422);

const created = await call("/api/quick/accounts", "POST", account);
assert.equal(created.status, 201);
const aAccount = created.body.accountId;
assert.match(aAccount, /^[0-9a-f-]{36}$/);
assert.equal(created.body.replayed, false);
assert.equal((await call("/api/quick/accounts")).body.accounts.length, 1);
assert.equal((await call("/api/quick/accounts", "GET", undefined, B)).body.accounts.length, 0);

const repeatedAccount = await call("/api/quick/accounts", "POST", account);
assert.equal(repeatedAccount.status, 200);
assert.equal(repeatedAccount.body.replayed, true);
assert.equal(repeatedAccount.body.accountId, aAccount);
assert.equal((await call("/api/quick/accounts", "POST", { ...account, label: "Other label" })).status, 409);

const aEntry = { ...entry, accountId: aAccount };
assert.equal((await call("/api/quick/entries", "POST", { ...aEntry, confirmed: false })).status, 422);
assert.equal((await call("/api/quick/entries", "POST", { ...aEntry, amount: "0" })).status, 422);
assert.equal((await call("/api/quick/entries", "POST", { ...aEntry, amount: "1.999" })).status, 422);
assert.equal((await call("/api/quick/entries", "POST", { ...aEntry, tenantId: "access-user-b" })).status, 422);
assert.equal((await call("/api/quick/entries", "POST", { ...aEntry, currency: "USD" })).status, 403);
assert.equal((await call("/api/quick/entries", "POST", { ...aEntry, bankLabel: null })).status, 422);
assert.equal((await call("/api/quick/entries", "POST", { ...aEntry, paymentMethod: "cash", bankLabel: "Banco de prueba" })).status, 422);

const saved = await call("/api/quick/entries", "POST", aEntry);
assert.equal(saved.status, 201);
assert.equal(saved.body.replayed, false);
assert.match(saved.body.entryId, /^[0-9a-f-]{36}$/);
assert.equal((await call("/api/quick/entries", "POST", aEntry)).body.entryId, saved.body.entryId);
assert.equal((await call("/api/quick/entries", "POST", aEntry)).body.replayed, true);
assert.equal((await call("/api/quick/entries", "POST", { ...aEntry, amount: "100" })).status, 409);
assert.equal((await call("/api/quick/entries", "POST", { ...aEntry, bankLabel: "Otro banco" })).status, 409);

const aListed = await call("/api/quick/entries");
assert.equal(aListed.status, 200);
assert.equal(aListed.body.entries.length, 1);
assert.equal(aListed.body.entries[0].amount_minor, "2500050");
assert.equal(aListed.body.entries[0].kind, "purchase");
assert.equal(aListed.body.entries[0].bank_label, "Banco de prueba");
assert.equal(aListed.body.entries[0].source, undefined);
assert.equal(aListed.headers.get("Cache-Control"), "no-store, private");
assert.equal((await call("/api/quick/entries", "GET", undefined, B)).body.entries.length, 0);

// Even if B knows A's account and entry IDs, B cannot save into or view them.
assert.equal((await call("/api/quick/entries", "POST", aEntry, B)).status, 403);
const bAccount = await call("/api/quick/accounts", "POST", account, B);
assert.equal(bAccount.status, 201);
assert.notEqual(bAccount.body.accountId, aAccount);
const bSaved = await call("/api/quick/entries", "POST", {
  ...entry,
  accountId: bAccount.body.accountId,
  classification: "investment_transfer",
}, B);
assert.equal(bSaved.status, 201);
assert.equal((await call("/api/quick/entries", "GET", undefined, B)).body.entries[0].kind, "investment_transfer");
assert.equal((await call("/api/quick/entries", "GET", undefined, A)).body.entries.length, 1);
assert.equal(sqlite.prepare("SELECT COUNT(*) as n FROM quick_manual_entries").get().n, 2);

// Cross-account currency mismatch is blocked at both application and FK level.
assert.throws(() => sqlite.prepare(
  "INSERT INTO quick_manual_entries(id,owner_id,account_id,client_entry_id,amount_minor,currency,payment_method,kind,occurred_at)" +
  " VALUES(?,?,?,?,?,?,?,?,?)",
).run("fake", "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", aAccount, "fake-unique-000001", 1, "COP", "cash", "purchase", entry.occurredAt), /FOREIGN KEY/);



// Account-FREE iPhone Shortcut E2E: Service Auth + scoped revocable bearer,
// expense-only classification, no account requirement and idempotency.
const shortcutEnv = { ...env, ALLOW_SHORTCUT_WRITES: "true" };
const shortcutDraft = {
  clientEntryId: "ios-expense-00000001", amount: "25000", concept: "Almuerzo de prueba",
  paymentMethod: "cash", bankLabel: null,
};
async function direct(body, token, user = A, environment = shortcutEnv) {
  const headers = new Headers({ "Content-Type": "application/json" });
  if (token) headers.set("Authorization", "Bearer " + token);
  const response = await handleQuickRequest(new Request(origin + "/api/quick/shortcut/expense", {
    method: "POST", headers, body: JSON.stringify(body),
  }), environment, user);
  return { status: response.status, body: await response.json() };
}
const granted = await call("/api/quick/shortcut/enroll", "POST",
  { label: "iPhone", confirmed: true }, A, { env: shortcutEnv });
assert.equal(granted.status, 201);
const deviceToken = granted.body.token;
assert.match(deviceToken, /^fosq_[0-9a-f]{64}$/);
assert.equal((await call("/api/quick/shortcut/enroll", "POST",
  { label: "iPhone", confirmed: true }, B)).status, 503, "flag disabled by default");
assert.equal((await call("/api/quick/shortcut/enroll", "POST",
  { label: "iPhone", confirmed: true }, missing, { env: shortcutEnv })).status, 401);
assert.equal((await call("/api/quick/shortcut/enroll", "POST",
  { label: "iPhone", confirmed: true }, A, { env: shortcutEnv, origin: "https://evil.invalid" })).status, 403);
assert.notEqual(sqlite.prepare("SELECT token_hash FROM quick_shortcut_devices LIMIT 1").get().token_hash, deviceToken);
assert.equal((await call("/api/quick/shortcut/devices")).body.devices.length, 1);
assert.equal((await call("/api/quick/shortcut/devices", "GET", undefined, B)).body.devices.length, 0);
assert.equal((await direct(shortcutDraft, null)).status, 401);
assert.equal((await direct(shortcutDraft, deviceToken, missing)).status, 401, "Access audience required in addition to bearer");
assert.equal((await direct(shortcutDraft, deviceToken, A, env)).status, 503, "direct writes disabled without explicit opt-in");
assert.equal((await direct({ ...shortcutDraft, classification: "own_transfer" }, deviceToken)).status, 422);
assert.equal((await direct({ ...shortcutDraft, ownerId: "not-owner" }, deviceToken)).status, 422);
assert.equal((await direct({ ...shortcutDraft, accountId: aAccount }, deviceToken)).status, 422, "accountId is forbidden");
assert.equal((await direct({ ...shortcutDraft, bankLabel: "Nequi" }, deviceToken)).status, 422);
assert.equal((await direct({ ...shortcutDraft, paymentMethod: "credit_card" }, deviceToken)).status, 422, "bank required");
assert.equal((await direct({ ...shortcutDraft, amount: "0" }, deviceToken)).status, 422);
const cashDirect = await direct(shortcutDraft, deviceToken);
assert.equal(cashDirect.status, 201);
assert.equal(cashDirect.body.replayed, false);
assert.equal((await direct(shortcutDraft, deviceToken)).body.replayed, true);
assert.equal((await direct({ ...shortcutDraft, amount: "35000" }, deviceToken)).status, 409);
const expenseSaved = sqlite.prepare(
  "SELECT kind,amount_minor,payment_method,merchant FROM quick_shortcut_expenses WHERE owner_id=? AND client_entry_id=?",
).get("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", shortcutDraft.clientEntryId);
assert.equal(expenseSaved.kind, "purchase");
assert.equal(expenseSaved.payment_method, "cash");
assert.equal(expenseSaved.amount_minor, 2500000);
assert.equal(expenseSaved.merchant, "Almuerzo de prueba");
assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM quick_manual_entries").get().n, 2,
  "Direct expenses must NOT create legacy account-bound entries");
assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM quick_manual_accounts").get().n, 2,
  "Direct expenses must NOT create hidden/fictional accounts");

// Bank and card payments are recorded by method + optional bank alone.
// No corresponding bank, wallet or card account is required or even looked up.
const withoutAccount = { ...shortcutDraft, clientEntryId: "ios-no-account-00001",
  paymentMethod: "debit_card", bankLabel: "Nequi de prueba" };
assert.equal((await direct(withoutAccount, deviceToken)).status, 201);
assert.equal((await direct({ ...withoutAccount, clientEntryId: "ios-credit-card-00001",
  paymentMethod: "credit_card", bankLabel: "Banco ficticio" }, deviceToken)).status, 201);
assert.equal((await direct({ ...withoutAccount, clientEntryId: "ios-bank-transfer-0001",
  paymentMethod: "bank_transfer", bankLabel: "Bancolombia de prueba" }, deviceToken)).status, 201);
assert.equal((await direct({ ...shortcutDraft, clientEntryId: "ios-wallet-expense-001",
  paymentMethod: "digital_wallet" }, deviceToken)).status, 201);
assert.equal((await direct({ ...shortcutDraft, clientEntryId: "ios-other-expense-001",
  paymentMethod: "other" }, deviceToken)).status, 201);
assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM quick_manual_accounts").get().n, 2);
assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM quick_shortcut_expenses").get().n, 6);

// Legacy retry keeps the original entry, instead of duplicating across tables.
const oldReplay = await direct({
  clientEntryId: aEntry.clientEntryId, amount: aEntry.amount,
  concept: aEntry.merchant, paymentMethod: aEntry.paymentMethod,
  bankLabel: aEntry.bankLabel,
}, deviceToken);
assert.equal(oldReplay.status, 200);
assert.equal(oldReplay.body.replayed, true);
assert.equal(oldReplay.body.entryId, saved.body.entryId);
assert.equal((await direct({ ...withoutAccount, clientEntryId: aEntry.clientEntryId },
  deviceToken)).status, 409, "cross-table idempotency conflict");
assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM quick_shortcut_expenses").get().n, 6);

// Unified history includes account-free entries without assigning any account.
const unified = await call("/api/quick/entries", "GET", undefined, A);
assert.equal(unified.status, 200);
assert.equal(unified.body.entries.length, 7);
const noAccount = unified.body.entries.find((row) => row.client_entry_id === withoutAccount.clientEntryId);
assert.equal(noAccount.account_id, null);
assert.equal(noAccount.payment_method, "debit_card");
assert.equal(noAccount.bank_label, "Nequi de prueba");
assert.equal(unified.body.entries.find((row) => row.id === saved.body.entryId).account_id, aAccount);
assert.equal((await call("/api/quick/entries", "GET", undefined, B)).body.entries.length, 1,
  "Owner B cannot read owner A's iPhone entries");

// A user with no account of ANY kind can still register a direct cash expense.
const C = identity("cccccccc-cccc-4ccc-8ccc-cccccccccccc");
const noAccountsYet = await call("/api/quick/accounts", "GET", undefined, C);
assert.equal(noAccountsYet.body.accounts.length, 0);
const cTokenResult = await call("/api/quick/shortcut/enroll", "POST",
  { label: "iPhone de prueba C", confirmed: true }, C, { env: shortcutEnv });
assert.equal(cTokenResult.status, 201);
const cDirect = await direct({ ...shortcutDraft, clientEntryId: "ios-accountless-owner-01" },
  cTokenResult.body.token, C);
assert.equal(cDirect.status, 201);
assert.equal((await call("/api/quick/accounts", "GET", undefined, C)).body.accounts.length, 0);
assert.equal((await call("/api/quick/entries", "GET", undefined, C)).body.entries.length, 1);
assert.equal((await call("/api/quick/entries", "GET", undefined, A)).body.entries.length, 7);
assert.equal((await direct({ ...shortcutDraft, clientEntryId: "ios-rotate-owner-test1" },
  cTokenResult.body.token)).status, 201,
  "device token, not human Access identity, determines account-free owner");
assert.equal((await call("/api/quick/entries", "GET", undefined, C)).body.entries.length, 2);
assert.equal((await call("/api/quick/entries", "GET", undefined, A)).body.entries.length, 7);

const tokenRotate = await call("/api/quick/shortcut/enroll", "POST",
  { label: "iPhone nuevo", confirmed: true }, A, { env: shortcutEnv });
assert.equal(tokenRotate.status, 201);
assert.equal((await direct({ ...shortcutDraft, clientEntryId: "ios-old-token-000001" }, deviceToken)).status, 401);
assert.equal((await direct({ ...shortcutDraft, clientEntryId: "ios-new-token-000001" }, tokenRotate.body.token)).status, 201);
assert.equal((await call("/api/quick/shortcut/revoke", "POST", { confirmed: true })).status, 200);
assert.equal((await direct({ ...shortcutDraft, clientEntryId: "ios-revoked-token-001" }, tokenRotate.body.token)).status, 401);
assert.equal((await call("/api/quick/shortcut/devices")).body.devices.length, 0);
assert.equal((await call("/api/quick/entries", "GET", undefined, B)).body.entries.length, 1);

// Dashboard PWA must be gated by the SAME verified human Access principal,
// never by the iPhone service token or a public assets endpoint.
for (const p of ["/dashboard", "/dashboard.css", "/dashboard.js",
  "/dashboard.webmanifest", "/dashboard-icon.svg", "/dashboard-icon-180.png",
  "/dashboard-sw.js", "/api/quick/dashboard/overview",
  "/api/quick/dashboard/movements"]) {
  assert.equal((await call(p, "GET", undefined, missing)).status, 401, "No public dashboard route: " + p);
  const allowed = await handleQuickRequest(new Request(origin + p), env, A);
  assert.equal(allowed.status, 200, p);
  assert.equal(allowed.headers.get("Cache-Control"), "no-store, private", p);
  if (p === "/dashboard") {
    const html = await allowed.text();
    assert.match(html, /id="kpi-total"/);
    assert.match(html, /id="history-body"/);
    assert.match(html, /href="\/dashboard.webmanifest"/);
    assert.match(allowed.headers.get("Content-Security-Policy"), /manifest-src 'self'/);
    assert.doesNotMatch(html, /<script(?![^>]*src=)/i);
  }
  if (p === "/dashboard.css") assert.match(await allowed.text(), /@media\(max-width:720px\)/);
  if (p === "/dashboard.js") {
    const code = await allowed.text();
    assert.doesNotThrow(() => new Function(code));
    assert.match(code, /America\/Bogota/);
    assert.doesNotMatch(code, /localStorage|sessionStorage|innerHTML/);
    assert.match(code, /dashboard\/overview/);
  }
  if (p === "/dashboard.webmanifest") {
    const manifest = await allowed.json();
    assert.equal(manifest.display, "standalone");
    assert.equal(manifest.start_url, "/dashboard");
    assert.ok(manifest.icons.length >= 2);
  }
  if (p === "/dashboard-icon-180.png") {
    const icon = new Uint8Array(await allowed.arrayBuffer());
    assert.deepEqual([...icon.slice(0, 8)], [137,80,78,71,13,10,26,10]);
  }
  if (p === "/dashboard-sw.js") {
    const sw = await allowed.text();
    assert.doesNotMatch(sw, /respondWith|addEventListener\(["\x27]fetch/);
    assert.doesNotMatch(sw, /caches\.open|localStorage|sessionStorage/);
  }
}
const dash = await call("/api/quick/dashboard/overview", "GET", undefined, A);
assert.equal(dash.status, 200);
assert.equal(dash.body.currency, "COP");
assert.equal(dash.body.timezone, "America/Bogota");
assert.equal(dash.body.movementCount, 8, "A's manual + account-free expenses");
assert.equal(dash.body.truncated, false);
assert.equal(dash.body.daily.reduce((n, row) => n + row.count, 0), 8);
assert.ok(dash.body.daily.some((day) => day.method === "credit_card"));
assert.ok(dash.body.daily.some((day) => day.method === "bank_transfer"));
const bDash = await call("/api/quick/dashboard/overview", "GET", undefined, B);
assert.equal(bDash.body.movementCount, 1);
assert.equal(bDash.body.transfersAndInvestments, 1);
assert.equal(bDash.body.daily.length, 0, "Investment transfers are not expenses");
assert.equal((await call("/api/quick/dashboard/overview", "GET", undefined, C)).body.movementCount, 2);
const historyA = await call("/api/quick/dashboard/movements", "GET", undefined, A);
assert.equal(historyA.body.entries.length, 8);
assert.equal(historyA.body.hasMore, false);
assert.ok(historyA.body.entries.some((x) => x.account_id === null));
assert.equal((await call("/api/quick/dashboard/movements", "GET", undefined, B)).body.entries.length, 1);
assert.equal((await call("/api/quick/dashboard/movements?page=not-a-page", "GET", undefined, A)).status, 422);
assert.equal((await call("/api/quick/dashboard/movements?page=0&owner_id=anything", "GET", undefined, A)).status, 422);
// More than one page must be reachable; do not limit the dashboard to 100 movements.
const add = sqlite.prepare("INSERT INTO quick_shortcut_expenses(id,owner_id,client_entry_id,amount_minor,currency,payment_method,kind,occurred_at,merchant) VALUES(?,?,?,?,?,?,?,?,?)");
for (let i = 0; i < 45; i++) {
  add.run("extra-" + i, "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
    "ios-extra-" + String(i).padStart(6, "0"), 10000, "COP", "cash", "purchase",
    "2026-10-17T12:00:00.000Z", "Prueba de paginación");
}
const firstPage = await call("/api/quick/dashboard/movements?page=0", "GET", undefined, C);
assert.equal(firstPage.body.entries.length, 40);
assert.equal(firstPage.body.hasMore, true);
const secondPage = await call("/api/quick/dashboard/movements?page=1", "GET", undefined, C);
assert.equal(secondPage.body.entries.length, 7);
assert.equal(secondPage.body.hasMore, false);
assert.equal((await call("/api/quick/dashboard/overview", "GET", undefined, C)).body.movementCount, 47);
assert.equal((await call("/api/quick/dashboard/overview", "GET", undefined, A)).body.movementCount, 8,
  "Pagination cannot leak other owner movements");


// Unified Studio: policy-backed capabilities, access-controlled assets,
// deliberate non-active banking features, browser/Shortcut shared ledger.
for (const path of ["/studio.js", "/api/quick/studio/capabilities"]) {
  const noAccess = await handleQuickRequest(new Request(origin + path), env, missing);
  assert.equal(noAccess.status, 401, path + " must not be public");
  const secured = await handleQuickRequest(new Request(origin + path), env, A);
  assert.equal(secured.status, 200);
  assert.equal(secured.headers.get("Cache-Control"), "no-store, private");
  if (path === "/studio.js") {
    const js = await secured.text();
    assert.doesNotThrow(() => new Function(js), "Browser interactions compile as JavaScript");
    assert.match(js, /prefers-reduced-motion/);
    assert.match(js, /finanzasoss:data/);
    assert.match(js, /__finanzasossLatestOverview/, "Studio must consume late-loaded data safely");
    assert.match(js, /document\.body\.classList\.toggle\("theme-night"/, "Night mode must include document and dialogs");
    assert.doesNotMatch(js, /localStorage|sessionStorage|innerHTML/);
  } else {
    const model = await secured.json();
    assert.equal(model.navigation.primary.length, 5);
    assert.deepEqual(model.navigation.primary.map(x => x.id),
      ["today","movement","portfolio","plan","map"]);
    assert.equal(model.banks.connected, 0);
    assert.equal(model.banks.automaticSync, false);
    assert.equal(model.investments.connected, 0);
    assert.equal(model.imports.liveUpload, false);
    assert.equal(model.quick.accountRequired, false);
    assert.equal(model.pwa.cacheFinancialData, false);
  }
}
const unifiedShell = await handleQuickRequest(new Request(origin + "/dashboard"), env, A);
assert.equal(unifiedShell.status, 200);
const unifiedHtml = await (await handleQuickRequest(new Request(origin + "/dashboard"), env, A)).text();
for(const name of ["space-today","space-movement","space-portfolio","space-plan","space-map",
  "space-imports","space-connections","space-settings","expense-dialog","privacy-toggle"]) {
  assert.match(unifiedHtml, new RegExp('id="' + name + '"'), name);
}
assert.match(unifiedHtml, /src="\/studio.js"/);
assert.match(unifiedHtml, /id="reset-open"/);
assert.match(unifiedHtml, /id="reset-dialog"/);
assert.match(unifiedHtml, /id="reset-phrase"/);
assert.match(unifiedHtml, /class="native-arrow"/);
assert.doesNotMatch(unifiedHtml, /↗/, "No iOS emoji-style outgoing arrows");

const mainScript = await handleQuickRequest(new Request(origin + "/dashboard.js"), env, A);
assert.match(await mainScript.text(), /__finanzasossLatestOverview/,
  "Dashboard must retain the in-memory ready event payload for late-loaded UI");
const cssAsset = await handleQuickRequest(new Request(origin + "/dashboard.css"), env, A);
const style = await cssAsset.text();
assert.match(style, /body\.theme-night/, "Dark mode must color the entire document");
assert.match(style, /min-width:44px/, "Main tap targets must remain accessible");

assert.doesNotMatch(unifiedHtml, /<script(?![^>]*src=)/i);
const browserBody = {
  clientEntryId: "studio-browser-00000001", amount: "9876", concept: "Compra de prueba PWA",
  paymentMethod: "credit_card", bankLabel: "Banco de prueba", confirmed: true,
};
assert.equal((await call("/api/quick/studio/expense", "POST", browserBody, missing)).status, 401);
assert.equal((await call("/api/quick/studio/expense", "POST", browserBody, A,
  { env: disabledEnv })).status, 503);
assert.equal((await call("/api/quick/studio/expense", "POST", browserBody, A,
  { origin: "https://evil.example" })).status, 403);
assert.equal((await call("/api/quick/studio/expense", "POST",
  { ...browserBody, confirmed: false })).status, 422);
assert.equal((await call("/api/quick/studio/expense", "POST",
  { ...browserBody, ownerId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb" })).status, 422);
assert.equal((await call("/api/quick/studio/expense", "POST",
  { ...browserBody, accountId: aAccount })).status, 422);
assert.equal((await call("/api/quick/studio/expense", "POST",
  { ...browserBody, bankLabel: null })).status, 422);
const accountCountBefore = sqlite.prepare("SELECT COUNT(*) AS n FROM quick_manual_accounts").get().n;
const directCountBefore = sqlite.prepare("SELECT COUNT(*) AS n FROM quick_shortcut_expenses").get().n;
const createdPwa = await call("/api/quick/studio/expense", "POST", browserBody);
assert.equal(createdPwa.status, 201);
assert.equal(createdPwa.body.replayed, false);
assert.match(createdPwa.body.entryId, /^[0-9a-f-]{36}$/);
assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM quick_manual_accounts").get().n, accountCountBefore);
assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM quick_shortcut_expenses").get().n,
  directCountBefore+1);
assert.equal((await call("/api/quick/studio/expense", "POST", browserBody)).body.entryId,
  createdPwa.body.entryId);
assert.equal((await call("/api/quick/studio/expense", "POST", browserBody)).body.replayed, true);
assert.equal((await call("/api/quick/studio/expense", "POST",
  { ...browserBody, amount: "9877" })).status, 409);
const afterBrowserA = await call("/api/quick/dashboard/movements", "GET", undefined, A);
assert.ok(afterBrowserA.body.entries.some(x=>x.id===createdPwa.body.entryId && x.account_id===null));
const bAfterBrowser = await call("/api/quick/dashboard/movements", "GET", undefined, B);
assert.ok(!bAfterBrowser.body.entries.some(x=>x.id===createdPwa.body.entryId));


// Reset is deliberately disabled without an explicit staging flag.
const resetEnv = { ...env, ALLOW_RESET_WRITES: "true" };
const previewPath = "/api/quick/studio/reset/prepare";
const confirmPath = "/api/quick/studio/reset/confirm";
const prepare = (user = A, options = {}) =>
  call(previewPath, "POST", { acknowledged: true }, user,
    { env: resetEnv, ...options });
const complete = (challengeId, user = A, options = {}) =>
  call(confirmPath, "POST", { challengeId, phrase:"RESTABLECER TODO", confirmed:true },
    user, { env: resetEnv, ...options });
const forbiddenOtherHost = await handleQuickRequest(
  new Request("https://unrelated.example/api/quick/studio/reset/prepare",{
    method:"POST",headers:{"Content-Type":"application/json","Origin":"https://unrelated.example"},
    body:JSON.stringify({acknowledged:true}),
  }),resetEnv,A);
assert.equal(forbiddenOtherHost.status,403,"Staging reset cannot be used from another host");
assert.equal((await call(previewPath, "POST", { acknowledged:true })).status, 403,
  "Reset must be disabled in all environments by default");
assert.equal((await call(previewPath, "POST", { acknowledged:true }, missing,
  { env:resetEnv })).status, 401);
assert.equal((await prepare(A, { origin:"https://evil.invalid" })).status, 403);
assert.equal((await call(previewPath, "POST", { acknowledged:false }, A,
  { env:resetEnv })).status, 422);
assert.equal((await call(confirmPath, "POST",
  { challengeId:crypto.randomUUID(),phrase:"RESTABLECER TODO",confirmed:true },
  A, { env:resetEnv })).status, 409);
const beforeReset = await call("/api/quick/dashboard/movements", "GET", undefined, A);
const otherOwnerBefore = await call("/api/quick/dashboard/movements", "GET", undefined, B);
const unrelatedOwnerBefore = await call("/api/quick/dashboard/movements", "GET", undefined, C);
const preview = await prepare();
assert.equal(preview.status, 200);
assert.equal(preview.body.counts.manualEntries > 0, true);
assert.equal(preview.body.counts.directExpenses > 0, true);
assert.equal(preview.body.counts.manualAccounts > 0, true);
assert.equal(preview.body.confirmationPhrase, "RESTABLECER TODO");
assert.equal((await complete(preview.body.challengeId, B)).status, 409,
  "A confirmation may not be used by a different owner");
assert.equal((await call(confirmPath,"POST",
  { challengeId:preview.body.challengeId,phrase:"RESTABLECER TODO",confirmed:false },
  A,{env:resetEnv})).status,422);
assert.equal((await call(confirmPath,"POST",
  { challengeId:preview.body.challengeId,phrase:"BORRAR",confirmed:true },
  A,{env:resetEnv})).status,422);
assert.equal((await call("/api/quick/dashboard/movements","GET",undefined,A)).body.entries.length,
  beforeReset.body.entries.length, "No changes before final confirmation");
// If new activity arrives after preview, counts must be re-reviewed.
sqlite.prepare("INSERT INTO quick_shortcut_expenses (id,owner_id,client_entry_id,amount_minor,currency,payment_method,kind,occurred_at,merchant) VALUES (?,?,?,?,?,?,?,?,?)").run(
  "change-while-previewing", "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  "ios-change-while-preview", 10000, "COP", "cash", "purchase",
  "2026-10-17T15:00:00.000Z", "Race-prevention test");
assert.equal((await complete(preview.body.challengeId)).status,409,
  "Financial changes after preview invalidate the confirmation");
const reviewed = await prepare();
assert.equal(reviewed.status,200);
// Insert active service token to verify a full reset revokes the iPhone too.
const laterShortcutEnv = { ...env, ALLOW_SHORTCUT_WRITES: "true" };
const renewed = await call("/api/quick/shortcut/enroll","POST",
  {label:"iPhone a revocar",confirmed:true},A,{env:laterShortcutEnv});
assert.equal(renewed.status,201);
// Authorizations changed since preview: must review again.
assert.equal((await complete(reviewed.body.challengeId)).status,409);
const finalPreview = await prepare();
assert.equal(finalPreview.body.counts.shortcutDevices,1);
const erased = await complete(finalPreview.body.challengeId);
assert.equal(erased.status,200);
assert.equal(erased.body.reset,true);
assert.equal(erased.body.shortcutAuthorizationRevoked,true);
assert.equal((await complete(finalPreview.body.challengeId)).status,409,
  "Destructive confirmation must be one-time");
for(const [table,field] of [
  ["quick_manual_entries","owner_id"],
  ["quick_shortcut_expenses","owner_id"],
  ["quick_manual_accounts","owner_id"],
  ["quick_shortcut_devices","owner_id"],
]){
  assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM "+table+" WHERE "+field+"=?")
    .get("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa").n,0,table+" scoped wipe");
}
assert.equal((await call("/api/quick/dashboard/movements","GET",undefined,A)).body.entries.length,0);
assert.equal((await call("/api/quick/dashboard/movements","GET",undefined,B)).body.entries.length,
  otherOwnerBefore.body.entries.length, "Reset must not remove other users");
assert.equal((await call("/api/quick/dashboard/movements","GET",undefined,C)).body.entries.length,
  unrelatedOwnerBefore.body.entries.length,"Separate user must remain intact");
assert.equal((await direct({ ...shortcutDraft,clientEntryId:"ios-post-reset-revoked" },
  renewed.body.token)).status,401,"Reset must revoke old iPhone token");
const zeroPreview = await prepare();
assert.deepEqual(zeroPreview.body.counts,{
  manualEntries:0,directExpenses:0,manualAccounts:0,shortcutDevices:0,
});
// Re-enrollment remains possible without deleting Cloudflare Access identity.
const canReenroll = await call("/api/quick/shortcut/enroll","POST",
  {label:"Nuevo iPhone",confirmed:true},A,{env:laterShortcutEnv});
assert.equal(canReenroll.status,201,"Human Access login survives a data reset");

console.log("Cloudflare Quick D1: SQLite + Worker E2E isolation, CSRF and idempotency passed");
sqlite.close();
