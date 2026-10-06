export interface BillingPlanDefinition {
  planId: string;
  displayName: string;
  catalogReference: string;
  featureKeys: readonly string[];
  limits?: Readonly<Record<string, number>>;
}

export interface PreparedBillingCatalog {
  plans: readonly BillingPlanDefinition[];
}

export interface TenantPlanAssignment {
  tenantId: string;
  planId: string;
  requestedAt: string;
  status: "pending_activation";
  activationEnabled: false;
  entitlementsApplied: false;
  paymentProcessorReference: null;
}

function required(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${label} is required`);
  return normalized;
}

function assertTimestamp(value: string, label: string): void {
  if (Number.isNaN(Date.parse(value))) throw new Error(`${label} must be a valid date`);
}

export function prepareBillingCatalog(
  plans: readonly BillingPlanDefinition[],
): PreparedBillingCatalog {
  if (plans.length === 0) throw new Error("Billing catalog requires at least one plan");

  const seen = new Set<string>();
  const normalized = plans.map((plan) => {
    const planId = required(plan.planId, "Billing planId");
    if (seen.has(planId)) throw new Error(`Duplicate billing planId: ${planId}`);
    seen.add(planId);

    const displayName = required(plan.displayName, "Billing displayName");
    const catalogReference = required(plan.catalogReference, "Billing catalogReference");

    const featureKeys = [...new Set(plan.featureKeys.map((feature) => required(feature, "Feature key")))].sort();
    if (featureKeys.length !== plan.featureKeys.length) {
      throw new Error(`Billing plan ${planId} contains duplicate feature keys`);
    }

    const limits = plan.limits
      ? Object.fromEntries(
          Object.entries(plan.limits).map(([key, value]) => {
            required(key, "Billing limit key");
            if (!Number.isInteger(value) || value < 0) {
              throw new Error(`Billing limit ${key} must be a non-negative integer`);
            }
            return [key, value];
          }),
        )
      : undefined;

    return Object.freeze({
      planId,
      displayName,
      catalogReference,
      featureKeys: Object.freeze(featureKeys),
      ...(limits !== undefined ? { limits: Object.freeze(limits) } : {}),
    });
  });

  return Object.freeze({ plans: Object.freeze(normalized) });
}

export function previewPlanEntitlements(
  catalog: PreparedBillingCatalog,
  planId: string,
): BillingPlanDefinition {
  const plan = catalog.plans.find((candidate) => candidate.planId === planId);
  if (!plan) throw new Error("Unknown billing plan");
  return plan;
}

export function prepareTenantPlanAssignment(input: {
  tenantId: string;
  planId: string;
  catalog: PreparedBillingCatalog;
  requestedAt: string;
}): TenantPlanAssignment {
  const tenantId = required(input.tenantId, "Billing tenantId");
  previewPlanEntitlements(input.catalog, input.planId);
  assertTimestamp(input.requestedAt, "Billing requestedAt");

  return Object.freeze({
    tenantId,
    planId: input.planId,
    requestedAt: input.requestedAt,
    status: "pending_activation" as const,
    activationEnabled: false as const,
    entitlementsApplied: false as const,
    paymentProcessorReference: null,
  });
}

export const billingReadinessPolicy = Object.freeze({
  automaticActivationAllowed: false,
  automaticChargingAllowed: false,
  paymentProcessorCallsEnabled: false,
  pricesMayBeInvented: false,
  pendingAssignmentGrantsEntitlements: false,
  productionBillingRequiresExplicitAuthorization: true,
});
