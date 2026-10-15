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
const db = {
  prepare(query) {
    let args = [];
    return {
      bind(...values) { args = values; return this; },
      async first() { return sqlite.prepare(query).get(...args) ?? null; },
      async all() { return { results: sqlite.prepare(query).all(...args) }; },
    };
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
const origin = "https://finanzasoss-staging.invalid";
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
  bankLabel: null,
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

const saved = await call("/api/quick/entries", "POST", aEntry);
assert.equal(saved.status, 201);
assert.equal(saved.body.replayed, false);
assert.match(saved.body.entryId, /^[0-9a-f-]{36}$/);
assert.equal((await call("/api/quick/entries", "POST", aEntry)).body.entryId, saved.body.entryId);
assert.equal((await call("/api/quick/entries", "POST", aEntry)).body.replayed, true);
assert.equal((await call("/api/quick/entries", "POST", { ...aEntry, amount: "100" })).status, 409);

const aListed = await call("/api/quick/entries");
assert.equal(aListed.status, 200);
assert.equal(aListed.body.entries.length, 1);
assert.equal(aListed.body.entries[0].amount_minor, "2500050");
assert.equal(aListed.body.entries[0].kind, "purchase");
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

console.log("Cloudflare Quick D1: SQLite + Worker E2E isolation, CSRF and idempotency passed");
sqlite.close();
