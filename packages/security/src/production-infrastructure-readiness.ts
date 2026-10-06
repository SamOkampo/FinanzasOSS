export interface ProductionInfrastructureEvidence {
  environmentReference: string;
  kmsOrSecretManagerReference: string;
  tenantIsolationReference: string;
  databaseBackupRestoreReference: string;
  egressPolicyReference: string;
  loggingRedactionReviewReference: string;
  monitoringReference: string;
  alertingReference: string;
  incidentRunbookReference: string;
  verifiedAt: string;
  verifiedBy: string;
}

export interface ProductionInfrastructureReadiness {
  ready: boolean;
  missing: readonly string[];
}

function hasText(value: string | undefined): boolean {
  return Boolean(value?.trim());
}

export function assessProductionInfrastructureReadiness(
  evidence: Partial<ProductionInfrastructureEvidence>,
): ProductionInfrastructureReadiness {
  const missing: string[] = [];
  const required: Array<keyof ProductionInfrastructureEvidence> = [
    "environmentReference",
    "kmsOrSecretManagerReference",
    "tenantIsolationReference",
    "databaseBackupRestoreReference",
    "egressPolicyReference",
    "loggingRedactionReviewReference",
    "monitoringReference",
    "alertingReference",
    "incidentRunbookReference",
    "verifiedBy",
  ];

  for (const key of required) {
    if (!hasText(evidence[key] as string | undefined)) missing.push(key);
  }
  if (!evidence.verifiedAt || Number.isNaN(Date.parse(evidence.verifiedAt))) {
    missing.push("verifiedAt");
  }

  return Object.freeze({
    ready: missing.length === 0,
    missing: Object.freeze(missing),
  });
}

export function assertProductionInfrastructureEvidence(
  evidence: ProductionInfrastructureEvidence,
): void {
  const readiness = assessProductionInfrastructureReadiness(evidence);
  if (!readiness.ready) {
    throw new Error(
      `Production infrastructure evidence incomplete: ${readiness.missing.join(", ")}`,
    );
  }
}

export const productionInfrastructurePolicy = Object.freeze({
  productionSecretsInRepositoryAllowed: false,
  productionSecretsInEnvironmentVariablesWithoutSecretManagerAllowed: false,
  databaseSecondBarrierRequired: true,
  outboundEgressPolicyRequired: true,
  structuredRedactedLoggingRequired: true,
  monitoringAndAlertingRequired: true,
  backupRestoreEvidenceRequired: true,
  incidentRunbookRequired: true,
  automaticProductionProvisioningAllowed: false,
});
