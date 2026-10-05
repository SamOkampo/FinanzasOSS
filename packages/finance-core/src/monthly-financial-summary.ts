export interface MonthlyFinancialSummaryInput {
  month: string;
  currency: string;
  openingNetWorthMinor: bigint;
  closingNetWorthMinor: bigint;
  incomeMinor: bigint;
  consumerExpenseMinor: bigint;
  investmentContributionsMinor: bigint;
  investmentWithdrawalsMinor: bigint;
  investmentPerformanceMinor?: bigint | null;
}

export interface MonthlyFinancialSummary {
  month: string;
  currency: string;
  openingNetWorthMinor: bigint;
  closingNetWorthMinor: bigint;
  netWorthChangeMinor: bigint;
  incomeMinor: bigint;
  consumerExpenseMinor: bigint;
  netInvestmentFlowMinor: bigint;
  investmentContributionsMinor: bigint;
  investmentWithdrawalsMinor: bigint;
  investmentPerformanceMinor: bigint | null;
  investmentTransferExcludedFromSpending: true;
  completeness: "complete" | "partial";
  isReadOnly: true;
  reasons: readonly string[];
}

function assertMonth(month: string): void {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new Error("Month must use YYYY-MM");
}

function assertNonNegative(value: bigint, label: string): void {
  if (value < 0n) throw new Error(`${label} cannot be negative`);
}

export function buildMonthlyFinancialSummary(
  input: MonthlyFinancialSummaryInput,
): MonthlyFinancialSummary {
  assertMonth(input.month);
  const currency = input.currency.trim().toUpperCase();
  if (!currency) throw new Error("Monthly summary currency is required");

  assertNonNegative(input.openingNetWorthMinor, "openingNetWorthMinor");
  assertNonNegative(input.closingNetWorthMinor, "closingNetWorthMinor");
  assertNonNegative(input.incomeMinor, "incomeMinor");
  assertNonNegative(input.consumerExpenseMinor, "consumerExpenseMinor");
  assertNonNegative(input.investmentContributionsMinor, "investmentContributionsMinor");
  assertNonNegative(input.investmentWithdrawalsMinor, "investmentWithdrawalsMinor");

  const investmentPerformanceMinor = input.investmentPerformanceMinor ?? null;

  return {
    month: input.month,
    currency,
    openingNetWorthMinor: input.openingNetWorthMinor,
    closingNetWorthMinor: input.closingNetWorthMinor,
    netWorthChangeMinor: input.closingNetWorthMinor - input.openingNetWorthMinor,
    incomeMinor: input.incomeMinor,
    consumerExpenseMinor: input.consumerExpenseMinor,
    netInvestmentFlowMinor: input.investmentContributionsMinor - input.investmentWithdrawalsMinor,
    investmentContributionsMinor: input.investmentContributionsMinor,
    investmentWithdrawalsMinor: input.investmentWithdrawalsMinor,
    investmentPerformanceMinor,
    investmentTransferExcludedFromSpending: true,
    completeness: investmentPerformanceMinor === null ? "partial" : "complete",
    isReadOnly: true,
    reasons: [
      "consumer spending excludes bank-to-investment transfers",
      "investment contributions and withdrawals are reported as patrimonial flows",
      investmentPerformanceMinor === null
        ? "investment performance is unavailable and is not invented as zero"
        : "investment performance is reported separately from contributions",
      "summary is read-only and does not initiate financial actions",
    ],
  };
}
