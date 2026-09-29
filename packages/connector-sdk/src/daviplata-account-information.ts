import {
  AccountInformationGate,
  type AccountInformationCapability,
} from "./account-information.js";

export interface DaviPlataAccountInformationConfig {
  officialRouteVerified?: boolean;
  accountsEndpoint?: string;
  balancesEndpoint?: string;
  transactionsEndpoint?: string;
  grantedCapabilities?: readonly AccountInformationCapability[];
  consentVerified?: boolean;
}

export class DaviPlataAccountInformationConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DaviPlataAccountInformationConfigurationError";
  }
}

/**
 * Read-only DaviPlata Account Information gate.
 *
 * No DaviPlata endpoint, scope or credential is embedded here. The adapter
 * remains fail-closed until an applicable official route and consent are
 * independently verified.
 */
export function createDaviPlataAccountInformationGate(
  config: DaviPlataAccountInformationConfig,
): AccountInformationGate {
  if (config.officialRouteVerified !== true) {
    throw new DaviPlataAccountInformationConfigurationError(
      "Verified official DaviPlata account-information route is required",
    );
  }
  if (config.consentVerified !== true) {
    throw new DaviPlataAccountInformationConfigurationError(
      "Verified DaviPlata consent is required before Account Information access",
    );
  }

  const granted = config.grantedCapabilities ?? [];
  if (granted.length === 0) {
    throw new DaviPlataAccountInformationConfigurationError(
      "At least one verified DaviPlata Account Information capability is required",
    );
  }

  const endpoints: Partial<Record<AccountInformationCapability, string | undefined>> = {
    accounts: config.accountsEndpoint,
    balances: config.balancesEndpoint,
    transactions: config.transactionsEndpoint,
  };
  for (const capability of granted) {
    if (!endpoints[capability]?.trim()) {
      throw new DaviPlataAccountInformationConfigurationError(
        `Verified DaviPlata endpoint is required for granted capability: ${capability}`,
      );
    }
  }

  try {
    return new AccountInformationGate({
      ...(config.accountsEndpoint !== undefined ? { accountsEndpoint: config.accountsEndpoint } : {}),
      ...(config.balancesEndpoint !== undefined ? { balancesEndpoint: config.balancesEndpoint } : {}),
      ...(config.transactionsEndpoint !== undefined ? { transactionsEndpoint: config.transactionsEndpoint } : {}),
      grantedCapabilities: granted,
      consentState: "active",
    });
  } catch (error) {
    throw new DaviPlataAccountInformationConfigurationError(
      error instanceof Error ? error.message : "Invalid DaviPlata Account Information configuration",
    );
  }
}
