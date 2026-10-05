import assert from "node:assert/strict";
import { buildNetWorthHistoryDashboard } from "../dist/packages/finance-core/src/net-worth-history-dashboard.js";

const dashboard = buildNetWorthHistoryDashboard({
  currency:"cop",
  snapshots:[
    {
      asOf:"2026-10-01T00:00:00Z",
      cashAssetsMinor:5000000n,
      investmentAssetsMinor:4000000n,
      creditLiabilitiesMinor:1000000n,
      currency:"COP",
    },
    {
      asOf:"2026-10-31T23:59:59Z",
      cashAssetsMinor:5200000n,
      investmentAssetsMinor:4800000n,
      creditLiabilitiesMinor:800000n,
      currency:"cop",
    },
    {
      asOf:"2026-11-30T23:59:59Z",
      cashAssetsMinor:5300000n,
      investmentAssetsMinor:4900000n,
      creditLiabilitiesMinor:800000n,
      currency:"COP",
    },
  ],
  changeEvents:[
    { id:"income", occurredAt:"2026-10-10T12:00:00Z", kind:"income", netWorthImpactMinor:1500000n, currency:"COP" },
    { id:"spend", occurredAt:"2026-10-12T12:00:00Z", kind:"consumer_expense", netWorthImpactMinor:-500000n, currency:"COP" },
    { id:"performance", occurredAt:"2026-10-20T12:00:00Z", kind:"investment_performance", netWorthImpactMinor:100000n, currency:"COP" },
    { id:"liability", occurredAt:"2026-10-22T12:00:00Z", kind:"liability_change", netWorthImpactMinor:100000n, currency:"COP" },
    { id:"transfer", occurredAt:"2026-10-25T12:00:00Z", kind:"investment_transfer", netWorthImpactMinor:0n, currency:"COP" },
    { id:"nov-performance", occurredAt:"2026-11-20T12:00:00Z", kind:"investment_performance", netWorthImpactMinor:100000n, currency:"COP" },
  ],
});

assert.equal(dashboard.points.length, 3);
assert.equal(dashboard.points[0]?.netWorthMinor, 8000000n);
assert.equal(dashboard.points[1]?.netWorthMinor, 9200000n);
assert.equal(dashboard.intervals.length, 2);

const october = dashboard.intervals[0];
assert.equal(october?.actualChangeMinor, 1200000n);
assert.equal(october?.explainedChangeMinor, 1200000n);
assert.equal(october?.unexplainedChangeMinor, 0n);
assert.equal(october?.isFullyExplained, true);
assert.equal(october?.sourceEvents.find((event) => event.id === "transfer")?.netWorthImpactMinor, 0n);

const november = dashboard.intervals[1];
assert.equal(november?.actualChangeMinor, 200000n);
assert.equal(november?.explainedChangeMinor, 100000n);
assert.equal(november?.unexplainedChangeMinor, 100000n);
assert.equal(november?.isFullyExplained, false);
assert.equal(dashboard.isComplete, false);
assert.equal(dashboard.investmentTransfersAffectNetWorth, false);
assert.equal(dashboard.isReadOnly, true);

const complete = buildNetWorthHistoryDashboard({
  currency:"COP",
  snapshots:[
    { asOf:"2026-10-01T00:00:00Z", cashAssetsMinor:100n, investmentAssetsMinor:0n, creditLiabilitiesMinor:0n, currency:"COP" },
    { asOf:"2026-10-31T00:00:00Z", cashAssetsMinor:150n, investmentAssetsMinor:0n, creditLiabilitiesMinor:0n, currency:"COP" },
  ],
  changeEvents:[
    { id:"income", occurredAt:"2026-10-15T00:00:00Z", kind:"income", netWorthImpactMinor:50n, currency:"COP" },
  ],
});
assert.equal(complete.isComplete, true);
assert.deepEqual(complete.unassignedEventIds, []);

assert.throws(() => buildNetWorthHistoryDashboard({
  currency:"COP",
  snapshots:[
    { asOf:"2026-10-01T00:00:00Z", cashAssetsMinor:100n, investmentAssetsMinor:0n, creditLiabilitiesMinor:0n, currency:"COP" },
    { asOf:"2026-10-31T00:00:00Z", cashAssetsMinor:100n, investmentAssetsMinor:0n, creditLiabilitiesMinor:0n, currency:"COP" },
  ],
  changeEvents:[
    { id:"bad-transfer", occurredAt:"2026-10-10T00:00:00Z", kind:"investment_transfer", netWorthImpactMinor:-10n, currency:"COP" },
  ],
}), /zero net-worth impact/);

console.log("Phase 11.6 net-worth history dashboard regression passed");
