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

export interface InvestmentCredentialPermissionAttestation {
  providerId: string;
  credentialReference: string;
  verifiedAt: string;
  verificationReference: string;
  canRead: boolean;
  canTrade: boolean;
  canWithdraw: boolean;
  canTransfer: boolean;
}

export interface ReadOnlyInvestmentCredentialBinding {
  connectorId: string;
  providerId: string;
  credentialReference: string;
  verifiedAt: string;
  verificationReference: string;
  permissionMode: "read_only";
}

const CREDENTIAL_BASED_INVESTMENT_ACCESS_MODES = new Set([
  "oauth",
  "read_only_api_key",
  "aggregator",
]);

/**
 * Binds an opaque credential reference to an investment connector only after
 * provider permissions have been independently verified as read-only.
 *
 * Provider-specific scope names or permission labels are intentionally not
 * encoded here. The attestation must point to a verified official/provider
 * source and reports the effective capabilities instead.
 */
export function bindReadOnlyInvestmentCredential(
  descriptor: ConnectorDescriptor,
  policy: InvestmentReadOnlyPolicy,
  attestation: InvestmentCredentialPermissionAttestation,
): ReadOnlyInvestmentCredentialBinding {
  assertInvestmentConnectorReadOnly(descriptor, policy);

  if (!CREDENTIAL_BASED_INVESTMENT_ACCESS_MODES.has(descriptor.accessMode)) {
    throw new ConnectorError(
      "Connector access mode does not accept credential binding",
      "CONFIGURATION",
      false,
    );
  }
  if (!attestation.providerId.trim() || attestation.providerId !== descriptor.institutionId) {
    throw new ConnectorError(
      "Credential permission attestation provider mismatch",
      "CONFIGURATION",
      false,
    );
  }
  if (!attestation.credentialReference.trim() || /\s/.test(attestation.credentialReference)) {
    throw new ConnectorError(
      "Credential reference must be an opaque non-empty reference",
      "CONFIGURATION",
      false,
    );
  }
  if (!attestation.verificationReference.trim()) {
    throw new ConnectorError(
      "Credential permission verification reference is required",
      "CONFIGURATION",
      false,
    );
  }
  if (Number.isNaN(Date.parse(attestation.verifiedAt))) {
    throw new ConnectorError(
      "Credential permission verifiedAt must be a valid date",
      "CONFIGURATION",
      false,
    );
  }
  if (!attestation.canRead) {
    throw new ConnectorError(
      "Read-only investment credential must have verified read access",
      "CONFIGURATION",
      false,
    );
  }
  if (attestation.canTrade || attestation.canWithdraw || attestation.canTransfer) {
    throw new ConnectorError(
      "Credential with trading, withdrawal or transfer permission is forbidden",
      "CONFIGURATION",
      false,
    );
  }

  return Object.freeze({
    connectorId: descriptor.connectorId,
    providerId: attestation.providerId,
    credentialReference: attestation.credentialReference,
    verifiedAt: attestation.verifiedAt,
    verificationReference: attestation.verificationReference.trim(),
    permissionMode: "read_only" as const,
  });
}

export const investmentCredentialPolicy = Object.freeze({
  rawCredentialsStoredInConnectorConfig: false,
  providerPermissionsMustBeVerified: true,
  tradingPermissionAllowed: false,
  withdrawalPermissionAllowed: false,
  transferPermissionAllowed: false,
  reverifyAfterCredentialRotationOrReauthorization: true,
  providerSpecificPermissionNamesMustComeFromVerifiedOfficialSource: true,
});

