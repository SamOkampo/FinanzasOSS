import type { InvestmentActivity, Money, Portfolio, Position } from "./index.js";

export interface PortfolioAccountingMissing {
  positionsWithoutCostBasis: number;
  positionsWithoutUnrealizedPnl: number;
  sellsWithoutRealizedPnl: number;
  dividendsWithoutCashAmount: number;
  interestWithoutCashAmount: number;
  feesWithoutAmount: number;
  taxesWithoutCashAmount: number;
}

export interface PortfolioAccountingSummary {
  portfolioId: string;
  currency: string;
  costBasis: Money | null;
  realizedPnl: Money | null;
  unrealizedPnl: Money | null;
  dividends: Money | null;
  interest: Money | null;
  fees: Money | null;
  taxes: Money | null;
  missing: PortfolioAccountingMissing;
  excludedCurrencies: readonly string[];
  isComplete: boolean;
}

interface Accumulator {
  total: bigint;
  missing: number;
  currencyMismatch: boolean;
}

function accumulator(): Accumulator {
  return { total: 0n, missing: 0, currencyMismatch: false };
}

function money(amountMinor: bigint, currency: string): Money {
  return Object.freeze({ amountMinor, currency });
}

function addMoney(
  acc: Accumulator,
  value: Money,
  currency: string,
  excludedCurrencies: Set<string>,
  options: { nonNegative?: boolean } = {},
): void {
  const valueCurrency = value.currency.toUpperCase();
  if (options.nonNegative && value.amountMinor < 0n) {
    throw new Error("Portfolio accounting absolute amount cannot be negative");
  }
  if (valueCurrency !== currency) {
    acc.currencyMismatch = true;
    excludedCurrencies.add(valueCurrency);
    return;
  }
  acc.total += value.amountMinor;
}

function finish(acc: Accumulator, currency: string): Money | null {
  return acc.missing > 0 || acc.currencyMismatch ? null : money(acc.total, currency);
}

export function derivePortfolioAccountingSummary(
  portfolio: Portfolio,
  positions: readonly Position[],
  activities: readonly InvestmentActivity[],
): PortfolioAccountingSummary {
  const currency = portfolio.baseCurrency.trim().toUpperCase();
  if (!currency) throw new Error("Portfolio base currency is required");

  const excludedCurrencies = new Set<string>();
  const costBasis = accumulator();
  const unrealizedPnl = accumulator();
  const realizedPnl = accumulator();
  const dividends = accumulator();
  const interest = accumulator();
  const fees = accumulator();
  const taxes = accumulator();

  for (const position of positions) {
    if (position.tenantId !== portfolio.tenantId || position.portfolioId !== portfolio.id) {
      throw new Error("Portfolio accounting position scope mismatch");
    }

    if (position.costBasis) addMoney(costBasis, position.costBasis, currency, excludedCurrencies, { nonNegative: true });
    else costBasis.missing += 1;

    if (position.unrealizedPnl) addMoney(unrealizedPnl, position.unrealizedPnl, currency, excludedCurrencies);
    else unrealizedPnl.missing += 1;
  }

  for (const activity of activities) {
    if (activity.tenantId !== portfolio.tenantId || activity.portfolioId !== portfolio.id) {
      throw new Error("Portfolio accounting activity scope mismatch");
    }

    if (activity.realizedPnl) {
      addMoney(realizedPnl, activity.realizedPnl, currency, excludedCurrencies);
    } else if (activity.kind === "sell") {
      realizedPnl.missing += 1;
    }

    if (activity.kind === "dividend") {
      if (activity.cashAmount) addMoney(dividends, activity.cashAmount, currency, excludedCurrencies, { nonNegative: true });
      else dividends.missing += 1;
    }

    if (activity.kind === "interest") {
      if (activity.cashAmount) addMoney(interest, activity.cashAmount, currency, excludedCurrencies, { nonNegative: true });
      else interest.missing += 1;
    }

    if (activity.kind === "fee") {
      const feeAmount = activity.cashAmount ?? activity.fee;
      if (feeAmount) addMoney(fees, feeAmount, currency, excludedCurrencies, { nonNegative: true });
      else fees.missing += 1;
    } else if (activity.fee) {
      addMoney(fees, activity.fee, currency, excludedCurrencies, { nonNegative: true });
    }

    if (activity.kind === "tax") {
      if (activity.cashAmount) addMoney(taxes, activity.cashAmount, currency, excludedCurrencies, { nonNegative: true });
      else taxes.missing += 1;
    }
  }

  const missing: PortfolioAccountingMissing = Object.freeze({
    positionsWithoutCostBasis: costBasis.missing,
    positionsWithoutUnrealizedPnl: unrealizedPnl.missing,
    sellsWithoutRealizedPnl: realizedPnl.missing,
    dividendsWithoutCashAmount: dividends.missing,
    interestWithoutCashAmount: interest.missing,
    feesWithoutAmount: fees.missing,
    taxesWithoutCashAmount: taxes.missing,
  });

  const excluded = Object.freeze([...excludedCurrencies].sort());
  const summary = {
    portfolioId: portfolio.id,
    currency,
    costBasis: finish(costBasis, currency),
    realizedPnl: finish(realizedPnl, currency),
    unrealizedPnl: finish(unrealizedPnl, currency),
    dividends: finish(dividends, currency),
    interest: finish(interest, currency),
    fees: finish(fees, currency),
    taxes: finish(taxes, currency),
    missing,
    excludedCurrencies: excluded,
  };

  return Object.freeze({
    ...summary,
    isComplete:
      Object.values(missing).every((value) => value === 0) &&
      excluded.length === 0,
  });
}
