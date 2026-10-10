export interface ProductionAccessEvidence {
  providerId: string;
  agreementReference: string;
  credentialReference: string;
  certificateReference?: string;
  verifiedAt: string;
  verifiedBy: string;
  environment: "production";
  readOnly: true;
}

export interface ProductionAccessReadiness {
  providerId: string;
  ready: boolean;
  missing: readonly string[];
}

function required(value: string | undefined, label: string): string {
  const normalized = value?.trim() ?? "";
  if (!normalized) throw new Error(`${label} is required`);
  if (/\s/.test(normalized) && label.toLowerCase().includes("reference")) {
    throw new Error(`${label} must be an opaque reference without whitespace`);
  }
  return normalized;
}

function isOpaqueReference(value: string | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0 && !/\s/.test(value.trim());
}

function isValidReviewTimestamp(value: string | undefined): boolean {
  if (typeof value !== "string") return false;
  const canonicalUtc = /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(?:[.][0-9]{3})?Z$/;
  if (!canonicalUtc.test(value)) return false;
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed) || parsed > Date.now()) return false;
  const iso = new Date(parsed).toISOString();
  return value === iso || value === iso.replace(".000Z", "Z");
}

function assertIso(value: string, label: string): void {
  if (!isValidReviewTimestamp(value)) throw new Error(`${label} must be a valid non-future UTC timestamp`);
}

export function assessProductionAccessEvidence(
  evidence: Partial<ProductionAccessEvidence>,
): ProductionAccessReadiness {
  const missing: string[] = [];
  const providerId = evidence.providerId?.trim() ?? "";

  if (!providerId) missing.push("providerId");
  if (!isOpaqueReference(evidence.agreementReference)) missing.push("agreementReference");
  if (!isOpaqueReference(evidence.credentialReference)) missing.push("credentialReference");
  if (evidence.certificateReference !== undefined && !isOpaqueReference(evidence.certificateReference)) {
    missing.push("certificateReference");
  }
  if (!evidence.verifiedBy?.trim()) missing.push("verifiedBy");
  if (!isValidReviewTimestamp(evidence.verifiedAt)) missing.push("verifiedAt");
  if (evidence.environment !== "production") missing.push("environment=production");
  if (evidence.readOnly !== true) missing.push("readOnly=true");

  return Object.freeze({
    providerId,
    ready: missing.length === 0,
    missing: Object.freeze(missing),
  });
}

export function assertProductionAccessEvidence(
  evidence: ProductionAccessEvidence,
): void {
  required(evidence.providerId, "Provider id");
  required(evidence.agreementReference, "Agreement reference");
  required(evidence.credentialReference, "Credential reference");
  if (evidence.certificateReference !== undefined) {
    required(evidence.certificateReference, "Certificate reference");
  }
  required(evidence.verifiedBy, "Verified by");
  assertIso(evidence.verifiedAt, "Verified at");

  if (evidence.environment !== "production") {
    throw new Error("Production access evidence must target production");
  }
  if (evidence.readOnly !== true) {
    throw new Error("Production connector access must remain read-only");
  }
}

export const productionAccessPolicy = Object.freeze({
  rawCredentialMaterialAllowedInEvidence: false,
  rawCertificateMaterialAllowedInEvidence: false,
  providerEndpointsMayBeInvented: false,
  providerScopesMayBeInvented: false,
  productionAgreementRequired: true,
  managedCredentialReferenceRequired: true,
  readOnlyRequired: true,
  automaticProviderActivationAllowed: false,
});
