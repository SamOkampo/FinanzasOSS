import assert from "node:assert/strict";
import { planIncrementalImport, IncrementalImportError } from "../dist/packages/import-engine/src/incremental-import.js";

function tx(id, sourceRecordId, description = "Compra café") {
  return {
    id,
    tenantId: "tenant-1",
    connectionId: "conn-1",
    accountId: "acct-1",
    externalId: sourceRecordId,
    postedAt: "2026-10-04T12:00:00.000Z",
    money: { amountMinor: 12500n, currency: "COP" },
    direction: "debit",
    status: "posted",
    kind: "purchase",
    rawDescription: description,
    provenance: {
      sourceType: "statement_import",
      observedAt: "2026-10-04T12:01:00.000Z",
      provider: "fixture-bank",
      sourceRecordId,
    },
  };
}

const existing = [tx("existing-1", "row-1")];
const duplicate = tx("incoming-duplicate", "row-1");
const fresh = {
  ...tx("incoming-new", "row-2", "Compra pan"),
  money: { amountMinor: 8300n, currency: "COP" },
};

const plan = planIncrementalImport(existing, {
  idempotencyKey: "import:fixture-bank:statement-2026-10",
  sourceId: "statement-2026-10",
  previousCheckpoint: "row-1",
  nextCheckpoint: "row-2",
  transactions: [duplicate, fresh, { ...fresh, id: "incoming-new-again" }],
});

assert.equal(plan.canCommit, true);
assert.equal(plan.checkpointBefore, "row-1");
assert.equal(plan.checkpointAfter, "row-2");
assert.deepEqual(plan.duplicateIds, ["incoming-duplicate", "incoming-new-again"]);
assert.equal(plan.inserts.length, 1);
assert.equal(plan.inserts[0].id, "incoming-new");
assert.ok(plan.inserts[0].fingerprint);

const retry = planIncrementalImport([...existing, ...plan.inserts], {
  idempotencyKey: "import:fixture-bank:statement-2026-10",
  sourceId: "statement-2026-10",
  previousCheckpoint: "row-1",
  nextCheckpoint: "row-2",
  transactions: [duplicate, fresh],
});
assert.equal(retry.inserts.length, 0);
assert.deepEqual(retry.duplicateIds, ["incoming-duplicate", "incoming-new"]);

assert.throws(
  () => planIncrementalImport([], {
    idempotencyKey: "",
    sourceId: "x",
    previousCheckpoint: null,
    nextCheckpoint: "1",
    transactions: [fresh],
  }),
  IncrementalImportError,
);

assert.throws(
  () => planIncrementalImport([], {
    idempotencyKey: "k",
    sourceId: "x",
    previousCheckpoint: null,
    nextCheckpoint: "1",
    transactions: [{ ...fresh, provenance: { ...fresh.provenance, sourceType: "provider_api" } }],
  }),
  IncrementalImportError,
);

console.log("incremental idempotent import 8.5: ok");
