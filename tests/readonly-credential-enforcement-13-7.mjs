import assert from "node:assert/strict";
import {
  bindReadOnlyInvestmentCredential,
  investmentCredentialPolicy,
} from "../dist/packages/connector-sdk/src/read-only-policy.js";
import {
  BINANCE_READONLY_DESCRIPTOR,
  BINANCE_READONLY_POLICY,
} from "../dist/packages/connector-sdk/src/binance-readonly.js";
import {
  IBKR_READONLY_DESCRIPTOR,
  IBKR_READONLY_POLICY,
} from "../dist/packages/connector-sdk/src/ibkr-readonly.js";

const base = {
  providerId: "binance",
  credentialReference: "vault://tenant-1/binance/ref-1",
  verifiedAt: "2026-10-06T01:25:00Z",
  verificationReference: "official-provider-permission-check-fixture",
  canRead: true,
  canTrade: false,
  canWithdraw: false,
  canTransfer: false,
};

const binance = bindReadOnlyInvestmentCredential(
  BINANCE_READONLY_DESCRIPTOR,
  BINANCE_READONLY_POLICY,
  base,
);
assert.equal(binance.permissionMode, "read_only");
assert.equal(binance.providerId, "binance");

const ibkr = bindReadOnlyInvestmentCredential(
  IBKR_READONLY_DESCRIPTOR,
  IBKR_READONLY_POLICY,
  {
    ...base,
    providerId: "interactive-brokers",
    credentialReference: "vault://tenant-1/ibkr/ref-1",
  },
);
assert.equal(ibkr.permissionMode, "read_only");

for (const forbidden of [
  { canTrade: true },
  { canWithdraw: true },
  { canTransfer: true },
]) {
  assert.throws(
    () =>
      bindReadOnlyInvestmentCredential(
        BINANCE_READONLY_DESCRIPTOR,
        BINANCE_READONLY_POLICY,
        { ...base, ...forbidden },
      ),
    /trading, withdrawal or transfer permission is forbidden/,
  );
}

assert.throws(
  () =>
    bindReadOnlyInvestmentCredential(
      BINANCE_READONLY_DESCRIPTOR,
      BINANCE_READONLY_POLICY,
      { ...base, providerId: "other-provider" },
    ),
  /provider mismatch/,
);

assert.throws(
  () =>
    bindReadOnlyInvestmentCredential(
      BINANCE_READONLY_DESCRIPTOR,
      BINANCE_READONLY_POLICY,
      { ...base, verificationReference: "" },
    ),
  /verification reference is required/,
);

assert.throws(
  () =>
    bindReadOnlyInvestmentCredential(
      BINANCE_READONLY_DESCRIPTOR,
      BINANCE_READONLY_POLICY,
      { ...base, canRead: false },
    ),
  /verified read access/,
);

assert.equal(investmentCredentialPolicy.rawCredentialsStoredInConnectorConfig, false);
assert.equal(investmentCredentialPolicy.tradingPermissionAllowed, false);
assert.equal(investmentCredentialPolicy.withdrawalPermissionAllowed, false);
assert.equal(investmentCredentialPolicy.transferPermissionAllowed, false);
assert.equal(
  investmentCredentialPolicy.providerSpecificPermissionNamesMustComeFromVerifiedOfficialSource,
  true,
);

console.log("Phase 13.7 read-only credential enforcement regression passed");
