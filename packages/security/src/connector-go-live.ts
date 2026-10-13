import { isValidReviewTimestamp } from "./production-access-readiness.js";
import {
  assessProductionAccessEvidence,
  type ProductionAccessEvidence,
} from "./production-access-readiness.js";
import {
  assessLegalDataReadiness,
  type LegalDataReviewEvidence,
} from "./legal-data-readiness.js";
import {
  assessProductionInfrastructureReadiness,
  type ProductionInfrastructureEvidence,
} from "./production-infrastructure-readiness.js";
import {
  assessExternalPentestReadiness,
  type ExternalPentestEvidence,
} from "./pentest-readiness.js";

export interface GradualRolloutEvidence {
  connectorId: string;
  canaryPlanReference: string;
  rollbackPlanReference: string;
  initialAudienceReference: string;
  healthDashboardReference: string;
  supportOwner: string;
  approvedBy: string;
  approvedAt: string;
}

export interface ConnectorGoLiveReadiness {
  connectorId: string;
  eligibleForManualCanary: boolean;
  automaticActivation: false;
  writeCapabilitiesAllowed: false;
  reasons: readonly string[];
}

function hasText(value: string | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function asEvidence<T extends object>(value: unknown): Partial<T> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Partial<T>)
    : {};
}

export function assessConnectorGoLive(input: {
  access: Partial<ProductionAccessEvidence>;
  legal: Partial<LegalDataReviewEvidence>;
  infrastructure: Partial<ProductionInfrastructureEvidence>;
  pentest: Partial<ExternalPentestEvidence>;
  rollout: Partial<GradualRolloutEvidence>;
}): ConnectorGoLiveReadiness {
  const raw = asEvidence<{
    access: Partial<ProductionAccessEvidence>;
    legal: Partial<LegalDataReviewEvidence>;
    infrastructure: Partial<ProductionInfrastructureEvidence>;
    pentest: Partial<ExternalPentestEvidence>;
    rollout: Partial<GradualRolloutEvidence>;
  }>(input);
  const accessEvidence = asEvidence<ProductionAccessEvidence>(raw.access);
  const legalEvidence = asEvidence<LegalDataReviewEvidence>(raw.legal);
  const infrastructureEvidence = asEvidence<ProductionInfrastructureEvidence>(raw.infrastructure);
  const pentestEvidence = asEvidence<ExternalPentestEvidence>(raw.pentest);
  const rolloutEvidence = asEvidence<GradualRolloutEvidence>(raw.rollout);
  const reasons: string[] = [];
  const access = assessProductionAccessEvidence(accessEvidence);
  if (!access.ready) reasons.push(...access.missing.map((item) => `access:${item}`));

  const legal = assessLegalDataReadiness(legalEvidence);
  if (!legal.ready) reasons.push(...legal.missing.map((item) => `legal:${item}`));

  const infrastructure = assessProductionInfrastructureReadiness(infrastructureEvidence);
  if (!infrastructure.ready) {
    reasons.push(...infrastructure.missing.map((item) => `infrastructure:${item}`));
  }

  const pentest = assessExternalPentestReadiness(pentestEvidence);
  if (!pentest.ready) reasons.push(...pentest.reasons.map((item) => `pentest:${item}`));

  const connectorId = typeof rolloutEvidence.connectorId === "string" ? rolloutEvidence.connectorId.trim() : "";
  if (!connectorId) reasons.push("rollout:connectorId");

  const accessProviderId = typeof accessEvidence.providerId === "string" ? accessEvidence.providerId.trim() : "";
  if (connectorId && accessProviderId && connectorId !== accessProviderId) {
    reasons.push("rollout:connectorId does not match access:providerId");
  }
  if (!hasText(rolloutEvidence.canaryPlanReference)) reasons.push("rollout:canaryPlanReference");
  if (!hasText(rolloutEvidence.rollbackPlanReference)) reasons.push("rollout:rollbackPlanReference");
  if (!hasText(rolloutEvidence.initialAudienceReference)) {
    reasons.push("rollout:initialAudienceReference");
  }
  if (!hasText(rolloutEvidence.healthDashboardReference)) {
    reasons.push("rollout:healthDashboardReference");
  }
  if (!hasText(rolloutEvidence.supportOwner)) reasons.push("rollout:supportOwner");
  if (!hasText(rolloutEvidence.approvedBy)) reasons.push("rollout:approvedBy");
  if (!isValidReviewTimestamp(rolloutEvidence.approvedAt)) {
    reasons.push("rollout:approvedAt");
  }

  return Object.freeze({
    connectorId,
    eligibleForManualCanary: reasons.length === 0,
    automaticActivation: false as const,
    writeCapabilitiesAllowed: false as const,
    reasons: Object.freeze(reasons),
  });
}

export const gradualGoLivePolicy = Object.freeze({
  automaticActivationAllowed: false,
  financialWriteCapabilitiesAllowed: false,
  manualCanaryApprovalRequired: true,
  rollbackPlanRequired: true,
  healthMonitoringRequired: true,
  initialAudienceMustBeExplicit: true,
  connectorByConnectorRolloutRequired: true,
});
