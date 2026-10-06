export interface LegalDataReviewEvidence {
  reviewReference: string;
  approvedBy: string;
  approvedAt: string;
  privacyNoticeReference: string;
  retentionPolicyReference: string;
  dataSubjectRightsProcedureReference: string;
  thirdPartyReceiverAssessmentReference: string;
  jurisdictionReference: string;
}

export interface LegalDataReadiness {
  ready: boolean;
  missing: readonly string[];
}

function hasText(value: string | undefined): boolean {
  return Boolean(value?.trim());
}

export function assessLegalDataReadiness(
  evidence: Partial<LegalDataReviewEvidence>,
): LegalDataReadiness {
  const missing: string[] = [];
  if (!hasText(evidence.reviewReference)) missing.push("reviewReference");
  if (!hasText(evidence.approvedBy)) missing.push("approvedBy");
  if (!evidence.approvedAt || Number.isNaN(Date.parse(evidence.approvedAt))) missing.push("approvedAt");
  if (!hasText(evidence.privacyNoticeReference)) missing.push("privacyNoticeReference");
  if (!hasText(evidence.retentionPolicyReference)) missing.push("retentionPolicyReference");
  if (!hasText(evidence.dataSubjectRightsProcedureReference)) {
    missing.push("dataSubjectRightsProcedureReference");
  }
  if (!hasText(evidence.thirdPartyReceiverAssessmentReference)) {
    missing.push("thirdPartyReceiverAssessmentReference");
  }
  if (!hasText(evidence.jurisdictionReference)) missing.push("jurisdictionReference");

  return Object.freeze({
    ready: missing.length === 0,
    missing: Object.freeze(missing),
  });
}

export function assertLegalDataReviewEvidence(
  evidence: LegalDataReviewEvidence,
): void {
  const readiness = assessLegalDataReadiness(evidence);
  if (!readiness.ready) {
    throw new Error(`Legal/data review evidence incomplete: ${readiness.missing.join(", ")}`);
  }
}

export const legalDataReadinessPolicy = Object.freeze({
  codeMaySelfApproveLegalReview: false,
  externalHumanApprovalRequired: true,
  privacyNoticeReferenceRequired: true,
  retentionPolicyReferenceRequired: true,
  dataSubjectRightsProcedureRequired: true,
  thirdPartyReceiverAssessmentRequired: true,
  jurisdictionMustBeExplicit: true,
  legalConclusionsMayBeInvented: false,
});
