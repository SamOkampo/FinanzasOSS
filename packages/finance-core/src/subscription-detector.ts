export type SubscriptionCadence = "weekly" | "monthly" | "yearly" | "unknown";

export interface SubscriptionObservation {
  id: string;
  postedAt: string;
  merchantKey: string;
  amountMinor: bigint;
  currency: string;
  direction: "debit" | "credit";
  status: "pending" | "posted" | "reversed";
  transactionType?: string | null;
}

export interface SubscriptionDetection {
  merchantKey: string;
  currency: string;
  cadence: SubscriptionCadence;
  confidence: "high" | "medium" | "low";
  occurrenceCount: number;
  averageAmountMinor: bigint;
  amountVariationBps: number;
  averageIntervalDays: number | null;
  nextExpectedAt: string | null;
  needsReview: boolean;
  reasons: readonly string[];
}

const PROTECTED_TYPES = new Set([
  "transfer",
  "internal_transfer",
  "investment_transfer",
  "investment_activity",
]);

function dayNumber(value: string): number {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) throw new Error("Subscription observation date is invalid");
  return Math.floor(parsed / 86_400_000);
}

function median(values: readonly number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

function cadenceFor(intervalDays: number): SubscriptionCadence {
  if (intervalDays >= 5 && intervalDays <= 9) return "weekly";
  if (intervalDays >= 25 && intervalDays <= 35) return "monthly";
  if (intervalDays >= 350 && intervalDays <= 380) return "yearly";
  return "unknown";
}

function addDaysIso(value: string, days: number): string {
  const date = new Date(value);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}

export function detectSubscription(
  observations: readonly SubscriptionObservation[],
): SubscriptionDetection | null {
  const eligible = observations
    .filter((item) =>
      item.direction === "debit" &&
      item.status === "posted" &&
      !PROTECTED_TYPES.has((item.transactionType ?? "").trim().toLowerCase()),
    )
    .sort((a, b) => dayNumber(a.postedAt) - dayNumber(b.postedAt));

  if (eligible.length < 3) return null;

  const merchantKey = eligible[0].merchantKey.trim();
  const currency = eligible[0].currency.trim().toUpperCase();
  if (!merchantKey || !currency) throw new Error("Subscription observations require merchant and currency");

  if (eligible.some((item) => item.merchantKey.trim() !== merchantKey)) return null;
  if (eligible.some((item) => item.currency.trim().toUpperCase() !== currency)) return null;
  if (eligible.some((item) => item.amountMinor <= 0n)) throw new Error("Subscription amounts must be positive");

  const amounts = eligible.map((item) => item.amountMinor);
  const total = amounts.reduce((sum, value) => sum + value, 0n);
  const averageAmountMinor = total / BigInt(amounts.length);
  if (averageAmountMinor <= 0n) return null;

  const maxDeviation = amounts.reduce((max, value) => {
    const diff = value >= averageAmountMinor ? value - averageAmountMinor : averageAmountMinor - value;
    return diff > max ? diff : max;
  }, 0n);
  const amountVariationBps = Number((maxDeviation * 10_000n) / averageAmountMinor);

  const intervals = eligible.slice(1).map((item, index) =>
    dayNumber(item.postedAt) - dayNumber(eligible[index].postedAt),
  );
  if (intervals.some((value) => value <= 0)) return null;

  const medianInterval = median(intervals);
  const cadence = cadenceFor(medianInterval);
  const intervalDeviation = Math.max(...intervals.map((value) => Math.abs(value - medianInterval)));

  if (cadence === "unknown") {
    return {
      merchantKey,
      currency,
      cadence,
      confidence: "low",
      occurrenceCount: eligible.length,
      averageAmountMinor,
      amountVariationBps,
      averageIntervalDays: medianInterval,
      nextExpectedAt: null,
      needsReview: true,
      reasons: ["recurrence exists but cadence is not recognized"],
    };
  }

  const stableAmount = amountVariationBps <= 500;
  const stableInterval =
    (cadence === "weekly" && intervalDeviation <= 2) ||
    (cadence === "monthly" && intervalDeviation <= 5) ||
    (cadence === "yearly" && intervalDeviation <= 15);

  const confidence =
    eligible.length >= 4 && stableAmount && stableInterval
      ? "high"
      : stableInterval
        ? "medium"
        : "low";

  const expectedDays = cadence === "weekly" ? 7 : cadence === "monthly" ? Math.round(medianInterval) : 365;
  const nextExpectedAt = addDaysIso(eligible[eligible.length - 1].postedAt, expectedDays);

  return {
    merchantKey,
    currency,
    cadence,
    confidence,
    occurrenceCount: eligible.length,
    averageAmountMinor,
    amountVariationBps,
    averageIntervalDays: medianInterval,
    nextExpectedAt,
    needsReview: confidence !== "high",
    reasons: [
      `${eligible.length} posted debits with same merchant/currency`,
      stableAmount ? "amount pattern is stable" : "amount pattern varies",
      stableInterval ? "interval pattern is stable" : "interval pattern varies",
    ],
  };
}
