import assert from "node:assert/strict";
import { detectSubscription } from "../dist/packages/finance-core/src/subscription-detector.js";

const monthly = detectSubscription([
  { id:"1", postedAt:"2026-01-05T00:00:00Z", merchantKey:"netflix", amountMinor:39900n, currency:"COP", direction:"debit", status:"posted" },
  { id:"2", postedAt:"2026-02-05T00:00:00Z", merchantKey:"netflix", amountMinor:39900n, currency:"COP", direction:"debit", status:"posted" },
  { id:"3", postedAt:"2026-03-05T00:00:00Z", merchantKey:"netflix", amountMinor:39900n, currency:"COP", direction:"debit", status:"posted" },
  { id:"4", postedAt:"2026-04-05T00:00:00Z", merchantKey:"netflix", amountMinor:39900n, currency:"COP", direction:"debit", status:"posted" },
]);
assert.ok(monthly);
assert.equal(monthly.cadence, "monthly");
assert.equal(monthly.confidence, "high");
assert.equal(monthly.needsReview, false);
assert.equal(monthly.occurrenceCount, 4);
assert.equal(monthly.averageAmountMinor, 39900n);
assert.ok(monthly.nextExpectedAt?.startsWith("2026-05-"));

const variableAmount = detectSubscription([
  { id:"1", postedAt:"2026-01-10T00:00:00Z", merchantKey:"cloud", amountMinor:10000n, currency:"USD", direction:"debit", status:"posted" },
  { id:"2", postedAt:"2026-02-10T00:00:00Z", merchantKey:"cloud", amountMinor:14000n, currency:"USD", direction:"debit", status:"posted" },
  { id:"3", postedAt:"2026-03-10T00:00:00Z", merchantKey:"cloud", amountMinor:9000n, currency:"USD", direction:"debit", status:"posted" },
]);
assert.ok(variableAmount);
assert.equal(variableAmount.cadence, "monthly");
assert.equal(variableAmount.confidence, "medium");
assert.equal(variableAmount.needsReview, true);

const protectedOnly = detectSubscription([
  { id:"1", postedAt:"2026-01-01T00:00:00Z", merchantKey:"broker", amountMinor:500000n, currency:"COP", direction:"debit", status:"posted", transactionType:"investment_transfer" },
  { id:"2", postedAt:"2026-02-01T00:00:00Z", merchantKey:"broker", amountMinor:500000n, currency:"COP", direction:"debit", status:"posted", transactionType:"investment_transfer" },
  { id:"3", postedAt:"2026-03-01T00:00:00Z", merchantKey:"broker", amountMinor:500000n, currency:"COP", direction:"debit", status:"posted", transactionType:"investment_transfer" },
]);
assert.equal(protectedOnly, null);

assert.equal(detectSubscription([
  { id:"1", postedAt:"2026-01-01T00:00:00Z", merchantKey:"spotify", amountMinor:20000n, currency:"COP", direction:"debit", status:"posted" },
  { id:"2", postedAt:"2026-02-01T00:00:00Z", merchantKey:"spotify", amountMinor:20000n, currency:"COP", direction:"debit", status:"posted" },
]), null);

const mixedMerchant = detectSubscription([
  { id:"1", postedAt:"2026-01-01T00:00:00Z", merchantKey:"a", amountMinor:1000n, currency:"COP", direction:"debit", status:"posted" },
  { id:"2", postedAt:"2026-02-01T00:00:00Z", merchantKey:"b", amountMinor:1000n, currency:"COP", direction:"debit", status:"posted" },
  { id:"3", postedAt:"2026-03-01T00:00:00Z", merchantKey:"a", amountMinor:1000n, currency:"COP", direction:"debit", status:"posted" },
]);
assert.equal(mixedMerchant, null);

console.log("Phase 10.3 subscription detector regression passed");
