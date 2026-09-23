export type CurrencyCode = string;
export type Money = Readonly<{ amountMinor: bigint; currency: CurrencyCode }>;
export type ISODateTime = string;

export type TenantStatus = "active" | "suspended" | "closed";
export type InstitutionKind = "bank" | "digital_wallet" | "broker" | "exchange" | "wallet_provider" | "other";
export type InstitutionStatus = "active" | "degraded" | "unavailable";
export type ConnectionAccessMode =
  | "open_finance_oauth"
  | "oauth"
  | "read_only_api_key"
  | "public_address"
  | "aggregator"
  | "statement_import";
export type ConnectionStatus =
  | "pending"
  | "connected"
  | "degraded"
  | "reauth_required"
  | "consent_expired"
  | "revoked"
  | "disconnected";
export type ConsentStatus = "pending" | "active" | "expired" | "revoked" | "rejected";
export type FinancialCapability =
  | "accounts"
  | "balances"
  | "transactions"
  | "positions"
  | "investment_activities"
  | "portfolio_snapshots"
  | "cards"
  | "payments";

export interface Tenant {
  id: string;
  ownerUserId: string;
  name: string;
  defaultCurrency: CurrencyCode;
  status: TenantStatus;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface FinancialInstitution {
  id: string;
  name: string;
  legalName?: string;
  country: string;
  kind: InstitutionKind;
  status: InstitutionStatus;
  supportedAccessModes: readonly ConnectionAccessMode[];
  sandboxAvailable: boolean;
}

export interface FinancialConnection {
  id: string;
  tenantId: string;
  institutionId: string;
  accessMode: ConnectionAccessMode;
  status: ConnectionStatus;
  capabilities: readonly FinancialCapability[];
  externalConnectionId?: string;
  secretReference?: string;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
  lastSyncedAt?: ISODateTime;
}

export interface FinancialConsent {
  id: string;
  tenantId: string;
  connectionId: string;
  status: ConsentStatus;
  capabilities: readonly FinancialCapability[];
  grantedAt?: ISODateTime;
  expiresAt?: ISODateTime;
  revokedAt?: ISODateTime;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export type TransactionDirection = "credit" | "debit";
export type TransactionStatus = "pending" | "posted" | "reversed";
export type TransactionKind =
  | "purchase"
  | "income"
  | "refund"
  | "fee"
  | "tax"
  | "transfer"
  | "investment_transfer"
  | "investment_activity"
  | "debt_payment"
  | "cash_withdrawal"
  | "cash_deposit"
  | "adjustment"
  | "unknown";

export type TransactionEconomicClass =
  | "expense"
  | "income"
  | "refund"
  | "internal_transfer"
  | "investment_flow"
  | "investment_activity"
  | "debt_flow"
  | "cash_movement"
  | "neutral"
  | "unknown";

export type TransactionCategoryGroup =
  | "housing"
  | "food"
  | "transport"
  | "education"
  | "health"
  | "subscriptions"
  | "entertainment"
  | "shopping"
  | "personal_care"
  | "travel"
  | "family"
  | "utilities"
  | "business"
  | "income"
  | "investments"
  | "transfers"
  | "debt"
  | "taxes_fees"
  | "cash"
  | "other";

export type TransactionCategorySource = "provider" | "rule" | "model" | "user" | "system";

export interface TransactionCategoryAssignment {
  group: TransactionCategoryGroup;
  code: string;
  label?: string;
  source: TransactionCategorySource;
  confidence?: number;
}

export type TransactionSourceType =
  | "open_finance_api"
  | "provider_api"
  | "aggregator_api"
  | "statement_import"
  | "manual"
  | "email_auxiliary";

export interface TransactionProvenance {
  sourceType: TransactionSourceType;
  observedAt: ISODateTime;
  provider?: string;
  sourceRecordId?: string;
}

export interface TransactionCounterparty {
  kind: "merchant" | "person" | "institution" | "self" | "unknown";
  name?: string;
  accountHint?: string;
}

export type AccountDomain = "cash" | "credit" | "investment" | "crypto";
export type FinancialAccountType =
  | "checking"
  | "savings"
  | "wallet"
  | "credit"
  | "investment"
  | "brokerage"
  | "exchange"
  | "crypto_wallet"
  | "other";

export interface FinancialAccount {
  id: string;
  tenantId: string;
  connectionId: string;
  institutionId: string;
  externalId: string;
  name: string;
  type: FinancialAccountType;
  domain: AccountDomain;
  currency: CurrencyCode;
  maskedNumber?: string;
  createdAt?: ISODateTime;
  updatedAt?: ISODateTime;
}

export interface FinancialBalance {
  id: string;
  tenantId: string;
  connectionId: string;
  accountId: string;
  current: Money;
  available?: Money;
  creditLimit?: Money;
  asOf: ISODateTime;
}

export interface FinancialTransaction {
  id: string;
  tenantId: string;
  connectionId: string;
  accountId: string;
  externalId?: string;
  authorizedAt?: ISODateTime;
  postedAt: ISODateTime;
  money: Money;
  direction: TransactionDirection;
  status: TransactionStatus;
  kind: TransactionKind;
  rawDescription: string;
  normalizedDescription?: string;
  counterparty?: TransactionCounterparty;
  category?: TransactionCategoryAssignment;
  provenance: TransactionProvenance;
  originalMoney?: Money;
  exchangeRate?: number;
  fingerprint?: string;
  transferGroupId?: string;
  investmentActivityId?: string;
}

export type InvestmentProviderKind = "broker" | "exchange" | "wallet" | "statement_import";
export type AssetClass = "cash" | "stock" | "etf" | "crypto" | "bond" | "fund" | "option" | "other";
export type InvestmentActivityKind =
  | "buy"
  | "sell"
  | "deposit"
  | "withdrawal"
  | "dividend"
  | "interest"
  | "fee"
  | "tax"
  | "transfer"
  | "other";

export interface InvestmentProvider {
  id: string;
  name: string;
  kind: InvestmentProviderKind;
}

export interface Portfolio {
  id: string;
  tenantId: string;
  name: string;
  baseCurrency: CurrencyCode;
  accountIds: readonly string[];
}

export interface Asset {
  id: string;
  symbol?: string;
  name: string;
  assetClass: AssetClass;
  currency: CurrencyCode;
  isin?: string;
  providerAssetId?: string;
}

export interface Position {
  id: string;
  portfolioId: string;
  accountId: string;
  assetId: string;
  quantity: number;
  averageCost?: Money;
  marketPrice?: Money;
  marketValue?: Money;
  unrealizedPnl?: Money;
  asOf: ISODateTime;
}

export interface InvestmentActivity {
  id: string;
  portfolioId: string;
  accountId: string;
  externalId?: string;
  assetId?: string;
  kind: InvestmentActivityKind;
  occurredAt: ISODateTime;
  cashAmount?: Money;
  quantity?: number;
  unitPrice?: Money;
  fee?: Money;
  linkedTransactionId?: string;
}

export interface PortfolioSnapshot {
  id: string;
  portfolioId: string;
  asOf: ISODateTime;
  marketValue: Money;
  cashValue?: Money;
  netContributions?: Money;
}

export interface TransferMatchCandidate {
  tenantId: string;
  sourceTransactionId: string;
  destinationTransactionId?: string;
  externalInvestmentAccountId?: string;
  confidence: "exact" | "high" | "medium" | "low";
}

export interface TenantScopedEntity {
  tenantId: string;
}

export function assertTenantScope(expectedTenantId: string, entity: TenantScopedEntity, label = "entity"): void {
  if (!expectedTenantId || entity.tenantId !== expectedTenantId) {
    throw new Error(`Tenant scope mismatch for ${label}`);
  }
}

export function assertAccountBelongsToConnection(
  account: FinancialAccount,
  connection: FinancialConnection,
): void {
  assertTenantScope(connection.tenantId, account, "account");
  if (account.connectionId !== connection.id) throw new Error("Account connection mismatch");
  if (account.institutionId !== connection.institutionId) throw new Error("Account institution mismatch");
}

export function assertBalanceBelongsToAccount(balance: FinancialBalance, account: FinancialAccount): void {
  assertTenantScope(account.tenantId, balance, "balance");
  if (balance.accountId !== account.id) throw new Error("Balance account mismatch");
  if (balance.connectionId !== account.connectionId) throw new Error("Balance connection mismatch");
}

export function assertTransactionBelongsToAccount(
  transaction: FinancialTransaction,
  account: FinancialAccount,
): void {
  assertTenantScope(account.tenantId, transaction, "transaction");
  if (transaction.accountId !== account.id) throw new Error("Transaction account mismatch");
  if (transaction.connectionId !== account.connectionId) throw new Error("Transaction connection mismatch");
}

export function isConsentActive(consent: FinancialConsent, at: ISODateTime): boolean {
  if (consent.status !== "active") return false;
  if (!consent.expiresAt) return true;
  return Date.parse(consent.expiresAt) > Date.parse(at);
}

export function signedMinorUnits(tx: Pick<FinancialTransaction, "money" | "direction">): bigint {
  return tx.direction === "debit" ? -tx.money.amountMinor : tx.money.amountMinor;
}

export function economicClassForKind(kind: TransactionKind): TransactionEconomicClass {
  switch (kind) {
    case "purchase":
    case "fee":
    case "tax":
      return "expense";
    case "income":
      return "income";
    case "refund":
      return "refund";
    case "transfer":
      return "internal_transfer";
    case "investment_transfer":
      return "investment_flow";
    case "investment_activity":
      return "investment_activity";
    case "debt_payment":
      return "debt_flow";
    case "cash_withdrawal":
    case "cash_deposit":
      return "cash_movement";
    case "adjustment":
      return "neutral";
    case "unknown":
      return "unknown";
  }
}

export function assertTransactionSchema(transaction: FinancialTransaction): void {
  if (transaction.money.amountMinor < 0n) throw new Error("Transaction amount must use absolute minor units");
  if (!transaction.money.currency) throw new Error("Transaction currency is required");
  if (!transaction.rawDescription.trim()) throw new Error("Transaction rawDescription is required");
  if (Number.isNaN(Date.parse(transaction.postedAt))) throw new Error("Transaction postedAt must be a valid date");
  if (Number.isNaN(Date.parse(transaction.provenance.observedAt))) {
    throw new Error("Transaction provenance observedAt must be a valid date");
  }
  if (
    transaction.category?.confidence !== undefined &&
    (transaction.category.confidence < 0 || transaction.category.confidence > 1)
  ) {
    throw new Error("Transaction category confidence must be between 0 and 1");
  }
  if (transaction.exchangeRate !== undefined && transaction.exchangeRate <= 0) {
    throw new Error("Transaction exchangeRate must be positive");
  }
}

export function isSpendingTransaction(tx: Pick<FinancialTransaction, "kind">): boolean {
  return economicClassForKind(tx.kind) === "expense";
}

export function isPatrimonialTransfer(tx: Pick<FinancialTransaction, "kind">): boolean {
  const economicClass = economicClassForKind(tx.kind);
  return (
    economicClass === "internal_transfer" ||
    economicClass === "investment_flow" ||
    economicClass === "cash_movement"
  );
}

export function netAccountMovementMinor(transactions: readonly FinancialTransaction[]): bigint {
  return transactions.reduce((total, tx) => total + signedMinorUnits(tx), 0n);
}

export function netEconomicCashFlowMinor(transactions: readonly FinancialTransaction[]): bigint {
  return transactions.reduce((total, tx) => {
    const economicClass = economicClassForKind(tx.kind);
    if (
      economicClass === "internal_transfer" ||
      economicClass === "investment_flow" ||
      economicClass === "investment_activity" ||
      economicClass === "cash_movement" ||
      economicClass === "neutral"
    ) {
      return total;
    }
    return total + signedMinorUnits(tx);
  }, 0n);
}

/** @deprecated Prefer netEconomicCashFlowMinor for explicit semantics. */
export function netCashFlowMinor(transactions: readonly FinancialTransaction[]): bigint {
  return netEconomicCashFlowMinor(transactions);
}
