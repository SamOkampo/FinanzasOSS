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

for (const [field, value] of [
  ["agreementReference", "agreement ref"],
  ["credentialReference", "vault\tref"],
  ["certificateReference", "cert ref"],
  ["certificateReference", "   "],
]) {
  const malformed = { ...evidence, [field]: value };
  assert.equal(assessProductionAccessEvidence(malformed).ready, false, `${field} must fail closed`);
  assert.ok(assessProductionAccessEvidence(malformed).missing.includes(field));
  assert.throws(() => assertProductionAccessEvidence(malformed), /reference/i);
}

for (const malformed of [
  { ...evidence, providerId: "" },
  { ...evidence, verifiedAt: "not-a-date" },
  { ...evidence, environment: "sandbox" },
  { ...evidence, readOnly: false },
]) {
  assert.equal(assessProductionAccessEvidence(malformed).ready, false);
  assert.throws(() => assertProductionAccessEvidence(malformed));
}

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
