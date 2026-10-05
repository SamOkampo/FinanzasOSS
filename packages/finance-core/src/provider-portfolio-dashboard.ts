import type { PortfolioWealthAggregation } from "./portfolio-aggregation.js";

export interface PortfolioProviderAssignment {
  portfolioId: string;
  providerId: string;
  providerName: string;
}

export interface ProviderPortfolioLine {
  portfolioId: string;
  portfolioName: string;
  totalValueMinor: bigint;
  netContributionsMinor: bigint;
  netPerformanceMinor: bigint;
}

export interface ProviderPortfolioGroup {
  providerId: string;
  providerName: string;
  portfolioIds: readonly string[];
  totalValueMinor: bigint;
  netContributionsMinor: bigint;
  netPerformanceMinor: bigint;
  portfolios: readonly ProviderPortfolioLine[];
}

export interface ProviderPortfolioDashboard {
  reportingCurrency: string;
  consolidatedTotalValueMinor: bigint;
  consolidatedNetContributionsMinor: bigint;
  consolidatedNetPerformanceMinor: bigint;
  providers: readonly ProviderPortfolioGroup[];
  unassignedPortfolioIds: readonly string[];
  excludedPortfolioIds: readonly string[];
  incompletePortfolioIds: readonly string[];
  providerBreakdownComplete: boolean;
  isComplete: boolean;
  isReadOnly: true;
}

interface MutableProviderGroup {
  providerId: string;
  providerName: string;
  portfolioIds: string[];
  totalValueMinor: bigint;
  netContributionsMinor: bigint;
  netPerformanceMinor: bigint;
  portfolios: ProviderPortfolioLine[];
}

export function buildProviderPortfolioDashboard(input: {
  portfolioWealth: PortfolioWealthAggregation;
  assignments: readonly PortfolioProviderAssignment[];
}): ProviderPortfolioDashboard {
  const reportingCurrency = input.portfolioWealth.reportingCurrency.trim().toUpperCase();
  if (!reportingCurrency) throw new Error("Portfolio reporting currency is required");

  const knownPortfolioIds = new Set(input.portfolioWealth.entries.map((entry) => entry.portfolioId));
  const assignmentByPortfolio = new Map<string, PortfolioProviderAssignment>();
  const providerNameById = new Map<string, string>();

  for (const assignment of input.assignments) {
    const portfolioId = assignment.portfolioId.trim();
    const providerId = assignment.providerId.trim();
    const providerName = assignment.providerName.trim();

    if (!portfolioId) throw new Error("Provider assignment portfolioId is required");
    if (!providerId) throw new Error("Provider assignment providerId is required");
    if (!providerName) throw new Error("Provider assignment providerName is required");
    if (!knownPortfolioIds.has(portfolioId)) {
      throw new Error(`Provider assignment references unknown portfolio: ${portfolioId}`);
    }
    if (assignmentByPortfolio.has(portfolioId)) {
      throw new Error(`Duplicate provider assignment for portfolio: ${portfolioId}`);
    }

    const knownProviderName = providerNameById.get(providerId);
    if (knownProviderName && knownProviderName !== providerName) {
      throw new Error(`Conflicting provider name for provider: ${providerId}`);
    }

    const normalized = Object.freeze({ portfolioId, providerId, providerName });
    assignmentByPortfolio.set(portfolioId, normalized);
    providerNameById.set(providerId, providerName);
  }

  const groups = new Map<string, MutableProviderGroup>();
  const unassignedPortfolioIds: string[] = [];

  for (const entry of input.portfolioWealth.entries) {
    if (!entry.includedInTotal) continue;

    if (!entry.totalValue || !entry.netContributions || !entry.netPerformance) {
      throw new Error(`Included portfolio is missing metrics: ${entry.portfolioId}`);
    }

    const assignment = assignmentByPortfolio.get(entry.portfolioId);
    if (!assignment) {
      unassignedPortfolioIds.push(entry.portfolioId);
      continue;
    }

    let group = groups.get(assignment.providerId);
    if (!group) {
      group = {
        providerId: assignment.providerId,
        providerName: assignment.providerName,
        portfolioIds: [],
        totalValueMinor: 0n,
        netContributionsMinor: 0n,
        netPerformanceMinor: 0n,
        portfolios: [],
      };
      groups.set(assignment.providerId, group);
    }

    group.portfolioIds.push(entry.portfolioId);
    group.totalValueMinor += entry.totalValue.amountMinor;
    group.netContributionsMinor += entry.netContributions.amountMinor;
    group.netPerformanceMinor += entry.netPerformance.amountMinor;
    group.portfolios.push(Object.freeze({
      portfolioId: entry.portfolioId,
      portfolioName: entry.name,
      totalValueMinor: entry.totalValue.amountMinor,
      netContributionsMinor: entry.netContributions.amountMinor,
      netPerformanceMinor: entry.netPerformance.amountMinor,
    }));
  }

  const providers = [...groups.values()]
    .sort((a, b) => a.providerName.localeCompare(b.providerName) || a.providerId.localeCompare(b.providerId))
    .map((group) => Object.freeze({
      providerId: group.providerId,
      providerName: group.providerName,
      portfolioIds: Object.freeze([...group.portfolioIds].sort()),
      totalValueMinor: group.totalValueMinor,
      netContributionsMinor: group.netContributionsMinor,
      netPerformanceMinor: group.netPerformanceMinor,
      portfolios: Object.freeze([...group.portfolios].sort((a, b) => a.portfolioName.localeCompare(b.portfolioName))),
    }));

  const unassigned = Object.freeze([...unassignedPortfolioIds].sort());
  const providerBreakdownComplete = unassigned.length === 0;

  return Object.freeze({
    reportingCurrency,
    consolidatedTotalValueMinor: input.portfolioWealth.totalValue.amountMinor,
    consolidatedNetContributionsMinor: input.portfolioWealth.netContributions.amountMinor,
    consolidatedNetPerformanceMinor: input.portfolioWealth.netPerformance.amountMinor,
    providers: Object.freeze(providers),
    unassignedPortfolioIds: unassigned,
    excludedPortfolioIds: Object.freeze([...input.portfolioWealth.excludedPortfolioIds]),
    incompletePortfolioIds: Object.freeze([...input.portfolioWealth.incompletePortfolioIds]),
    providerBreakdownComplete,
    isComplete: input.portfolioWealth.isComplete && providerBreakdownComplete,
    isReadOnly: true,
  });
}
