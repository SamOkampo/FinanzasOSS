import type {
  FinancialAccount,
  FinancialConnection,
  Portfolio,
} from "../../finance-core/src/index.js";
import type { TenantContext } from "./index.js";
import { assertTenantCollectionOwnership, assertTenantContext } from "./tenant-isolation.js";

export interface TenantWorkspacePortfolioView {
  portfolioId: string;
  accountIds: readonly string[];
  connectionIds: readonly string[];
}

export interface TenantWorkspace {
  tenantId: string;
  connectionIds: readonly string[];
  portfolioIds: readonly string[];
  portfolios: readonly TenantWorkspacePortfolioView[];
  unassignedInvestmentAccountIds: readonly string[];
}

function assertUniqueIds(items: readonly { id: string }[], label: string): void {
  const seen = new Set<string>();
  for (const item of items) {
    if (!item.id.trim()) throw new Error(`${label} id is required`);
    if (seen.has(item.id)) throw new Error(`Duplicate ${label} id: ${item.id}`);
    seen.add(item.id);
  }
}

export function buildTenantWorkspace(input: {
  ctx: TenantContext;
  connections: readonly FinancialConnection[];
  accounts: readonly FinancialAccount[];
  portfolios: readonly Portfolio[];
}): TenantWorkspace {
  const { ctx, connections, accounts, portfolios } = input;
  assertTenantContext(ctx);
  assertTenantCollectionOwnership(ctx, connections, "connection");
  assertTenantCollectionOwnership(ctx, accounts, "account");
  assertTenantCollectionOwnership(ctx, portfolios, "portfolio");

  assertUniqueIds(connections, "connection");
  assertUniqueIds(accounts, "account");
  assertUniqueIds(portfolios, "portfolio");

  const connectionById = new Map(connections.map((connection) => [connection.id, connection] as const));
  const accountById = new Map(accounts.map((account) => [account.id, account] as const));

  for (const account of accounts) {
    const connection = connectionById.get(account.connectionId);
    if (!connection) throw new Error(`Account ${account.id} references an unknown connection`);
    if (connection.tenantId !== ctx.tenantId) {
      throw new Error(`Account ${account.id} references a cross-tenant connection`);
    }
  }

  const assignedAccountIds = new Set<string>();
  const portfolioViews = portfolios.map((portfolio) => {
    const connectionIds = new Set<string>();

    for (const accountId of portfolio.accountIds) {
      const account = accountById.get(accountId);
      if (!account) throw new Error(`Portfolio ${portfolio.id} references an unknown account`);
      if (account.domain !== "investment" && account.domain !== "crypto") {
        throw new Error(`Portfolio ${portfolio.id} can only include investment/crypto accounts`);
      }
      assignedAccountIds.add(account.id);
      connectionIds.add(account.connectionId);
    }

    return Object.freeze({
      portfolioId: portfolio.id,
      accountIds: Object.freeze([...portfolio.accountIds]),
      connectionIds: Object.freeze([...connectionIds].sort()),
    });
  });

  const unassignedInvestmentAccountIds = accounts
    .filter(
      (account) =>
        (account.domain === "investment" || account.domain === "crypto") &&
        !assignedAccountIds.has(account.id),
    )
    .map((account) => account.id)
    .sort();

  return Object.freeze({
    tenantId: ctx.tenantId,
    connectionIds: Object.freeze(connections.map((connection) => connection.id).sort()),
    portfolioIds: Object.freeze(portfolios.map((portfolio) => portfolio.id).sort()),
    portfolios: Object.freeze(portfolioViews),
    unassignedInvestmentAccountIds: Object.freeze(unassignedInvestmentAccountIds),
  });
}

export const multiConnectionPortfolioPolicy = Object.freeze({
  multipleConnectionsAllowedPerTenant: true,
  multiplePortfoliosAllowedPerTenant: true,
  relationshipsMustBeDerivedFromExplicitAccounts: true,
  implicitCrossTenantAggregationAllowed: false,
  implicitFxConversionAllowed: false,
  readOnlyPortfolioSemanticsPreserved: true,
});
