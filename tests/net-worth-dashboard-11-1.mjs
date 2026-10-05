import assert from "node:assert/strict";
import { buildNetWorthDashboard } from "../dist/packages/finance-core/src/net-worth-dashboard.js";

const portfolioWealth = {
  reportingCurrency:"COP",
  totalValue:{ amountMinor:4000000n, currency:"COP" },
  netContributions:{ amountMinor:3000000n, currency:"COP" },
  netPerformance:{ amountMinor:1000000n, currency:"COP" },
  entries:[],
  includedPortfolioIds:["p1"],
  excludedPortfolioIds:[],
  incompletePortfolioIds:[],
  isComplete:true,
};

const dashboard = buildNetWorthDashboard({
  reportingCurrency:"cop",
  cashBalances:[
    { accountId:"cash-1", amountMinor:3000000n, currency:"COP" },
    { accountId:"cash-2", amountMinor:2000000n, currency:"COP" },
  ],
  creditLiabilities:[
    { accountId:"card-1", outstandingMinor:1500000n, currency:"COP" },
  ],
  portfolioWealth,
});
assert.equal(dashboard.reportingCurrency, "COP");
assert.equal(dashboard.cashAssetsMinor, 5000000n);
assert.equal(dashboard.investmentAssetsMinor, 4000000n);
assert.equal(dashboard.totalAssetsMinor, 9000000n);
assert.equal(dashboard.creditLiabilitiesMinor, 1500000n);
assert.equal(dashboard.netWorthMinor, 7500000n);
assert.equal(dashboard.creditLimitIncludedAsAsset, false);
assert.equal(dashboard.isComplete, true);

const incomplete = buildNetWorthDashboard({
  reportingCurrency:"COP",
  cashBalances:[
    { accountId:"cash-cop", amountMinor:1000000n, currency:"COP" },
    { accountId:"cash-usd", amountMinor:50000n, currency:"USD" },
  ],
  creditLiabilities:[
    { accountId:"card-usd", outstandingMinor:10000n, currency:"USD" },
  ],
  portfolioWealth:{ ...portfolioWealth, isComplete:false },
});
assert.deepEqual(incomplete.excludedCashAccountIds, ["cash-usd"]);
assert.deepEqual(incomplete.excludedCreditAccountIds, ["card-usd"]);
assert.equal(incomplete.isComplete, false);

assert.throws(() => buildNetWorthDashboard({
  reportingCurrency:"COP",
  cashBalances:[{ accountId:"bad", amountMinor:-1n, currency:"COP" }],
  creditLiabilities:[],
  portfolioWealth,
}), /Cash balance cannot be negative/);

assert.throws(() => buildNetWorthDashboard({
  reportingCurrency:"USD",
  cashBalances:[],
  creditLiabilities:[],
  portfolioWealth,
}), /portfolio wealth reporting currency mismatch/);

console.log("Phase 11.1 net-worth dashboard regression passed");
