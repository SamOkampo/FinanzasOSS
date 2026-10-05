import type { ConnectorAccessMode, ConnectorCapability, ConnectorDescriptor } from "./index.js";
import { ConnectorError } from "./index.js";
import {
  assertInvestmentConnectorReadOnly,
  investmentReadOnlyPolicy,
  type InvestmentProviderKind,
  type InvestmentReadOnlyPolicy,
} from "./read-only-policy.js";

export type AuthorizedInvestmentProviderKind = Extract<InvestmentProviderKind, "broker" | "exchange">;
export type AuthorizedInvestmentSource = "official_api" | "authorized_aggregator";
export type AuthorizedInvestmentAccessMode = Extract<
  ConnectorAccessMode,
  "oauth" | "read_only_api_key" | "aggregator"
>;

export interface AuthorizedInvestmentAdapterConfig {
  providerId: string;
  displayName: string;
  providerKind: AuthorizedInvestmentProviderKind;
  source: AuthorizedInvestmentSource;
  verificationReference: string;
  accessMode: AuthorizedInvestmentAccessMode;
  capabilities: readonly ConnectorCapability[];
}

export interface AuthorizedInvestmentAdapterContract {
  descriptor: ConnectorDescriptor;
  policy: InvestmentReadOnlyPolicy;
  source: AuthorizedInvestmentSource;
  verificationReference: string;
}

export function createAuthorizedInvestmentAdapterContract(
  config: AuthorizedInvestmentAdapterConfig,
): AuthorizedInvestmentAdapterContract {
  if (!/^[a-z0-9][a-z0-9-]{1,62}$/.test(config.providerId)) {
    throw new ConnectorError("Authorized investment providerId is invalid", "CONFIGURATION", false);
  }
  if (!config.displayName.trim()) {
    throw new ConnectorError("Authorized investment displayName is required", "CONFIGURATION", false);
  }
  if (config.source !== "official_api" && config.source !== "authorized_aggregator") {
    throw new ConnectorError("Investment source must be official or authorized", "CONFIGURATION", false);
  }
  if (!config.verificationReference.trim()) {
    throw new ConnectorError("Investment source verification reference is required", "CONFIGURATION", false);
  }
  if (!["oauth", "read_only_api_key", "aggregator"].includes(config.accessMode)) {
    throw new ConnectorError("Unsupported investment access mode", "CONFIGURATION", false);
  }
  if (!config.capabilities.includes("accounts")) {
    throw new ConnectorError("Authorized investment adapters must expose accounts read-only", "CONFIGURATION", false);
  }

  const descriptor: ConnectorDescriptor = Object.freeze({
    connectorId: `${config.providerId}-readonly`,
    institutionId: config.providerId,
    displayName: config.displayName.trim(),
    version: "0.1.0",
    environment: "sandbox",
    accessMode: config.accessMode,
    capabilities: Object.freeze([...config.capabilities]),
    dataAccess: "read_only",
  });

  const policy = investmentReadOnlyPolicy(config.providerKind, {
    positions: config.capabilities.includes("positions"),
    activity: config.capabilities.includes("investment_activities"),
    snapshots: config.capabilities.includes("portfolio_snapshots"),
  });
  assertInvestmentConnectorReadOnly(descriptor, policy);

  return Object.freeze({
    descriptor,
    policy,
    source: config.source,
    verificationReference: config.verificationReference.trim(),
  });
}
