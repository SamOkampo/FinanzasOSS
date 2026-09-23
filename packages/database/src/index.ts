import type { FinancialTransaction } from "../../finance-core/src/index.js";

export interface TenantContext {
  tenantId: string;
  actorId: string;
}

export interface TransactionRepository {
  upsertMany(ctx: TenantContext, transactions: readonly FinancialTransaction[]): Promise<number>;
  listByAccount(ctx: TenantContext, accountId: string): Promise<FinancialTransaction[]>;
}

export interface SyncCheckpoint {
  connectionId: string;
  resource: "accounts" | "balances" | "transactions";
  cursor?: string;
  updatedAt: string;
}
