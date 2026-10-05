export type FinancialCalendarItemKind =
  | "income"
  | "obligation"
  | "subscription"
  | "investment_contribution";

export interface MonthlyRecurringCalendarItem {
  id: string;
  label: string;
  kind: FinancialCalendarItemKind;
  dayOfMonth: number;
  amountMinor: bigint;
  currency: string;
  enabled?: boolean;
}

export interface FinancialCalendarOccurrence {
  itemId: string;
  label: string;
  kind: FinancialCalendarItemKind;
  scheduledDate: string;
  scheduledDay: number;
  adjustedToMonthEnd: boolean;
  amountMinor: bigint;
  currency: string;
  countsAsConsumerCommitment: boolean;
  usesInvestmentTransferClassification: boolean;
}

export interface FinancialCalendarDashboard {
  month: string;
  currency: string;
  occurrences: readonly FinancialCalendarOccurrence[];
  totalIncomeMinor: bigint;
  totalConsumerCommitmentsMinor: bigint;
  totalInvestmentContributionsMinor: bigint;
  investmentContributionsExcludedFromSpending: true;
  isReadOnly: true;
}

function assertMonth(month: string): void {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    throw new Error("Month must use YYYY-MM");
  }
}

function daysInMonth(month: string): number {
  const [yearText, monthText] = month.split("-");
  const year = Number(yearText);
  const monthNumber = Number(monthText);
  if (!Number.isInteger(year) || !Number.isInteger(monthNumber)) {
    throw new Error("Invalid calendar month");
  }
  return new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
}

function formatDate(month: string, day: number): string {
  return `${month}-${String(day).padStart(2, "0")}`;
}

export function buildFinancialCalendar(input: {
  month: string;
  currency: string;
  items: readonly MonthlyRecurringCalendarItem[];
}): FinancialCalendarDashboard {
  assertMonth(input.month);

  const currency = input.currency.trim().toUpperCase();
  if (!currency) throw new Error("Calendar currency is required");

  const monthDays = daysInMonth(input.month);
  const seenIds = new Set<string>();
  const occurrences: FinancialCalendarOccurrence[] = [];

  let totalIncomeMinor = 0n;
  let totalConsumerCommitmentsMinor = 0n;
  let totalInvestmentContributionsMinor = 0n;

  for (const item of input.items) {
    const id = item.id.trim();
    const label = item.label.trim();
    const itemCurrency = item.currency.trim().toUpperCase();

    if (!id) throw new Error("Calendar item id is required");
    if (seenIds.has(id)) throw new Error(`Duplicate calendar item: ${id}`);
    seenIds.add(id);

    if (!label) throw new Error(`Calendar item label is required: ${id}`);
    if (!Number.isInteger(item.dayOfMonth) || item.dayOfMonth < 1 || item.dayOfMonth > 31) {
      throw new Error(`Calendar dayOfMonth must be between 1 and 31: ${id}`);
    }
    if (item.amountMinor < 0n) throw new Error(`Calendar amount cannot be negative: ${id}`);
    if (itemCurrency !== currency) {
      throw new Error(`Calendar item currency mismatch: ${id}`);
    }
    if (item.enabled === false) continue;

    const scheduledDay = Math.min(item.dayOfMonth, monthDays);
    const adjustedToMonthEnd = scheduledDay !== item.dayOfMonth;
    const countsAsConsumerCommitment =
      item.kind === "obligation" || item.kind === "subscription";
    const usesInvestmentTransferClassification =
      item.kind === "investment_contribution";

    if (item.kind === "income") {
      totalIncomeMinor += item.amountMinor;
    } else if (usesInvestmentTransferClassification) {
      totalInvestmentContributionsMinor += item.amountMinor;
    } else {
      totalConsumerCommitmentsMinor += item.amountMinor;
    }

    occurrences.push(Object.freeze({
      itemId: id,
      label,
      kind: item.kind,
      scheduledDate: formatDate(input.month, scheduledDay),
      scheduledDay,
      adjustedToMonthEnd,
      amountMinor: item.amountMinor,
      currency,
      countsAsConsumerCommitment,
      usesInvestmentTransferClassification,
    }));
  }

  occurrences.sort(
    (a, b) =>
      a.scheduledDate.localeCompare(b.scheduledDate) ||
      a.kind.localeCompare(b.kind) ||
      a.itemId.localeCompare(b.itemId),
  );

  return Object.freeze({
    month: input.month,
    currency,
    occurrences: Object.freeze(occurrences),
    totalIncomeMinor,
    totalConsumerCommitmentsMinor,
    totalInvestmentContributionsMinor,
    investmentContributionsExcludedFromSpending: true,
    isReadOnly: true,
  });
}
