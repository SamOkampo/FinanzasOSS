import assert from "node:assert/strict";
import {
  assessProductionInfrastructureReadiness,
  assertProductionInfrastructureEvidence,
  productionInfrastructurePolicy,
} from "../dist/packages/security/src/index.js";

const incomplete = assessProductionInfrastructureReadiness({
  environmentReference: "prod-env-001",
  verifiedBy: "operator",
});
assert.equal(incomplete.ready, false);
assert.ok(incomplete.missing.includes("kmsOrSecretManagerReference"));
assert.ok(incomplete.missing.includes("tenantIsolationReference"));

// Runtime evidence can be absent even when static types require an object.
for (const absent of [null, undefined]) {
  const assessed = assessProductionInfrastructureReadiness(absent);
  assert.equal(assessed.ready, false);
  assert.ok(assessed.missing.includes("environmentReference"));
  assert.ok(assessed.missing.includes("verifiedAt"));
  assert.deepEqual(assessed.missing, assessProductionInfrastructureReadiness({}).missing);
  assert.throws(() => assertProductionInfrastructureEvidence(absent), /Production infrastructure evidence incomplete:/);
}

const evidence = {
  environmentReference: "prod-env-001",
  kmsOrSecretManagerReference: "kms-ref-001",
  tenantIsolationReference: "rls-ref-001",
  databaseBackupRestoreReference: "restore-drill-001",
  egressPolicyReference: "egress-policy-001",
  loggingRedactionReviewReference: "logging-review-001",
  monitoringReference: "monitoring-001",
  alertingReference: "alerts-001",
  incidentRunbookReference: "runbook-001",
  verifiedAt: "2026-10-06T03:20:00Z",
  verifiedBy: "operator",
};

assert.equal(assessProductionInfrastructureReadiness(evidence).ready, true);
assert.doesNotThrow(() => assertProductionInfrastructureEvidence(evidence));

assert.equal(productionInfrastructurePolicy.productionSecretsInRepositoryAllowed, false);
assert.equal(
  productionInfrastructurePolicy.productionSecretsInEnvironmentVariablesWithoutSecretManagerAllowed,
  false,
);
assert.equal(productionInfrastructurePolicy.databaseSecondBarrierRequired, true);
assert.equal(productionInfrastructurePolicy.outboundEgressPolicyRequired, true);
assert.equal(productionInfrastructurePolicy.automaticProductionProvisioningAllowed, false);

console.log("Phase 15.3 production infrastructure readiness regression passed");
