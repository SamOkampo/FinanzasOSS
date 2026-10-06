import assert from "node:assert/strict";
import {
  appendAuditEvent,
  appendConsentTransition,
  auditConsentPolicy,
  createConsentLedger,
  validateAuditChain,
} from "../dist/packages/security/src/index.js";

const first = appendAuditEvent([], {
  eventId: "evt-1",
  tenantId: "tenant-1",
  actorType: "user",
  actorReference: "user-ref-1",
  action: "consent.granted",
  resourceType: "connection",
  resourceReference: "conn-1",
  occurredAt: "2026-10-06T01:00:00Z",
  metadata: { source: "synthetic", detail: { provider: "fixture-bank" } },
});

const second = appendAuditEvent([first], {
  eventId: "evt-2",
  tenantId: "tenant-1",
  actorType: "system",
  action: "sync.completed",
  resourceType: "connection",
  resourceReference: "conn-1",
  occurredAt: "2026-10-06T01:01:00Z",
  metadata: { records: 3 },
});

assert.equal(first.sequence, 1);
assert.equal(second.sequence, 2);
assert.equal(second.previousHash, first.eventHash);
assert.doesNotThrow(() => validateAuditChain([first, second]));

assert.throws(
  () => appendAuditEvent([first], {
    eventId: "evt-x",
    tenantId: "tenant-2",
    actorType: "system",
    action: "bad",
    resourceType: "connection",
    occurredAt: "2026-10-06T01:02:00Z",
  }),
  /tenant cannot change/,
);

assert.throws(
  () => appendAuditEvent([], {
    eventId: "evt-secret",
    tenantId: "tenant-1",
    actorType: "system",
    action: "bad",
    resourceType: "connection",
    occurredAt: "2026-10-06T01:00:00Z",
    metadata: { accessToken: "must-not-be-logged" },
  }),
  /Sensitive audit metadata key/,
);

const tampered = [{ ...first, action: "tampered" }];
assert.throws(() => validateAuditChain(tampered), /hash mismatch/);

const ledger = createConsentLedger({
  consentId: "consent-1",
  tenantId: "tenant-1",
  connectionId: "conn-1",
  providerId: "fixture-bank",
  purpose: "read account information",
  scopeReferences: ["verified-scope-ref-1"],
  occurredAt: "2026-10-06T01:00:00Z",
});

const revoked = appendConsentTransition(ledger, {
  event: "revoked",
  occurredAt: "2026-10-06T01:05:00Z",
  reason: "user_requested",
});

assert.equal(ledger[0].event, "granted");
assert.equal(revoked.sequence, 2);
assert.equal(revoked.consentId, ledger[0].consentId);
assert.equal(revoked.providerId, ledger[0].providerId);

assert.throws(
  () => appendConsentTransition([...ledger, revoked], {
    event: "expired",
    occurredAt: "2026-10-06T01:10:00Z",
  }),
  /Terminal consent/,
);

assert.equal(auditConsentPolicy.appendOnlyRequired, true);
assert.equal(auditConsentPolicy.secretMaterialAllowedInAuditMetadata, false);
assert.equal(auditConsentPolicy.consentHistoryMayBeRewritten, false);
assert.equal(auditConsentPolicy.productionImmutableStoreRequiredBeforeRealData, true);

console.log("Phase 13.4 audit and consent ledger regression passed");
