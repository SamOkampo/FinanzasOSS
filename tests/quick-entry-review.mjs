import assert from "node:assert/strict";
import { prepareQuickEntry } from "../dist/packages/finance-core/src/quick-entry.js";

const base = {
  tenantId: "tenant-test",
  actorId: "actor-test",
  clientEntryId: "entry-test-00000001",
  amount: "25000",
  currency: "COP",
  paymentMethod: "debit_card",
  classification: "expense",
  occurredAt: "2026-10-15T12:00:00Z",
  merchant: "  Almuerzo  ",
  bankLabel: "  Banco de prueba  ",
};

const expense = prepareQuickEntry(base);
assert.equal(expense.money.amountMinor, 2500000n);
assert.equal(expense.money.currency, "COP");
assert.equal(expense.kind, "purchase");
assert.equal(expense.economicClass, "expense");
assert.equal(expense.merchant, "Almuerzo");
assert.equal(expense.bankLabel, "Banco de prueba");
assert.equal(expense.sourceType, "manual");
assert.equal(expense.direction, "debit");
assert.equal(expense.requiresUserConfirmation, true);
assert.equal(expense.persistenceEnabled, false);
assert.equal(expense.accountSelectionRequiredBeforePosting, true);
assert.ok(Object.isFrozen(expense));
assert.ok(Object.isFrozen(expense.money));

const minimal = prepareQuickEntry({ ...base, merchant: undefined, bankLabel: undefined });
assert.equal(minimal.merchant, null);
assert.equal(minimal.bankLabel, null);
assert.equal(minimal.persistenceEnabled, false);

const precise = prepareQuickEntry({ ...base, amount: "0.01", currency: "USD" });
assert.equal(precise.money.amountMinor, 1n);

const ownTransfer = prepareQuickEntry({ ...base, classification: "own_transfer" });
assert.equal(ownTransfer.kind, "transfer");
assert.equal(ownTransfer.economicClass, "internal_transfer");

const investment = prepareQuickEntry({
  ...base, classification: "investment_transfer", merchant: "Broker test",
});
assert.equal(investment.kind, "investment_transfer");
assert.equal(investment.economicClass, "investment_flow");
assert.notEqual(investment.economicClass, "expense");

const invalidAmounts = [
  "0", "-1", "0.00", "1e3", "1,000", "1.000,50", "1 000",
  "1.234", "01", "1000000000000", "NaN", "Infinity", "", 25.5, null, undefined,
];
for (const amount of invalidAmounts) {
  assert.throws(() => prepareQuickEntry({ ...base, amount }), /Amount/);
}
assert.throws(() => prepareQuickEntry({ ...base, currency: "EUR" }), /currencies/);
assert.throws(() => prepareQuickEntry({ ...base, classification: "unspecified" }), /Classification/);
assert.throws(() => prepareQuickEntry({ ...base, paymentMethod: "trading" }), /Payment method/);
assert.throws(() => prepareQuickEntry({ ...base, tenantId: "" }), /tenantId/);
assert.throws(() => prepareQuickEntry({ ...base, actorId: "\n" }), /actorId/);
assert.throws(() => prepareQuickEntry({ ...base, clientEntryId: "x" }), /idempotency/);
assert.throws(() => prepareQuickEntry({ ...base, merchant: "x\n<script>" }), /merchant/);
assert.throws(() => prepareQuickEntry({ ...base, bankLabel: "x".repeat(81) }), /bankLabel/);
assert.throws(() => prepareQuickEntry(null), /object/);
assert.throws(() => prepareQuickEntry([]), /object/);

for (const occurredAt of [
  "2026-02-30T12:00:00Z", "2026-10-15", "2026-10-15T12:00:00+00:00",
  "2026-10-15T25:00:00Z", "2026-10-15T12:60:00Z", null,
]) {
  assert.throws(() => prepareQuickEntry({ ...base, occurredAt }), /occurredAt/);
}
assert.equal(
  prepareQuickEntry({ ...base, occurredAt: "2026-10-15T12:00:00.123Z" }).occurredAt,
  "2026-10-15T12:00:00.123Z",
);

// The pure preparer must not allocate account records, call payment providers,
// persist balances, or convert a user's bank label into verified account ownership.
assert.equal(Object.hasOwn(expense, "accountId"), false);
assert.equal(Object.hasOwn(expense, "connectionId"), false);
assert.equal(Object.hasOwn(expense, "authorizedToPost"), false);

console.log("Quick entry review-only model regressions passed");
