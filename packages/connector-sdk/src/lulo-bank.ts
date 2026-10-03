import {
  AccountInformationGate,
  type AccountInformationCapability,
} from "./account-information.js";

export const LULO_BANK_IMPORT_PROFILE = Object.freeze({
  institutionId: "lulo-bank",
  displayName: "Lulo Bank",
  productScope: "Lulo Cuenta",
  accessMode: "statement_import" as const,
  environment: "local_import" as const,
  statementFormat: "pdf" as const,
  officialAccountInformationRoute: "not_verified" as const,
  aggregatorRoute: "not_verified" as const,
  requiresUserProvidedDocument: true,
  statementMayBePasswordProtected: true,
  persistDocumentPassword: false,
  parserAvailable: false,
});

export interface LuloBankAccountInformationConfig {
  officialRouteVerified?: boolean;
  consentVerified?: boolean;
  accountsEndpoint?: string;
  balancesEndpoint?: string;
  transactionsEndpoint?: string;
  grantedCapabilities?: readonly AccountInformationCapability[];
}

export class LuloBankAccountInformationConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LuloBankAccountInformationConfigurationError";
  }
}

/**
 * Fail-closed Lulo Bank Account Information gate.
 *
 * FinanzasOSS has verified an official statement-download flow, not a
 * consumable third-party Account Information route. No endpoint, scope,
 * credential or certificate is embedded here.
 */
export function createLuloBankAccountInformationGate(
  config: LuloBankAccountInformationConfig,
): AccountInformationGate {
  if (config.officialRouteVerified !== true) {
    throw new LuloBankAccountInformationConfigurationError(
      "Verified official Lulo Bank account-information route is required",
    );
  }
  if (config.consentVerified !== true) {
    throw new LuloBankAccountInformationConfigurationError(
      "Verified Lulo Bank consent is required before Account Information access",
    );
  }

  const granted = config.grantedCapabilities ?? [];
  if (granted.length === 0) {
    throw new LuloBankAccountInformationConfigurationError(
      "At least one verified Lulo Bank Account Information capability is required",
    );
  }

  const endpoints: Partial<Record<AccountInformationCapability, string | undefined>> = {
    accounts: config.accountsEndpoint,
    balances: config.balancesEndpoint,
    transactions: config.transactionsEndpoint,
  };

  for (const capability of granted) {
    if (!endpoints[capability]?.trim()) {
      throw new LuloBankAccountInformationConfigurationError(
        `Verified Lulo Bank endpoint is required for granted capability: ${capability}`,
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
    throw new LuloBankAccountInformationConfigurationError(
      error instanceof Error ? error.message : "Invalid Lulo Bank Account Information configuration",
    );
  }
}
