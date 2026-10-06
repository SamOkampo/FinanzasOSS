import type { Tenant } from "../../finance-core/src/index.js";
import type { TenantContext } from "./index.js";

export interface TenantOwnedResource {
  tenantId: string;
}

export interface TenantOnboardingInput {
  tenantId: string;
  ownerUserId: string;
  actorUserId: string;
  name: string;
  defaultCurrency: string;
  createdAt: string;
}

function requireNonEmpty(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${label} is required`);
  return normalized;
}

function requireIsoTimestamp(value: string, label: string): string {
  if (Number.isNaN(Date.parse(value))) throw new Error(`${label} must be a valid date`);
  return value;
}

export function assertTenantContext(ctx: TenantContext): void {
  requireNonEmpty(ctx.tenantId, "Tenant context tenantId");
  requireNonEmpty(ctx.actorId, "Tenant context actorId");
}

export function assertTenantOwnership(
  ctx: TenantContext,
  resource: TenantOwnedResource,
  label = "resource",
): void {
  assertTenantContext(ctx);
  requireNonEmpty(resource.tenantId, `${label} tenantId`);
  if (resource.tenantId !== ctx.tenantId) {
    throw new Error(`Cross-tenant access denied for ${label}`);
  }
}

export function assertTenantCollectionOwnership(
  ctx: TenantContext,
  resources: readonly TenantOwnedResource[],
  label = "resource",
): void {
  assertTenantContext(ctx);
  for (const resource of resources) assertTenantOwnership(ctx, resource, label);
}

export function createTenantOnboarding(input: TenantOnboardingInput): {
  tenant: Tenant;
  context: TenantContext;
} {
  const tenantId = requireNonEmpty(input.tenantId, "Tenant id");
  const ownerUserId = requireNonEmpty(input.ownerUserId, "Owner user id");
  const actorUserId = requireNonEmpty(input.actorUserId, "Actor user id");
  const name = requireNonEmpty(input.name, "Tenant name");
  const currency = requireNonEmpty(input.defaultCurrency, "Default currency").toUpperCase();
  const createdAt = requireIsoTimestamp(input.createdAt, "Onboarding createdAt");

  if (actorUserId !== ownerUserId) {
    throw new Error("Tenant onboarding actor must match the owner user");
  }
  if (!/^[A-Z]{3}$/.test(currency)) {
    throw new Error("Default currency must be a three-letter currency code");
  }

  const tenant: Tenant = Object.freeze({
    id: tenantId,
    ownerUserId,
    name,
    defaultCurrency: currency,
    status: "active",
    createdAt,
    updatedAt: createdAt,
  });

  const context: TenantContext = Object.freeze({
    tenantId,
    actorId: actorUserId,
  });

  return Object.freeze({ tenant, context });
}

export const tenantIsolationPolicy = Object.freeze({
  contextRequiredForRepositoryAccess: true,
  implicitFallbackTenantAllowed: false,
  crossTenantAccessFailsClosed: true,
  onboardingGrantsFinancialDataAccess: false,
  onboardingStoresBankCredentials: false,
  productionIdentityProvisioningEnabled: false,
  productionRlsStillRequired: true,
});
