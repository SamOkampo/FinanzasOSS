import type {
  Asset,
  FinancialAccount,
  FinancialBalance,
  FinancialConnection,
  FinancialConsent,
  FinancialTransaction,
  InvestmentActivity,
  Portfolio,
  PortfolioSnapshot,
  Position,
} from "../../finance-core/src/index.js";

export interface TenantContext {
  tenantId: string;
  actorId: string;
}

export interface ConnectionRepository {
  upsert(ctx: TenantContext, connection: FinancialConnection): Promise<void>;
  getById(ctx: TenantContext, connectionId: string): Promise<FinancialConnection | null>;
  list(ctx: TenantContext): Promise<FinancialConnection[]>;
}

export interface ConsentRepository {
  upsert(ctx: TenantContext, consent: FinancialConsent): Promise<void>;
  getByConnection(ctx: TenantContext, connectionId: string): Promise<FinancialConsent | null>;
}

export interface AccountRepository {
  upsertMany(ctx: TenantContext, accounts: readonly FinancialAccount[]): Promise<number>;
  getById(ctx: TenantContext, accountId: string): Promise<FinancialAccount | null>;
  listByConnection(ctx: TenantContext, connectionId: string): Promise<FinancialAccount[]>;
}

export interface BalanceRepository {
  upsertMany(ctx: TenantContext, balances: readonly FinancialBalance[]): Promise<number>;
  getLatestByAccount(ctx: TenantContext, accountId: string): Promise<FinancialBalance | null>;
}

export interface TransactionRepository {
  upsertMany(ctx: TenantContext, transactions: readonly FinancialTransaction[]): Promise<number>;
  listByAccount(ctx: TenantContext, accountId: string): Promise<FinancialTransaction[]>;
  findByExternalId(
    ctx: TenantContext,
    connectionId: string,
    externalId: string,
  ): Promise<FinancialTransaction | null>;
  findCandidatesByFingerprint(
    ctx: TenantContext,
    fingerprint: string,
  ): Promise<FinancialTransaction[]>;
}

export interface PortfolioRepository {
  upsert(ctx: TenantContext, portfolio: Portfolio): Promise<void>;
  getById(ctx: TenantContext, portfolioId: string): Promise<Portfolio | null>;
  list(ctx: TenantContext): Promise<Portfolio[]>;
}

export interface AssetRepository {
  upsertMany(ctx: TenantContext, assets: readonly Asset[]): Promise<number>;
  getById(ctx: TenantContext, assetId: string): Promise<Asset | null>;
}

export interface PositionRepository {
  replaceSnapshot(
    ctx: TenantContext,
    portfolioId: string,
    asOf: string,
    positions: readonly Position[],
  ): Promise<number>;
  listLatestByPortfolio(ctx: TenantContext, portfolioId: string): Promise<Position[]>;
}

export interface InvestmentActivityRepository {
  upsertMany(ctx: TenantContext, activities: readonly InvestmentActivity[]): Promise<number>;
  listByPortfolio(ctx: TenantContext, portfolioId: string): Promise<InvestmentActivity[]>;
}

export interface PortfolioSnapshotRepository {
  upsert(ctx: TenantContext, snapshot: PortfolioSnapshot): Promise<void>;
  listByPortfolio(ctx: TenantContext, portfolioId: string): Promise<PortfolioSnapshot[]>;
}

export interface SyncCheckpoint {
  tenantId: string;
  connectionId: string;
  resource: "accounts" | "balances" | "transactions" | "positions" | "investment_activities" | "portfolio_snapshots";
  cursor?: string;
  updatedAt: string;
}
