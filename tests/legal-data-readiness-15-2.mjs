import assert from "node:assert/strict";
import {
  assessLegalDataReadiness,
  assertLegalDataReviewEvidence,
  legalDataReadinessPolicy,
} from "../dist/packages/security/src/index.js";

const incomplete = assessLegalDataReadiness({
  reviewReference: "legal-review-001",
  approvedBy: "external-counsel",
});
assert.equal(incomplete.ready, false);
assert.ok(incomplete.missing.includes("privacyNoticeReference"));
assert.ok(incomplete.missing.includes("retentionPolicyReference"));

const evidence = {
  reviewReference: "legal-review-001",
  approvedBy: "external-counsel",
  approvedAt: "2026-10-06T03:10:00Z",
  privacyNoticeReference: "privacy-notice-v1",
  retentionPolicyReference: "retention-policy-v1",
  dataSubjectRightsProcedureReference: "rights-procedure-v1",
  thirdPartyReceiverAssessmentReference: "third-party-assessment-v1",
  jurisdictionReference: "jurisdiction-review-v1",
};

assert.equal(assessLegalDataReadiness(evidence).ready, true);
assert.doesNotThrow(() => assertLegalDataReviewEvidence(evidence));
assert.throws(
  () => assertLegalDataReviewEvidence({ ...evidence, approvedAt: "not-a-date" }),
  /evidence incomplete/,
);

assert.equal(legalDataReadinessPolicy.codeMaySelfApproveLegalReview, false);
assert.equal(legalDataReadinessPolicy.externalHumanApprovalRequired, true);
assert.equal(legalDataReadinessPolicy.legalConclusionsMayBeInvented, false);

// Direct public gate calls must reject absent JSON evidence without throwing.
for (const malformed of [null, undefined]) {
  const decision = assessLegalDataReadiness(malformed);
  assert.equal(decision.ready, false);
  assert.ok(decision.missing.length > 0);
  assert.ok(Object.isFrozen(decision));
  assert.throws(() => assertLegalDataReviewEvidence(malformed), /evidence incomplete/i);
}

console.log("Phase 15.2 legal/data readiness regression passed");
