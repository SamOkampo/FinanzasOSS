import assert from "node:assert/strict";
import {
  assertAccountBelongsToConnection,
  assertBalanceBelongsToAccount,
  assertTenantScope,
  assertTransactionBelongsToAccount,
  isConsentActive,
  isPatrimonialTransfer,
  isSpendingTransaction,
  netCashFlowMinor,
  signedMinorUnits,
} from "../dist/packages/finance-core/src/index.js";
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

const connection = {
  id: "conn-1",
  tenantId: "tenant-1",
  institutionId: "davivienda",
  accessMode: "open_finance_oauth",
  status: "connected",
  capabilities: ["accounts", "balances", "transactions"],
  secretReference: "vault://connection/conn-1",
  createdAt: "2026-09-23T12:00:00Z",
  updatedAt: "2026-09-23T12:00:00Z",
};

const account = {
  id: "acc-1",
  tenantId: "tenant-1",
  connectionId: "conn-1",
  institutionId: "davivienda",
  externalId: "external-acc-1",
  name: "Cuenta principal",
  type: "savings",
  domain: "cash",
  currency: "COP",
};

const balance = {
  id: "bal-1",
  tenantId: "tenant-1",
  connectionId: "conn-1",
  accountId: "acc-1",
  current: { amountMinor: 250000n, currency: "COP" },
  available: { amountMinor: 240000n, currency: "COP" },
  asOf: "2026-09-23T12:05:00Z",
};

const expense = {
  id: "tx-expense",
  tenantId: "tenant-1",
  connectionId: "conn-1",
  accountId: "acc-1",
  postedAt: "2026-09-03",
  money: { amountMinor: 20000n, currency: "COP" },
  direction: "debit",
  status: "posted",
  kind: "expense",
  rawDescription: "Food",
};

assert.doesNotThrow(() => assertTenantScope("tenant-1", account, "account"));
assert.throws(() => assertTenantScope("tenant-2", account, "account"), /Tenant scope mismatch/);
assert.doesNotThrow(() => assertAccountBelongsToConnection(account, connection));
assert.throws(
  () => assertAccountBelongsToConnection({ ...account, connectionId: "conn-2" }, connection),
  /Account connection mismatch/,
);
assert.doesNotThrow(() => assertBalanceBelongsToAccount(balance, account));
assert.throws(
  () => assertBalanceBelongsToAccount({ ...balance, tenantId: "tenant-2" }, account),
  /Tenant scope mismatch/,
);
assert.doesNotThrow(() => assertTransactionBelongsToAccount(expense, account));
assert.throws(
  () => assertTransactionBelongsToAccount({ ...expense, accountId: "acc-2" }, account),
  /Transaction account mismatch/,
);

assert.equal(
  isConsentActive(
    {
      id: "consent-1",
      tenantId: "tenant-1",
      connectionId: "conn-1",
      status: "active",
      capabilities: ["accounts", "balances", "transactions"],
      expiresAt: "2026-10-23T00:00:00Z",
      createdAt: "2026-09-23T00:00:00Z",
      updatedAt: "2026-09-23T00:00:00Z",
    },
    "2026-09-24T00:00:00Z",
  ),
  true,
);
assert.equal(
  isConsentActive(
    {
      id: "consent-2",
      tenantId: "tenant-1",
      connectionId: "conn-1",
      status: "active",
      capabilities: ["accounts"],
      expiresAt: "2026-09-20T00:00:00Z",
      createdAt: "2026-09-01T00:00:00Z",
      updatedAt: "2026-09-01T00:00:00Z",
    },
    "2026-09-24T00:00:00Z",
  ),
  false,
);

assert.equal(signedMinorUnits({ money: { amountMinor: 1200n, currency: "COP" }, direction: "debit" }), -1200n);
assert.equal(signedMinorUnits({ money: { amountMinor: 1200n, currency: "COP" }, direction: "credit" }), 1200n);
assert.equal(isSpendingTransaction({ kind: "expense" }), true);
assert.equal(isSpendingTransaction({ kind: "investment_transfer" }), false);
assert.equal(isPatrimonialTransfer({ kind: "investment_transfer" }), true);
assert.equal(
  netCashFlowMinor([
    {
      id: "1",
      tenantId: "tenant-1",
      connectionId: "c",
      accountId: "a",
      postedAt: "2026-09-01",
      money: { amountMinor: 100000n, currency: "COP" },
      direction: "credit",
      status: "posted",
      kind: "income",
      rawDescription: "Income",
    },
    {
      id: "2",
      tenantId: "tenant-1",
      connectionId: "c",
      accountId: "a",
      postedAt: "2026-09-02",
      money: { amountMinor: 30000n, currency: "COP" },
      direction: "debit",
      status: "posted",
      kind: "investment_transfer",
      rawDescription: "Hapi funding",
    },
    expense,
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
