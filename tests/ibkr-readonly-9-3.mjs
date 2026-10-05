import assert from "node:assert/strict";
import {
  IBKR_READONLY_DESCRIPTOR,
  IBKR_READONLY_POLICY,
  assertIbkrReadOnlyContract,
} from "../dist/packages/connector-sdk/src/ibkr-readonly.js";

assert.equal(IBKR_READONLY_DESCRIPTOR.dataAccess, "read_only");
assert.equal(IBKR_READONLY_DESCRIPTOR.environment, "sandbox");
assert.equal(IBKR_READONLY_DESCRIPTOR.accessMode, "oauth");
assert.deepEqual(IBKR_READONLY_DESCRIPTOR.capabilities, ["accounts", "positions", "investment_activities"]);
assert.equal(IBKR_READONLY_POLICY.providerKind, "broker");
assert.equal(IBKR_READONLY_POLICY.canReadPositions, true);
assert.equal(IBKR_READONLY_POLICY.canReadActivity, true);
assert.equal(IBKR_READONLY_POLICY.canTrade, false);
assert.equal(IBKR_READONLY_POLICY.canWithdraw, false);
assert.equal(IBKR_READONLY_POLICY.canTransfer, false);
assert.doesNotThrow(() => assertIbkrReadOnlyContract());
console.log("Phase 9.3 IBKR read-only regression passed");
