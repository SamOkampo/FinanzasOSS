import assert from "node:assert/strict";
import {
  assertSupportAccess,
  buildSupportAccessAuditMetadata,
  createSupportAccessGrant,
  safeSupportPolicy,
} from "../dist/packages/security/src/index.js";

const grant = createSupportAccessGrant({
  grantId: "support-1",
  tenantId: "tenant-1",
  operatorId: "operator-1",
  role: "support",
  authorizedByActorId: "user-1",
  caseReference: "case-123",
  reason: "Investigate sync status",
  scopes: ["tenant_metadata", "connection_health", "sync_status"],
  createdAt: "2026-10-06T02:35:00Z",
  expiresAt: "2026-10-06T03:05:00Z",
});

assert.doesNotThrow(() =>
  assertSupportAccess({
    grant,
    tenantId: "tenant-1",
    scope: "sync_status",
    now: "2026-10-06T02:45:00Z",
  }),
);

assert.throws(
  () =>
    assertSupportAccess({
      grant,
      tenantId: "tenant-2",
      scope: "sync_status",
      now: "2026-10-06T02:45:00Z",
    }),
  /Cross-tenant support access denied/,
);

assert.throws(
  () =>
    createSupportAccessGrant({
      grantId: "support-too-long",
      tenantId: "tenant-1",
      operatorId: "operator-1",
      role: "support",
      authorizedByActorId: "user-1",
      caseReference: "case-124",
      reason: "Too long",
      scopes: ["tenant_metadata"],
      createdAt: "2026-10-06T02:35:00Z",
      expiresAt: "2026-10-06T04:00:01Z",
    }),
  /cannot exceed one hour/,
);

assert.throws(
  () =>
    createSupportAccessGrant({
      grantId: "support-billing",
      tenantId: "tenant-1",
      operatorId: "operator-1",
      role: "support",
      authorizedByActorId: "user-1",
      caseReference: "case-125",
      reason: "Wrong scope",
      scopes: ["billing_status"],
      createdAt: "2026-10-06T02:35:00Z",
      expiresAt: "2026-10-06T03:00:00Z",
    }),
  /not allowed for role support/,
);

const admin = createSupportAccessGrant({
  grantId: "admin-1",
  tenantId: "tenant-1",
  operatorId: "admin-1",
  role: "admin",
  authorizedByActorId: "user-1",
  caseReference: "case-126",
  reason: "Review pending plan assignment",
  scopes: ["billing_status", "plan_assignment_review"],
  createdAt: "2026-10-06T02:35:00Z",
  expiresAt: "2026-10-06T03:00:00Z",
});
assert.doesNotThrow(() =>
  assertSupportAccess({
    grant: admin,
    tenantId: "tenant-1",
    scope: "plan_assignment_review",
    now: "2026-10-06T02:40:00Z",
  }),
);

const auditMetadata = buildSupportAccessAuditMetadata(grant);
assert.equal(auditMetadata.caseReference, "case-123");
assert.equal(auditMetadata.reason, undefined);

assert.equal(safeSupportPolicy.rawBalancesAccessible, false);
assert.equal(safeSupportPolicy.rawTransactionsAccessible, false);
assert.equal(safeSupportPolicy.portfolioPositionsAccessible, false);
assert.equal(safeSupportPolicy.secretMaterialAccessible, false);
assert.equal(safeSupportPolicy.credentialMaterialAccessible, false);
assert.equal(safeSupportPolicy.userImpersonationAllowed, false);
assert.equal(safeSupportPolicy.providerConsentMutationAllowed, false);
assert.equal(safeSupportPolicy.moneyMovementAllowed, false);
assert.equal(safeSupportPolicy.supportAccessMustBeAudited, true);

console.log("Phase 14.5 safe admin/support regression passed");
