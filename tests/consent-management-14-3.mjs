import assert from "node:assert/strict";
import {
  assertConsentCapabilitiesUnchanged,
  consentManagementPolicy,
  deriveConsentManagementView,
  planConsentManagementAction,
} from "../dist/packages/security/src/index.js";

const active = {
  id: "consent-1",
  tenantId: "tenant-1",
  connectionId: "conn-1",
  status: "active",
  capabilities: ["accounts", "balances", "transactions"],
  grantedAt: "2026-10-01T00:00:00Z",
  expiresAt: "2026-11-01T00:00:00Z",
  createdAt: "2026-10-01T00:00:00Z",
  updatedAt: "2026-10-01T00:00:00Z",
};

const view = deriveConsentManagementView({
  tenantId: "tenant-1",
  connectionId: "conn-1",
  consent: active,
  now: "2026-10-06T02:25:00Z",
});
assert.equal(view.effectiveStatus, "active");
assert.deepEqual(view.allowedActions, ["revoke"]);
const revoke = planConsentManagementAction(view, "revoke");
assert.equal(revoke.executesProviderCall, false);
assert.equal(revoke.requiresProviderConsent, false);
assert.deepEqual(revoke.capabilities, ["accounts", "balances", "transactions"]);

const expired = deriveConsentManagementView({
  tenantId: "tenant-1",
  connectionId: "conn-1",
  consent: active,
  now: "2026-12-01T00:00:00Z",
});
assert.equal(expired.effectiveStatus, "expired");
assert.deepEqual(expired.allowedActions, ["renew"]);
assert.equal(planConsentManagementAction(expired, "renew").requiresProviderConsent, true);

const revoked = deriveConsentManagementView({
  tenantId: "tenant-1",
  connectionId: "conn-1",
  consent: { ...active, status: "revoked", revokedAt: "2026-10-05T00:00:00Z" },
  now: "2026-10-06T02:25:00Z",
});
assert.deepEqual(revoked.allowedActions, ["reauthorize"]);

assert.throws(
  () =>
    deriveConsentManagementView({
      tenantId: "tenant-2",
      connectionId: "conn-1",
      consent: active,
      now: "2026-10-06T02:25:00Z",
    }),
  /Cross-tenant consent access denied/,
);

assert.throws(() => planConsentManagementAction(view, "renew"), /not allowed/);

assert.doesNotThrow(() =>
  assertConsentCapabilitiesUnchanged(
    ["accounts", "balances", "transactions"],
    ["transactions", "accounts", "balances"],
  ),
);
assert.throws(
  () =>
    assertConsentCapabilitiesUnchanged(
      ["accounts", "balances"],
      ["accounts", "balances", "transactions"],
    ),
  /fresh explicit consent flow/,
);

assert.equal(consentManagementPolicy.tenantBound, true);
assert.equal(consentManagementPolicy.onboardingImpliesConsent, false);
assert.equal(consentManagementPolicy.silentCapabilityExpansionAllowed, false);
assert.equal(consentManagementPolicy.providerCallsExecutedByManagementLayer, false);
assert.equal(consentManagementPolicy.providerEndpointsOrScopesInvented, false);

console.log("Phase 14.3 consent management regression passed");
