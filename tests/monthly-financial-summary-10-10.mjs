import assert from "node:assert/strict";
import { buildMonthlyFinancialSummary } from "../dist/packages/finance-core/src/monthly-financial-summary.js";

const summary = buildMonthlyFinancialSummary({
  month:"2026-10",
  currency:"cop",
  openingNetWorthMinor:10000000n,
  closingNetWorthMinor:11500000n,
  incomeMinor:3000000n,
  consumerExpenseMinor:1200000n,
  investmentContributionsMinor:800000n,
  investmentWithdrawalsMinor:100000n,
  investmentPerformanceMinor:250000n,
});
assert.equal(summary.currency, "COP");
assert.equal(summary.netWorthChangeMinor, 1500000n);
assert.equal(summary.consumerExpenseMinor, 1200000n);
assert.equal(summary.netInvestmentFlowMinor, 700000n);
assert.equal(summary.investmentPerformanceMinor, 250000n);
assert.equal(summary.investmentTransferExcludedFromSpending, true);
assert.equal(summary.completeness, "complete");
assert.equal(summary.isReadOnly, true);

const partial = buildMonthlyFinancialSummary({
  month:"2026-10",
  currency:"USD",
  openingNetWorthMinor:100000n,
  closingNetWorthMinor:90000n,
  incomeMinor:10000n,
  consumerExpenseMinor:15000n,
  investmentContributionsMinor:5000n,
  investmentWithdrawalsMinor:0n,
});
assert.equal(partial.netWorthChangeMinor, -10000n);
assert.equal(partial.investmentPerformanceMinor, null);
assert.equal(partial.completeness, "partial");

assert.throws(() => buildMonthlyFinancialSummary({
  month:"2026-10",
  currency:"COP",
  openingNetWorthMinor:1n,
  closingNetWorthMinor:1n,
  incomeMinor:0n,
  consumerExpenseMinor:-1n,
  investmentContributionsMinor:0n,
  investmentWithdrawalsMinor:0n,
}), /consumerExpenseMinor cannot be negative/);

assert.throws(() => buildMonthlyFinancialSummary({
  month:"2026-99",
  currency:"COP",
  openingNetWorthMinor:0n,
  closingNetWorthMinor:0n,
  incomeMinor:0n,
  consumerExpenseMinor:0n,
  investmentContributionsMinor:0n,
  investmentWithdrawalsMinor:0n,
}), /Month must use YYYY-MM/);

console.log("Phase 10.10 monthly financial summary regression passed");
