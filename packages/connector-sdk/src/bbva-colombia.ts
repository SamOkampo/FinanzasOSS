import { AccountInformationGate, type AccountInformationCapability } from "./account-information.js";

export const BBVA_COLOMBIA_CONSUMER_IMPORT_PROFILE = Object.freeze({
  institutionId: "bbva-colombia",
  legalInstitution: "Banco Bilbao Vizcaya Argentaria Colombia S.A.",
  displayName: "BBVA Colombia",
  productScope: "consumer current and savings accounts",
  accessMode: "statement_import" as const,
  environment: "local_import" as const,
  statementFormat: "pdf" as const,
  officialAccountInformationRoute: "not_verified" as const,
  aggregatorRoute: "not_verified" as const,
  officialStatementChannels: ["app_bbva", "bbva_net"] as const,
  requiresUserProvidedDocument: true,
  persistDocumentPassword: false,
  parserAvailable: false,
});

export const BBVA_COLOMBIA_ENTERPRISE_API_PROFILE = Object.freeze({
  institutionId: "bbva-colombia-enterprise",
  legalInstitution: "Banco Bilbao Vizcaya Argentaria Colombia S.A.",
  productScope: "BBVA Colombia business current and savings accounts",
  accessMode: "enterprise_api" as const,
  eligibility: "enterprise_only" as const,
  apiVisibility: "private" as const,
  verifiedCapabilities: ["accounts", "balances", "transactions"] as const,
  products: ["Business Accounts", "Business Reconciliation"] as const,
  consumerEligible: false,
});

export interface BbvaColombiaConsumerAccountInformationConfig {
  consumerRouteVerified?: boolean;
  consentVerified?: boolean;
  accountsEndpoint?: string;
  balancesEndpoint?: string;
  transactionsEndpoint?: string;
  grantedCapabilities?: readonly AccountInformationCapability[];
}

export class BbvaColombiaAccountInformationConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BbvaColombiaAccountInformationConfigurationError";
  }
}

export function createBbvaColombiaConsumerAccountInformationGate(
  config: BbvaColombiaConsumerAccountInformationConfig,
): AccountInformationGate {
  if (config.consumerRouteVerified !== true) {
    throw new BbvaColombiaAccountInformationConfigurationError(
      "Verified BBVA Colombia consumer Account Information route is required; enterprise API evidence is insufficient",
    );
  }
  if (config.consentVerified !== true) {
    throw new BbvaColombiaAccountInformationConfigurationError("Verified BBVA Colombia consumer consent is required");
  }
  const granted = config.grantedCapabilities ?? [];
  if (granted.length === 0) {
    throw new BbvaColombiaAccountInformationConfigurationError("At least one verified BBVA Colombia consumer capability is required");
  }
  const endpoints: Partial<Record<AccountInformationCapability, string | undefined>> = {
    accounts: config.accountsEndpoint,
    balances: config.balancesEndpoint,
    transactions: config.transactionsEndpoint,
  };
  for (const capability of granted) {
    if (!endpoints[capability]?.trim()) {
      throw new BbvaColombiaAccountInformationConfigurationError(
        `Verified BBVA Colombia consumer endpoint is required for granted capability: ${capability}`,
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
    throw new BbvaColombiaAccountInformationConfigurationError(
      error instanceof Error ? error.message : "Invalid BBVA Colombia consumer Account Information configuration",
    );
  }
}
