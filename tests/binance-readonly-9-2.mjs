import assert from "node:assert/strict";
import {
  BINANCE_READONLY_DESCRIPTOR,
  BINANCE_READONLY_POLICY,
  assertBinanceReadOnlyContract,
} from "../dist/packages/connector-sdk/src/binance-readonly.js";

assert.doesNotThrow(() => assertBinanceReadOnlyContract());
assert.equal(BINANCE_READONLY_DESCRIPTOR.dataAccess, "read_only");
assert.equal(BINANCE_READONLY_DESCRIPTOR.environment, "sandbox");
assert.equal(BINANCE_READONLY_POLICY.providerKind, "exchange");
assert.equal(BINANCE_READONLY_POLICY.canTrade, false);
assert.equal(BINANCE_READONLY_POLICY.canWithdraw, false);
assert.equal(BINANCE_READONLY_POLICY.canTransfer, false);
assert.equal(BINANCE_READONLY_POLICY.requiresPrivateKey, false);
assert.equal(BINANCE_READONLY_POLICY.requiresSeedPhrase, false);
assert.equal(BINANCE_READONLY_DESCRIPTOR.capabilities.includes("transactions"), false);

console.log("phase 9.2 Binance read-only contract passed");
