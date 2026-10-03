import {
  AccountInformationGate,
  type AccountInformationCapability,
} from "./account-information.js";

export const NU_COLOMBIA_IMPORT_PROFILE = Object.freeze({
  institutionId: "nu-colombia",
  legalInstitution: "Nu Colombia Compañía de Financiamiento S.A.",
  displayName: "Cuenta Nu",
  productScope: "Cuenta de ahorros Nu",
  accessMode: "statement_import" as const,
  environment: "local_import" as const,
  statementFormat: "pdf" as const,
  officialAccountInformationRoute: "not_verified" as const,
  aggregatorRoute: "not_verified" as const,
  officialStatementDelivery: ["nu_app", "email"] as const,
  requiresUserProvidedDocument: true,
  persistDocumentPassword: false,
  parserAvailable: false,
});

export interface NuColombiaAccountInformationConfig {
  officialRouteVerified?: boolean;
  consentVerified?: boolean;
  accountsEndpoint?: string;
  balancesEndpoint?: string;
  transactionsEndpoint?: string;
  grantedCapabilities?: readonly AccountInformationCapability[];
}

export class NuColombiaAccountInformationConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NuColombiaAccountInformationConfigurationError";
  }
}

/**
 * Fail-closed Nu Colombia Account Information gate.
 *
 * Current official evidence verifies a customer statement flow for Cuenta Nu,
 * not a consumable third-party Account Information route. No endpoint, scope,
 * credential, OAuth parameter or certificate is embedded here.
 */
export function createNuColombiaAccountInformationGate(
  config: NuColombiaAccountInformationConfig,
): AccountInformationGate {
  if (config.officialRouteVerified !== true) {
    throw new NuColombiaAccountInformationConfigurationError(
      "Verified official Nu Colombia account-information route is required",
    );
  }
  if (config.consentVerified !== true) {
    throw new NuColombiaAccountInformationConfigurationError(
      "Verified Nu Colombia consent is required before Account Information access",
    );
  }

  const granted = config.grantedCapabilities ?? [];
  if (granted.length === 0) {
    throw new NuColombiaAccountInformationConfigurationError(
      "At least one verified Nu Colombia Account Information capability is required",
    );
  }

  const endpoints: Partial<Record<AccountInformationCapability, string | undefined>> = {
    accounts: config.accountsEndpoint,
    balances: config.balancesEndpoint,
    transactions: config.transactionsEndpoint,
  };

  for (const capability of granted) {
    if (!endpoints[capability]?.trim()) {
      throw new NuColombiaAccountInformationConfigurationError(
        `Verified Nu Colombia endpoint is required for granted capability: ${capability}`,
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
    throw new NuColombiaAccountInformationConfigurationError(
      error instanceof Error ? error.message : "Invalid Nu Colombia Account Information configuration",
    );
  }
}
