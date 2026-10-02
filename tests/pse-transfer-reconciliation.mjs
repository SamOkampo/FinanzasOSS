import assert from "node:assert/strict";
import {
  applyOwnAccountTransferMatch,
  evaluateOwnAccountTransfer,
  isSpendingTransaction,
} from "../dist/packages/finance-core/src/index.js";

const accountA = {
  id: "acc-a",
  tenantId: "tenant-1",
  connectionId: "conn-a",
  institutionId: "bank-a",
  externalId: "external-a",
  name: "Cuenta A",
  type: "savings",
  domain: "cash",
  currency: "COP",
};

const accountB = {
  ...accountA,
  id: "acc-b",
  connectionId: "conn-b",
  institutionId: "bank-b",
  externalId: "external-b",
  name: "Cuenta B",
};

const base = {
  tenantId: "tenant-1",
  postedAt: "2026-10-02T00:00:00Z",
  money: { amountMinor: 125000n, currency: "COP" },
  status: "posted",
  rawDescription: "Movimiento PSE",
  provenance: { sourceType: "open_finance_api", observedAt: "2026-10-02T12:00:00Z" },
};

const debit = {
  ...base,
  id: "tx-pse-out",
  connectionId: "conn-a",
  accountId: "acc-a",
  direction: "debit",
  kind: "transfer",
};

const credit = {
  ...base,
  id: "tx-pse-in",
  connectionId: "conn-b",
  accountId: "acc-b",
  direction: "credit",
  kind: "unknown",
};

const matching = evaluateOwnAccountTransfer(debit, accountA, credit, accountB, {
  pseReferences: {
    "tx-pse-out": "PSE-REF 12345",
    "tx-pse-in": "pse ref-12345",
  },
});
assert.equal(matching.confidence, "high");
assert.equal(matching.autoLink, true);
assert.equal(matching.pseReference, "PSEREF12345");
assert.ok(matching.reasons.includes("matching PSE reference"));

const [linkedDebit, linkedCredit] = applyOwnAccountTransferMatch(debit, credit, matching);
assert.equal(linkedDebit.kind, "transfer");
assert.equal(linkedCredit.kind, "transfer");
assert.equal(linkedDebit.transferGroupId, linkedCredit.transferGroupId);
assert.equal(linkedDebit.category?.code, "transfers.internal");
assert.equal(isSpendingTransaction(linkedDebit), false);

const pseOnly = evaluateOwnAccountTransfer(
  { ...debit, kind: "unknown" },
  accountA,
  credit,
  accountB,
  {
    pseReferences: {
      "tx-pse-out": "PSE-ONLY-999",
      "tx-pse-in": "PSE-ONLY-999",
    },
  },
);
assert.equal(pseOnly.confidence, "medium");
assert.equal(pseOnly.autoLink, false);

const oneSided = evaluateOwnAccountTransfer(debit, accountA, credit, accountB, {
  pseReferences: { "tx-pse-out": "PSE-ONE-SIDE" },
});
assert.equal(oneSided.autoLink, false);
assert.ok(oneSided.reasons.includes("PSE reference is present on only one side"));

const conflicting = evaluateOwnAccountTransfer(debit, accountA, credit, accountB, {
  pseReferences: {
    "tx-pse-out": "PSE-AAA-111",
    "tx-pse-in": "PSE-BBB-222",
  },
});
assert.equal(conflicting.confidence, "none");
assert.equal(conflicting.autoLink, false);
assert.deepEqual(conflicting.reasons, ["PSE references differ"]);

const sameAccount = evaluateOwnAccountTransfer(
  { ...debit, accountId: "acc-a", connectionId: "conn-a" },
  accountA,
  { ...credit, accountId: "acc-a", connectionId: "conn-a" },
  accountA,
  {
    pseReferences: {
      "tx-pse-out": "PSE-SAME-ACC",
      "tx-pse-in": "PSE-SAME-ACC",
    },
  },
);
assert.equal(sameAccount.confidence, "none");

const investmentDelegated = evaluateOwnAccountTransfer(
  { ...debit, kind: "investment_transfer" },
  accountA,
  credit,
  accountB,
  {
    pseReferences: {
      "tx-pse-out": "PSE-INV-123",
      "tx-pse-in": "PSE-INV-123",
    },
  },
);
assert.equal(investmentDelegated.confidence, "none");
assert.ok(investmentDelegated.reasons[0].includes("Phase 2.5"));

console.log("pse transfer reconciliation tests: ok");
