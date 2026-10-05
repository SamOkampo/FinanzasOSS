import type { Money, PortfolioSnapshot } from "./index.js";
import type { PortfolioSnapshotHistory } from "./portfolio-snapshot-history.js";

export interface PortfolioReturnPeriod {
  startAt: string;
  endAt: string;
  startValue: Money;
  endValue: Money;
  externalFlow: Money;
  returnRate: number | null;
}

export interface PortfolioPerformanceReturns {
  portfolioId: string;
  currency: string;
  startingValue: Money;
  endingValue: Money;
  netContributionsChange: Money;
  absolutePerformance: Money;
  twr: number | null;
  xirr: number | null;
  periods: readonly PortfolioReturnPeriod[];
}

interface DatedCashFlow {
  at: string;
  amountMinor: bigint;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function money(amountMinor: bigint, currency: string): Money {
  return Object.freeze({ amountMinor, currency });
}

function absoluteBigInt(value: bigint): bigint {
  return value < 0n ? -value : value;
}

function safeNumber(value: bigint, label: string): number {
  if (absoluteBigInt(value) > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error(`${label} exceeds safe numeric range for return calculation`);
  }
  return Number(value);
}

function snapshotTotal(snapshot: PortfolioSnapshot, currency: string): bigint {
  if (snapshot.marketValue.currency.toUpperCase() !== currency) {
    throw new Error("Portfolio performance marketValue currency mismatch");
  }
  let total = snapshot.marketValue.amountMinor;
  if (snapshot.cashValue) {
    if (snapshot.cashValue.currency.toUpperCase() !== currency) {
      throw new Error("Portfolio performance cashValue currency mismatch");
    }
    total += snapshot.cashValue.amountMinor;
  }
  return total;
}

function snapshotContributions(snapshot: PortfolioSnapshot, currency: string): bigint {
  if (!snapshot.netContributions) {
    throw new Error("Portfolio performance requires netContributions on every snapshot");
  }
  if (snapshot.netContributions.currency.toUpperCase() !== currency) {
    throw new Error("Portfolio performance netContributions currency mismatch");
  }
  return snapshot.netContributions.amountMinor;
}

function xnpv(rate: number, flows: readonly DatedCashFlow[]): number {
  if (rate <= -1) return Number.POSITIVE_INFINITY;
  const start = Date.parse(flows[0]!.at);
  return flows.reduce((sum, flow) => {
    const years = (Date.parse(flow.at) - start) / (365 * DAY_MS);
    return sum + safeNumber(flow.amountMinor, "XIRR cash flow") / Math.pow(1 + rate, years);
  }, 0);
}

export function calculateXirr(flows: readonly DatedCashFlow[]): number | null {
  if (flows.length < 2) return null;
  const ordered = [...flows].sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
  if (ordered.some((flow) => Number.isNaN(Date.parse(flow.at)))) throw new Error("XIRR cash flow date is invalid");
  const hasPositive = ordered.some((flow) => flow.amountMinor > 0n);
  const hasNegative = ordered.some((flow) => flow.amountMinor < 0n);
  if (!hasPositive || !hasNegative) return null;

  let low = -0.9999;
  let high = 1;
  let lowValue = xnpv(low, ordered);
  let highValue = xnpv(high, ordered);

  for (let i = 0; i < 32 && Math.sign(lowValue) === Math.sign(highValue); i += 1) {
    high = high * 2 + 1;
    highValue = xnpv(high, ordered);
  }
  if (!Number.isFinite(lowValue) || !Number.isFinite(highValue) || Math.sign(lowValue) === Math.sign(highValue)) {
    return null;
  }

  for (let i = 0; i < 160; i += 1) {
    const mid = (low + high) / 2;
    const midValue = xnpv(mid, ordered);
    if (!Number.isFinite(midValue)) return null;
    if (Math.abs(midValue) < 1e-9 || Math.abs(high - low) < 1e-12) return mid;
    if (Math.sign(midValue) === Math.sign(lowValue)) {
      low = mid;
      lowValue = midValue;
    } else {
      high = mid;
      highValue = midValue;
    }
  }

  return (low + high) / 2;
}

export function derivePortfolioPerformanceReturns(
  history: PortfolioSnapshotHistory,
): PortfolioPerformanceReturns {
  if (history.snapshots.length < 2) throw new Error("Portfolio performance requires at least two snapshots");

  const currency = history.currency.toUpperCase();
  const snapshots = history.snapshots;
  const first = snapshots[0]!;
  const last = snapshots[snapshots.length - 1]!;
  const firstAt = Date.parse(first.asOf);
  if (Number.isNaN(firstAt)) throw new Error("Portfolio performance snapshot date is invalid");

  let previousAt = firstAt;
  for (const snapshot of snapshots.slice(1)) {
    const at = Date.parse(snapshot.asOf);
    if (Number.isNaN(at) || at <= previousAt) {
      throw new Error("Portfolio performance snapshots must be strictly chronological");
    }
    previousAt = at;
  }

  const startingValueMinor = snapshotTotal(first, currency);
  const endingValueMinor = snapshotTotal(last, currency);
  const startingContributionsMinor = snapshotContributions(first, currency);
  const endingContributionsMinor = snapshotContributions(last, currency);
  const netContributionsChangeMinor = endingContributionsMinor - startingContributionsMinor;

  let twrFactor = 1;
  let twrAvailable = true;
  const periods: PortfolioReturnPeriod[] = [];
  const xirrFlows: DatedCashFlow[] = [{ at: first.asOf, amountMinor: -startingValueMinor }];

  for (let index = 1; index < snapshots.length; index += 1) {
    const start = snapshots[index - 1]!;
    const end = snapshots[index]!;
    const startValueMinor = snapshotTotal(start, currency);
    const endValueMinor = snapshotTotal(end, currency);
    const startContributionsMinor = snapshotContributions(start, currency);
    const endContributionsMinor = snapshotContributions(end, currency);
    const externalFlowMinor = endContributionsMinor - startContributionsMinor;

    let returnRate: number | null = null;
    if (startValueMinor > 0n) {
      const adjustedEndMinor = endValueMinor - externalFlowMinor;
      if (adjustedEndMinor >= 0n) {
        returnRate =
          safeNumber(adjustedEndMinor, "TWR adjusted end value") /
            safeNumber(startValueMinor, "TWR start value") -
          1;
        twrFactor *= 1 + returnRate;
      } else {
        twrAvailable = false;
      }
    } else {
      twrAvailable = false;
    }

    if (externalFlowMinor !== 0n) {
      xirrFlows.push({ at: end.asOf, amountMinor: -externalFlowMinor });
    }

    periods.push(Object.freeze({
      startAt: start.asOf,
      endAt: end.asOf,
      startValue: money(startValueMinor, currency),
      endValue: money(endValueMinor, currency),
      externalFlow: money(externalFlowMinor, currency),
      returnRate,
    }));
  }

  xirrFlows.push({ at: last.asOf, amountMinor: endingValueMinor });

  return Object.freeze({
    portfolioId: history.portfolioId,
    currency,
    startingValue: money(startingValueMinor, currency),
    endingValue: money(endingValueMinor, currency),
    netContributionsChange: money(netContributionsChangeMinor, currency),
    absolutePerformance: money(
      endingValueMinor - startingValueMinor - netContributionsChangeMinor,
      currency,
    ),
    twr: twrAvailable ? twrFactor - 1 : null,
    xirr: calculateXirr(xirrFlows),
    periods: Object.freeze(periods),
  });
}
