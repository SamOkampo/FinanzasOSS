import assert from "node:assert/strict";
import {
  assessConnectorGoLive,
  gradualGoLivePolicy,
} from "../dist/packages/security/src/index.js";

const access = {
  providerId: "provider-a",
  agreementReference: "agreement-ref-001",
  credentialReference: "vault-ref-001",
  certificateReference: "cert-ref-001",
  verifiedAt: "2026-10-06T03:40:00Z",
  verifiedBy: "reviewer",
  environment: "production",
  readOnly: true,
};

const legal = {
  reviewReference: "legal-review-001",
  approvedBy: "counsel",
  approvedAt: "2026-10-06T03:40:00Z",
  privacyNoticeReference: "privacy-v1",
  retentionPolicyReference: "retention-v1",
  dataSubjectRightsProcedureReference: "rights-v1",
  thirdPartyReceiverAssessmentReference: "third-party-v1",
  jurisdictionReference: "jurisdiction-v1",
};

const infrastructure = {
  environmentReference: "prod-env-001",
  kmsOrSecretManagerReference: "kms-001",
  tenantIsolationReference: "rls-001",
  databaseBackupRestoreReference: "restore-001",
  egressPolicyReference: "egress-001",
  loggingRedactionReviewReference: "logging-001",
  monitoringReference: "monitoring-001",
  alertingReference: "alerts-001",
  incidentRunbookReference: "runbook-001",
  verifiedAt: "2026-10-06T03:40:00Z",
  verifiedBy: "operator",
};

const pentest = {
  reportReference: "pentest-001",
  assessorReference: "assessor-001",
  scopeReference: "scope-001",
  performedAt: "2026-10-06T03:40:00Z",
  remediationReference: "remediation-001",
  retestReference: "retest-001",
  openCriticalFindings: 0,
  openHighFindings: 0,
};

const rollout = {
  connectorId: "provider-a",
  canaryPlanReference: "canary-001",
  rollbackPlanReference: "rollback-001",
  initialAudienceReference: "audience-001",
  healthDashboardReference: "health-001",
  supportOwner: "support-owner",
  approvedBy: "release-approver",
  approvedAt: "2026-10-06T03:40:00Z",
};

const ready = assessConnectorGoLive({ access, legal, infrastructure, pentest, rollout });
assert.equal(ready.eligibleForManualCanary, true);
assert.equal(ready.automaticActivation, false);
assert.equal(ready.writeCapabilitiesAllowed, false);
assert.deepEqual(ready.reasons, []);

const blocked = assessConnectorGoLive({
  access: { ...access, agreementReference: "" },
  legal,
  infrastructure,
  pentest: { ...pentest, openHighFindings: 1 },
  rollout,
});
assert.equal(blocked.eligibleForManualCanary, false);
assert.ok(blocked.reasons.includes("access:agreementReference"));
assert.ok(blocked.reasons.includes("pentest:high findings remain open"));

const crossProviderEvidence = assessConnectorGoLive({
  access,
  legal,
  infrastructure,
  pentest,
  rollout: { ...rollout, connectorId: "provider-b" },
});
assert.equal(crossProviderEvidence.eligibleForManualCanary, false);
assert.ok(
  crossProviderEvidence.reasons.includes("rollout:connectorId does not match access:providerId"),
);

assert.equal(gradualGoLivePolicy.automaticActivationAllowed, false);
assert.equal(gradualGoLivePolicy.financialWriteCapabilitiesAllowed, false);
assert.equal(gradualGoLivePolicy.manualCanaryApprovalRequired, true);
assert.equal(gradualGoLivePolicy.connectorByConnectorRolloutRequired, true);

console.log("Phase 15.5 connector go-live readiness regression passed");
