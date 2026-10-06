import assert from "node:assert/strict";
import {
  assessProductionAccessEvidence,
  assertProductionAccessEvidence,
  productionAccessPolicy,
} from "../dist/packages/security/src/index.js";

const incomplete = assessProductionAccessEvidence({
  providerId: "provider-a",
  environment: "production",
  readOnly: true,
});
assert.equal(incomplete.ready, false);
assert.deepEqual([...incomplete.missing].sort(), [
  "agreementReference",
  "credentialReference",
  "verifiedAt",
  "verifiedBy",
].sort());

const evidence = {
  providerId: "provider-a",
  agreementReference: "agreement-ref-001",
  credentialReference: "vault-ref-001",
  certificateReference: "cert-ref-001",
  verifiedAt: "2026-10-06T03:00:00Z",
  verifiedBy: "human-reviewer",
  environment: "production",
  readOnly: true,
};

assert.doesNotThrow(() => assertProductionAccessEvidence(evidence));
assert.equal(assessProductionAccessEvidence(evidence).ready, true);

assert.throws(
  () => assertProductionAccessEvidence({ ...evidence, readOnly: false }),
  /must remain read-only/,
);

assert.equal(productionAccessPolicy.rawCredentialMaterialAllowedInEvidence, false);
assert.equal(productionAccessPolicy.rawCertificateMaterialAllowedInEvidence, false);
assert.equal(productionAccessPolicy.providerEndpointsMayBeInvented, false);
assert.equal(productionAccessPolicy.providerScopesMayBeInvented, false);
assert.equal(productionAccessPolicy.automaticProviderActivationAllowed, false);

console.log("Phase 15.1 production access readiness regression passed");
