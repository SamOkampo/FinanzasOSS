import assert from "node:assert/strict";
import { buildMonthlyContributionAlerts } from "../dist/packages/finance-core/src/contribution-alerts.js";

const alerts = buildMonthlyContributionAlerts({
  month: "2026-10",
  currency: "cop",
  targetContributionMinor: 1000000n,
  records: [
    { id:"a", month:"2026-10", amountMinor:400000n, currency:"COP", reconciliationStatus:"reconciled", transferGroupId:"tg-1" },
    { id:"b", month:"2026-10", amountMinor:400000n, currency:"COP", reconciliationStatus:"reconciled", transferGroupId:"tg-1" },
    { id:"c", month:"2026-10", amountMinor:200000n, currency:"COP", reconciliationStatus:"unreconciled" },
    { id:"d", month:"2026-09", amountMinor:999999n, currency:"COP", reconciliationStatus:"reconciled", transferGroupId:"tg-old" },
  ],
});
assert.equal(alerts.filter((a) => a.kind === "duplicate").length, 1);
assert.equal(alerts.filter((a) => a.kind === "unreconciled").length, 1);
const missing = alerts.find((a) => a.kind === "missing");
assert.ok(missing);
assert.equal(missing.amountMinor, 600000n);

const complete = buildMonthlyContributionAlerts({
  month: "2026-10",
  currency: "COP",
  targetContributionMinor: 500000n,
  records: [
    { id:"a", month:"2026-10", amountMinor:500000n, currency:"COP", reconciliationStatus:"reconciled", transferGroupId:"tg-1" },
  ],
});
assert.equal(complete.length, 0);

const currencyIsolation = buildMonthlyContributionAlerts({
  month: "2026-10",
  currency: "COP",
  targetContributionMinor: 100n,
  records: [
    { id:"usd", month:"2026-10", amountMinor:100n, currency:"USD", reconciliationStatus:"reconciled", transferGroupId:"tg-usd" },
  ],
});
assert.equal(currencyIsolation.length, 1);
assert.equal(currencyIsolation[0]?.kind, "missing");
assert.equal(currencyIsolation[0]?.amountMinor, 100n);

assert.throws(() => buildMonthlyContributionAlerts({
  month: "2026-13",
  currency: "COP",
  targetContributionMinor: 0n,
  records: [],
}), /Month must use YYYY-MM/);

console.log("Phase 10.7 contribution alerts regression passed");
