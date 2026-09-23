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
  nextCursor?: string;
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
  healthCheck(ctx: ConnectorContext): Promise<ConnectionHealth>;
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
