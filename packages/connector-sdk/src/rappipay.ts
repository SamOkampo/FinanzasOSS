import {
  AccountInformationGate,
  type AccountInformationCapability,
} from "./account-information.js";

export type RappiFinancialProduct = "rappicuenta" | "rappicard";

export const RAPPICUENTA_IMPORT_PROFILE = Object.freeze({
  institutionId: "rappipay",
  legalInstitution: "RappiPay Compañía de Financiamiento S.A.",
  displayName: "RappiCuenta",
  productScope: "RappiCuenta / consumer deposits",
  accessMode: "statement_import" as const,
  environment: "local_import" as const,
  statementFormat: "not_verified" as const,
  officialAccountInformationRoute: "not_verified" as const,
  aggregatorRoute: "not_verified" as const,
  officialStatementDelivery: ["rappipay_app", "email", "official_channels"] as const,
  requiresUserProvidedDocument: true,
  persistDocumentPassword: false,
  parserAvailable: false,
});

export const RAPPICARD_IMPORT_PROFILE = Object.freeze({
  institutionId: "davivienda-rappicard",
  legalInstitution: "Banco Davivienda S.A.",
  displayName: "RappiCard",
  productScope: "RappiCard / consumer credit card",
  accessMode: "statement_import" as const,
  environment: "local_import" as const,
  statementFormat: "not_verified" as const,
  officialAccountInformationRoute: "not_verified" as const,
  aggregatorRoute: "not_verified" as const,
  officialStatementDelivery: ["rappi_app", "official_channels"] as const,
  requiresUserProvidedDocument: true,
  persistDocumentPassword: false,
  parserAvailable: false,
});

export interface RappiAccountInformationConfig {
  product: RappiFinancialProduct;
  officialRouteVerified?: boolean;
  consentVerified?: boolean;
  accountsEndpoint?: string;
  balancesEndpoint?: string;
  transactionsEndpoint?: string;
  grantedCapabilities?: readonly AccountInformationCapability[];
}

export class RappiAccountInformationConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RappiAccountInformationConfigurationError";
  }
}

function productLabel(product: RappiFinancialProduct): string {
  return product === "rappicuenta" ? "RappiCuenta" : "RappiCard";
}

/**
 * Fail-closed Account Information gate for Rappi financial products.
 *
 * RappiCuenta and RappiCard are deliberately modeled as separate products and
 * legal institutions. Current evidence verifies official monthly statements,
 * not a consumable third-party Account Information route for either product.
 */
export function createRappiAccountInformationGate(
  config: RappiAccountInformationConfig,
): AccountInformationGate {
  const label = productLabel(config.product);

  if (config.officialRouteVerified !== true) {
    throw new RappiAccountInformationConfigurationError(
      `Verified official ${label} account-information route is required`,
    );
  }
  if (config.consentVerified !== true) {
    throw new RappiAccountInformationConfigurationError(
      `Verified ${label} consent is required before Account Information access`,
    );
  }

  const granted = config.grantedCapabilities ?? [];
  if (granted.length === 0) {
    throw new RappiAccountInformationConfigurationError(
      `At least one verified ${label} Account Information capability is required`,
    );
  }

  const endpoints: Partial<Record<AccountInformationCapability, string | undefined>> = {
    accounts: config.accountsEndpoint,
    balances: config.balancesEndpoint,
    transactions: config.transactionsEndpoint,
  };

  for (const capability of granted) {
    if (!endpoints[capability]?.trim()) {
      throw new RappiAccountInformationConfigurationError(
        `Verified ${label} endpoint is required for granted capability: ${capability}`,
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
    throw new RappiAccountInformationConfigurationError(
      error instanceof Error ? error.message : `Invalid ${label} Account Information configuration`,
    );
  }
}
