import assert from "node:assert/strict";
import { buildGoalProgressDashboard } from "../dist/packages/finance-core/src/goal-progress-dashboard.js";

const dashboard = buildGoalProgressDashboard({
  currency:"cop",
  goals:[
    {
      id:"emergency",
      name:"Emergency fund",
      kind:"emergency_fund",
      currency:"COP",
      baselineMinor:0n,
      currentMinor:3000000n,
      targetMinor:6000000n,
      targetDate:"2027-06-30",
    },
    {
      id:"debt",
      name:"Credit debt",
      kind:"debt_reduction",
      currency:"cop",
      baselineMinor:4000000n,
      currentMinor:1000000n,
      targetMinor:0n,
    },
    {
      id:"invest",
      name:"Investment goal",
      kind:"investment_contribution",
      currency:"COP",
      baselineMinor:1000000n,
      currentMinor:6000000n,
      targetMinor:5000000n,
    },
    {
      id:"away",
      name:"Savings moving away",
      kind:"custom",
      currency:"COP",
      baselineMinor:2000000n,
      currentMinor:1500000n,
      targetMinor:5000000n,
    },
  ],
});

const emergency = dashboard.goals.find((goal) => goal.id === "emergency");
assert.equal(emergency?.direction, "increase");
assert.equal(emergency?.progressBasisPoints, 5000);
assert.equal(emergency?.remainingMinor, 3000000n);
assert.equal(emergency?.status, "in_progress");

const debt = dashboard.goals.find((goal) => goal.id === "debt");
assert.equal(debt?.direction, "decrease");
assert.equal(debt?.progressBasisPoints, 7500);
assert.equal(debt?.remainingMinor, 1000000n);

const invest = dashboard.goals.find((goal) => goal.id === "invest");
assert.equal(invest?.progressBasisPoints, 10000);
assert.equal(invest?.remainingMinor, 0n);
assert.equal(invest?.status, "complete");

const away = dashboard.goals.find((goal) => goal.id === "away");
assert.equal(away?.progressBasisPoints, 0);
assert.equal(away?.status, "moving_away");

assert.deepEqual(dashboard.completedGoalIds, ["invest"]);
assert.deepEqual(dashboard.incompleteGoalIds, ["away","debt","emergency"]);
assert.equal(dashboard.isReadOnly, true);
assert.equal(dashboard.isAdvisory, false);

assert.throws(() => buildGoalProgressDashboard({
  currency:"COP",
  goals:[
    { id:"same", name:"A", kind:"custom", currency:"COP", baselineMinor:0n, currentMinor:0n, targetMinor:1n },
    { id:"same", name:"B", kind:"custom", currency:"COP", baselineMinor:0n, currentMinor:0n, targetMinor:2n },
  ],
}), /Duplicate goal/);

assert.throws(() => buildGoalProgressDashboard({
  currency:"COP",
  goals:[
    { id:"flat", name:"Flat", kind:"custom", currency:"COP", baselineMinor:5n, currentMinor:5n, targetMinor:5n },
  ],
}), /target must differ from baseline/);

console.log("Phase 11.5 goal progress dashboard regression passed");
