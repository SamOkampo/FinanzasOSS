import {
  AccountInformationGate,
  type AccountInformationCapability,
} from "./account-information.js";

export const PIBANK_IMPORT_PROFILE = Object.freeze({
  institutionId: "pibank",
  legalInstitution: "Banco Pichincha S.A.",
  displayName: "Pibank",
  productScope: "Cuenta Pibank",
  accessMode: "statement_import" as const,
  environment: "local_import" as const,
  statementFormat: "not_verified" as const,
  officialAccountInformationRoute: "not_verified" as const,
  aggregatorRoute: "not_verified" as const,
  officialStatementDelivery: ["email", "official_digital_channels"] as const,
  requiresUserProvidedDocument: true,
  persistDocumentPassword: false,
  parserAvailable: false,
});

export interface PibankAccountInformationConfig {
  officialRouteVerified?: boolean;
  consentVerified?: boolean;
  accountsEndpoint?: string;
  balancesEndpoint?: string;
  transactionsEndpoint?: string;
  grantedCapabilities?: readonly AccountInformationCapability[];
}

export class PibankAccountInformationConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PibankAccountInformationConfigurationError";
  }
}

/**
 * Fail-closed Pibank Account Information gate.
 *
 * Current official evidence supports monthly statement access for Cuenta
 * Pibank, not a verified third-party Account Information route. No endpoint,
 * scope, credential, OAuth parameter or certificate is embedded here.
 */
export function createPibankAccountInformationGate(
  config: PibankAccountInformationConfig,
): AccountInformationGate {
  if (config.officialRouteVerified !== true) {
    throw new PibankAccountInformationConfigurationError(
      "Verified official Pibank account-information route is required",
    );
  }
  if (config.consentVerified !== true) {
    throw new PibankAccountInformationConfigurationError(
      "Verified Pibank consent is required before Account Information access",
    );
  }

  const granted = config.grantedCapabilities ?? [];
  if (granted.length === 0) {
    throw new PibankAccountInformationConfigurationError(
      "At least one verified Pibank Account Information capability is required",
    );
  }

  const endpoints: Partial<Record<AccountInformationCapability, string | undefined>> = {
    accounts: config.accountsEndpoint,
    balances: config.balancesEndpoint,
    transactions: config.transactionsEndpoint,
  };

  for (const capability of granted) {
    if (!endpoints[capability]?.trim()) {
      throw new PibankAccountInformationConfigurationError(
        `Verified Pibank endpoint is required for granted capability: ${capability}`,
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
    throw new PibankAccountInformationConfigurationError(
      error instanceof Error ? error.message : "Invalid Pibank Account Information configuration",
    );
  }
}
