import assert from "node:assert/strict";
import {
  CrossSourceReconciliationError,
  reconcileCrossSourceTransactions,
} from "../dist/packages/import-engine/src/cross-source-reconciliation.js";

function tx({
  id,
  sourceType,
  amountMinor = 12500n,
  description = "Compra café",
  externalId,
  sourceRecordId,
}) {
  return {
    id,
    tenantId: "tenant-1",
    connectionId: "conn-1",
    accountId: "acct-1",
    ...(externalId ? { externalId } : {}),
    postedAt: "2026-10-04T12:00:00.000Z",
    money: { amountMinor, currency: "COP" },
    direction: "debit",
    status: "posted",
    kind: "purchase",
    rawDescription: description,
    provenance: {
      sourceType,
      observedAt: "2026-10-04T12:01:00.000Z",
      provider: sourceType,
      ...(sourceRecordId ? { sourceRecordId } : {}),
    },
  };
}

const statementExisting = tx({
  id: "stmt-1",
  sourceType: "statement_import",
  externalId: "statement-row-1",
  sourceRecordId: "statement-row-1",
});

const apiDuplicate = tx({
  id: "api-1",
  sourceType: "open_finance_api",
  externalId: "api-tx-1",
  sourceRecordId: "api-tx-1",
});

const gmailPossible = tx({
  id: "gmail-1",
  sourceType: "email_auxiliary",
  description: "Compra cafe Bogota",
});

const freshProvider = tx({
  id: "provider-2",
  sourceType: "provider_api",
  amountMinor: 8300n,
  description: "Compra pan",
  externalId: "provider-2",
  sourceRecordId: "provider-2",
});

const plan = reconcileCrossSourceTransactions(
  [statementExisting],
  [apiDuplicate, gmailPossible, freshProvider],
);

assert.equal(plan.replacements.length, 1);
assert.equal(plan.replacements[0].replacedId, "stmt-1");
assert.equal(plan.replacements[0].replacement.id, "api-1");
assert.equal(plan.replacements[0].replacement.provenance.sourceType, "open_finance_api");
assert.ok(plan.replacements[0].replacement.fingerprint);

assert.equal(plan.reviews.length, 1);
assert.equal(plan.reviews[0].candidateId, "gmail-1");
assert.equal(plan.reviews[0].matchedId, "api-1");
assert.ok(["likely", "possible"].includes(plan.reviews[0].level));

assert.equal(plan.inserts.length, 1);
assert.equal(plan.inserts[0].id, "provider-2");
assert.equal(plan.suppressions.length, 0);
assert.equal(plan.autoInsertCount, 2);
assert.equal(plan.heldForReviewCount, 1);

const retry = reconcileCrossSourceTransactions(
  [plan.replacements[0].replacement, ...plan.inserts],
  [apiDuplicate, freshProvider],
);
assert.equal(retry.inserts.length, 0);
assert.equal(retry.replacements.length, 0);
assert.deepEqual(
  retry.suppressions.map((item) => item.candidateId),
  ["api-1", "provider-2"],
);

const manualCandidate = {
  ...freshProvider,
  id: "manual-1",
  provenance: { ...freshProvider.provenance, sourceType: "manual" },
};

assert.throws(
  () => reconcileCrossSourceTransactions([], [manualCandidate]),
  CrossSourceReconciliationError,
);

console.log("cross-source reconciliation 8.6: ok");
