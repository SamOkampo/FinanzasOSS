import type {
  FinancialCapability,
  FinancialConsent,
} from "../../finance-core/src/index.js";

export type ConsentManagementAction = "revoke" | "renew" | "reauthorize";

export interface ConsentManagementView {
  tenantId: string;
  connectionId: string;
  consentId: string;
  status: FinancialConsent["status"];
  effectiveStatus: FinancialConsent["status"];
  capabilities: readonly FinancialCapability[];
  expiresAt?: string;
  allowedActions: readonly ConsentManagementAction[];
}

export interface ConsentActionPlan {
  action: ConsentManagementAction;
  tenantId: string;
  connectionId: string;
  consentId: string;
  capabilities: readonly FinancialCapability[];
  requiresProviderConsent: boolean;
  executesProviderCall: false;
}

function assertIso(value: string, label: string): number {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) throw new Error(`${label} must be a valid date`);
  return parsed;
}

function assertConsentScope(
  consent: FinancialConsent,
  tenantId: string,
  connectionId: string,
): void {
  if (!tenantId.trim()) throw new Error("Consent management tenantId is required");
  if (!connectionId.trim()) throw new Error("Consent management connectionId is required");
  if (consent.tenantId !== tenantId) throw new Error("Cross-tenant consent access denied");
  if (consent.connectionId !== connectionId) throw new Error("Consent connection mismatch");
}

function uniqueCapabilities(capabilities: readonly FinancialCapability[]): readonly FinancialCapability[] {
  const normalized = [...new Set(capabilities)];
  if (normalized.length !== capabilities.length) {
    throw new Error("Consent capabilities cannot contain duplicates");
  }
  return Object.freeze(normalized.sort());
}

export function deriveConsentManagementView(input: {
  tenantId: string;
  connectionId: string;
  consent: FinancialConsent;
  now: string;
}): ConsentManagementView {
  assertConsentScope(input.consent, input.tenantId, input.connectionId);
  const nowMs = assertIso(input.now, "Consent management now");
  const capabilities = uniqueCapabilities(input.consent.capabilities);

  let effectiveStatus = input.consent.status;
  if (
    input.consent.status === "active" &&
    input.consent.expiresAt !== undefined &&
    assertIso(input.consent.expiresAt, "Consent expiresAt") <= nowMs
  ) {
    effectiveStatus = "expired";
  }

  const allowedActions: ConsentManagementAction[] = [];
  switch (effectiveStatus) {
    case "active":
      allowedActions.push("revoke");
      break;
    case "expired":
      allowedActions.push("renew");
      break;
    case "revoked":
    case "rejected":
      allowedActions.push("reauthorize");
      break;
    case "pending":
      break;
  }

  return Object.freeze({
    tenantId: input.tenantId,
    connectionId: input.connectionId,
    consentId: input.consent.id,
    status: input.consent.status,
    effectiveStatus,
    capabilities,
    ...(input.consent.expiresAt !== undefined ? { expiresAt: input.consent.expiresAt } : {}),
    allowedActions: Object.freeze(allowedActions),
  });
}

export function planConsentManagementAction(
  view: ConsentManagementView,
  action: ConsentManagementAction,
): ConsentActionPlan {
  if (!view.allowedActions.includes(action)) {
    throw new Error(`Consent action ${action} is not allowed for status ${view.effectiveStatus}`);
  }

  return Object.freeze({
    action,
    tenantId: view.tenantId,
    connectionId: view.connectionId,
    consentId: view.consentId,
    capabilities: Object.freeze([...view.capabilities]),
    requiresProviderConsent: action === "renew" || action === "reauthorize",
    executesProviderCall: false as const,
  });
}

export function assertConsentCapabilitiesUnchanged(
  existing: readonly FinancialCapability[],
  requested: readonly FinancialCapability[],
): void {
  const left = [...new Set(existing)].sort();
  const right = [...new Set(requested)].sort();
  if (left.length !== right.length || left.some((value, index) => value !== right[index])) {
    throw new Error("Consent capability changes require a fresh explicit consent flow");
  }
}

export const consentManagementPolicy = Object.freeze({
  tenantBound: true,
  onboardingImpliesConsent: false,
  silentCapabilityExpansionAllowed: false,
  providerCallsExecutedByManagementLayer: false,
  revocationIsExplicit: true,
  renewalRequiresProviderConsent: true,
  reauthorizationRequiresProviderConsent: true,
  providerEndpointsOrScopesInvented: false,
});
