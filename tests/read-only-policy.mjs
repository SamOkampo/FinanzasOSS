import assert from "node:assert/strict";
import {
  assertInvestmentConnectorReadOnly,
  investmentReadOnlyPolicy,
} from "../dist/packages/connector-sdk/src/read-only-policy.js";

const descriptor = {
  connectorId: "binance-readonly",
  institutionId: "binance",
  displayName: "Binance",
  version: "0.1.0",
  environment: "sandbox",
  accessMode: "api",
  capabilities: ["accounts", "positions", "investment_activities"],
  dataAccess: "read_only",
};

const exchange = investmentReadOnlyPolicy("exchange");
assert.equal(exchange.canTrade, false);
assert.equal(exchange.canWithdraw, false);
assert.equal(exchange.canTransfer, false);
assert.equal(exchange.requiresPrivateKey, false);
assert.equal(exchange.requiresSeedPhrase, false);
assert.doesNotThrow(() => assertInvestmentConnectorReadOnly(descriptor, exchange));

assert.throws(
  () => assertInvestmentConnectorReadOnly(descriptor, { ...exchange, canTrade: true }),
  /money-moving capabilities/,
);
assert.throws(
  () => assertInvestmentConnectorReadOnly(descriptor, { ...exchange, canWithdraw: true }),
  /money-moving capabilities/,
);
assert.throws(
  () => assertInvestmentConnectorReadOnly(descriptor, { ...exchange, requiresPrivateKey: true }),
  /private keys or seed phrases/,
);

const wallet = investmentReadOnlyPolicy("wallet", { activity: false });
assert.equal(wallet.canReadActivity, false);
assert.equal(wallet.requiresPrivateKey, false);

console.log("read-only investment connector policy: ok");
