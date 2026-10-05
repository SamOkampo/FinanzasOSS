import type { ConnectorDescriptor } from "./index.js";
import { assertInvestmentConnectorReadOnly, investmentReadOnlyPolicy } from "./read-only-policy.js";

export const IBKR_READONLY_DESCRIPTOR: ConnectorDescriptor = Object.freeze({
  connectorId: "ibkr-readonly",
  institutionId: "interactive-brokers",
  displayName: "Interactive Brokers",
  version: "0.1.0",
  environment: "sandbox",
  accessMode: "oauth",
  capabilities: Object.freeze(["accounts", "positions", "investment_activities"] as const),
  dataAccess: "read_only",
});

export const IBKR_READONLY_POLICY = investmentReadOnlyPolicy("broker", {
  positions: true,
  activity: true,
  snapshots: false,
});

export function assertIbkrReadOnlyContract(): void {
  assertInvestmentConnectorReadOnly(IBKR_READONLY_DESCRIPTOR, IBKR_READONLY_POLICY);
}

/**
 * Phase 9.3 intentionally defines no provider endpoint, scope, auth transport,
 * order, withdrawal or transfer implementation until those details are
 * verified against official Interactive Brokers documentation.
 */
