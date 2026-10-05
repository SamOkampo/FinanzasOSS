import type { Money, Portfolio, PortfolioSnapshot } from "./index.js";
import { assertPortfolioSnapshotBelongsToPortfolio } from "./index.js";

export interface PortfolioSnapshotHistory {
  tenantId: string;
  portfolioId: string;
  currency: string;
  snapshots: readonly PortfolioSnapshot[];
}

function assertMoneyCurrency(money: Money | undefined, currency: string, label: string): void {
  if (money && money.currency.toUpperCase() !== currency) {
    throw new Error(`${label} currency mismatch`);
  }
}

function validateSnapshot(snapshot: PortfolioSnapshot, portfolio: Portfolio): void {
  assertPortfolioSnapshotBelongsToPortfolio(snapshot, portfolio);
  if (Number.isNaN(Date.parse(snapshot.asOf))) throw new Error("Portfolio snapshot asOf must be a valid date");
  const currency = portfolio.baseCurrency.toUpperCase();
  if (snapshot.marketValue.currency.toUpperCase() !== currency) {
    throw new Error("Portfolio snapshot marketValue currency mismatch");
  }
  assertMoneyCurrency(snapshot.cashValue, currency, "Portfolio snapshot cashValue");
  assertMoneyCurrency(snapshot.netContributions, currency, "Portfolio snapshot netContributions");
}

export function buildPortfolioSnapshotHistory(
  portfolio: Portfolio,
  snapshots: readonly PortfolioSnapshot[],
): PortfolioSnapshotHistory {
  const seenIds = new Set<string>();
  const seenTimestamps = new Set<string>();
  for (const snapshot of snapshots) {
    validateSnapshot(snapshot, portfolio);
    if (seenIds.has(snapshot.id)) throw new Error("Duplicate portfolio snapshot id");
    if (seenTimestamps.has(snapshot.asOf)) throw new Error("Duplicate portfolio snapshot timestamp");
    seenIds.add(snapshot.id);
    seenTimestamps.add(snapshot.asOf);
  }

  const ordered = [...snapshots].sort((a, b) =>
    Date.parse(a.asOf) - Date.parse(b.asOf) || a.id.localeCompare(b.id),
  );

  return Object.freeze({
    tenantId: portfolio.tenantId,
    portfolioId: portfolio.id,
    currency: portfolio.baseCurrency.toUpperCase(),
    snapshots: Object.freeze(ordered),
  });
}

export function appendPortfolioSnapshot(
  portfolio: Portfolio,
  history: PortfolioSnapshotHistory,
  snapshot: PortfolioSnapshot,
): PortfolioSnapshotHistory {
  if (history.tenantId !== portfolio.tenantId || history.portfolioId !== portfolio.id) {
    throw new Error("Portfolio snapshot history scope mismatch");
  }
  if (history.currency !== portfolio.baseCurrency.toUpperCase()) {
    throw new Error("Portfolio snapshot history currency mismatch");
  }
  return buildPortfolioSnapshotHistory(portfolio, [...history.snapshots, snapshot]);
}

export function latestPortfolioSnapshot(
  history: PortfolioSnapshotHistory,
): PortfolioSnapshot | null {
  return history.snapshots.length ? (history.snapshots[history.snapshots.length - 1] ?? null) : null;
}
