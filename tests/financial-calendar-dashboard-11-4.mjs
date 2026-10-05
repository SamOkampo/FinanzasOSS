import assert from "node:assert/strict";
import { buildFinancialCalendar } from "../dist/packages/finance-core/src/financial-calendar-dashboard.js";

const calendar = buildFinancialCalendar({
  month:"2026-02",
  currency:"cop",
  items:[
    { id:"salary", label:"Salary", kind:"income", dayOfMonth:5, amountMinor:3000000n, currency:"COP" },
    { id:"rent", label:"Rent", kind:"obligation", dayOfMonth:1, amountMinor:1200000n, currency:"cop" },
    { id:"music", label:"Music", kind:"subscription", dayOfMonth:31, amountMinor:25000n, currency:"COP" },
    { id:"dca", label:"Monthly contribution", kind:"investment_contribution", dayOfMonth:29, amountMinor:500000n, currency:"COP" },
    { id:"disabled", label:"Disabled", kind:"subscription", dayOfMonth:10, amountMinor:999n, currency:"COP", enabled:false },
  ],
});

assert.equal(calendar.month, "2026-02");
assert.equal(calendar.currency, "COP");
assert.equal(calendar.totalIncomeMinor, 3000000n);
assert.equal(calendar.totalConsumerCommitmentsMinor, 1225000n);
assert.equal(calendar.totalInvestmentContributionsMinor, 500000n);
assert.equal(calendar.investmentContributionsExcludedFromSpending, true);
assert.equal(calendar.isReadOnly, true);
assert.equal(calendar.occurrences.length, 4);

const subscription = calendar.occurrences.find((item) => item.itemId === "music");
assert.equal(subscription?.scheduledDate, "2026-02-28");
assert.equal(subscription?.adjustedToMonthEnd, true);
assert.equal(subscription?.countsAsConsumerCommitment, true);

const contribution = calendar.occurrences.find((item) => item.itemId === "dca");
assert.equal(contribution?.scheduledDate, "2026-02-28");
assert.equal(contribution?.usesInvestmentTransferClassification, true);
assert.equal(contribution?.countsAsConsumerCommitment, false);

assert.throws(() => buildFinancialCalendar({
  month:"2026-02",
  currency:"COP",
  items:[
    { id:"same", label:"A", kind:"obligation", dayOfMonth:1, amountMinor:1n, currency:"COP" },
    { id:"same", label:"B", kind:"obligation", dayOfMonth:2, amountMinor:1n, currency:"COP" },
  ],
}), /Duplicate calendar item/);

assert.throws(() => buildFinancialCalendar({
  month:"2026-02",
  currency:"COP",
  items:[
    { id:"usd", label:"USD", kind:"obligation", dayOfMonth:1, amountMinor:1n, currency:"USD" },
  ],
}), /currency mismatch/);

console.log("Phase 11.4 financial calendar regression passed");
