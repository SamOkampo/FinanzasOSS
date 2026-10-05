import assert from "node:assert/strict";
import { calculateSafeToSpend } from "../dist/packages/finance-core/src/safe-to-spend.js";

const conservative = calculateSafeToSpend({
  currency: "cop",
  availableCashMinor: 5000000n,
  reservedMinor: 1000000n,
  obligationsMinor: 1500000n,
  safetyBufferMinor: 500000n,
  forecastNetCashFlowMinor: 900000n,
});
assert.equal(conservative.currency, "COP");
assert.equal(conservative.forecastAdjustmentMinor, 0n);
assert.equal(conservative.safeToSpendMinor, 2000000n);
assert.deepEqual(conservative.constrainedBy, ["reserved", "obligations", "safety_buffer"]);
assert.equal(conservative.isEstimate, true);

const negativeForecast = calculateSafeToSpend({
  currency: "COP",
  availableCashMinor: 5000000n,
  reservedMinor: 1000000n,
  obligationsMinor: 1500000n,
  safetyBufferMinor: 500000n,
  forecastNetCashFlowMinor: -800000n,
});
assert.equal(negativeForecast.forecastAdjustmentMinor, -800000n);
assert.equal(negativeForecast.safeToSpendMinor, 1200000n);
assert.ok(negativeForecast.constrainedBy.includes("negative_forecast"));

const floored = calculateSafeToSpend({
  currency: "COP",
  availableCashMinor: 1000000n,
  reservedMinor: 800000n,
  obligationsMinor: 600000n,
  safetyBufferMinor: 300000n,
});
assert.equal(floored.safeToSpendMinor, 0n);

const optInPositive = calculateSafeToSpend({
  currency: "USD",
  availableCashMinor: 100000n,
  reservedMinor: 10000n,
  obligationsMinor: 20000n,
  safetyBufferMinor: 10000n,
  forecastNetCashFlowMinor: 30000n,
  includePositiveForecast: true,
});
assert.equal(optInPositive.safeToSpendMinor, 90000n);

assert.throws(() => calculateSafeToSpend({
  currency: "COP",
  availableCashMinor: -1n,
  reservedMinor: 0n,
  obligationsMinor: 0n,
  safetyBufferMinor: 0n,
}), /availableCashMinor cannot be negative/);

console.log("Phase 10.5 safe-to-spend regression passed");
