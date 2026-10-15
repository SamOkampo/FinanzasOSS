import assert from "node:assert/strict";
import fs from "node:fs";
import {
  confirmQuickEntry,
  prepareConfirmedQuickRpc,
} from "../dist/packages/database/src/quick-entry-persistence.js";

const user = {
  userId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  tenantId: "personal-test-tenant",
};
const input = {
  accountId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  clientEntryId: "quick-expense-000001",
  amount: "25000.25",
  currency: "COP",
  paymentMethod: "debit_card",
  classification: "expense",
  occurredAt: "2026-10-15T11:30:00Z",
  merchant: "Almuerzo",
  bankLabel: "Banco de prueba",
  confirmed: true,
};

const confirmed = prepareConfirmedQuickRpc(user, input);
assert.equal(confirmed.draft.money.amountMinor, 2500025n);
assert.equal(confirmed.draft.kind, "purchase");
assert.equal(confirmed.draft.persistenceEnabled, false);
assert.equal(confirmed.params.p_amount_minor, "2500025");
assert.equal(confirmed.params.p_tenant_id, user.tenantId);
assert.equal(confirmed.params.p_account_id, input.accountId);
assert.equal(confirmed.params.p_confirmed, true);
assert.equal(confirmed.params.p_kind, "purchase");
assert.ok(Object.isFrozen(confirmed.params));

// Client-supplied identity fields MUST NOT influence the authenticated account.
const spoofed = prepareConfirmedQuickRpc(user, {
  ...input,
  tenantId: "other-user",
  actorId: "other-actor",
});
assert.equal(spoofed.params.p_tenant_id, user.tenantId);
assert.equal(spoofed.draft.actorId, user.userId);

const investment = prepareConfirmedQuickRpc(user, {
  ...input,
  classification: "investment_transfer",
});
assert.equal(investment.params.p_kind, "investment_transfer");
assert.equal(investment.draft.economicClass, "investment_flow");

const own = prepareConfirmedQuickRpc(user, { ...input, classification: "own_transfer" });
assert.equal(own.params.p_kind, "transfer");
assert.equal(own.draft.economicClass, "internal_transfer");

let rpcCalls = 0;
let previousPayload = "";
const port = {
  async confirm(params) {
    rpcCalls += 1;
    const json = JSON.stringify(params);
    if (previousPayload && previousPayload !== json) {
      throw new Error("Idempotency key reused with different content");
    }
    const replayed = Boolean(previousPayload);
    previousPayload = json;
    return { entryId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc", replayed };
  },
};
const first = await confirmQuickEntry(user, input, port);
const repeat = await confirmQuickEntry(user, input, port);
assert.equal(first.replayed, false);
assert.equal(repeat.replayed, true);
assert.equal(first.entryId, repeat.entryId);
assert.equal(rpcCalls, 2);
await assert.rejects(
  confirmQuickEntry(user, { ...input, amount: "999.00" }, port),
  /Idempotency key reused/,
);

// A request without explicit human confirmation cannot reach storage.
await assert.rejects(
  confirmQuickEntry(user, { ...input, confirmed: false }, port),
  /Explicit confirmation/,
);
assert.equal(rpcCalls, 3);
assert.throws(() => prepareConfirmedQuickRpc(user, { ...input, accountId: "not-a-uuid" }), /account UUID/);
assert.throws(() => prepareConfirmedQuickRpc({ ...user, tenantId: "" }, input), /tenantId/);
assert.throws(() => prepareConfirmedQuickRpc({ ...user, userId: "invalid user!" }, input), /userId/);
assert.throws(() => prepareConfirmedQuickRpc(null, input), /principal/);
assert.throws(() => prepareConfirmedQuickRpc(user, null), /input must be an object/);
assert.throws(() => prepareConfirmedQuickRpc(user, { ...input, amount: "0" }), /Amount/);
await assert.rejects(
  confirmQuickEntry(user, input, {
    async confirm() {
      return { entryId: "not-a-uuid", replayed: false };
    },
  }),
  /invalid confirmation result/,
);

// Static migration invariants: NOT a substitute for executing this against a
// disposable PostgreSQL/Supabase staging instance with multiple authenticated
// test JWTs. Never mark Q4 operational solely from this test.
const sql = fs.readFileSync(
  new URL("../packages/database/migrations/0001_quick_personal.sql", import.meta.url),
  "utf8",
);
assert.match(sql, /create table if not exists public\.quick_manual_accounts/i);
assert.match(sql, /create table if not exists public\.quick_manual_entries/i);
assert.match(sql, /foreign key \(account_id, tenant_id, owner_user_id, currency\)/i);
assert.match(sql, /unique \(owner_user_id, tenant_id, client_entry_id\)/i);
assert.match(sql, /alter table public\.quick_manual_entries enable row level security/i);
assert.match(sql, /alter table public\.quick_manual_entries force row level security/i);
assert.match(sql, /alter table public\.quick_manual_accounts enable row level security/i);
assert.match(sql, /with check \(owner_user_id = \(select auth\.uid\(\)\)\)/i);
assert.match(sql, /revoke all on public\.quick_manual_entries from public, anon, authenticated/i);
assert.doesNotMatch(sql, /grant\s+(?:select,\s*)?insert\s+on\s+public\.quick_manual_entries\s+to\s+authenticated/i);
assert.match(sql, /security definer\s+set search_path = ''/i);
assert.match(sql, /v_owner uuid := auth\.uid\(\)/i);
assert.match(sql, /if p_confirmed is distinct from true/i);
assert.match(sql, /on conflict \(owner_user_id, tenant_id, client_entry_id\) do nothing/i);
assert.match(sql, /Idempotency key reused with different content/i);
assert.match(sql, /grant execute on function public\.quick_confirm_manual_entry\(/i);
assert.match(sql, /to authenticated/i);

console.log("Quick Q4 authenticated persistence contract/regression passed; SQL runtime NOT validated");
