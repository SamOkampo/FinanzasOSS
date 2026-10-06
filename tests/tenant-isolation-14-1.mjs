import assert from "node:assert/strict";
import {
  assertTenantCollectionOwnership,
  assertTenantOwnership,
  createTenantOnboarding,
  tenantIsolationPolicy,
} from "../dist/packages/database/src/index.js";

const onboarded = createTenantOnboarding({
  tenantId: "tenant-1",
  ownerUserId: "user-1",
  actorUserId: "user-1",
  name: "Samuel Finance",
  defaultCurrency: "cop",
  createdAt: "2026-10-06T02:10:00Z",
});

assert.equal(onboarded.tenant.id, "tenant-1");
assert.equal(onboarded.tenant.ownerUserId, "user-1");
assert.equal(onboarded.tenant.defaultCurrency, "COP");
assert.equal(onboarded.context.tenantId, "tenant-1");
assert.equal(onboarded.context.actorId, "user-1");

assert.doesNotThrow(() =>
  assertTenantOwnership(onboarded.context, { tenantId: "tenant-1" }, "account"),
);
assert.doesNotThrow(() =>
  assertTenantCollectionOwnership(
    onboarded.context,
    [{ tenantId: "tenant-1" }, { tenantId: "tenant-1" }],
    "transaction",
  ),
);

assert.throws(
  () => assertTenantOwnership(onboarded.context, { tenantId: "tenant-2" }, "portfolio"),
  /Cross-tenant access denied/,
);

assert.throws(
  () =>
    createTenantOnboarding({
      tenantId: "tenant-2",
      ownerUserId: "user-2",
      actorUserId: "attacker-user",
      name: "Other",
      defaultCurrency: "USD",
      createdAt: "2026-10-06T02:10:00Z",
    }),
  /actor must match the owner/,
);

assert.throws(
  () =>
    createTenantOnboarding({
      tenantId: "",
      ownerUserId: "user-1",
      actorUserId: "user-1",
      name: "Bad",
      defaultCurrency: "COP",
      createdAt: "2026-10-06T02:10:00Z",
    }),
  /Tenant id is required/,
);

assert.equal(tenantIsolationPolicy.contextRequiredForRepositoryAccess, true);
assert.equal(tenantIsolationPolicy.implicitFallbackTenantAllowed, false);
assert.equal(tenantIsolationPolicy.crossTenantAccessFailsClosed, true);
assert.equal(tenantIsolationPolicy.onboardingGrantsFinancialDataAccess, false);
assert.equal(tenantIsolationPolicy.onboardingStoresBankCredentials, false);
assert.equal(tenantIsolationPolicy.productionIdentityProvisioningEnabled, false);

console.log("Phase 14.1 tenant onboarding/isolation regression passed");
