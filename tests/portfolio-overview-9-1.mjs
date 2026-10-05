import assert from "node:assert/strict";
import { aggregatePortfolioWealth } from "../dist/packages/finance-core/src/portfolio-aggregation.js";
import { buildPortfolioOverview } from "../dist/apps/web/src/portfolio-overview.js";

function completeness(isComplete = true) {
  return {
    isComplete,
    excludedCurrencies: [],
    positionsWithoutMarketValue: isComplete ? 0 : 1,
    positionsWithoutUnrealizedPnl: 0,
    sellActivitiesWithoutRealizedPnl: 0,
    cashValueMissing: false,
  };
}

const portfolios = [
  { id: "p1", tenantId: "t1", name: "Broker COP", baseCurrency: "COP", status: "active", accountIds: ["a1"] },
  { id: "p2", tenantId: "t1", name: "Crypto COP", baseCurrency: "COP", status: "active", accountIds: ["a2"] },
  { id: "p3", tenantId: "t1", name: "Broker USD", baseCurrency: "USD", status: "active", accountIds: ["a3"] },
  { id: "p4", tenantId: "t1", name: "Archivado", baseCurrency: "COP", status: "archived", accountIds: ["a4"] },
];

const metrics = [
  {
    portfolioId: "p1",
    baseCurrency: "COP",
    asOf: "2026-10-04T12:00:00.000Z",
    marketValue: { amountMinor: 900000n, currency: "COP" },
    cashValue: { amountMinor: 100000n, currency: "COP" },
    totalValue: { amountMinor: 1000000n, currency: "COP" },
    netContributions: { amountMinor: 800000n, currency: "COP" },
    realizedPnl: { amountMinor: 0n, currency: "COP" },
    unrealizedPnl: { amountMinor: 150000n, currency: "COP" },
    income: { amountMinor: 50000n, currency: "COP" },
    fees: { amountMinor: 0n, currency: "COP" },
    taxes: { amountMinor: 0n, currency: "COP" },
    netPerformance: { amountMinor: 200000n, currency: "COP" },
    completeness: completeness(true),
  },
  {
    portfolioId: "p2",
    baseCurrency: "COP",
    asOf: "2026-10-04T12:00:00.000Z",
    marketValue: { amountMinor: 500000n, currency: "COP" },
    cashValue: { amountMinor: 0n, currency: "COP" },
    totalValue: { amountMinor: 500000n, currency: "COP" },
    netContributions: { amountMinor: 450000n, currency: "COP" },
    realizedPnl: { amountMinor: 0n, currency: "COP" },
    unrealizedPnl: { amountMinor: 50000n, currency: "COP" },
    income: { amountMinor: 0n, currency: "COP" },
    fees: { amountMinor: 0n, currency: "COP" },
    taxes: { amountMinor: 0n, currency: "COP" },
    netPerformance: { amountMinor: 50000n, currency: "COP" },
    completeness: completeness(false),
  },
  {
    portfolioId: "p3",
    baseCurrency: "USD",
    asOf: "2026-10-04T12:00:00.000Z",
    marketValue: { amountMinor: 25000n, currency: "USD" },
    cashValue: { amountMinor: 0n, currency: "USD" },
    totalValue: { amountMinor: 25000n, currency: "USD" },
    netContributions: { amountMinor: 20000n, currency: "USD" },
    realizedPnl: { amountMinor: 0n, currency: "USD" },
    unrealizedPnl: { amountMinor: 5000n, currency: "USD" },
    income: { amountMinor: 0n, currency: "USD" },
    fees: { amountMinor: 0n, currency: "USD" },
    taxes: { amountMinor: 0n, currency: "USD" },
    netPerformance: { amountMinor: 5000n, currency: "USD" },
    completeness: completeness(true),
  },
];

const aggregate = aggregatePortfolioWealth({ reportingCurrency: "cop", portfolios, metrics });
assert.equal(aggregate.reportingCurrency, "COP");
assert.equal(aggregate.totalValue.amountMinor, 1500000n);
assert.equal(aggregate.netContributions.amountMinor, 1250000n);
assert.equal(aggregate.netPerformance.amountMinor, 250000n);
assert.deepEqual(aggregate.includedPortfolioIds, ["p1", "p2"]);
assert.deepEqual(aggregate.excludedPortfolioIds, ["p3"]);
assert.deepEqual(aggregate.incompletePortfolioIds, ["p2"]);
assert.equal(aggregate.isComplete, false);
assert.equal(aggregate.entries.find((entry) => entry.portfolioId === "p3").issue, "currency_mismatch");
assert.equal(aggregate.entries.find((entry) => entry.portfolioId === "p4").includedInTotal, false);

const overview = buildPortfolioOverview({
  reportingCurrency: "COP",
  portfolios,
  metrics,
  privacyMode: true,
});
assert.equal(overview.title, "Portafolios");
assert.equal(overview.totalValueMinor, 1500000n);
assert.equal(overview.totalVisibility, "masked");
assert.equal(overview.dataQuality, "attention");
assert.equal(overview.readOnly, true);
assert.equal(overview.cards.length, 4);
assert.ok(overview.cards.every((card) => card.valueVisibility === "masked"));
assert.equal(overview.excludedCount, 1);
assert.equal(overview.attentionCount, 1);

assert.throws(
  () => aggregatePortfolioWealth({ reportingCurrency: "COP", portfolios: [portfolios[0]], metrics: [metrics[0], metrics[0]] }),
  /Duplicate metrics/,
);

console.log("portfolio aggregation and overview 9.1: ok");
