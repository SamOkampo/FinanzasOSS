import assert from "node:assert/strict";
import { buildPortfolioDriftReport } from "../dist/packages/finance-core/src/portfolio-drift.js";

const report = buildPortfolioDriftReport({
  positions: [
    { assetKey:"QQQM", marketValueMinor:600000n, currency:"USD" },
    { assetKey:"SMH", marketValueMinor:250000n, currency:"USD" },
    { assetKey:"NU", marketValueMinor:150000n, currency:"USD" },
  ],
  targetAllocationBps: { QQQM:5000, SMH:3000, NU:2000 },
  concentrationThresholdBps:5500,
});
assert.ok(report);
assert.equal(report.currency, "USD");
assert.equal(report.totalMarketValueMinor, 1000000n);
assert.equal(report.topHolding?.assetKey, "QQQM");
assert.equal(report.topHolding?.actualBps, 6000);
assert.deepEqual(report.concentrationBreaches, ["QQQM"]);
const qqqm = report.lines.find((line) => line.assetKey === "QQQM");
assert.equal(qqqm?.driftBps, 1000);
const nu = report.lines.find((line) => line.assetKey === "NU");
assert.equal(nu?.driftBps, -500);
assert.equal(report.isReadOnly, true);

const noThreshold = buildPortfolioDriftReport({
  positions:[{ assetKey:"A", marketValueMinor:100n, currency:"COP" }],
  targetAllocationBps:{ A:10000 },
});
assert.ok(noThreshold);
assert.deepEqual(noThreshold.concentrationBreaches, []);
assert.equal(noThreshold.userConcentrationThresholdBps, null);

const mixedCurrency = buildPortfolioDriftReport({
  positions:[
    { assetKey:"A", marketValueMinor:100n, currency:"COP" },
    { assetKey:"B", marketValueMinor:100n, currency:"USD" },
  ],
  targetAllocationBps:{ A:5000, B:5000 },
});
assert.equal(mixedCurrency, null);

assert.throws(() => buildPortfolioDriftReport({
  positions:[{ assetKey:"A", marketValueMinor:100n, currency:"COP" }],
  targetAllocationBps:{ A:9000 },
}), /sum to 10000/);

console.log("Phase 10.9 portfolio drift regression passed");
