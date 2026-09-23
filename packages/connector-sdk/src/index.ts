import type {
  ConnectionAccessMode,
  FinancialAccount,
  FinancialCapability,
  FinancialTransaction,
  InvestmentActivity,
  Money,
  PortfolioSnapshot,
  Position,
} from "../../finance-core/src/index.js";

export type ConnectorCapability = Extract<
  FinancialCapability,
  "accounts" | "balances" | "transactions" | "positions" | "investment_activities" | "portfolio_snapshots"
>;
export type ConnectorAccessMode = ConnectionAccessMode;
export type ConnectorEnvironment = "sandbox" | "production" | "local_import";
export type ConnectionHealth =
  | "connected"
  | "degraded"
  | "auth_required"
  | "consent_expired"
  | "api_down"
  | "syncing";

export interface ConnectorHealthReport {
  state: ConnectionHealth;
  checkedAt: string;
  detail?: string;
  retryAfterMs?: number;
}

export type ConnectorRecoveryAction =
  | "none"
  | "retry"
  | "reauthorize"
  | "renew_consent"
  | "reconfigure"
  | "wait";

export interface ConnectorRecoveryPlan {
  action: ConnectorRecoveryAction;
  automatic: boolean;
  userActionRequired: boolean;
  retryAfterMs?: number;
}

export interface ConnectorDescriptor {
  connectorId: string;
  institutionId: string;
  displayName: string;
  version: string;
  environment: ConnectorEnvironment;
  accessMode: ConnectorAccessMode;
  capabilities: readonly ConnectorCapability[];
  dataAccess: "read_only";
}

export interface ConnectorContext {
  tenantId: string;
  connectionId: string;
}

export interface ConsentRequest {
  redirectUri: string;
  requestedCapabilities: readonly ConnectorCapability[];
  purpose?: string;
}

export interface ConsentStart {
  authorizationUrl: string;
  stateReference: string;
  expiresAt: string;
}

export interface ConnectorPage<T> {
  items: T[];
  /** Cursor for the next page in the current bounded run. */
  nextCursor?: string;
  /** Durable incremental cursor to use on the next sync. Prefer emitting this on the terminal page. */
  checkpointCursor?: string;
}

export type TransactionPage = ConnectorPage<FinancialTransaction>;
export type InvestmentActivityPage = ConnectorPage<InvestmentActivity>;
export type PositionPage = ConnectorPage<Position>;
export type PortfolioSnapshotPage = ConnectorPage<PortfolioSnapshot>;

export interface BalanceRecord {
  accountExternalId: string;
  available?: Money;
  current: Money;
  asOf: string;
}

export interface FinancialConnector {
  readonly descriptor: ConnectorDescriptor;
  createConsent?(ctx: ConnectorContext, request: ConsentRequest): Promise<ConsentStart>;
  getAccounts(ctx: ConnectorContext): Promise<FinancialAccount[]>;
  getBalances?(ctx: ConnectorContext): Promise<BalanceRecord[]>;
  getTransactions?(ctx: ConnectorContext, cursor?: string): Promise<TransactionPage>;
  getPositions?(ctx: ConnectorContext, cursor?: string): Promise<PositionPage>;
  getInvestmentActivities?(ctx: ConnectorContext, cursor?: string): Promise<InvestmentActivityPage>;
  getPortfolioSnapshots?(ctx: ConnectorContext, cursor?: string): Promise<PortfolioSnapshotPage>;
  revokeConsent?(ctx: ConnectorContext): Promise<void>;
  healthCheck(ctx: ConnectorContext): Promise<ConnectorHealthReport>;
}

export type ConnectorErrorCode =
  | "AUTH"
  | "CONSENT"
  | "RATE_LIMIT"
  | "UPSTREAM"
  | "INVALID_RESPONSE"
  | "UNSUPPORTED"
  | "CONFIGURATION";

export interface ConnectorErrorOptions {
  retryAfterMs?: number;
  providerCode?: string;
}

export class ConnectorError extends Error {
  readonly retryAfterMs?: number;
  readonly providerCode?: string;

  constructor(
    message: string,
    readonly code: ConnectorErrorCode,
    readonly retryable: boolean,
    options: ConnectorErrorOptions = {},
  ) {
    super(message);
    this.name = "ConnectorError";
    if (options.retryAfterMs !== undefined) this.retryAfterMs = options.retryAfterMs;
    if (options.providerCode !== undefined) this.providerCode = options.providerCode;
  }
}


export function validateHealthReport(report: ConnectorHealthReport): void {
  if (Number.isNaN(Date.parse(report.checkedAt))) {
    throw new ConnectorError("Health report checkedAt must be a valid date", "INVALID_RESPONSE", false);
  }
  if (report.retryAfterMs !== undefined && (!Number.isFinite(report.retryAfterMs) || report.retryAfterMs < 0)) {
    throw new ConnectorError("Health report retryAfterMs must be non-negative", "INVALID_RESPONSE", false);
  }
}

export function recoveryPlanForHealth(report: ConnectorHealthReport): ConnectorRecoveryPlan {
  validateHealthReport(report);

  switch (report.state) {
    case "connected":
      return { action: "none", automatic: false, userActionRequired: false };
    case "syncing":
      return { action: "wait", automatic: true, userActionRequired: false };
    case "degraded":
      return {
        action: "retry",
        automatic: true,
        userActionRequired: false,
        ...(report.retryAfterMs !== undefined ? { retryAfterMs: report.retryAfterMs } : {}),
      };
    case "api_down":
      return {
        action: "retry",
        automatic: true,
        userActionRequired: false,
        ...(report.retryAfterMs !== undefined ? { retryAfterMs: report.retryAfterMs } : {}),
      };
    case "auth_required":
      return { action: "reauthorize", automatic: false, userActionRequired: true };
    case "consent_expired":
      return { action: "renew_consent", automatic: false, userActionRequired: true };
  }
}

export function healthReportFromConnectorError(error: ConnectorError, checkedAt: string): ConnectorHealthReport {
  const base = {
    checkedAt,
    detail: error.message,
    ...(error.retryAfterMs !== undefined ? { retryAfterMs: error.retryAfterMs } : {}),
  };

  switch (error.code) {
    case "AUTH":
      return { state: "auth_required", ...base };
    case "CONSENT":
      return { state: "consent_expired", ...base };
    case "RATE_LIMIT":
      return { state: "degraded", ...base };
    case "UPSTREAM":
      return { state: "api_down", ...base };
    case "INVALID_RESPONSE":
      return { state: "degraded", ...base };
    case "CONFIGURATION":
    case "UNSUPPORTED":
      return { state: "degraded", ...base };
  }
}

export function connectorCanSync(report: ConnectorHealthReport): boolean {
  validateHealthReport(report);
  return report.state === "connected" || report.state === "degraded";
}

const capabilityMethodMap: Record<
  Exclude<ConnectorCapability, "accounts">,
  keyof FinancialConnector
> = {
  balances: "getBalances",
  transactions: "getTransactions",
  positions: "getPositions",
  investment_activities: "getInvestmentActivities",
  portfolio_snapshots: "getPortfolioSnapshots",
};

export function validateConnectorDescriptor(descriptor: ConnectorDescriptor): void {
  if (!descriptor.connectorId.trim()) throw new ConnectorError("connectorId is required", "CONFIGURATION", false);
  if (!descriptor.institutionId.trim()) throw new ConnectorError("institutionId is required", "CONFIGURATION", false);
  if (!descriptor.displayName.trim()) throw new ConnectorError("displayName is required", "CONFIGURATION", false);
  if (!descriptor.version.trim()) throw new ConnectorError("connector version is required", "CONFIGURATION", false);
  if (descriptor.dataAccess !== "read_only") {
    throw new ConnectorError("MVP connectors must be read-only", "CONFIGURATION", false);
  }
  if (!descriptor.capabilities.includes("accounts")) {
    throw new ConnectorError("Every connector must expose accounts", "CONFIGURATION", false);
  }
  if (new Set(descriptor.capabilities).size !== descriptor.capabilities.length) {
    throw new ConnectorError("Connector capabilities cannot contain duplicates", "CONFIGURATION", false);
  }
}

export function connectorSupports(
  connector: Pick<FinancialConnector, "descriptor">,
  capability: ConnectorCapability,
): boolean {
  return connector.descriptor.capabilities.includes(capability);
}

export function assertConnectorSupports(
  connector: Pick<FinancialConnector, "descriptor">,
  capability: ConnectorCapability,
): void {
  if (!connectorSupports(connector, capability)) {
    throw new ConnectorError(
      `Connector ${connector.descriptor.connectorId} does not support ${capability}`,
      "UNSUPPORTED",
      false,
    );
  }
}

export function validateConnectorContract(connector: FinancialConnector): void {
  validateConnectorDescriptor(connector.descriptor);

  for (const capability of connector.descriptor.capabilities) {
    if (capability === "accounts") continue;
    const method = capabilityMethodMap[capability];
    if (typeof connector[method] !== "function") {
      throw new ConnectorError(
        `Connector declares ${capability} but does not implement ${String(method)}`,
        "CONFIGURATION",
        false,
      );
    }
  }
}


export const CONNECTOR_CAPABILITIES: readonly ConnectorCapability[] = Object.freeze([
  "accounts",
  "balances",
  "transactions",
  "positions",
  "investment_activities",
  "portfolio_snapshots",
]);

export interface ConnectorCapabilityMatrixRow {
  connectorId: string;
  institutionId: string;
  displayName: string;
  version: string;
  environment: ConnectorEnvironment;
  accessMode: ConnectorAccessMode;
  capabilities: Readonly<Record<ConnectorCapability, boolean>>;
}

function capabilityFlags(descriptor: ConnectorDescriptor): Readonly<Record<ConnectorCapability, boolean>> {
  return Object.freeze(
    Object.fromEntries(
      CONNECTOR_CAPABILITIES.map((capability) => [
        capability,
        descriptor.capabilities.includes(capability),
      ]),
    ) as Record<ConnectorCapability, boolean>,
  );
}

export function buildConnectorCapabilityMatrix(
  descriptors: readonly ConnectorDescriptor[],
): readonly ConnectorCapabilityMatrixRow[] {
  const seen = new Set<string>();

  const rows = descriptors.map((descriptor) => {
    validateConnectorDescriptor(descriptor);
    const key = `${descriptor.connectorId}::${descriptor.environment}`;
    if (seen.has(key)) {
      throw new ConnectorError(
        `Duplicate connector descriptor for ${key}`,
        "CONFIGURATION",
        false,
      );
    }
    seen.add(key);

    return {
      connectorId: descriptor.connectorId,
      institutionId: descriptor.institutionId,
      displayName: descriptor.displayName,
      version: descriptor.version,
      environment: descriptor.environment,
      accessMode: descriptor.accessMode,
      capabilities: capabilityFlags(descriptor),
    };
  });

  return Object.freeze(
    rows.sort(
      (a, b) =>
        a.institutionId.localeCompare(b.institutionId) ||
        a.connectorId.localeCompare(b.connectorId) ||
        a.environment.localeCompare(b.environment),
    ),
  );
}

export function findConnectorsSupporting(
  matrix: readonly ConnectorCapabilityMatrixRow[],
  requiredCapabilities: readonly ConnectorCapability[],
  environment?: ConnectorEnvironment,
): readonly ConnectorCapabilityMatrixRow[] {
  return matrix.filter(
    (row) =>
      (environment === undefined || row.environment === environment) &&
      requiredCapabilities.every((capability) => row.capabilities[capability]),
  );
}


export interface ConnectorSyncCheckpoint {
  resource: ConnectorCapability;
  cursor?: string;
  updatedAt: string;
}

export interface ConnectorSyncCheckpointStore {
  load(ctx: ConnectorContext, resource: ConnectorCapability): Promise<ConnectorSyncCheckpoint | null>;
  save(ctx: ConnectorContext, checkpoint: ConnectorSyncCheckpoint): Promise<void>;
}

export interface SyncBatchMetadata {
  resource: ConnectorCapability;
  idempotencyKey: string;
  requestCursor?: string;
  nextCursor?: string;
  checkpointCursor?: string;
}

export interface ConnectorSyncSink {
  writeAccounts(
    ctx: ConnectorContext,
    items: readonly FinancialAccount[],
    metadata: SyncBatchMetadata,
  ): Promise<void>;
  writeBalances(
    ctx: ConnectorContext,
    items: readonly BalanceRecord[],
    metadata: SyncBatchMetadata,
  ): Promise<void>;
  writeTransactions(
    ctx: ConnectorContext,
    items: readonly FinancialTransaction[],
    metadata: SyncBatchMetadata,
  ): Promise<void>;
  writePositions(
    ctx: ConnectorContext,
    items: readonly Position[],
    metadata: SyncBatchMetadata,
  ): Promise<void>;
  writeInvestmentActivities(
    ctx: ConnectorContext,
    items: readonly InvestmentActivity[],
    metadata: SyncBatchMetadata,
  ): Promise<void>;
  writePortfolioSnapshots(
    ctx: ConnectorContext,
    items: readonly PortfolioSnapshot[],
    metadata: SyncBatchMetadata,
  ): Promise<void>;
}

export interface ConnectorSyncRequest {
  resources?: readonly ConnectorCapability[];
  resetCursor?: boolean;
  maxPagesPerResource?: number;
}

export interface ConnectorSyncResourceResult {
  resource: ConnectorCapability;
  pages: number;
  items: number;
  truncated: boolean;
  checkpointCursor?: string;
}

export interface ConnectorSyncResult {
  connectorId: string;
  resources: readonly ConnectorSyncResourceResult[];
}

function syncHash(value: string): string {
  let hash = 0xcbf29ce484222325n;
  const prime = 0x100000001b3n;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= BigInt(value.charCodeAt(index));
    hash = BigInt.asUintN(64, hash * prime);
  }
  return hash.toString(16).padStart(16, "0");
}

function canonicalizeSyncValue(value: unknown): string {
  if (typeof value === "bigint") return `bigint:${value.toString()}`;
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (typeof value !== "object") return JSON.stringify(value);

  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalizeSyncValue(item)).join(",")}]`;
  }

  const entries = Object.entries(value as Record<string, unknown>)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, nested]) => `${JSON.stringify(key)}:${canonicalizeSyncValue(nested)}`);
  return `{${entries.join(",")}}`;
}

export function buildSyncIdempotencyKey(
  ctx: ConnectorContext,
  connectorId: string,
  resource: ConnectorCapability,
  requestCursor: string | undefined,
  items: readonly unknown[],
): string {
  const canonicalItems = items.map((item) => canonicalizeSyncValue(item)).sort();
  const canonical = [
    "sync1",
    ctx.tenantId,
    ctx.connectionId,
    connectorId,
    resource,
    requestCursor ?? "root",
    ...canonicalItems,
  ].join("|");
  return `sync1_${syncHash(canonical)}`;
}

function syncMetadata(
  ctx: ConnectorContext,
  connectorId: string,
  resource: ConnectorCapability,
  requestCursor: string | undefined,
  items: readonly unknown[],
  nextCursor?: string,
  checkpointCursor?: string,
): SyncBatchMetadata {
  return {
    resource,
    idempotencyKey: buildSyncIdempotencyKey(ctx, connectorId, resource, requestCursor, items),
    ...(requestCursor !== undefined ? { requestCursor } : {}),
    ...(nextCursor !== undefined ? { nextCursor } : {}),
    ...(checkpointCursor !== undefined ? { checkpointCursor } : {}),
  };
}

function checkpointAfterPage(
  resource: ConnectorCapability,
  now: string,
  nextCursor?: string,
  checkpointCursor?: string,
): ConnectorSyncCheckpoint {
  const cursor = nextCursor ?? checkpointCursor;
  return {
    resource,
    ...(cursor !== undefined ? { cursor } : {}),
    updatedAt: now,
  };
}

export class ConnectorSyncEngine {
  constructor(
    private readonly checkpointStore: ConnectorSyncCheckpointStore,
    private readonly sink: ConnectorSyncSink,
    private readonly now: () => string = () => new Date().toISOString(),
  ) {}

  async sync(
    connector: FinancialConnector,
    ctx: ConnectorContext,
    request: ConnectorSyncRequest = {},
  ): Promise<ConnectorSyncResult> {
    validateConnectorContract(connector);
    if (!ctx.tenantId.trim() || !ctx.connectionId.trim()) {
      throw new ConnectorError("Sync context requires tenantId and connectionId", "CONFIGURATION", false);
    }

    const resources = request.resources ?? connector.descriptor.capabilities;
    for (const resource of resources) assertConnectorSupports(connector, resource);

    const maxPages = request.maxPagesPerResource ?? 10;
    if (!Number.isInteger(maxPages) || maxPages < 1 || maxPages > 100) {
      throw new ConnectorError("maxPagesPerResource must be an integer from 1 to 100", "CONFIGURATION", false);
    }

    const results: ConnectorSyncResourceResult[] = [];
    for (const resource of resources) {
      results.push(await this.syncResource(connector, ctx, resource, request.resetCursor === true, maxPages));
    }

    return { connectorId: connector.descriptor.connectorId, resources: results };
  }

  private async syncResource(
    connector: FinancialConnector,
    ctx: ConnectorContext,
    resource: ConnectorCapability,
    resetCursor: boolean,
    maxPages: number,
  ): Promise<ConnectorSyncResourceResult> {
    if (resource === "accounts") {
      const items = await connector.getAccounts(ctx);
      const metadata = syncMetadata(ctx, connector.descriptor.connectorId, resource, undefined, items);
      if (items.length > 0) await this.sink.writeAccounts(ctx, items, metadata);
      const checkpoint = checkpointAfterPage(resource, this.now());
      await this.checkpointStore.save(ctx, checkpoint);
      return { resource, pages: 1, items: items.length, truncated: false };
    }

    if (resource === "balances") {
      if (!connector.getBalances) throw new ConnectorError("getBalances is not implemented", "CONFIGURATION", false);
      const items = await connector.getBalances(ctx);
      const metadata = syncMetadata(ctx, connector.descriptor.connectorId, resource, undefined, items);
      if (items.length > 0) await this.sink.writeBalances(ctx, items, metadata);
      const checkpoint = checkpointAfterPage(resource, this.now());
      await this.checkpointStore.save(ctx, checkpoint);
      return { resource, pages: 1, items: items.length, truncated: false };
    }

    const previous = resetCursor ? null : await this.checkpointStore.load(ctx, resource);
    let requestCursor = previous?.cursor;
    let pages = 0;
    let itemCount = 0;
    let lastCheckpointCursor: string | undefined = previous?.cursor;
    const seenPageCursors = new Set<string>();
    let truncated = false;

    while (pages < maxPages) {
      if (requestCursor !== undefined) {
        if (seenPageCursors.has(requestCursor)) {
          throw new ConnectorError("Connector pagination cursor repeated in the same run", "INVALID_RESPONSE", false);
        }
        seenPageCursors.add(requestCursor);
      }

      const page = await this.fetchPage(connector, ctx, resource, requestCursor);
      const metadata = syncMetadata(
        ctx,
        connector.descriptor.connectorId,
        resource,
        requestCursor,
        page.items,
        page.nextCursor,
        page.checkpointCursor,
      );

      if (page.items.length > 0) {
        await this.writePage(resource, ctx, page.items, metadata);
      }

      pages += 1;
      itemCount += page.items.length;

      const checkpoint = checkpointAfterPage(
        resource,
        this.now(),
        page.nextCursor,
        page.nextCursor === undefined ? page.checkpointCursor : undefined,
      );
      await this.checkpointStore.save(ctx, checkpoint);
      lastCheckpointCursor = checkpoint.cursor;

      if (!page.nextCursor) {
        truncated = false;
        break;
      }

      requestCursor = page.nextCursor;
      if (pages >= maxPages) truncated = true;
    }

    return {
      resource,
      pages,
      items: itemCount,
      truncated,
      ...(lastCheckpointCursor !== undefined ? { checkpointCursor: lastCheckpointCursor } : {}),
    };
  }

  private async fetchPage(
    connector: FinancialConnector,
    ctx: ConnectorContext,
    resource: Exclude<ConnectorCapability, "accounts" | "balances">,
    cursor?: string,
  ): Promise<ConnectorPage<FinancialTransaction | Position | InvestmentActivity | PortfolioSnapshot>> {
    switch (resource) {
      case "transactions":
        if (!connector.getTransactions) throw new ConnectorError("getTransactions is not implemented", "CONFIGURATION", false);
        return connector.getTransactions(ctx, cursor);
      case "positions":
        if (!connector.getPositions) throw new ConnectorError("getPositions is not implemented", "CONFIGURATION", false);
        return connector.getPositions(ctx, cursor);
      case "investment_activities":
        if (!connector.getInvestmentActivities) {
          throw new ConnectorError("getInvestmentActivities is not implemented", "CONFIGURATION", false);
        }
        return connector.getInvestmentActivities(ctx, cursor);
      case "portfolio_snapshots":
        if (!connector.getPortfolioSnapshots) {
          throw new ConnectorError("getPortfolioSnapshots is not implemented", "CONFIGURATION", false);
        }
        return connector.getPortfolioSnapshots(ctx, cursor);
    }
  }

  private async writePage(
    resource: Exclude<ConnectorCapability, "accounts" | "balances">,
    ctx: ConnectorContext,
    items: readonly (FinancialTransaction | Position | InvestmentActivity | PortfolioSnapshot)[],
    metadata: SyncBatchMetadata,
  ): Promise<void> {
    switch (resource) {
      case "transactions":
        return this.sink.writeTransactions(ctx, items as readonly FinancialTransaction[], metadata);
      case "positions":
        return this.sink.writePositions(ctx, items as readonly Position[], metadata);
      case "investment_activities":
        return this.sink.writeInvestmentActivities(ctx, items as readonly InvestmentActivity[], metadata);
      case "portfolio_snapshots":
        return this.sink.writePortfolioSnapshots(ctx, items as readonly PortfolioSnapshot[], metadata);
    }
  }
}
