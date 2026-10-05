import type { PortfolioWealthAggregation } from "./portfolio-aggregation.js";

export interface DashboardCashBalance {
  accountId: string;
  amountMinor: bigint;
  currency: string;
}

export interface DashboardCreditLiability {
  accountId: string;
  outstandingMinor: bigint;
  currency: string;
}

export interface NetWorthDashboard {
  reportingCurrency: string;
  cashAssetsMinor: bigint;
  investmentAssetsMinor: bigint;
  totalAssetsMinor: bigint;
  creditLiabilitiesMinor: bigint;
  netWorthMinor: bigint;
  excludedCashAccountIds: readonly string[];
  excludedCreditAccountIds: readonly string[];
  portfolioComplete: boolean;
  isComplete: boolean;
  creditLimitIncludedAsAsset: false;
  reasons: readonly string[];
}

export function buildNetWorthDashboard(input: {
  reportingCurrency: string;
  cashBalances: readonly DashboardCashBalance[];
  creditLiabilities: readonly DashboardCreditLiability[];
  portfolioWealth: PortfolioWealthAggregation;
}): NetWorthDashboard {
  const reportingCurrency = input.reportingCurrency.trim().toUpperCase();
  if (!reportingCurrency) throw new Error("reportingCurrency is required");
  if (input.portfolioWealth.reportingCurrency.toUpperCase() !== reportingCurrency) {
    throw new Error("portfolio wealth reporting currency mismatch");
  }

  let cashAssetsMinor = 0n;
  let creditLiabilitiesMinor = 0n;
  const excludedCashAccountIds: string[] = [];
  const excludedCreditAccountIds: string[] = [];

  for (const balance of input.cashBalances) {
    if (balance.amountMinor < 0n) throw new Error("Cash balance cannot be negative");
    if (balance.currency.trim().toUpperCase() !== reportingCurrency) {
      excludedCashAccountIds.push(balance.accountId);
      continue;
    }
    cashAssetsMinor += balance.amountMinor;
  }

  for (const liability of input.creditLiabilities) {
    if (liability.outstandingMinor < 0n) throw new Error("Credit liability cannot be negative");
    if (liability.currency.trim().toUpperCase() !== reportingCurrency) {
      excludedCreditAccountIds.push(liability.accountId);
      continue;
    }
    creditLiabilitiesMinor += liability.outstandingMinor;
  }

  const investmentAssetsMinor = input.portfolioWealth.totalValue.amountMinor;
  const totalAssetsMinor = cashAssetsMinor + investmentAssetsMinor;
  const netWorthMinor = totalAssetsMinor - creditLiabilitiesMinor;
  const isComplete =
    excludedCashAccountIds.length === 0 &&
    excludedCreditAccountIds.length === 0 &&
    input.portfolioWealth.isComplete;

  return {
    reportingCurrency,
    cashAssetsMinor,
    investmentAssetsMinor,
    totalAssetsMinor,
    creditLiabilitiesMinor,
    netWorthMinor,
    excludedCashAccountIds,
    excludedCreditAccountIds,
    portfolioComplete: input.portfolioWealth.isComplete,
    isComplete,
    creditLimitIncludedAsAsset: false,
    reasons: [
      "cash and investment market value are assets",
      "outstanding credit liability is subtracted from assets",
      "credit limit is never treated as an asset",
      "currency mismatches are excluded rather than implicitly converted",
    ],
  };
}
