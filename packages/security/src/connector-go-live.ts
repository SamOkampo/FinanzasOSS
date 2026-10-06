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
  return Boolean(value?.trim());
}

export function assessConnectorGoLive(input: {
  access: Partial<ProductionAccessEvidence>;
  legal: Partial<LegalDataReviewEvidence>;
  infrastructure: Partial<ProductionInfrastructureEvidence>;
  pentest: Partial<ExternalPentestEvidence>;
  rollout: Partial<GradualRolloutEvidence>;
}): ConnectorGoLiveReadiness {
  const reasons: string[] = [];
  const access = assessProductionAccessEvidence(input.access);
  if (!access.ready) reasons.push(...access.missing.map((item) => `access:${item}`));

  const legal = assessLegalDataReadiness(input.legal);
  if (!legal.ready) reasons.push(...legal.missing.map((item) => `legal:${item}`));

  const infrastructure = assessProductionInfrastructureReadiness(input.infrastructure);
  if (!infrastructure.ready) {
    reasons.push(...infrastructure.missing.map((item) => `infrastructure:${item}`));
  }

  const pentest = assessExternalPentestReadiness(input.pentest);
  if (!pentest.ready) reasons.push(...pentest.reasons.map((item) => `pentest:${item}`));

  const connectorId = input.rollout.connectorId?.trim() ?? "";
  if (!connectorId) reasons.push("rollout:connectorId");

  const accessProviderId = input.access.providerId?.trim() ?? "";
  if (connectorId && accessProviderId && connectorId !== accessProviderId) {
    reasons.push("rollout:connectorId does not match access:providerId");
  }
  if (!hasText(input.rollout.canaryPlanReference)) reasons.push("rollout:canaryPlanReference");
  if (!hasText(input.rollout.rollbackPlanReference)) reasons.push("rollout:rollbackPlanReference");
  if (!hasText(input.rollout.initialAudienceReference)) {
    reasons.push("rollout:initialAudienceReference");
  }
  if (!hasText(input.rollout.healthDashboardReference)) {
    reasons.push("rollout:healthDashboardReference");
  }
  if (!hasText(input.rollout.supportOwner)) reasons.push("rollout:supportOwner");
  if (!hasText(input.rollout.approvedBy)) reasons.push("rollout:approvedBy");
  if (!input.rollout.approvedAt || Number.isNaN(Date.parse(input.rollout.approvedAt))) {
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
