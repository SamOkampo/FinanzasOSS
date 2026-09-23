import type {
  FinancialAccount,
  FinancialBalance,
  FinancialConnection,
  FinancialConsent,
  FinancialTransaction,
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
}

export interface SyncCheckpoint {
  tenantId: string;
  connectionId: string;
  resource: "accounts" | "balances" | "transactions" | "positions" | "investment_activities" | "portfolio_snapshots";
  cursor?: string;
  updatedAt: string;
}
