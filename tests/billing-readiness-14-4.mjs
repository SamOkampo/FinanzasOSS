import assert from "node:assert/strict";
import {
  billingReadinessPolicy,
  prepareBillingCatalog,
  prepareTenantPlanAssignment,
  previewPlanEntitlements,
} from "../dist/packages/finance-core/src/index.js";

const catalog = prepareBillingCatalog([
  {
    planId: "starter",
    displayName: "Starter",
    catalogReference: "approved-catalog/starter",
    featureKeys: ["dashboard", "imports"],
    limits: { connections: 2, portfolios: 2 },
  },
  {
    planId: "plus",
    displayName: "Plus",
    catalogReference: "approved-catalog/plus",
    featureKeys: ["dashboard", "imports", "multi_connection"],
    limits: { connections: 10, portfolios: 10 },
  },
]);

assert.equal(catalog.plans.length, 2);
assert.deepEqual(previewPlanEntitlements(catalog, "starter").featureKeys, ["dashboard", "imports"]);

const assignment = prepareTenantPlanAssignment({
  tenantId: "tenant-1",
  planId: "plus",
  catalog,
  requestedAt: "2026-10-06T02:30:00Z",
});
assert.equal(assignment.status, "pending_activation");
assert.equal(assignment.activationEnabled, false);
assert.equal(assignment.entitlementsApplied, false);
assert.equal(assignment.paymentProcessorReference, null);

assert.throws(
  () =>
    prepareBillingCatalog([
      {
        planId: "dup",
        displayName: "One",
        catalogReference: "catalog/one",
        featureKeys: [],
      },
      {
        planId: "dup",
        displayName: "Two",
        catalogReference: "catalog/two",
        featureKeys: [],
      },
    ]),
  /Duplicate billing planId/,
);

assert.throws(
  () =>
    prepareTenantPlanAssignment({
      tenantId: "tenant-1",
      planId: "missing",
      catalog,
      requestedAt: "2026-10-06T02:30:00Z",
    }),
  /Unknown billing plan/,
);

assert.equal(billingReadinessPolicy.automaticActivationAllowed, false);
assert.equal(billingReadinessPolicy.automaticChargingAllowed, false);
assert.equal(billingReadinessPolicy.paymentProcessorCallsEnabled, false);
assert.equal(billingReadinessPolicy.pricesMayBeInvented, false);
assert.equal(billingReadinessPolicy.pendingAssignmentGrantsEntitlements, false);
assert.equal(billingReadinessPolicy.productionBillingRequiresExplicitAuthorization, true);

console.log("Phase 14.4 billing readiness regression passed");
