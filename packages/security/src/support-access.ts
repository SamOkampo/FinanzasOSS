export type SupportOperatorRole = "support" | "admin";

export type SupportAccessScope =
  | "tenant_metadata"
  | "connection_health"
  | "sync_status"
  | "import_status"
  | "billing_status"
  | "plan_assignment_review";

export interface SupportAccessGrant {
  grantId: string;
  tenantId: string;
  operatorId: string;
  role: SupportOperatorRole;
  authorizedByActorId: string;
  caseReference: string;
  reason: string;
  scopes: readonly SupportAccessScope[];
  createdAt: string;
  expiresAt: string;
  revoked: false;
}

const SUPPORT_SCOPES = new Set<SupportAccessScope>([
  "tenant_metadata",
  "connection_health",
  "sync_status",
  "import_status",
]);

const ADMIN_EXTRA_SCOPES = new Set<SupportAccessScope>([
  "billing_status",
  "plan_assignment_review",
]);

const MAX_SUPPORT_SESSION_MS = 60 * 60 * 1000;

function required(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${label} is required`);
  return normalized;
}

function parseTimestamp(value: string, label: string): number {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) throw new Error(`${label} must be a valid date`);
  return parsed;
}

function allowedForRole(role: SupportOperatorRole, scope: SupportAccessScope): boolean {
  if (SUPPORT_SCOPES.has(scope)) return true;
  return role === "admin" && ADMIN_EXTRA_SCOPES.has(scope);
}

export function createSupportAccessGrant(input: {
  grantId: string;
  tenantId: string;
  operatorId: string;
  role: SupportOperatorRole;
  authorizedByActorId: string;
  caseReference: string;
  reason: string;
  scopes: readonly SupportAccessScope[];
  createdAt: string;
  expiresAt: string;
}): SupportAccessGrant {
  const grantId = required(input.grantId, "Support grantId");
  const tenantId = required(input.tenantId, "Support tenantId");
  const operatorId = required(input.operatorId, "Support operatorId");
  const authorizedByActorId = required(input.authorizedByActorId, "Support authorizing actor");
  const caseReference = required(input.caseReference, "Support case reference");
  const reason = required(input.reason, "Support reason");

  if (input.scopes.length === 0) throw new Error("Support grant requires at least one scope");
  const scopes = [...new Set(input.scopes)];
  if (scopes.length !== input.scopes.length) throw new Error("Support scopes cannot contain duplicates");
  for (const scope of scopes) {
    if (!allowedForRole(input.role, scope)) {
      throw new Error(`Support scope ${scope} is not allowed for role ${input.role}`);
    }
  }

  const createdAtMs = parseTimestamp(input.createdAt, "Support createdAt");
  const expiresAtMs = parseTimestamp(input.expiresAt, "Support expiresAt");
  if (expiresAtMs <= createdAtMs) throw new Error("Support access must expire after creation");
  if (expiresAtMs - createdAtMs > MAX_SUPPORT_SESSION_MS) {
    throw new Error("Support access cannot exceed one hour");
  }

  return Object.freeze({
    grantId,
    tenantId,
    operatorId,
    role: input.role,
    authorizedByActorId,
    caseReference,
    reason,
    scopes: Object.freeze(scopes.sort()),
    createdAt: input.createdAt,
    expiresAt: input.expiresAt,
    revoked: false as const,
  });
}

export function assertSupportAccess(input: {
  grant: SupportAccessGrant;
  tenantId: string;
  scope: SupportAccessScope;
  now: string;
}): void {
  required(input.tenantId, "Support request tenantId");
  if (input.grant.tenantId !== input.tenantId) throw new Error("Cross-tenant support access denied");
  if (!input.grant.scopes.includes(input.scope)) throw new Error("Support scope not granted");

  const nowMs = parseTimestamp(input.now, "Support access now");
  const createdAtMs = parseTimestamp(input.grant.createdAt, "Support grant createdAt");
  const expiresAtMs = parseTimestamp(input.grant.expiresAt, "Support grant expiresAt");
  if (nowMs < createdAtMs) throw new Error("Support grant is not active yet");
  if (nowMs >= expiresAtMs) throw new Error("Support grant has expired");
}

export const safeSupportPolicy = Object.freeze({
  accessIsTenantBound: true,
  explicitCaseReferenceRequired: true,
  explicitUserOrTenantAuthorizationRequired: true,
  maximumSessionMinutes: 60,
  rawBalancesAccessible: false,
  rawTransactionsAccessible: false,
  portfolioPositionsAccessible: false,
  secretMaterialAccessible: false,
  credentialMaterialAccessible: false,
  userImpersonationAllowed: false,
  providerConsentMutationAllowed: false,
  moneyMovementAllowed: false,
  supportAccessMustBeAudited: true,
});

export function buildSupportAccessAuditMetadata(
  grant: SupportAccessGrant,
): Readonly<Record<string, unknown>> {
  return Object.freeze({
    grantId: grant.grantId,
    operatorId: grant.operatorId,
    role: grant.role,
    caseReference: grant.caseReference,
    scopes: Object.freeze([...grant.scopes]),
    expiresAt: grant.expiresAt,
  });
}

