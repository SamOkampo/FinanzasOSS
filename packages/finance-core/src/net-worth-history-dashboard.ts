export type NetWorthChangeKind =
  | "income"
  | "consumer_expense"
  | "investment_performance"
  | "investment_transfer"
  | "liability_change"
  | "fee_tax"
  | "other";

export interface NetWorthHistorySnapshot {
  asOf: string;
  cashAssetsMinor: bigint;
  investmentAssetsMinor: bigint;
  creditLiabilitiesMinor: bigint;
  currency: string;
}

export interface NetWorthChangeEvent {
  id: string;
  occurredAt: string;
  kind: NetWorthChangeKind;
  netWorthImpactMinor: bigint;
  currency: string;
  label?: string;
}

export interface NetWorthHistoryPoint {
  asOf: string;
  cashAssetsMinor: bigint;
  investmentAssetsMinor: bigint;
  creditLiabilitiesMinor: bigint;
  netWorthMinor: bigint;
  currency: string;
}

export interface NetWorthHistoryInterval {
  fromAsOf: string;
  toAsOf: string;
  actualChangeMinor: bigint;
  explainedChangeMinor: bigint;
  unexplainedChangeMinor: bigint;
  sourceEvents: readonly NetWorthChangeEvent[];
  isFullyExplained: boolean;
}

export interface NetWorthHistoryDashboard {
  currency: string;
  points: readonly NetWorthHistoryPoint[];
  intervals: readonly NetWorthHistoryInterval[];
  unassignedEventIds: readonly string[];
  investmentTransfersAffectNetWorth: false;
  isComplete: boolean;
  isReadOnly: true;
}

function parseInstant(value: string, label: string): number {
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) throw new Error(`${label} must be a valid ISO date/time`);
  return timestamp;
}

function assertNonNegative(value: bigint, label: string): void {
  if (value < 0n) throw new Error(`${label} cannot be negative`);
}

export function buildNetWorthHistoryDashboard(input: {
  currency: string;
  snapshots: readonly NetWorthHistorySnapshot[];
  changeEvents: readonly NetWorthChangeEvent[];
}): NetWorthHistoryDashboard {
  const currency = input.currency.trim().toUpperCase();
  if (!currency) throw new Error("History currency is required");
  if (input.snapshots.length === 0) throw new Error("At least one history snapshot is required");

  const seenSnapshotTimes = new Set<number>();
  const points = input.snapshots.map((snapshot) => {
    const snapshotCurrency = snapshot.currency.trim().toUpperCase();
    if (snapshotCurrency !== currency) throw new Error("History snapshot currency mismatch");

    const timestamp = parseInstant(snapshot.asOf, "snapshot asOf");
    if (seenSnapshotTimes.has(timestamp)) throw new Error("Duplicate history snapshot timestamp");
    seenSnapshotTimes.add(timestamp);

    assertNonNegative(snapshot.cashAssetsMinor, "cashAssetsMinor");
    assertNonNegative(snapshot.investmentAssetsMinor, "investmentAssetsMinor");
    assertNonNegative(snapshot.creditLiabilitiesMinor, "creditLiabilitiesMinor");

    return {
      timestamp,
      point: Object.freeze({
        asOf: new Date(timestamp).toISOString(),
        cashAssetsMinor: snapshot.cashAssetsMinor,
        investmentAssetsMinor: snapshot.investmentAssetsMinor,
        creditLiabilitiesMinor: snapshot.creditLiabilitiesMinor,
        netWorthMinor:
          snapshot.cashAssetsMinor +
          snapshot.investmentAssetsMinor -
          snapshot.creditLiabilitiesMinor,
        currency,
      }),
    };
  }).sort((a, b) => a.timestamp - b.timestamp);

  const seenEventIds = new Set<string>();
  const events = input.changeEvents.map((event) => {
    const id = event.id.trim();
    if (!id) throw new Error("History change event id is required");
    if (seenEventIds.has(id)) throw new Error(`Duplicate history change event: ${id}`);
    seenEventIds.add(id);

    const eventCurrency = event.currency.trim().toUpperCase();
    if (eventCurrency !== currency) throw new Error(`History change event currency mismatch: ${id}`);

    const timestamp = parseInstant(event.occurredAt, "change event occurredAt");
    if (event.kind === "investment_transfer" && event.netWorthImpactMinor !== 0n) {
      throw new Error(`investment_transfer must have zero net-worth impact: ${id}`);
    }

    return {
      timestamp,
      event: Object.freeze({
        ...event,
        id,
        occurredAt: new Date(timestamp).toISOString(),
        currency,
        ...(event.label !== undefined ? { label: event.label.trim() } : {}),
      }),
    };
  }).sort((a, b) => a.timestamp - b.timestamp || a.event.id.localeCompare(b.event.id));

  const assignedEventIds = new Set<string>();
  const intervals: NetWorthHistoryInterval[] = [];

  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    if (!previous || !current) continue;

    const sourceEvents = events
      .filter((event) => event.timestamp > previous.timestamp && event.timestamp <= current.timestamp)
      .map((event) => {
        assignedEventIds.add(event.event.id);
        return event.event;
      });

    const actualChangeMinor = current.point.netWorthMinor - previous.point.netWorthMinor;
    const explainedChangeMinor = sourceEvents.reduce(
      (sum, event) => sum + event.netWorthImpactMinor,
      0n,
    );
    const unexplainedChangeMinor = actualChangeMinor - explainedChangeMinor;

    intervals.push(Object.freeze({
      fromAsOf: previous.point.asOf,
      toAsOf: current.point.asOf,
      actualChangeMinor,
      explainedChangeMinor,
      unexplainedChangeMinor,
      sourceEvents: Object.freeze(sourceEvents),
      isFullyExplained: unexplainedChangeMinor === 0n,
    }));
  }

  const unassignedEventIds = events
    .filter((event) => !assignedEventIds.has(event.event.id))
    .map((event) => event.event.id)
    .sort();

  const allIntervalsExplained = intervals.every((interval) => interval.isFullyExplained);

  return Object.freeze({
    currency,
    points: Object.freeze(points.map((entry) => entry.point)),
    intervals: Object.freeze(intervals),
    unassignedEventIds: Object.freeze(unassignedEventIds),
    investmentTransfersAffectNetWorth: false,
    isComplete: allIntervalsExplained && unassignedEventIds.length === 0,
    isReadOnly: true,
  });
}
