import type {
  FinancialAccount,
  FinancialTransaction,
  InvestmentActivity,
  Money,
  PortfolioSnapshot,
  Position,
} from "../../finance-core/src/index.js";

export type ConnectorCapability =
  | "accounts"
  | "balances"
  | "transactions"
  | "positions"
  | "investment_activities"
  | "portfolio_snapshots"
  | "cards"
  | "payments";

export type ConnectionHealth = "connected" | "degraded" | "auth_required" | "consent_expired" | "api_down" | "syncing";
export type ConnectorAccessMode = "oauth" | "read_only_api_key" | "public_address" | "statement_import" | "aggregator";

export interface ConnectorContext {
  tenantId: string;
  connectionId: string;
}

export interface ConsentRequest {
  redirectUri: string;
  requestedCapabilities: readonly ConnectorCapability[];
}

export interface ConsentStart {
  authorizationUrl: string;
  stateReference: string;
  expiresAt: string;
}

export interface TransactionPage {
  items: FinancialTransaction[];
  nextCursor?: string;
}

export interface InvestmentActivityPage {
  items: InvestmentActivity[];
  nextCursor?: string;
}

export interface PositionPage {
  items: Position[];
  nextCursor?: string;
}

export interface BalanceRecord {
  accountExternalId: string;
  available?: Money;
  current: Money;
  asOf: string;
}

export interface FinancialConnector {
  readonly institutionId: string;
  readonly accessMode: ConnectorAccessMode;
  readonly capabilities: ReadonlySet<ConnectorCapability>;
  createConsent?(ctx: ConnectorContext, request: ConsentRequest): Promise<ConsentStart>;
  getAccounts(ctx: ConnectorContext): Promise<FinancialAccount[]>;
  getBalances?(ctx: ConnectorContext): Promise<BalanceRecord[]>;
  getTransactions?(ctx: ConnectorContext, cursor?: string): Promise<TransactionPage>;
  getPositions?(ctx: ConnectorContext, cursor?: string): Promise<PositionPage>;
  getInvestmentActivities?(ctx: ConnectorContext, cursor?: string): Promise<InvestmentActivityPage>;
  getPortfolioSnapshots?(ctx: ConnectorContext, cursor?: string): Promise<{ items: PortfolioSnapshot[]; nextCursor?: string }>;
  revokeConsent?(ctx: ConnectorContext): Promise<void>;
  healthCheck(ctx: ConnectorContext): Promise<ConnectionHealth>;
}

export class ConnectorError extends Error {
  constructor(
    message: string,
    readonly code: "AUTH" | "CONSENT" | "RATE_LIMIT" | "UPSTREAM" | "INVALID_RESPONSE" | "UNSUPPORTED",
    readonly retryable: boolean,
  ) {
    super(message);
    this.name = "ConnectorError";
  }
}
