export interface BudgetTarget {
  categoryKey: string;
  budgetMinor: bigint;
}

export interface BudgetActual {
  categoryKey: string;
  spentMinor: bigint;
}

export interface BudgetLine {
  categoryKey: string;
  budgetMinor: bigint;
  spentMinor: bigint;
  remainingMinor: bigint;
  overBudgetMinor: bigint;
  status: "within_budget" | "over_budget" | "unbudgeted";
}

export interface CashFlowBudgetDashboard {
  month: string;
  currency: string;
  incomeMinor: bigint;
  consumerExpenseMinor: bigint;
  investmentTransferMinor: bigint;
  economicCashFlowMinor: bigint;
  budgetLines: readonly BudgetLine[];
  totalBudgetMinor: bigint;
  totalBudgetedSpendMinor: bigint;
  totalUnbudgetedSpendMinor: bigint;
  investmentTransferExcludedFromSpending: true;
  isReadOnly: true;
}

function assertMonth(month: string): void {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new Error("Month must use YYYY-MM");
}

function assertNonNegative(value: bigint, label: string): void {
  if (value < 0n) throw new Error(`${label} cannot be negative`);
}

export function buildCashFlowBudgetDashboard(input: {
  month: string;
  currency: string;
  incomeMinor: bigint;
  consumerExpenseMinor: bigint;
  investmentTransferMinor: bigint;
  budgetTargets: readonly BudgetTarget[];
  budgetActuals: readonly BudgetActual[];
}): CashFlowBudgetDashboard {
  assertMonth(input.month);
  const currency = input.currency.trim().toUpperCase();
  if (!currency) throw new Error("Budget currency is required");

  assertNonNegative(input.incomeMinor, "incomeMinor");
  assertNonNegative(input.consumerExpenseMinor, "consumerExpenseMinor");
  assertNonNegative(input.investmentTransferMinor, "investmentTransferMinor");

  const targetByCategory = new Map<string, bigint>();
  for (const target of input.budgetTargets) {
    const key = target.categoryKey.trim();
    if (!key) throw new Error("Budget categoryKey is required");
    assertNonNegative(target.budgetMinor, "budgetMinor");
    if (targetByCategory.has(key)) throw new Error(`Duplicate budget target: ${key}`);
    targetByCategory.set(key, target.budgetMinor);
  }

  const actualByCategory = new Map<string, bigint>();
  for (const actual of input.budgetActuals) {
    const key = actual.categoryKey.trim();
    if (!key) throw new Error("Budget actual categoryKey is required");
    assertNonNegative(actual.spentMinor, "spentMinor");
    actualByCategory.set(key, (actualByCategory.get(key) ?? 0n) + actual.spentMinor);
  }

  const keys = new Set([...targetByCategory.keys(), ...actualByCategory.keys()]);
  const budgetLines: BudgetLine[] = [];
  let totalBudgetMinor = 0n;
  let totalBudgetedSpendMinor = 0n;
  let totalUnbudgetedSpendMinor = 0n;

  for (const categoryKey of [...keys].sort()) {
    const budgetMinor = targetByCategory.get(categoryKey) ?? 0n;
    const spentMinor = actualByCategory.get(categoryKey) ?? 0n;
    const hasBudget = targetByCategory.has(categoryKey);

    if (hasBudget) {
      totalBudgetMinor += budgetMinor;
      totalBudgetedSpendMinor += spentMinor;
    } else {
      totalUnbudgetedSpendMinor += spentMinor;
    }

    const remainingMinor = budgetMinor > spentMinor ? budgetMinor - spentMinor : 0n;
    const overBudgetMinor = spentMinor > budgetMinor ? spentMinor - budgetMinor : 0n;
    budgetLines.push({
      categoryKey,
      budgetMinor,
      spentMinor,
      remainingMinor,
      overBudgetMinor,
      status: !hasBudget ? "unbudgeted" : overBudgetMinor > 0n ? "over_budget" : "within_budget",
    });
  }

  return {
    month: input.month,
    currency,
    incomeMinor: input.incomeMinor,
    consumerExpenseMinor: input.consumerExpenseMinor,
    investmentTransferMinor: input.investmentTransferMinor,
    economicCashFlowMinor: input.incomeMinor - input.consumerExpenseMinor,
    budgetLines,
    totalBudgetMinor,
    totalBudgetedSpendMinor,
    totalUnbudgetedSpendMinor,
    investmentTransferExcludedFromSpending: true,
    isReadOnly: true,
  };
}
