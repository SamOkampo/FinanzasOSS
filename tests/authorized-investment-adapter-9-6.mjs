import assert from "node:assert/strict";
import { createAuthorizedInvestmentAdapterContract } from "../dist/packages/connector-sdk/src/authorized-investment-adapter.js";

const broker = createAuthorizedInvestmentAdapterContract({
  providerId: "synthetic-broker",
  displayName: "Synthetic Broker",
  providerKind: "broker",
  source: "official_api",
  verificationReference: "synthetic-official-doc-ref",
  accessMode: "oauth",
  capabilities: ["accounts", "positions", "investment_activities"],
});

assert.equal(broker.descriptor.environment, "sandbox");
assert.equal(broker.descriptor.dataAccess, "read_only");
assert.equal(broker.policy.canTrade, false);
assert.equal(broker.policy.canWithdraw, false);
assert.equal(broker.policy.canTransfer, false);
assert.equal(broker.policy.canReadPositions, true);

const exchange = createAuthorizedInvestmentAdapterContract({
  providerId: "synthetic-exchange",
  displayName: "Synthetic Exchange",
  providerKind: "exchange",
  source: "authorized_aggregator",
  verificationReference: "synthetic-authorized-ref",
  accessMode: "aggregator",
  capabilities: ["accounts", "balances", "investment_activities"],
});
assert.equal(exchange.source, "authorized_aggregator");
assert.equal(exchange.policy.canReadPositions, false);

assert.throws(() => createAuthorizedInvestmentAdapterContract({
  providerId: "synthetic-unverified",
  displayName: "Synthetic",
  providerKind: "broker",
  source: "unverified_source",
  verificationReference: "x",
  accessMode: "oauth",
  capabilities: ["accounts"],
}), /official or authorized/);

assert.throws(() => createAuthorizedInvestmentAdapterContract({
  providerId: "synthetic-no-ref",
  displayName: "Synthetic",
  providerKind: "broker",
  source: "official_api",
  verificationReference: " ",
  accessMode: "oauth",
  capabilities: ["accounts"],
}), /verification reference/);

assert.throws(() => createAuthorizedInvestmentAdapterContract({
  providerId: "synthetic-no-accounts",
  displayName: "Synthetic",
  providerKind: "exchange",
  source: "official_api",
  verificationReference: "synthetic",
  accessMode: "read_only_api_key",
  capabilities: ["balances"],
}), /must expose accounts/);

console.log("Phase 9.6 authorized investment adapter regression passed");
