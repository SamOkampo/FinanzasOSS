export type CashFlowEconomicClass =
  | "expense"
  | "income"
  | "refund"
  | "internal_transfer"
  | "investment_flow"
  | "investment_activity"
  | "debt_flow"
  | "cash_movement"
  | "neutral"
  | "unknown";

export interface CashFlowObservation {
  id: string;
  postedAt: string;
  amountMinor: bigint;
  currency: string;
  direction: "debit" | "credit";
  status: "pending" | "posted" | "reversed";
  economicClass: CashFlowEconomicClass;
  merchantKey?: string | null;
  transactionType?: string | null;
}

export interface SpendingAnomaly {
  observationId: string;
  merchantKey: string;
  currency: string;
  currentAmountMinor: bigint;
  baselineAmountMinor: bigint;
  multipleBps: number;
  confidence: "medium" | "high";
  needsReview: true;
  reason: string;
}

export interface MonthlyCashFlowForecast {
  currency: string;
  completedMonthsUsed: number;
  averageMonthlyIncomeMinor: bigint;
  averageMonthlyExpenseMinor: bigint;
  forecastNetCashFlowMinor: bigint;
  confidence: "medium" | "low";
  isEstimate: true;
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
  if (!Number.isFinite(parsed)) throw new Error("Cash-flow observation date is invalid");
  return Math.floor(parsed / 86_400_000);
}

function monthKey(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) throw new Error("Cash-flow observation date is invalid");
  return `${parsed.getUTCFullYear()}-${String(parsed.getUTCMonth() + 1).padStart(2, "0")}`;
}

function medianBigInt(values: readonly bigint[]): bigint {
  if (values.length === 0) throw new Error("Median requires at least one value");
  const sorted = [...values].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    const left = sorted[middle - 1];
    const right = sorted[middle];
    if (left === undefined || right === undefined) throw new Error("Median bounds are invalid");
    return (left + right) / 2n;
  }
  const value = sorted[middle];
  if (value === undefined) throw new Error("Median value is missing");
  return value;
}

function isProtected(item: CashFlowObservation): boolean {
  return PROTECTED_TYPES.has((item.transactionType ?? "").trim().toLowerCase()) ||
    item.economicClass === "internal_transfer" ||
    item.economicClass === "investment_flow" ||
    item.economicClass === "investment_activity";
}

export function detectSpendingAnomalies(
  observations: readonly CashFlowObservation[],
): readonly SpendingAnomaly[] {
  const eligible = observations
    .filter((item) =>
      item.status === "posted" &&
      item.direction === "debit" &&
      item.economicClass === "expense" &&
      !isProtected(item) &&
      (item.merchantKey ?? "").trim().length > 0 &&
      item.amountMinor > 0n,
    )
    .sort((a, b) => dayNumber(a.postedAt) - dayNumber(b.postedAt));

  const groups = new Map<string, CashFlowObservation[]>();
  for (const item of eligible) {
    const merchantKey = item.merchantKey?.trim();
    if (!merchantKey) continue;
    const currency = item.currency.trim().toUpperCase();
    if (!currency) continue;
    const key = `${merchantKey}\u0000${currency}`;
    const bucket = groups.get(key) ?? [];
    bucket.push(item);
    groups.set(key, bucket);
  }

  const anomalies: SpendingAnomaly[] = [];
  for (const bucket of groups.values()) {
    if (bucket.length < 4) continue;
    const current = bucket[bucket.length - 1];
    if (!current) continue;
    const history = bucket.slice(0, -1);
    const baseline = medianBigInt(history.map((item) => item.amountMinor));
    if (baseline <= 0n) continue;

    const multipleBps = Number((current.amountMinor * 10_000n) / baseline);
    if (multipleBps < 20_000) continue;

    const merchantKey = current.merchantKey?.trim();
    if (!merchantKey) continue;
    anomalies.push({
      observationId: current.id,
      merchantKey,
      currency: current.currency.trim().toUpperCase(),
      currentAmountMinor: current.amountMinor,
      baselineAmountMinor: baseline,
      multipleBps,
      confidence: multipleBps >= 30_000 ? "high" : "medium",
      needsReview: true,
      reason: "latest posted expense is at least 2x the merchant historical median",
    });
  }

  return anomalies;
}

export function forecastMonthlyCashFlow(
  observations: readonly CashFlowObservation[],
  asOf: string,
  lookbackMonths = 3,
): MonthlyCashFlowForecast | null {
  if (!Number.isInteger(lookbackMonths) || lookbackMonths < 2 || lookbackMonths > 12) {
    throw new Error("lookbackMonths must be an integer between 2 and 12");
  }
  const asOfDate = new Date(asOf);
  if (Number.isNaN(asOfDate.getTime())) throw new Error("asOf must be a valid date");
  const currentMonth = `${asOfDate.getUTCFullYear()}-${String(asOfDate.getUTCMonth() + 1).padStart(2, "0")}`;

  const eligible = observations.filter((item) =>
    item.status === "posted" &&
    !isProtected(item) &&
    (item.economicClass === "income" || item.economicClass === "expense"),
  );
  if (eligible.length === 0) return null;

  const currencies = new Set(eligible.map((item) => item.currency.trim().toUpperCase()).filter(Boolean));
  if (currencies.size !== 1) return null;
  const currency = [...currencies][0];
  if (!currency) return null;

  const monthly = new Map<string, { income: bigint; expense: bigint }>();
  for (const item of eligible) {
    const key = monthKey(item.postedAt);
    if (key >= currentMonth) continue;
    const bucket = monthly.get(key) ?? { income: 0n, expense: 0n };
    if (item.economicClass === "income" && item.direction === "credit") bucket.income += item.amountMinor;
    if (item.economicClass === "expense" && item.direction === "debit") bucket.expense += item.amountMinor;
    monthly.set(key, bucket);
  }

  const months = [...monthly.keys()].sort().slice(-lookbackMonths);
  if (months.length < 2) return null;

  let incomeTotal = 0n;
  let expenseTotal = 0n;
  for (const key of months) {
    const bucket = monthly.get(key);
    if (!bucket) continue;
    incomeTotal += bucket.income;
    expenseTotal += bucket.expense;
  }

  const divisor = BigInt(months.length);
  const averageMonthlyIncomeMinor = incomeTotal / divisor;
  const averageMonthlyExpenseMinor = expenseTotal / divisor;
  return {
    currency,
    completedMonthsUsed: months.length,
    averageMonthlyIncomeMinor,
    averageMonthlyExpenseMinor,
    forecastNetCashFlowMinor: averageMonthlyIncomeMinor - averageMonthlyExpenseMinor,
    confidence: months.length >= 3 ? "medium" : "low",
    isEstimate: true,
    reasons: [
      "forecast uses completed historical months only",
      "internal transfers and investment flows are excluded",
      "result is an estimate, not a guarantee",
    ],
  };
}
