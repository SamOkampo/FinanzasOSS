export interface PortfolioAllocationPosition {
  assetKey: string;
  marketValueMinor: bigint;
  currency: string;
}

export interface PortfolioAllocationLine {
  assetKey: string;
  marketValueMinor: bigint;
  actualBps: number;
  targetBps: number;
  driftBps: number;
  absoluteDriftBps: number;
  exceedsUserConcentrationThreshold: boolean;
}

export interface PortfolioDriftReport {
  currency: string;
  totalMarketValueMinor: bigint;
  lines: readonly PortfolioAllocationLine[];
  topHolding: { assetKey: string; actualBps: number } | null;
  userConcentrationThresholdBps: number | null;
  concentrationBreaches: readonly string[];
  isReadOnly: true;
  reasons: readonly string[];
}

function assertBps(value: number, label: string): void {
  if (!Number.isInteger(value) || value < 0 || value > 10_000) {
    throw new Error(`${label} must be an integer between 0 and 10000`);
  }
}

export function buildPortfolioDriftReport(input: {
  positions: readonly PortfolioAllocationPosition[];
  targetAllocationBps: Readonly<Record<string, number>>;
  concentrationThresholdBps?: number | null;
}): PortfolioDriftReport | null {
  const positions = input.positions.map((position) => ({
    ...position,
    assetKey: position.assetKey.trim(),
    currency: position.currency.trim().toUpperCase(),
  }));
  if (positions.length === 0) return null;
  if (positions.some((position) => !position.assetKey || !position.currency)) {
    throw new Error("Portfolio allocation positions require assetKey and currency");
  }
  if (positions.some((position) => position.marketValueMinor < 0n)) {
    throw new Error("Portfolio market values cannot be negative");
  }

  const currencies = new Set(positions.map((position) => position.currency));
  if (currencies.size !== 1) return null;
  const currency = positions[0]?.currency;
  if (!currency) return null;

  let targetSum = 0;
  for (const [assetKey, targetBps] of Object.entries(input.targetAllocationBps)) {
    if (!assetKey.trim()) throw new Error("Target allocation assetKey cannot be empty");
    assertBps(targetBps, `targetAllocationBps.${assetKey}`);
    targetSum += targetBps;
  }
  if (targetSum !== 10_000) throw new Error("Target allocation must sum to 10000 bps");

  const threshold = input.concentrationThresholdBps ?? null;
  if (threshold !== null) assertBps(threshold, "concentrationThresholdBps");

  const valueByAsset = new Map<string, bigint>();
  for (const position of positions) {
    valueByAsset.set(position.assetKey, (valueByAsset.get(position.assetKey) ?? 0n) + position.marketValueMinor);
  }

  const totalMarketValueMinor = [...valueByAsset.values()].reduce((sum, value) => sum + value, 0n);
  if (totalMarketValueMinor <= 0n) return null;

  const assetKeys = new Set([...Object.keys(input.targetAllocationBps), ...valueByAsset.keys()]);
  const lines: PortfolioAllocationLine[] = [];
  for (const assetKey of [...assetKeys].sort()) {
    const marketValueMinor = valueByAsset.get(assetKey) ?? 0n;
    const actualBps = Number((marketValueMinor * 10_000n) / totalMarketValueMinor);
    const targetBps = input.targetAllocationBps[assetKey] ?? 0;
    const driftBps = actualBps - targetBps;
    lines.push({
      assetKey,
      marketValueMinor,
      actualBps,
      targetBps,
      driftBps,
      absoluteDriftBps: Math.abs(driftBps),
      exceedsUserConcentrationThreshold: threshold !== null && actualBps > threshold,
    });
  }

  const sortedByActual = [...lines].sort((a, b) => b.actualBps - a.actualBps);
  const top = sortedByActual[0];
  const concentrationBreaches = lines
    .filter((line) => line.exceedsUserConcentrationThreshold)
    .map((line) => line.assetKey);

  return {
    currency,
    totalMarketValueMinor,
    lines,
    topHolding: top ? { assetKey: top.assetKey, actualBps: top.actualBps } : null,
    userConcentrationThresholdBps: threshold,
    concentrationBreaches,
    isReadOnly: true,
    reasons: [
      "actual allocation is derived from current market values only",
      "drift compares actual allocation with the user-defined target",
      threshold === null
        ? "no concentration threshold was supplied, so no concentration breach is asserted"
        : "concentration breaches use only the user-supplied threshold",
      "report does not recommend or execute rebalancing trades",
    ],
  };
}
