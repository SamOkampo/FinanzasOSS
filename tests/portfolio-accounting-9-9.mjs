import assert from "node:assert/strict";
import { derivePortfolioAccountingSummary } from "../dist/packages/finance-core/src/portfolio-accounting-summary.js";

const portfolio = {
  id: "portfolio-1",
  tenantId: "tenant-1",
  name: "Synthetic Portfolio",
  baseCurrency: "USD",
  status: "active",
  accountIds: ["broker-account"],
};
const positions = [
  {
    id: "position-1",
    tenantId: "tenant-1",
    portfolioId: "portfolio-1",
    accountId: "broker-account",
    assetId: "asset-1",
    quantity: "10",
    costBasis: { amountMinor: 100000n, currency: "USD" },
    unrealizedPnl: { amountMinor: 25000n, currency: "USD" },
    asOf: "2026-03-31T23:59:59Z",
  },
  {
    id: "position-2",
    tenantId: "tenant-1",
    portfolioId: "portfolio-1",
    accountId: "broker-account",
    assetId: "asset-2",
    quantity: "5",
    costBasis: { amountMinor: 50000n, currency: "USD" },
    unrealizedPnl: { amountMinor: -5000n, currency: "USD" },
    asOf: "2026-03-31T23:59:59Z",
  },
];
const baseActivity = {
  tenantId: "tenant-1",
  portfolioId: "portfolio-1",
  accountId: "broker-account",
  occurredAt: "2026-03-15T12:00:00Z",
};
const activities = [
  { ...baseActivity, id: "sell-1", kind: "sell", realizedPnl: { amountMinor: 12000n, currency: "USD" } },
  { ...baseActivity, id: "dividend-1", kind: "dividend", cashAmount: { amountMinor: 3000n, currency: "USD" } },
  { ...baseActivity, id: "interest-1", kind: "interest", cashAmount: { amountMinor: 1000n, currency: "USD" } },
  { ...baseActivity, id: "buy-1", kind: "buy", fee: { amountMinor: 500n, currency: "USD" } },
  { ...baseActivity, id: "fee-1", kind: "fee", cashAmount: { amountMinor: 200n, currency: "USD" } },
  { ...baseActivity, id: "tax-1", kind: "tax", cashAmount: { amountMinor: 800n, currency: "USD" } },
];

const summary = derivePortfolioAccountingSummary(portfolio, positions, activities);
assert.equal(summary.costBasis.amountMinor, 150000n);
assert.equal(summary.unrealizedPnl.amountMinor, 20000n);
assert.equal(summary.realizedPnl.amountMinor, 12000n);
assert.equal(summary.dividends.amountMinor, 3000n);
assert.equal(summary.interest.amountMinor, 1000n);
assert.equal(summary.fees.amountMinor, 700n);
assert.equal(summary.taxes.amountMinor, 800n);
assert.equal(summary.isComplete, true);

const incomplete = derivePortfolioAccountingSummary(portfolio, [{ ...positions[0], costBasis: undefined }], activities);
assert.equal(incomplete.costBasis, null);
assert.equal(incomplete.missing.positionsWithoutCostBasis, 1);
assert.equal(incomplete.isComplete, false);

const currencyMismatch = derivePortfolioAccountingSummary(
  portfolio,
  [{ ...positions[0], costBasis: { amountMinor: 1n, currency: "COP" } }],
  activities,
);
assert.equal(currencyMismatch.costBasis, null);
assert.deepEqual(currencyMismatch.excludedCurrencies, ["COP"]);

assert.throws(() => derivePortfolioAccountingSummary(
  portfolio,
  positions,
  [{ ...baseActivity, id: "fee-negative", kind: "fee", cashAmount: { amountMinor: -1n, currency: "USD" } }],
), /cannot be negative/);

console.log("Phase 9.9 portfolio accounting regression passed");
