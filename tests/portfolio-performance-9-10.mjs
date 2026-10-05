import assert from "node:assert/strict";
import { derivePortfolioPerformanceReturns } from "../dist/packages/finance-core/src/portfolio-performance-returns.js";

const history = {
  tenantId: "tenant-1",
  portfolioId: "portfolio-1",
  currency: "USD",
  snapshots: [
    {
      id: "s0",
      tenantId: "tenant-1",
      portfolioId: "portfolio-1",
      asOf: "2026-01-01T00:00:00Z",
      marketValue: { amountMinor: 100000n, currency: "USD" },
      cashValue: { amountMinor: 0n, currency: "USD" },
      netContributions: { amountMinor: 100000n, currency: "USD" },
    },
    {
      id: "s1",
      tenantId: "tenant-1",
      portfolioId: "portfolio-1",
      asOf: "2026-07-01T00:00:00Z",
      marketValue: { amountMinor: 160000n, currency: "USD" },
      cashValue: { amountMinor: 0n, currency: "USD" },
      netContributions: { amountMinor: 150000n, currency: "USD" },
    },
    {
      id: "s2",
      tenantId: "tenant-1",
      portfolioId: "portfolio-1",
      asOf: "2027-01-01T00:00:00Z",
      marketValue: { amountMinor: 176000n, currency: "USD" },
      cashValue: { amountMinor: 0n, currency: "USD" },
      netContributions: { amountMinor: 150000n, currency: "USD" },
    },
  ],
};

const performance = derivePortfolioPerformanceReturns(history);
assert.equal(performance.netContributionsChange.amountMinor, 50000n);
assert.equal(performance.absolutePerformance.amountMinor, 26000n);
assert.ok(Math.abs(performance.twr - 0.21) < 1e-12);
assert.equal(performance.periods.length, 2);
assert.equal(performance.periods[0].externalFlow.amountMinor, 50000n);
assert.ok(performance.xirr !== null && performance.xirr > 0);

const noFlowHistory = {
  ...history,
  snapshots: [
    {
      ...history.snapshots[0],
      netContributions: { amountMinor: 100000n, currency: "USD" },
    },
    {
      ...history.snapshots[2],
      marketValue: { amountMinor: 121000n, currency: "USD" },
      netContributions: { amountMinor: 100000n, currency: "USD" },
    },
  ],
};
const noFlow = derivePortfolioPerformanceReturns(noFlowHistory);
assert.ok(Math.abs(noFlow.twr - 0.21) < 1e-12);
assert.ok(noFlow.xirr !== null && Math.abs(noFlow.xirr - 0.21) < 1e-9);
assert.equal(noFlow.absolutePerformance.amountMinor, 21000n);

assert.throws(() => derivePortfolioPerformanceReturns({
  ...history,
  snapshots: [
    history.snapshots[0],
    { ...history.snapshots[1], netContributions: undefined },
  ],
}), /requires netContributions/);

assert.throws(() => derivePortfolioPerformanceReturns({
  ...history,
  snapshots: [
    history.snapshots[0],
    { ...history.snapshots[1], marketValue: { amountMinor: 1n, currency: "COP" } },
  ],
}), /currency mismatch/);

console.log("Phase 9.10 TWR/XIRR regression passed");
