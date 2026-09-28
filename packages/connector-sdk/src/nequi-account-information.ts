import {
  AccountInformationGate,
  type AccountInformationCapability,
} from "./account-information.js";

export interface NequiAccountInformationConfig {
  officialRouteVerified?: boolean;
  accountsEndpoint?: string;
  balancesEndpoint?: string;
  transactionsEndpoint?: string;
  grantedCapabilities?: readonly AccountInformationCapability[];
  consentVerified?: boolean;
}

export class NequiAccountInformationConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NequiAccountInformationConfigurationError";
  }
}

export function createNequiAccountInformationGate(
  config: NequiAccountInformationConfig,
): AccountInformationGate {
  if (config.officialRouteVerified !== true) {
    throw new NequiAccountInformationConfigurationError(
      "Verified official Nequi account-information route is required",
    );
  }
  if (config.consentVerified !== true) {
    throw new NequiAccountInformationConfigurationError(
      "Verified Nequi consent is required before Account Information access",
    );
  }

  const granted = config.grantedCapabilities ?? [];
  if (granted.length === 0) {
    throw new NequiAccountInformationConfigurationError(
      "At least one verified Nequi Account Information capability is required",
    );
  }

  const endpoints: Partial<Record<AccountInformationCapability, string | undefined>> = {
    accounts: config.accountsEndpoint,
    balances: config.balancesEndpoint,
    transactions: config.transactionsEndpoint,
  };
  for (const capability of granted) {
    if (!endpoints[capability]?.trim()) {
      throw new NequiAccountInformationConfigurationError(
        `Verified Nequi endpoint is required for granted capability: ${capability}`,
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
    throw new NequiAccountInformationConfigurationError(
      error instanceof Error ? error.message : "Invalid Nequi Account Information configuration",
    );
  }
}
