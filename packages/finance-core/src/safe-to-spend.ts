export interface SafeToSpendInput {
  currency: string;
  availableCashMinor: bigint;
  reservedMinor: bigint;
  obligationsMinor: bigint;
  safetyBufferMinor: bigint;
  forecastNetCashFlowMinor?: bigint | null;
  includePositiveForecast?: boolean;
}

export interface SafeToSpendResult {
  currency: string;
  availableCashMinor: bigint;
  reservedMinor: bigint;
  obligationsMinor: bigint;
  safetyBufferMinor: bigint;
  forecastAdjustmentMinor: bigint;
  safeToSpendMinor: bigint;
  constrainedBy: readonly ("reserved" | "obligations" | "safety_buffer" | "negative_forecast")[];
  confidence: "conservative";
  isEstimate: true;
  reasons: readonly string[];
}

function assertNonNegative(value: bigint, label: string): void {
  if (value < 0n) throw new Error(`${label} cannot be negative`);
}

export function calculateSafeToSpend(input: SafeToSpendInput): SafeToSpendResult {
  const currency = input.currency.trim().toUpperCase();
  if (!currency) throw new Error("Safe-to-spend currency is required");

  assertNonNegative(input.availableCashMinor, "availableCashMinor");
  assertNonNegative(input.reservedMinor, "reservedMinor");
  assertNonNegative(input.obligationsMinor, "obligationsMinor");
  assertNonNegative(input.safetyBufferMinor, "safetyBufferMinor");

  const rawForecast = input.forecastNetCashFlowMinor ?? 0n;
  const forecastAdjustmentMinor =
    rawForecast < 0n
      ? rawForecast
      : input.includePositiveForecast === true
        ? rawForecast
        : 0n;

  const rawSafe =
    input.availableCashMinor -
    input.reservedMinor -
    input.obligationsMinor -
    input.safetyBufferMinor +
    forecastAdjustmentMinor;

  const safeToSpendMinor = rawSafe > 0n ? rawSafe : 0n;
  const constrainedBy: ("reserved" | "obligations" | "safety_buffer" | "negative_forecast")[] = [];
  if (input.reservedMinor > 0n) constrainedBy.push("reserved");
  if (input.obligationsMinor > 0n) constrainedBy.push("obligations");
  if (input.safetyBufferMinor > 0n) constrainedBy.push("safety_buffer");
  if (forecastAdjustmentMinor < 0n) constrainedBy.push("negative_forecast");

  return {
    currency,
    availableCashMinor: input.availableCashMinor,
    reservedMinor: input.reservedMinor,
    obligationsMinor: input.obligationsMinor,
    safetyBufferMinor: input.safetyBufferMinor,
    forecastAdjustmentMinor,
    safeToSpendMinor,
    constrainedBy,
    confidence: "conservative",
    isEstimate: true,
    reasons: [
      "reserves, known obligations and safety buffer are subtracted before spending capacity",
      "negative forecast reduces the estimate",
      input.includePositiveForecast === true
        ? "positive forecast was explicitly allowed to increase the estimate"
        : "positive forecast is ignored by default",
      "result is an estimate, not a guarantee of future liquidity",
    ],
  };
}
