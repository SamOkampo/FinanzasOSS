import type {
  CurrencyCode,
  Money,
  Portfolio,
  PortfolioMetrics,
} from "./index.js";

export type PortfolioAggregationIssue =
  | "missing_metrics"
  | "currency_mismatch"
  | "metrics_incomplete";

export interface PortfolioAggregationEntry {
  portfolioId: string;
  name: string;
  status: Portfolio["status"];
  includedInTotal: boolean;
  issue: PortfolioAggregationIssue | null;
  totalValue: Money | null;
  netContributions: Money | null;
  netPerformance: Money | null;
}

export interface PortfolioWealthAggregation {
  reportingCurrency: CurrencyCode;
  totalValue: Money;
  netContributions: Money;
  netPerformance: Money;
  entries: readonly PortfolioAggregationEntry[];
  includedPortfolioIds: readonly string[];
  excludedPortfolioIds: readonly string[];
  incompletePortfolioIds: readonly string[];
  isComplete: boolean;
}

export interface AggregatePortfolioWealthInput {
  reportingCurrency: CurrencyCode;
  portfolios: readonly Portfolio[];
  metrics: readonly PortfolioMetrics[];
}

function money(amountMinor: bigint, currency: CurrencyCode): Money {
  return Object.freeze({ amountMinor, currency });
}

export function aggregatePortfolioWealth(
  input: AggregatePortfolioWealthInput,
): PortfolioWealthAggregation {
  const reportingCurrency = input.reportingCurrency.trim().toUpperCase();
  if (!reportingCurrency) throw new Error("reportingCurrency is required");

  const metricByPortfolio = new Map<string, PortfolioMetrics>();
  for (const metric of input.metrics) {
    if (metricByPortfolio.has(metric.portfolioId)) {
      throw new Error(`Duplicate metrics for portfolio: ${metric.portfolioId}`);
    }
    metricByPortfolio.set(metric.portfolioId, metric);
  }

  let totalValueMinor = 0n;
  let netContributionsMinor = 0n;
  let netPerformanceMinor = 0n;
  const entries: PortfolioAggregationEntry[] = [];
  const includedPortfolioIds: string[] = [];
  const excludedPortfolioIds: string[] = [];
  const incompletePortfolioIds: string[] = [];

  for (const portfolio of input.portfolios) {
    if (portfolio.status === "archived") {
      entries.push(Object.freeze({
        portfolioId: portfolio.id,
        name: portfolio.name,
        status: portfolio.status,
        includedInTotal: false,
        issue: null,
        totalValue: null,
        netContributions: null,
        netPerformance: null,
      }));
      continue;
    }

    const metric = metricByPortfolio.get(portfolio.id);
    if (!metric) {
      excludedPortfolioIds.push(portfolio.id);
      incompletePortfolioIds.push(portfolio.id);
      entries.push(Object.freeze({
        portfolioId: portfolio.id,
        name: portfolio.name,
        status: portfolio.status,
        includedInTotal: false,
        issue: "missing_metrics" as const,
        totalValue: null,
        netContributions: null,
        netPerformance: null,
      }));
      continue;
    }

    const metricCurrency = metric.baseCurrency.toUpperCase();
    const portfolioCurrency = portfolio.baseCurrency.toUpperCase();
    if (metricCurrency !== reportingCurrency || portfolioCurrency !== reportingCurrency) {
      excludedPortfolioIds.push(portfolio.id);
      entries.push(Object.freeze({
        portfolioId: portfolio.id,
        name: portfolio.name,
        status: portfolio.status,
        includedInTotal: false,
        issue: "currency_mismatch" as const,
        totalValue: metric.totalValue,
        netContributions: metric.netContributions,
        netPerformance: metric.netPerformance,
      }));
      continue;
    }

    includedPortfolioIds.push(portfolio.id);
    totalValueMinor += metric.totalValue.amountMinor;
    netContributionsMinor += metric.netContributions.amountMinor;
    netPerformanceMinor += metric.netPerformance.amountMinor;

    const issue = metric.completeness.isComplete ? null : "metrics_incomplete" as const;
    if (issue) incompletePortfolioIds.push(portfolio.id);

    entries.push(Object.freeze({
      portfolioId: portfolio.id,
      name: portfolio.name,
      status: portfolio.status,
      includedInTotal: true,
      issue,
      totalValue: metric.totalValue,
      netContributions: metric.netContributions,
      netPerformance: metric.netPerformance,
    }));
  }

  return Object.freeze({
    reportingCurrency,
    totalValue: money(totalValueMinor, reportingCurrency),
    netContributions: money(netContributionsMinor, reportingCurrency),
    netPerformance: money(netPerformanceMinor, reportingCurrency),
    entries: Object.freeze(entries),
    includedPortfolioIds: Object.freeze(includedPortfolioIds),
    excludedPortfolioIds: Object.freeze(excludedPortfolioIds),
    incompletePortfolioIds: Object.freeze(incompletePortfolioIds),
    isComplete: excludedPortfolioIds.length === 0 && incompletePortfolioIds.length === 0,
  });
}
