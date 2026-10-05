export interface MonthlyContributionRecord {
  id: string;
  month: string;
  amountMinor: bigint;
  currency: string;
  reconciliationStatus: "reconciled" | "unreconciled";
  transferGroupId?: string | null;
}

export type ContributionAlertKind = "missing" | "duplicate" | "unreconciled";

export interface ContributionAlert {
  kind: ContributionAlertKind;
  severity: "info" | "warning";
  month: string;
  currency: string;
  amountMinor?: bigint;
  recordIds: readonly string[];
  message: string;
}

function assertMonth(month: string): void {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new Error("Month must use YYYY-MM");
}

export function buildMonthlyContributionAlerts(input: {
  month: string;
  currency: string;
  targetContributionMinor: bigint;
  records: readonly MonthlyContributionRecord[];
}): readonly ContributionAlert[] {
  assertMonth(input.month);
  const currency = input.currency.trim().toUpperCase();
  if (!currency) throw new Error("Contribution alert currency is required");
  if (input.targetContributionMinor < 0n) throw new Error("targetContributionMinor cannot be negative");

  const records = input.records.filter((record) => {
    assertMonth(record.month);
    if (record.amountMinor < 0n) throw new Error("Contribution amount cannot be negative");
    return record.month === input.month && record.currency.trim().toUpperCase() === currency;
  });

  const alerts: ContributionAlert[] = [];
  const unreconciled = records.filter((record) => record.reconciliationStatus === "unreconciled");
  for (const record of unreconciled) {
    alerts.push({
      kind: "unreconciled",
      severity: "warning",
      month: input.month,
      currency,
      amountMinor: record.amountMinor,
      recordIds: [record.id],
      message: "Contribution-like movement is not reconciled to an investment-side record",
    });
  }

  const byTransferGroup = new Map<string, MonthlyContributionRecord[]>();
  for (const record of records) {
    const transferGroupId = record.transferGroupId?.trim();
    if (!transferGroupId) continue;
    const bucket = byTransferGroup.get(transferGroupId) ?? [];
    bucket.push(record);
    byTransferGroup.set(transferGroupId, bucket);
  }
  for (const bucket of byTransferGroup.values()) {
    if (bucket.length < 2) continue;
    alerts.push({
      kind: "duplicate",
      severity: "warning",
      month: input.month,
      currency,
      recordIds: bucket.map((record) => record.id),
      message: "Multiple contribution records share the same transferGroupId and require review",
    });
  }

  const reconciledUnique = records.filter((record) => record.reconciliationStatus === "reconciled");
  const seenGroups = new Set<string>();
  let reconciledTotal = 0n;
  for (const record of reconciledUnique) {
    const group = record.transferGroupId?.trim();
    if (group) {
      if (seenGroups.has(group)) continue;
      seenGroups.add(group);
    }
    reconciledTotal += record.amountMinor;
  }

  if (input.targetContributionMinor > reconciledTotal) {
    alerts.push({
      kind: "missing",
      severity: "info",
      month: input.month,
      currency,
      amountMinor: input.targetContributionMinor - reconciledTotal,
      recordIds: [],
      message: "Reconciled monthly contributions are below the user-defined target",
    });
  }

  return alerts;
}
