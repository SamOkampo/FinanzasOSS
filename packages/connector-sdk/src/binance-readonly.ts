import type { ConnectorDescriptor } from "./index.js";
import { assertInvestmentConnectorReadOnly, investmentReadOnlyPolicy } from "./read-only-policy.js";

export const BINANCE_READONLY_DESCRIPTOR: ConnectorDescriptor = Object.freeze({
  connectorId: "binance-readonly",
  institutionId: "binance",
  displayName: "Binance",
  version: "0.1.0",
  environment: "sandbox",
  accessMode: "api",
  capabilities: Object.freeze(["accounts", "balances", "investment_activities"]),
  dataAccess: "read_only",
});

export const BINANCE_READONLY_POLICY = investmentReadOnlyPolicy("exchange", {
  positions: false,
  activity: true,
  snapshots: false,
});

export function assertBinanceReadOnlyContract(): void {
  assertInvestmentConnectorReadOnly(BINANCE_READONLY_DESCRIPTOR, BINANCE_READONLY_POLICY);
}

/**
 * Phase 9.2 intentionally contains no provider endpoint, scope, credential,
 * trading, withdrawal or transfer implementation until those details are
 * verified against official provider documentation.
 */
