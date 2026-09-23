import assert from "node:assert/strict";
import { isPatrimonialTransfer, isSpendingTransaction, netCashFlowMinor, signedMinorUnits } from "../dist/packages/finance-core/src/index.js";
import { redactForLog } from "../dist/packages/security/src/index.js";
import { health } from "../dist/apps/api/src/index.js";
import { elevationFor, resolveMotionDuration, touchTokens } from "../dist/packages/ui/src/index.js";
import {
  accessibilityPolicy,
  assertSurfaceForSensitiveMoney,
  navigate,
  primaryNavigation,
  togglePrivacyMode,
} from "../dist/apps/web/src/index.js";

assert.equal(signedMinorUnits({ money: { amountMinor: 1200n, currency: "COP" }, direction: "debit" }), -1200n);
assert.equal(signedMinorUnits({ money: { amountMinor: 1200n, currency: "COP" }, direction: "credit" }), 1200n);
assert.equal(isSpendingTransaction({ kind: "expense" }), true);
assert.equal(isSpendingTransaction({ kind: "investment_transfer" }), false);
assert.equal(isPatrimonialTransfer({ kind: "investment_transfer" }), true);
assert.equal(
  netCashFlowMinor([
    { id: "1", connectionId: "c", accountId: "a", postedAt: "2026-09-01", money: { amountMinor: 100000n, currency: "COP" }, direction: "credit", status: "posted", kind: "income", rawDescription: "Income" },
    { id: "2", connectionId: "c", accountId: "a", postedAt: "2026-09-02", money: { amountMinor: 30000n, currency: "COP" }, direction: "debit", status: "posted", kind: "investment_transfer", rawDescription: "Hapi funding" },
    { id: "3", connectionId: "c", accountId: "a", postedAt: "2026-09-03", money: { amountMinor: 20000n, currency: "COP" }, direction: "debit", status: "posted", kind: "expense", rawDescription: "Food" },
  ]),
  80000n,
);
assert.deepEqual(redactForLog({ merchant: "Uber", accessToken: "secret", client_secret: "secret2" }), {
  merchant: "Uber",
  accessToken: "[REDACTED]",
  client_secret: "[REDACTED]",
});
assert.equal(health("0.1.0").status, "ok");
assert.equal(elevationFor("modal"), 50);
assert.equal(resolveMotionDuration("expressive", "reduced"), 120);
assert.ok(touchTokens.minimumTargetPx >= 44);
assert.equal(primaryNavigation.length, 5);
assert.ok(primaryNavigation.some((item) => item.id === "portfolio"));
assert.equal(navigate({ activeSpace: "today", privacyMode: true }, "portfolio").previousSpace, "today");
assert.equal(togglePrivacyMode({ activeSpace: "today", privacyMode: true }).privacyMode, false);
assert.doesNotThrow(() => assertSurfaceForSensitiveMoney("solid"));
assert.throws(() => assertSurfaceForSensitiveMoney("glass"));
assert.equal(accessibilityPolicy.minimumTouchTargetPx, 44);
console.log("smoke tests: ok");
