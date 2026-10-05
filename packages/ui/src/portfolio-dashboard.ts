import {
  assertPortfolioAccountMembership,
  derivePortfolioMetrics,
  type Asset,
  type FinancialAccount,
  type InvestmentActivity,
  type Portfolio,
  type PortfolioMetrics,
  type PortfolioSnapshot,
  type Position,
} from "../../finance-core/src/index.js";

export interface PortfolioAccountSummary {
  accountId: string;
  institutionId: string;
  name: string;
  domain: "investment" | "crypto";
  currency: string;
}

export interface PortfolioPositionSummary {
  positionId: string;
  assetId: string;
  assetName: string;
  symbol?: string;
  quantity: string;
  marketValueMinor?: bigint;
  marketValueCurrency?: string;
  asOf: string;
}

export interface PortfolioDashboardModel {
  portfolioId: string;
  name: string;
  baseCurrency: string;
  status: "active" | "archived";
  readOnly: true;
  accounts: readonly PortfolioAccountSummary[];
  positions: readonly PortfolioPositionSummary[];
  metrics: PortfolioMetrics;
  warnings: readonly string[];
}

export interface BuildPortfolioDashboardInput {
  portfolio: Portfolio;
  accounts: readonly FinancialAccount[];
  assets: readonly Asset[];
  positions: readonly Position[];
  activities: readonly InvestmentActivity[];
  snapshot?: PortfolioSnapshot;
  asOf: string;
}

export function buildPortfolioDashboardModel(input: BuildPortfolioDashboardInput): PortfolioDashboardModel {
  const { portfolio, accounts, assets, positions, activities, snapshot, asOf } = input;
  const accountsById = new Map(accounts.map((account) => [account.id, account]));
  const assetsById = new Map(assets.map((asset) => [asset.id, asset]));

  const accountSummaries = portfolio.accountIds.map((accountId) => {
    const account = accountsById.get(accountId);
    if (!account) throw new Error(`Missing portfolio account: ${accountId}`);
    assertPortfolioAccountMembership(portfolio, account);
    return Object.freeze({
      accountId: account.id,
      institutionId: account.institutionId,
      name: account.name,
      domain: account.domain as "investment" | "crypto",
      currency: account.currency,
    });
  });

  const positionSummaries = positions.map((position) => {
    if (position.portfolioId !== portfolio.id) throw new Error("Position portfolio mismatch");
    const account = accountsById.get(position.accountId);
    if (!account) throw new Error(`Missing position account: ${position.accountId}`);
    assertPortfolioAccountMembership(portfolio, account);
    const asset = assetsById.get(position.assetId);
    if (!asset || asset.tenantId !== portfolio.tenantId) throw new Error(`Missing portfolio asset: ${position.assetId}`);

    return Object.freeze({
      positionId: position.id,
      assetId: asset.id,
      assetName: asset.name,
      ...(asset.symbol ? { symbol: asset.symbol } : {}),
      quantity: position.quantity,
      ...(position.marketValue
        ? {
            marketValueMinor: position.marketValue.amountMinor,
            marketValueCurrency: position.marketValue.currency,
          }
        : {}),
      asOf: position.asOf,
    });
  });

  const metrics = derivePortfolioMetrics({ portfolio, positions, activities, ...(snapshot ? { snapshot } : {}), asOf });
  const warnings: string[] = [];
  if (!metrics.completeness.isComplete) warnings.push("Portfolio totals are incomplete; missing values are excluded.");
  if (metrics.completeness.excludedCurrencies.length > 0) {
    warnings.push("Some values use currencies without an explicit conversion to the portfolio base currency.");
  }
  if (metrics.completeness.positionsWithoutMarketValue > 0) {
    warnings.push("Some positions do not have a market value.");
  }

  return Object.freeze({
    portfolioId: portfolio.id,
    name: portfolio.name,
    baseCurrency: portfolio.baseCurrency,
    status: portfolio.status,
    readOnly: true as const,
    accounts: Object.freeze(accountSummaries),
    positions: Object.freeze(positionSummaries),
    metrics,
    warnings: Object.freeze(warnings),
  });
}
