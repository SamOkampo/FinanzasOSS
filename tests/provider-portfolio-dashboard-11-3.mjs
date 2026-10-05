import assert from "node:assert/strict";
import { buildProviderPortfolioDashboard } from "../dist/packages/finance-core/src/provider-portfolio-dashboard.js";

const wealth = {
  reportingCurrency:"COP",
  totalValue:{ amountMinor:6000000n, currency:"COP" },
  netContributions:{ amountMinor:5000000n, currency:"COP" },
  netPerformance:{ amountMinor:1000000n, currency:"COP" },
  entries:[
    {
      portfolioId:"p-hapi",
      name:"Hapi",
      status:"active",
      includedInTotal:true,
      issue:null,
      totalValue:{ amountMinor:4000000n, currency:"COP" },
      netContributions:{ amountMinor:3500000n, currency:"COP" },
      netPerformance:{ amountMinor:500000n, currency:"COP" },
    },
    {
      portfolioId:"p-binance",
      name:"Binance",
      status:"active",
      includedInTotal:true,
      issue:null,
      totalValue:{ amountMinor:2000000n, currency:"COP" },
      netContributions:{ amountMinor:1500000n, currency:"COP" },
      netPerformance:{ amountMinor:500000n, currency:"COP" },
    },
    {
      portfolioId:"p-ibkr",
      name:"IBKR USD",
      status:"active",
      includedInTotal:false,
      issue:"currency_mismatch",
      totalValue:{ amountMinor:100000n, currency:"USD" },
      netContributions:{ amountMinor:90000n, currency:"USD" },
      netPerformance:{ amountMinor:10000n, currency:"USD" },
    },
  ],
  includedPortfolioIds:["p-hapi","p-binance"],
  excludedPortfolioIds:["p-ibkr"],
  incompletePortfolioIds:[],
  isComplete:false,
};

const dashboard = buildProviderPortfolioDashboard({
  portfolioWealth:wealth,
  assignments:[
    { portfolioId:"p-hapi", providerId:"hapi", providerName:"Hapi" },
    { portfolioId:"p-binance", providerId:"binance", providerName:"Binance" },
    { portfolioId:"p-ibkr", providerId:"ibkr", providerName:"Interactive Brokers" },
  ],
});

assert.equal(dashboard.reportingCurrency, "COP");
assert.equal(dashboard.consolidatedTotalValueMinor, 6000000n);
assert.equal(dashboard.providers.length, 2);
assert.equal(dashboard.providers.find((provider) => provider.providerId === "hapi")?.totalValueMinor, 4000000n);
assert.equal(dashboard.providers.find((provider) => provider.providerId === "binance")?.netPerformanceMinor, 500000n);
assert.deepEqual(dashboard.excludedPortfolioIds, ["p-ibkr"]);
assert.equal(dashboard.providerBreakdownComplete, true);
assert.equal(dashboard.isComplete, false);
assert.equal(dashboard.isReadOnly, true);

const unassigned = buildProviderPortfolioDashboard({
  portfolioWealth:{ ...wealth, excludedPortfolioIds:[], isComplete:true },
  assignments:[
    { portfolioId:"p-hapi", providerId:"hapi", providerName:"Hapi" },
    { portfolioId:"p-ibkr", providerId:"ibkr", providerName:"Interactive Brokers" },
  ],
});
assert.deepEqual(unassigned.unassignedPortfolioIds, ["p-binance"]);
assert.equal(unassigned.providerBreakdownComplete, false);
assert.equal(unassigned.isComplete, false);
assert.equal(unassigned.consolidatedTotalValueMinor, 6000000n);

assert.throws(() => buildProviderPortfolioDashboard({
  portfolioWealth:wealth,
  assignments:[
    { portfolioId:"p-hapi", providerId:"hapi", providerName:"Hapi" },
    { portfolioId:"p-hapi", providerId:"other", providerName:"Other" },
  ],
}), /Duplicate provider assignment/);

assert.throws(() => buildProviderPortfolioDashboard({
  portfolioWealth:wealth,
  assignments:[
    { portfolioId:"p-hapi", providerId:"provider-1", providerName:"Provider A" },
    { portfolioId:"p-binance", providerId:"provider-1", providerName:"Provider B" },
  ],
}), /Conflicting provider name/);

assert.throws(() => buildProviderPortfolioDashboard({
  portfolioWealth:wealth,
  assignments:[
    { portfolioId:"missing", providerId:"provider-1", providerName:"Provider A" },
  ],
}), /unknown portfolio/);

console.log("Phase 11.3 provider portfolio dashboard regression passed");
