import assert from "node:assert/strict";
import {
  buildTenantDataExport,
  createTenantDeletionPlan,
  dataLifecyclePolicy,
  TENANT_DELETION_ORDER,
} from "../dist/packages/database/src/index.js";

const bundle = buildTenantDataExport({
  tenantId: "tenant-1",
  generatedAt: "2026-10-06T01:20:00Z",
  datasets: {
    connections: [
      {
        id: "conn-1",
        tenantId: "tenant-1",
        institutionId: "fixture-bank",
        secretReference: "vault://opaque",
      },
    ],
    transactions: [
      {
        id: "tx-1",
        tenantId: "tenant-1",
        amountMinor: 1234n,
        nested: { note: "synthetic" },
      },
    ],
  },
});

assert.equal(bundle.format, "finanzasoss-tenant-export-v1");
assert.equal(bundle.recordCounts.connections, 1);
assert.equal(bundle.recordCounts.transactions, 1);
assert.equal(bundle.excludedSensitiveFields, true);
assert.equal(bundle.datasets.connections[0].secretReference, undefined);
assert.equal(bundle.datasets.transactions[0].amountMinor, "1234");

assert.throws(
  () =>
    buildTenantDataExport({
      tenantId: "tenant-1",
      generatedAt: "2026-10-06T01:20:00Z",
      datasets: { accounts: [{ id: "acct-x", tenantId: "tenant-2" }] },
    }),
  /Cross-tenant export data/,
);

const plan = createTenantDeletionPlan({
  tenantId: "tenant-1",
  requestedAt: "2026-10-06T01:21:00Z",
});

assert.deepEqual(plan.steps, TENANT_DELETION_ORDER);
assert.equal(plan.requiresExplicitDestructiveAuthorization, true);
assert.equal(plan.productionExecutionEnabled, false);

const retainedPlan = createTenantDeletionPlan({
  tenantId: "tenant-1",
  requestedAt: "2026-10-06T01:21:00Z",
  retentionExceptions: [
    {
      dataset: "consents",
      approvedPolicyReference: "policy-ref-1",
      reason: "synthetic approved retention fixture",
    },
    {
      dataset: "audit_log",
      approvedPolicyReference: "policy-ref-2",
      reason: "synthetic approved retention fixture",
    },
  ],
});
assert.equal(retainedPlan.steps.includes("consents"), false);
assert.equal(retainedPlan.retentionExceptions.length, 2);

assert.throws(
  () =>
    createTenantDeletionPlan({
      tenantId: "tenant-1",
      requestedAt: "2026-10-06T01:21:00Z",
      retentionExceptions: [
        { dataset: "audit_log", approvedPolicyReference: "", reason: "missing policy" },
      ],
    }),
  /approved policy reference/,
);

assert.equal(dataLifecyclePolicy.exportsAreTenantScoped, true);
assert.equal(dataLifecyclePolicy.secretMaterialIsExcludedFromExports, true);
assert.equal(dataLifecyclePolicy.legalRetentionIsNeverInvented, true);
assert.equal(dataLifecyclePolicy.productionDeletionExecutionEnabledByMvp, false);

console.log("Phase 13.5 data export/delete regression passed");
