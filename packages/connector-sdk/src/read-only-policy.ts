import type { ConnectorDescriptor } from "./index.js";
import { ConnectorError } from "./index.js";

export type InvestmentProviderKind = "broker" | "exchange" | "wallet";

export interface InvestmentReadOnlyPolicy {
  providerKind: InvestmentProviderKind;
  canReadAccounts: true;
  canReadPositions: boolean;
  canReadActivity: boolean;
  canReadSnapshots: boolean;
  canTrade: false;
  canWithdraw: false;
  canTransfer: false;
  requiresPrivateKey: false;
  requiresSeedPhrase: false;
}

/**
 * Fail closed for every broker/exchange/wallet adapter in the MVP.
 * Adapters may observe authorized financial data, but can never trade,
 * withdraw, transfer funds, or request wallet secrets.
 */
export function assertInvestmentConnectorReadOnly(
  descriptor: ConnectorDescriptor,
  policy: InvestmentReadOnlyPolicy,
): void {
  if (descriptor.dataAccess !== "read_only") {
    throw new ConnectorError("Investment connectors must be read-only", "CONFIGURATION", false);
  }

  if (policy.canTrade || policy.canWithdraw || policy.canTransfer) {
    throw new ConnectorError("Investment connector cannot expose money-moving capabilities", "CONFIGURATION", false);
  }

  if (policy.requiresPrivateKey || policy.requiresSeedPhrase) {
    throw new ConnectorError("Wallet adapters cannot require private keys or seed phrases", "CONFIGURATION", false);
  }
}

export function investmentReadOnlyPolicy(
  providerKind: InvestmentProviderKind,
  options: {
    positions?: boolean;
    activity?: boolean;
    snapshots?: boolean;
  } = {},
): InvestmentReadOnlyPolicy {
  return Object.freeze({
    providerKind,
    canReadAccounts: true,
    canReadPositions: options.positions ?? true,
    canReadActivity: options.activity ?? true,
    canReadSnapshots: options.snapshots ?? true,
    canTrade: false,
    canWithdraw: false,
    canTransfer: false,
    requiresPrivateKey: false,
    requiresSeedPhrase: false,
  });
}
