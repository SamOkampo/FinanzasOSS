import assert from "node:assert/strict";
import { buildCashFlowBudgetDashboard } from "../dist/packages/finance-core/src/cash-flow-budget-dashboard.js";

const dashboard = buildCashFlowBudgetDashboard({
  month:"2026-10",
  currency:"cop",
  incomeMinor:3000000n,
  consumerExpenseMinor:1400000n,
  investmentTransferMinor:500000n,
  budgetTargets:[
    { categoryKey:"food", budgetMinor:600000n },
    { categoryKey:"transport", budgetMinor:300000n },
  ],
  budgetActuals:[
    { categoryKey:"food", spentMinor:650000n },
    { categoryKey:"transport", spentMinor:200000n },
    { categoryKey:"entertainment", spentMinor:100000n },
  ],
});
assert.equal(dashboard.currency, "COP");
assert.equal(dashboard.economicCashFlowMinor, 1600000n);
assert.equal(dashboard.investmentTransferExcludedFromSpending, true);
assert.equal(dashboard.investmentTransferMinor, 500000n);
assert.equal(dashboard.totalBudgetMinor, 900000n);
assert.equal(dashboard.totalBudgetedSpendMinor, 850000n);
assert.equal(dashboard.totalUnbudgetedSpendMinor, 100000n);

const food = dashboard.budgetLines.find((line) => line.categoryKey === "food");
assert.equal(food?.status, "over_budget");
assert.equal(food?.overBudgetMinor, 50000n);
const entertainment = dashboard.budgetLines.find((line) => line.categoryKey === "entertainment");
assert.equal(entertainment?.status, "unbudgeted");

assert.throws(() => buildCashFlowBudgetDashboard({
  month:"2026-10",
  currency:"COP",
  incomeMinor:0n,
  consumerExpenseMinor:0n,
  investmentTransferMinor:0n,
  budgetTargets:[
    { categoryKey:"food", budgetMinor:10n },
    { categoryKey:"food", budgetMinor:20n },
  ],
  budgetActuals:[],
}), /Duplicate budget target/);

console.log("Phase 11.2 cash-flow budget dashboard regression passed");
