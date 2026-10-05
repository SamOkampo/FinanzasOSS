import assert from "node:assert/strict";
import { detectSpendingAnomalies, forecastMonthlyCashFlow } from "../dist/packages/finance-core/src/spending-intelligence.js";

const anomalies = detectSpendingAnomalies([
  { id:"1", postedAt:"2026-01-01T00:00:00Z", amountMinor:10000n, currency:"COP", direction:"debit", status:"posted", economicClass:"expense", merchantKey:"uber" },
  { id:"2", postedAt:"2026-01-10T00:00:00Z", amountMinor:11000n, currency:"COP", direction:"debit", status:"posted", economicClass:"expense", merchantKey:"uber" },
  { id:"3", postedAt:"2026-01-20T00:00:00Z", amountMinor:9000n, currency:"COP", direction:"debit", status:"posted", economicClass:"expense", merchantKey:"uber" },
  { id:"4", postedAt:"2026-02-01T00:00:00Z", amountMinor:35000n, currency:"COP", direction:"debit", status:"posted", economicClass:"expense", merchantKey:"uber" },
]);
assert.equal(anomalies.length, 1);
assert.equal(anomalies[0]?.merchantKey, "uber");
assert.equal(anomalies[0]?.confidence, "high");
assert.equal(anomalies[0]?.needsReview, true);

const protectedAnomaly = detectSpendingAnomalies([
  { id:"1", postedAt:"2026-01-01T00:00:00Z", amountMinor:10000n, currency:"COP", direction:"debit", status:"posted", economicClass:"expense", merchantKey:"broker", transactionType:"investment_transfer" },
  { id:"2", postedAt:"2026-01-10T00:00:00Z", amountMinor:10000n, currency:"COP", direction:"debit", status:"posted", economicClass:"expense", merchantKey:"broker", transactionType:"investment_transfer" },
  { id:"3", postedAt:"2026-01-20T00:00:00Z", amountMinor:10000n, currency:"COP", direction:"debit", status:"posted", economicClass:"expense", merchantKey:"broker", transactionType:"investment_transfer" },
  { id:"4", postedAt:"2026-02-01T00:00:00Z", amountMinor:50000n, currency:"COP", direction:"debit", status:"posted", economicClass:"expense", merchantKey:"broker", transactionType:"investment_transfer" },
]);
assert.equal(protectedAnomaly.length, 0);

const forecast = forecastMonthlyCashFlow([
  { id:"i1", postedAt:"2026-01-05T00:00:00Z", amountMinor:3000000n, currency:"COP", direction:"credit", status:"posted", economicClass:"income" },
  { id:"e1", postedAt:"2026-01-15T00:00:00Z", amountMinor:1000000n, currency:"COP", direction:"debit", status:"posted", economicClass:"expense" },
  { id:"i2", postedAt:"2026-02-05T00:00:00Z", amountMinor:3000000n, currency:"COP", direction:"credit", status:"posted", economicClass:"income" },
  { id:"e2", postedAt:"2026-02-15T00:00:00Z", amountMinor:1200000n, currency:"COP", direction:"debit", status:"posted", economicClass:"expense" },
  { id:"i3", postedAt:"2026-03-05T00:00:00Z", amountMinor:3000000n, currency:"COP", direction:"credit", status:"posted", economicClass:"income" },
  { id:"e3", postedAt:"2026-03-15T00:00:00Z", amountMinor:1100000n, currency:"COP", direction:"debit", status:"posted", economicClass:"expense" },
  { id:"x", postedAt:"2026-03-20T00:00:00Z", amountMinor:900000n, currency:"COP", direction:"debit", status:"posted", economicClass:"investment_flow", transactionType:"investment_transfer" },
], "2026-04-10T00:00:00Z", 3);
assert.ok(forecast);
assert.equal(forecast.completedMonthsUsed, 3);
assert.equal(forecast.averageMonthlyIncomeMinor, 3000000n);
assert.equal(forecast.averageMonthlyExpenseMinor, 1100000n);
assert.equal(forecast.forecastNetCashFlowMinor, 1900000n);
assert.equal(forecast.confidence, "medium");
assert.equal(forecast.isEstimate, true);

const multicurrency = forecastMonthlyCashFlow([
  { id:"1", postedAt:"2026-01-01T00:00:00Z", amountMinor:100n, currency:"COP", direction:"credit", status:"posted", economicClass:"income" },
  { id:"2", postedAt:"2026-02-01T00:00:00Z", amountMinor:100n, currency:"USD", direction:"credit", status:"posted", economicClass:"income" },
], "2026-03-01T00:00:00Z", 2);
assert.equal(multicurrency, null);

console.log("Phase 10.4 spending anomaly and cash-flow forecast regression passed");
