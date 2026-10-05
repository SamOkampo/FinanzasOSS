import {
  aggregatePortfolioWealth,
  type AggregatePortfolioWealthInput,
  type PortfolioAggregationIssue,
} from "../../../packages/finance-core/src/portfolio-aggregation.js";

export interface PortfolioCardModel {
  id: string;
  title: string;
  status: "active" | "archived";
  includedInTotal: boolean;
  valueMinor: bigint | null;
  currency: string | null;
  issue: PortfolioAggregationIssue | null;
  valueVisibility: "visible" | "masked";
}

export interface PortfolioOverviewModel {
  title: "Portafolios";
  reportingCurrency: string;
  totalValueMinor: bigint;
  netContributionsMinor: bigint;
  netPerformanceMinor: bigint;
  totalVisibility: "visible" | "masked";
  dataQuality: "complete" | "attention";
  cards: readonly PortfolioCardModel[];
  excludedCount: number;
  attentionCount: number;
  readOnly: true;
}

export interface BuildPortfolioOverviewInput extends AggregatePortfolioWealthInput {
  privacyMode: boolean;
}

export function buildPortfolioOverview(
  input: BuildPortfolioOverviewInput,
): PortfolioOverviewModel {
  const aggregate = aggregatePortfolioWealth(input);
  const valueVisibility = input.privacyMode ? "masked" as const : "visible" as const;

  return Object.freeze({
    title: "Portafolios" as const,
    reportingCurrency: aggregate.reportingCurrency,
    totalValueMinor: aggregate.totalValue.amountMinor,
    netContributionsMinor: aggregate.netContributions.amountMinor,
    netPerformanceMinor: aggregate.netPerformance.amountMinor,
    totalVisibility: valueVisibility,
    dataQuality: aggregate.isComplete ? "complete" as const : "attention" as const,
    cards: Object.freeze(aggregate.entries.map((entry) => Object.freeze({
      id: entry.portfolioId,
      title: entry.name,
      status: entry.status,
      includedInTotal: entry.includedInTotal,
      valueMinor: entry.totalValue?.amountMinor ?? null,
      currency: entry.totalValue?.currency ?? null,
      issue: entry.issue,
      valueVisibility,
    }))),
    excludedCount: aggregate.excludedPortfolioIds.length,
    attentionCount: aggregate.incompletePortfolioIds.length,
    readOnly: true as const,
  });
}
