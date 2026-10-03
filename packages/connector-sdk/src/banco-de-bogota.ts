import { AccountInformationGate, type AccountInformationCapability } from "./account-information.js";

export const BANCO_DE_BOGOTA_IMPORT_PROFILE = Object.freeze({
  institutionId: "banco-de-bogota",
  legalInstitution: "Banco de Bogotá S.A.",
  displayName: "Banco de Bogotá",
  group: "Grupo Aval",
  productScope: "consumer deposit accounts",
  accessMode: "statement_import" as const,
  environment: "local_import" as const,
  statementFormat: "document" as const,
  officialAccountInformationRoute: "not_verified" as const,
  aggregatorRoute: "not_verified" as const,
  officialStatementChannels: ["banca_movil", "banca_virtual"] as const,
  requiresUserProvidedDocument: true,
  persistDocumentPassword: false,
  parserAvailable: false,
});

export interface BancoDeBogotaAccountInformationConfig {
  officialRouteVerified?: boolean;
  consentVerified?: boolean;
  accountsEndpoint?: string;
  balancesEndpoint?: string;
  transactionsEndpoint?: string;
  grantedCapabilities?: readonly AccountInformationCapability[];
}

export class BancoDeBogotaAccountInformationConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BancoDeBogotaAccountInformationConfigurationError";
  }
}

export function createBancoDeBogotaAccountInformationGate(
  config: BancoDeBogotaAccountInformationConfig,
): AccountInformationGate {
  if (config.officialRouteVerified !== true) throw new BancoDeBogotaAccountInformationConfigurationError("Verified Banco de Bogotá consumer Account Information route is required");
  if (config.consentVerified !== true) throw new BancoDeBogotaAccountInformationConfigurationError("Verified Banco de Bogotá consumer consent is required");
  const granted = config.grantedCapabilities ?? [];
  if (granted.length === 0) throw new BancoDeBogotaAccountInformationConfigurationError("At least one verified Banco de Bogotá capability is required");
  const endpoints: Partial<Record<AccountInformationCapability, string | undefined>> = {
    accounts: config.accountsEndpoint, balances: config.balancesEndpoint, transactions: config.transactionsEndpoint,
  };
  for (const capability of granted) {
    if (!endpoints[capability]?.trim()) throw new BancoDeBogotaAccountInformationConfigurationError(`Verified Banco de Bogotá endpoint is required for granted capability: ${capability}`);
  }
  try {
    return new AccountInformationGate({
      ...(config.accountsEndpoint !== undefined ? { accountsEndpoint: config.accountsEndpoint } : {}),
      ...(config.balancesEndpoint !== undefined ? { balancesEndpoint: config.balancesEndpoint } : {}),
      ...(config.transactionsEndpoint !== undefined ? { transactionsEndpoint: config.transactionsEndpoint } : {}),
      grantedCapabilities: granted, consentState: "active",
    });
  } catch (error) {
    throw new BancoDeBogotaAccountInformationConfigurationError(error instanceof Error ? error.message : "Invalid Banco de Bogotá Account Information configuration");
  }
}
