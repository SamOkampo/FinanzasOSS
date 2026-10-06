export type TenantExportDataset =
  | "connections"
  | "consents"
  | "accounts"
  | "balances"
  | "transactions"
  | "portfolios"
  | "assets"
  | "positions"
  | "investment_activities"
  | "portfolio_snapshots";

export const TENANT_EXPORT_DATASETS: readonly TenantExportDataset[] = Object.freeze([
  "connections",
  "consents",
  "accounts",
  "balances",
  "transactions",
  "portfolios",
  "assets",
  "positions",
  "investment_activities",
  "portfolio_snapshots",
]);

const EXPORT_FORBIDDEN_KEY =
  /authorization|token|secret|password|credential|cookie|seed|mnemonic|private[_-]?key|api[_-]?key/i;

export interface TenantExportInput {
  tenantId: string;
  generatedAt: string;
  datasets: Partial<
    Readonly<Record<TenantExportDataset, readonly Readonly<Record<string, unknown>>[]>>
  >;
}

export interface TenantDataExport {
  format: "finanzasoss-tenant-export-v1";
  tenantId: string;
  generatedAt: string;
  datasets: Readonly<Record<TenantExportDataset, readonly unknown[]>>;
  recordCounts: Readonly<Record<TenantExportDataset, number>>;
  excludedSensitiveFields: true;
}

function assertLifecycleTimestamp(value: string, label: string): number {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) throw new Error(`${label} must be a valid date`);
  return parsed;
}

function assertTenantId(value: string): void {
  if (!value.trim()) throw new Error("Tenant id is required");
}

function sanitizeExportValue(value: unknown, tenantId: string, path: string): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === "bigint") return value.toString();
  if (["string", "number", "boolean"].includes(typeof value)) return value;
  if (Array.isArray(value)) {
    return value.map((item, index) => sanitizeExportValue(item, tenantId, `${path}[${index}]`));
  }
  if (typeof value !== "object") throw new Error(`${path} contains an unsupported export value`);

  const output: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    if (key === "tenantId" && nested !== tenantId) {
      throw new Error(`Cross-tenant export data detected at ${path}.tenantId`);
    }
    if (EXPORT_FORBIDDEN_KEY.test(key)) continue;
    output[key] = sanitizeExportValue(nested, tenantId, `${path}.${key}`);
  }
  return Object.freeze(output);
}

export function buildTenantDataExport(input: TenantExportInput): TenantDataExport {
  assertTenantId(input.tenantId);
  assertLifecycleTimestamp(input.generatedAt, "Export generatedAt");

  const datasets = Object.fromEntries(
    TENANT_EXPORT_DATASETS.map((dataset) => [
      dataset,
      Object.freeze(
        (input.datasets[dataset] ?? []).map((record, index) =>
          sanitizeExportValue(record, input.tenantId, `${dataset}[${index}]`),
        ),
      ),
    ]),
  ) as Record<TenantExportDataset, readonly unknown[]>;

  const recordCounts = Object.fromEntries(
    TENANT_EXPORT_DATASETS.map((dataset) => [dataset, datasets[dataset].length]),
  ) as Record<TenantExportDataset, number>;

  return Object.freeze({
    format: "finanzasoss-tenant-export-v1",
    tenantId: input.tenantId,
    generatedAt: input.generatedAt,
    datasets: Object.freeze(datasets),
    recordCounts: Object.freeze(recordCounts),
    excludedSensitiveFields: true,
  });
}

export type TenantDeletionDataset =
  | "sync_checkpoints"
  | "portfolio_snapshots"
  | "positions"
  | "investment_activities"
  | "transactions"
  | "balances"
  | "accounts"
  | "consents"
  | "connections"
  | "assets"
  | "portfolios"
  | "tenant_profile";

export const TENANT_DELETION_ORDER: readonly TenantDeletionDataset[] = Object.freeze([
  "sync_checkpoints",
  "portfolio_snapshots",
  "positions",
  "investment_activities",
  "transactions",
  "balances",
  "accounts",
  "consents",
  "connections",
  "assets",
  "portfolios",
  "tenant_profile",
]);

export interface TenantRetentionException {
  dataset: TenantDeletionDataset | "audit_log" | "consent_ledger";
  approvedPolicyReference: string;
  reason: string;
}

export interface TenantDeletionPlan {
  tenantId: string;
  requestedAt: string;
  steps: readonly TenantDeletionDataset[];
  retentionExceptions: readonly TenantRetentionException[];
  requiresExplicitDestructiveAuthorization: true;
  productionExecutionEnabled: false;
}

export function createTenantDeletionPlan(input: {
  tenantId: string;
  requestedAt: string;
  retentionExceptions?: readonly TenantRetentionException[];
}): TenantDeletionPlan {
  assertTenantId(input.tenantId);
  assertLifecycleTimestamp(input.requestedAt, "Deletion requestedAt");

  const retentionExceptions = input.retentionExceptions ?? [];
  for (const exception of retentionExceptions) {
    if (!exception.approvedPolicyReference.trim()) {
      throw new Error("Retention exception requires an approved policy reference");
    }
    if (!exception.reason.trim()) throw new Error("Retention exception requires a reason");
  }

  const retained = new Set(
    retentionExceptions
      .map((exception) => exception.dataset)
      .filter((dataset): dataset is TenantDeletionDataset =>
        TENANT_DELETION_ORDER.includes(dataset as TenantDeletionDataset),
      ),
  );

  return Object.freeze({
    tenantId: input.tenantId,
    requestedAt: input.requestedAt,
    steps: Object.freeze(TENANT_DELETION_ORDER.filter((dataset) => !retained.has(dataset))),
    retentionExceptions: Object.freeze([...retentionExceptions]),
    requiresExplicitDestructiveAuthorization: true,
    productionExecutionEnabled: false,
  });
}

export const dataLifecyclePolicy = Object.freeze({
  exportsAreTenantScoped: true,
  secretMaterialIsExcludedFromExports: true,
  crossTenantRecordsFailClosed: true,
  deletionRequiresExplicitDestructiveAuthorization: true,
  legalRetentionIsNeverInvented: true,
  productionDeletionExecutionEnabledByMvp: false,
});
