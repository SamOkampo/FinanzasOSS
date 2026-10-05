export interface ContributionPlannerInput {
  currency: string;
  safeToSpendMinor: bigint;
  targetContributionMinor: bigint;
  contributedThisPeriodMinor: bigint;
  userCapMinor?: bigint | null;
}

export interface ContributionPlannerResult {
  currency: string;
  targetContributionMinor: bigint;
  contributedThisPeriodMinor: bigint;
  remainingTargetMinor: bigint;
  availableForContributionMinor: bigint;
  suggestedContributionMinor: bigint;
  status: "complete" | "not_available" | "partial" | "target_available";
  isEstimate: true;
  transactionKindIfExecuted: "investment_transfer";
  reasons: readonly string[];
}

function assertNonNegative(value: bigint, label: string): void {
  if (value < 0n) throw new Error(`${label} cannot be negative`);
}

function minBigInt(a: bigint, b: bigint): bigint {
  return a < b ? a : b;
}

export function planContribution(input: ContributionPlannerInput): ContributionPlannerResult {
  const currency = input.currency.trim().toUpperCase();
  if (!currency) throw new Error("Contribution planner currency is required");

  assertNonNegative(input.safeToSpendMinor, "safeToSpendMinor");
  assertNonNegative(input.targetContributionMinor, "targetContributionMinor");
  assertNonNegative(input.contributedThisPeriodMinor, "contributedThisPeriodMinor");
  if (input.userCapMinor !== null && input.userCapMinor !== undefined) {
    assertNonNegative(input.userCapMinor, "userCapMinor");
  }

  const remainingTargetMinor =
    input.targetContributionMinor > input.contributedThisPeriodMinor
      ? input.targetContributionMinor - input.contributedThisPeriodMinor
      : 0n;

  const capMinor = input.userCapMinor ?? input.safeToSpendMinor;
  const availableForContributionMinor = minBigInt(input.safeToSpendMinor, capMinor);
  const suggestedContributionMinor = minBigInt(remainingTargetMinor, availableForContributionMinor);

  let status: ContributionPlannerResult["status"];
  if (remainingTargetMinor === 0n) status = "complete";
  else if (suggestedContributionMinor === 0n) status = "not_available";
  else if (suggestedContributionMinor < remainingTargetMinor) status = "partial";
  else status = "target_available";

  return {
    currency,
    targetContributionMinor: input.targetContributionMinor,
    contributedThisPeriodMinor: input.contributedThisPeriodMinor,
    remainingTargetMinor,
    availableForContributionMinor,
    suggestedContributionMinor,
    status,
    isEstimate: true,
    transactionKindIfExecuted: "investment_transfer",
    reasons: [
      "planner never exceeds the conservative safe-to-spend amount",
      "planner never exceeds the remaining user-defined contribution target",
      input.userCapMinor !== null && input.userCapMinor !== undefined
        ? "user contribution cap further limits the estimate"
        : "no additional user cap was supplied",
      "suggested amount is an estimate, not a guarantee or instruction to move money",
    ],
  };
}
