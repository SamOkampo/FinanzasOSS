export type FinancialGoalKind =
  | "emergency_fund"
  | "debt_reduction"
  | "net_worth"
  | "investment_contribution"
  | "custom";

export type FinancialGoalStatus =
  | "not_started"
  | "in_progress"
  | "moving_away"
  | "complete";

export interface FinancialGoalInput {
  id: string;
  name: string;
  kind: FinancialGoalKind;
  currency: string;
  baselineMinor: bigint;
  currentMinor: bigint;
  targetMinor: bigint;
  targetDate?: string;
}

export interface FinancialGoalProgress {
  id: string;
  name: string;
  kind: FinancialGoalKind;
  currency: string;
  baselineMinor: bigint;
  currentMinor: bigint;
  targetMinor: bigint;
  direction: "increase" | "decrease";
  progressBasisPoints: number;
  remainingMinor: bigint;
  status: FinancialGoalStatus;
  targetDate: string | null;
}

export interface GoalProgressDashboard {
  currency: string;
  goals: readonly FinancialGoalProgress[];
  completedGoalIds: readonly string[];
  incompleteGoalIds: readonly string[];
  isReadOnly: true;
  isAdvisory: false;
}

function isValidDateOnly(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function abs(value: bigint): bigint {
  return value < 0n ? -value : value;
}

export function buildGoalProgressDashboard(input: {
  currency: string;
  goals: readonly FinancialGoalInput[];
}): GoalProgressDashboard {
  const currency = input.currency.trim().toUpperCase();
  if (!currency) throw new Error("Goal dashboard currency is required");

  const seenIds = new Set<string>();
  const goals: FinancialGoalProgress[] = [];
  const completedGoalIds: string[] = [];
  const incompleteGoalIds: string[] = [];

  for (const goal of input.goals) {
    const id = goal.id.trim();
    const name = goal.name.trim();
    const goalCurrency = goal.currency.trim().toUpperCase();

    if (!id) throw new Error("Goal id is required");
    if (seenIds.has(id)) throw new Error(`Duplicate goal: ${id}`);
    seenIds.add(id);

    if (!name) throw new Error(`Goal name is required: ${id}`);
    if (goalCurrency !== currency) throw new Error(`Goal currency mismatch: ${id}`);
    if (goal.targetMinor === goal.baselineMinor) {
      throw new Error(`Goal target must differ from baseline: ${id}`);
    }
    if (goal.targetDate !== undefined && !isValidDateOnly(goal.targetDate)) {
      throw new Error(`Goal targetDate must use YYYY-MM-DD: ${id}`);
    }

    const direction = goal.targetMinor > goal.baselineMinor ? "increase" as const : "decrease" as const;
    const targetDistance = abs(goal.targetMinor - goal.baselineMinor);
    const progressedDistance =
      direction === "increase"
        ? goal.currentMinor - goal.baselineMinor
        : goal.baselineMinor - goal.currentMinor;

    const isComplete =
      direction === "increase"
        ? goal.currentMinor >= goal.targetMinor
        : goal.currentMinor <= goal.targetMinor;

    let progressBasisPoints = 0;
    if (isComplete) {
      progressBasisPoints = 10000;
    } else if (progressedDistance > 0n) {
      progressBasisPoints = Number((progressedDistance * 10000n) / targetDistance);
    }

    const movingAway =
      direction === "increase"
        ? goal.currentMinor < goal.baselineMinor
        : goal.currentMinor > goal.baselineMinor;

    const status: FinancialGoalStatus =
      isComplete
        ? "complete"
        : movingAway
          ? "moving_away"
          : goal.currentMinor === goal.baselineMinor
            ? "not_started"
            : "in_progress";

    const remainingMinor = isComplete ? 0n : abs(goal.targetMinor - goal.currentMinor);

    goals.push(Object.freeze({
      id,
      name,
      kind: goal.kind,
      currency,
      baselineMinor: goal.baselineMinor,
      currentMinor: goal.currentMinor,
      targetMinor: goal.targetMinor,
      direction,
      progressBasisPoints,
      remainingMinor,
      status,
      targetDate: goal.targetDate ?? null,
    }));

    if (isComplete) completedGoalIds.push(id);
    else incompleteGoalIds.push(id);
  }

  goals.sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));

  return Object.freeze({
    currency,
    goals: Object.freeze(goals),
    completedGoalIds: Object.freeze([...completedGoalIds].sort()),
    incompleteGoalIds: Object.freeze([...incompleteGoalIds].sort()),
    isReadOnly: true,
    isAdvisory: false,
  });
}
