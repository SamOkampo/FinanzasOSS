import assert from "node:assert/strict";
import { planContribution } from "../dist/packages/finance-core/src/contribution-planner.js";

const full = planContribution({
  currency: "cop",
  safeToSpendMinor: 2000000n,
  targetContributionMinor: 1000000n,
  contributedThisPeriodMinor: 250000n,
});
assert.equal(full.currency, "COP");
assert.equal(full.remainingTargetMinor, 750000n);
assert.equal(full.suggestedContributionMinor, 750000n);
assert.equal(full.status, "target_available");
assert.equal(full.transactionKindIfExecuted, "investment_transfer");

const partial = planContribution({
  currency: "COP",
  safeToSpendMinor: 300000n,
  targetContributionMinor: 1000000n,
  contributedThisPeriodMinor: 100000n,
});
assert.equal(partial.remainingTargetMinor, 900000n);
assert.equal(partial.suggestedContributionMinor, 300000n);
assert.equal(partial.status, "partial");

const capped = planContribution({
  currency: "USD",
  safeToSpendMinor: 100000n,
  targetContributionMinor: 90000n,
  contributedThisPeriodMinor: 0n,
  userCapMinor: 25000n,
});
assert.equal(capped.availableForContributionMinor, 25000n);
assert.equal(capped.suggestedContributionMinor, 25000n);

const complete = planContribution({
  currency: "COP",
  safeToSpendMinor: 1000000n,
  targetContributionMinor: 500000n,
  contributedThisPeriodMinor: 600000n,
});
assert.equal(complete.remainingTargetMinor, 0n);
assert.equal(complete.suggestedContributionMinor, 0n);
assert.equal(complete.status, "complete");

const unavailable = planContribution({
  currency: "COP",
  safeToSpendMinor: 0n,
  targetContributionMinor: 500000n,
  contributedThisPeriodMinor: 0n,
});
assert.equal(unavailable.status, "not_available");

assert.throws(() => planContribution({
  currency: "COP",
  safeToSpendMinor: -1n,
  targetContributionMinor: 1n,
  contributedThisPeriodMinor: 0n,
}), /safeToSpendMinor cannot be negative/);

console.log("Phase 10.6 contribution planner regression passed");
