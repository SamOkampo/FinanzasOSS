import {
  AccountInformationGate,
  type AccountInformationCapability,
} from "./account-information.js";

export interface DaviviendaAccountInformationConfig {
  accountsEndpoint?: string;
  balancesEndpoint?: string;
  transactionsEndpoint?: string;
  grantedCapabilities?: readonly AccountInformationCapability[];
  consentVerified?: boolean;
}

export class DaviviendaAccountInformationConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DaviviendaAccountInformationConfigurationError";
  }
}

/**
 * Davivienda sandbox Account Information adapter gate.
 *
 * It deliberately contains no guessed Davivienda URLs, scopes, response
 * mappings or credentials. The caller must provide values verified from the
 * official authenticated sandbox/catalog. Consent is a prerequisite.
 */
export function createDaviviendaAccountInformationGate(
  config: DaviviendaAccountInformationConfig,
): AccountInformationGate {
  if (config.consentVerified !== true) {
    throw new DaviviendaAccountInformationConfigurationError(
      "Verified Davivienda sandbox consent is required before Account Information access",
    );
  }

  const granted = config.grantedCapabilities ?? [];
  if (granted.length === 0) {
    throw new DaviviendaAccountInformationConfigurationError(
      "At least one verified Davivienda Account Information capability is required",
    );
  }

  const endpoints: Partial<Record<AccountInformationCapability, string | undefined>> = {
    accounts: config.accountsEndpoint,
    balances: config.balancesEndpoint,
    transactions: config.transactionsEndpoint,
  };

  for (const capability of granted) {
    if (!endpoints[capability]?.trim()) {
      throw new DaviviendaAccountInformationConfigurationError(
        `Verified Davivienda endpoint is required for granted capability: ${capability}`,
      );
    }
  }

  try {
    return new AccountInformationGate({
      accountsEndpoint: config.accountsEndpoint,
      balancesEndpoint: config.balancesEndpoint,
      transactionsEndpoint: config.transactionsEndpoint,
      grantedCapabilities: granted,
      consentState: "active",
    });
  } catch (error) {
    throw new DaviviendaAccountInformationConfigurationError(
      error instanceof Error ? error.message : "Invalid Davivienda Account Information configuration",
    );
  }
}
