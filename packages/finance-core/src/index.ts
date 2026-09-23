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

export type DecimalString = string;
export type InvestmentProviderKind = "broker" | "exchange" | "wallet" | "statement_import";
export type PortfolioStatus = "active" | "archived";
export type AssetClass = "cash" | "stock" | "etf" | "crypto" | "bond" | "fund" | "option" | "other";
export type AssetIdentifierKind = "isin" | "cusip" | "figi" | "ticker" | "crypto_contract" | "provider";
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
  | "corporate_action"
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
  status: PortfolioStatus;
  accountIds: readonly string[];
  createdAt?: ISODateTime;
  updatedAt?: ISODateTime;
}

export interface AssetIdentifier {
  kind: AssetIdentifierKind;
  value: string;
  namespace?: string;
}

export interface Asset {
  id: string;
  tenantId: string;
  symbol?: string;
  name: string;
  assetClass: AssetClass;
  currency: CurrencyCode;
  identifiers: readonly AssetIdentifier[];
  providerAssetId?: string;
}

export interface Position {
  id: string;
  tenantId: string;
  portfolioId: string;
  accountId: string;
  assetId: string;
  quantity: DecimalString;
  averageCostPerUnit?: Money;
  marketPrice?: Money;
  marketValue?: Money;
  costBasis?: Money;
  unrealizedPnl?: Money;
  asOf: ISODateTime;
}

export interface InvestmentActivity {
  id: string;
  tenantId: string;
  portfolioId: string;
  accountId: string;
  externalId?: string;
  assetId?: string;
  kind: InvestmentActivityKind;
  occurredAt: ISODateTime;
  cashAmount?: Money;
  quantity?: DecimalString;
  unitPrice?: Money;
  fee?: Money;
  realizedPnl?: Money;
  linkedTransactionId?: string;
}

export interface PortfolioSnapshot {
  id: string;
  tenantId: string;
  portfolioId: string;
  asOf: ISODateTime;
  marketValue: Money;
  cashValue?: Money;
  netContributions?: Money;
}

export function isValidDecimalString(value: string): boolean {
  return /^-?(?:0|[1-9]\d*)(?:\.\d+)?$/.test(value);
}

export function assertDecimalString(value: string, label = "decimal"): void {
  if (!isValidDecimalString(value)) throw new Error(`${label} must be a canonical decimal string`);
}

export function assertPortfolioAccountMembership(portfolio: Portfolio, account: FinancialAccount): void {
  assertTenantScope(portfolio.tenantId, account, "portfolio account");
  if (!portfolio.accountIds.includes(account.id)) throw new Error("Account is not part of portfolio");
  if (account.domain !== "investment" && account.domain !== "crypto") {
    throw new Error("Portfolio accounts must use investment or crypto domain");
  }
}

export function assertAssetBelongsToTenant(asset: Asset, tenantId: string): void {
  assertTenantScope(tenantId, asset, "asset");
  if (!asset.name.trim()) throw new Error("Asset name is required");
  if (!asset.currency.trim()) throw new Error("Asset currency is required");
  if (asset.identifiers.some((identifier) => !identifier.value.trim())) {
    throw new Error("Asset identifiers cannot be empty");
  }
}

export function assertPositionBelongsToPortfolio(
  position: Position,
  portfolio: Portfolio,
  account: FinancialAccount,
  asset: Asset,
): void {
  assertTenantScope(portfolio.tenantId, position, "position");
  assertPortfolioAccountMembership(portfolio, account);
  assertAssetBelongsToTenant(asset, portfolio.tenantId);
  if (position.portfolioId !== portfolio.id) throw new Error("Position portfolio mismatch");
  if (position.accountId !== account.id) throw new Error("Position account mismatch");
  if (position.assetId !== asset.id) throw new Error("Position asset mismatch");
  assertDecimalString(position.quantity, "Position quantity");
}

export function assertInvestmentActivityBelongsToPortfolio(
  activity: InvestmentActivity,
  portfolio: Portfolio,
  account: FinancialAccount,
  asset?: Asset,
): void {
  assertTenantScope(portfolio.tenantId, activity, "investment activity");
  assertPortfolioAccountMembership(portfolio, account);
  if (activity.portfolioId !== portfolio.id) throw new Error("Investment activity portfolio mismatch");
  if (activity.accountId !== account.id) throw new Error("Investment activity account mismatch");
  if (activity.quantity !== undefined) assertDecimalString(activity.quantity, "Investment activity quantity");
  if (asset) {
    assertAssetBelongsToTenant(asset, portfolio.tenantId);
    if (activity.assetId !== asset.id) throw new Error("Investment activity asset mismatch");
  }
}

export function assertPortfolioSnapshotBelongsToPortfolio(snapshot: PortfolioSnapshot, portfolio: Portfolio): void {
  assertTenantScope(portfolio.tenantId, snapshot, "portfolio snapshot");
  if (snapshot.portfolioId !== portfolio.id) throw new Error("Portfolio snapshot mismatch");
  if (Number.isNaN(Date.parse(snapshot.asOf))) throw new Error("Portfolio snapshot asOf must be a valid date");
}

export interface PortfolioMetricsCompleteness {
  isComplete: boolean;
  excludedCurrencies: readonly CurrencyCode[];
  positionsWithoutMarketValue: number;
  positionsWithoutUnrealizedPnl: number;
  sellActivitiesWithoutRealizedPnl: number;
  cashValueMissing: boolean;
}

export interface PortfolioMetrics {
  portfolioId: string;
  baseCurrency: CurrencyCode;
  asOf: ISODateTime;
  marketValue: Money;
  cashValue: Money;
  totalValue: Money;
  netContributions: Money;
  realizedPnl: Money;
  unrealizedPnl: Money;
  income: Money;
  fees: Money;
  taxes: Money;
  netPerformance: Money;
  completeness: PortfolioMetricsCompleteness;
}

export interface DerivePortfolioMetricsInput {
  portfolio: Portfolio;
  positions: readonly Position[];
  activities: readonly InvestmentActivity[];
  snapshot?: PortfolioSnapshot;
  asOf: ISODateTime;
}

function moneyInCurrency(amountMinor: bigint, currency: CurrencyCode): Money {
  return { amountMinor, currency };
}

function assertNonNegativeMoney(money: Money, label: string): void {
  if (money.amountMinor < 0n) throw new Error(`${label} must use a non-negative absolute amount`);
}

export function derivePortfolioMetrics(input: DerivePortfolioMetricsInput): PortfolioMetrics {
  const { portfolio, positions, activities, snapshot, asOf } = input;
  if (Number.isNaN(Date.parse(asOf))) throw new Error("Portfolio metrics asOf must be a valid date");
  if (snapshot) assertPortfolioSnapshotBelongsToPortfolio(snapshot, portfolio);

  const baseCurrency = portfolio.baseCurrency.toUpperCase();
  const excludedCurrencies = new Set<CurrencyCode>();

  const include = (money: Money | undefined): bigint | null => {
    if (!money) return null;
    if (money.currency.toUpperCase() !== baseCurrency) {
      excludedCurrencies.add(money.currency.toUpperCase());
      return null;
    }
    return money.amountMinor;
  };

  let positionsWithoutMarketValue = 0;
  let positionsWithoutUnrealizedPnl = 0;
  let sellActivitiesWithoutRealizedPnl = 0;

  let marketValueMinor = 0n;
  if (snapshot) {
    const value = include(snapshot.marketValue);
    if (value !== null) marketValueMinor = value;
  } else {
    for (const position of positions) {
      assertTenantScope(portfolio.tenantId, position, "position metrics");
      if (position.portfolioId !== portfolio.id) throw new Error("Position metrics portfolio mismatch");
      const value = include(position.marketValue);
      if (value === null) positionsWithoutMarketValue += 1;
      else marketValueMinor += value;
    }
  }

  let cashValueMinor = 0n;
  let cashValueMissing = true;
  if (snapshot?.cashValue) {
    const value = include(snapshot.cashValue);
    if (value !== null) {
      cashValueMinor = value;
      cashValueMissing = false;
    }
  }

  let netContributionsMinor = 0n;
  if (snapshot?.netContributions) {
    const value = include(snapshot.netContributions);
    if (value !== null) netContributionsMinor = value;
  } else {
    for (const activity of activities) {
      assertTenantScope(portfolio.tenantId, activity, "investment activity metrics");
      if (activity.portfolioId !== portfolio.id) throw new Error("Investment activity metrics portfolio mismatch");
      if (activity.kind !== "deposit" && activity.kind !== "withdrawal") continue;
      const amount = include(activity.cashAmount);
      if (amount === null) continue;
      assertNonNegativeMoney(activity.cashAmount!, "Contribution cashAmount");
      netContributionsMinor += activity.kind === "deposit" ? amount : -amount;
    }
  }

  let realizedPnlMinor = 0n;
  let unrealizedPnlMinor = 0n;
  let incomeMinor = 0n;
  let feesMinor = 0n;
  let taxesMinor = 0n;

  for (const position of positions) {
    assertTenantScope(portfolio.tenantId, position, "position metrics");
    if (position.portfolioId !== portfolio.id) throw new Error("Position metrics portfolio mismatch");
    const pnl = include(position.unrealizedPnl);
    if (pnl === null) positionsWithoutUnrealizedPnl += 1;
    else unrealizedPnlMinor += pnl;
  }

  for (const activity of activities) {
    assertTenantScope(portfolio.tenantId, activity, "investment activity metrics");
    if (activity.portfolioId !== portfolio.id) throw new Error("Investment activity metrics portfolio mismatch");

    if (activity.realizedPnl) {
      const realized = include(activity.realizedPnl);
      if (realized !== null) realizedPnlMinor += realized;
    } else if (activity.kind === "sell") {
      sellActivitiesWithoutRealizedPnl += 1;
    }

    if ((activity.kind === "dividend" || activity.kind === "interest") && activity.cashAmount) {
      assertNonNegativeMoney(activity.cashAmount, "Investment income cashAmount");
      const amount = include(activity.cashAmount);
      if (amount !== null) incomeMinor += amount;
    }

    if (activity.kind === "fee" && activity.cashAmount) {
      assertNonNegativeMoney(activity.cashAmount, "Fee cashAmount");
      const amount = include(activity.cashAmount);
      if (amount !== null) feesMinor += amount;
    } else if (activity.fee) {
      assertNonNegativeMoney(activity.fee, "Activity fee");
      const fee = include(activity.fee);
      if (fee !== null) feesMinor += fee;
    }

    if (activity.kind === "tax" && activity.cashAmount) {
      assertNonNegativeMoney(activity.cashAmount, "Tax cashAmount");
      const amount = include(activity.cashAmount);
      if (amount !== null) taxesMinor += amount;
    }
  }

  const totalValueMinor = marketValueMinor + cashValueMinor;
  const netPerformanceMinor = realizedPnlMinor + unrealizedPnlMinor + incomeMinor - feesMinor - taxesMinor;
  const excluded = [...excludedCurrencies].sort();
  const isComplete =
    excluded.length === 0 &&
    positionsWithoutMarketValue === 0 &&
    positionsWithoutUnrealizedPnl === 0 &&
    sellActivitiesWithoutRealizedPnl === 0 &&
    !cashValueMissing;

  return {
    portfolioId: portfolio.id,
    baseCurrency,
    asOf,
    marketValue: moneyInCurrency(marketValueMinor, baseCurrency),
    cashValue: moneyInCurrency(cashValueMinor, baseCurrency),
    totalValue: moneyInCurrency(totalValueMinor, baseCurrency),
    netContributions: moneyInCurrency(netContributionsMinor, baseCurrency),
    realizedPnl: moneyInCurrency(realizedPnlMinor, baseCurrency),
    unrealizedPnl: moneyInCurrency(unrealizedPnlMinor, baseCurrency),
    income: moneyInCurrency(incomeMinor, baseCurrency),
    fees: moneyInCurrency(feesMinor, baseCurrency),
    taxes: moneyInCurrency(taxesMinor, baseCurrency),
    netPerformance: moneyInCurrency(netPerformanceMinor, baseCurrency),
    completeness: {
      isComplete,
      excludedCurrencies: excluded,
      positionsWithoutMarketValue,
      positionsWithoutUnrealizedPnl,
      sellActivitiesWithoutRealizedPnl,
      cashValueMissing,
    },
  };
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


export type DuplicateMatchLevel = "exact" | "likely" | "possible" | "none";

export interface DedupeOptions {
  scopeKeyA?: string;
  scopeKeyB?: string;
  dateToleranceDays?: number;
}

export interface DedupeEvaluation {
  level: DuplicateMatchLevel;
  autoMerge: boolean;
  score: number;
  reasons: readonly string[];
  fingerprintA: string;
  fingerprintB: string;
}

export function normalizeFingerprintText(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function fnv1a64(value: string): string {
  let hash = 0xcbf29ce484222325n;
  const prime = 0x100000001b3n;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= BigInt(value.charCodeAt(index));
    hash = BigInt.asUintN(64, hash * prime);
  }
  return hash.toString(16).padStart(16, "0");
}

function transactionDayKey(postedAt: ISODateTime): string {
  const parsed = new Date(postedAt);
  if (Number.isNaN(parsed.getTime())) throw new Error("Cannot fingerprint transaction with invalid postedAt");
  return parsed.toISOString().slice(0, 10);
}

function transactionDayNumber(postedAt: ISODateTime): number {
  const day = transactionDayKey(postedAt);
  return Math.floor(Date.parse(`${day}T00:00:00Z`) / 86_400_000);
}

export function buildTransactionFingerprint(transaction: FinancialTransaction, scopeKey = transaction.accountId): string {
  assertTransactionSchema(transaction);
  const canonical = [
    "fp1",
    transaction.tenantId,
    scopeKey,
    transaction.direction,
    transaction.money.currency.toUpperCase(),
    transaction.money.amountMinor.toString(),
    transactionDayKey(transaction.postedAt),
    normalizeFingerprintText(transaction.rawDescription),
  ].join("|");
  return `fp1_${fnv1a64(canonical)}`;
}

export function withTransactionFingerprint(
  transaction: FinancialTransaction,
  scopeKey = transaction.accountId,
): FinancialTransaction {
  return { ...transaction, fingerprint: buildTransactionFingerprint(transaction, scopeKey) };
}

function exactSourceIdentityMatch(a: FinancialTransaction, b: FinancialTransaction): string | null {
  if (a.externalId && b.externalId && a.connectionId === b.connectionId && a.externalId === b.externalId) {
    return "same connection + externalId";
  }
  if (
    a.provenance.provider &&
    b.provenance.provider &&
    a.provenance.provider === b.provenance.provider &&
    a.provenance.sourceRecordId &&
    b.provenance.sourceRecordId &&
    a.provenance.sourceRecordId === b.provenance.sourceRecordId
  ) {
    return "same provider + sourceRecordId";
  }
  return null;
}

function descriptionScore(a: string, b: string): number {
  const normalizedA = normalizeFingerprintText(a);
  const normalizedB = normalizeFingerprintText(b);
  if (!normalizedA || !normalizedB) return 0;
  if (normalizedA === normalizedB) return 20;
  const shorter = normalizedA.length <= normalizedB.length ? normalizedA : normalizedB;
  const longer = shorter === normalizedA ? normalizedB : normalizedA;
  return shorter.length >= 5 && longer.includes(shorter) ? 12 : 0;
}

export function evaluateDuplicateTransactions(
  a: FinancialTransaction,
  b: FinancialTransaction,
  options: DedupeOptions = {},
): DedupeEvaluation {
  const scopeKeyA = options.scopeKeyA ?? a.accountId;
  const scopeKeyB = options.scopeKeyB ?? b.accountId;
  const fingerprintA = buildTransactionFingerprint(a, scopeKeyA);
  const fingerprintB = buildTransactionFingerprint(b, scopeKeyB);
  const reasons: string[] = [];

  if (a.tenantId !== b.tenantId) {
    return { level: "none", autoMerge: false, score: 0, reasons: ["different tenant"], fingerprintA, fingerprintB };
  }
  if (scopeKeyA !== scopeKeyB) {
    return { level: "none", autoMerge: false, score: 0, reasons: ["different dedupe scope"], fingerprintA, fingerprintB };
  }

  const exactSourceMatch = exactSourceIdentityMatch(a, b);
  if (exactSourceMatch) {
    return {
      level: "exact",
      autoMerge: true,
      score: 100,
      reasons: [exactSourceMatch],
      fingerprintA,
      fingerprintB,
    };
  }

  if (
    a.direction !== b.direction ||
    a.money.currency.toUpperCase() !== b.money.currency.toUpperCase() ||
    a.money.amountMinor !== b.money.amountMinor
  ) {
    return {
      level: "none",
      autoMerge: false,
      score: 0,
      reasons: ["amount, currency or direction differ"],
      fingerprintA,
      fingerprintB,
    };
  }

  const tolerance = Math.max(0, options.dateToleranceDays ?? 1);
  const dayDistance = Math.abs(transactionDayNumber(a.postedAt) - transactionDayNumber(b.postedAt));
  if (dayDistance > tolerance) {
    return {
      level: "none",
      autoMerge: false,
      score: 0,
      reasons: ["posting dates outside tolerance"],
      fingerprintA,
      fingerprintB,
    };
  }

  let score = 45;
  reasons.push("same scope + amount + currency + direction");

  if (dayDistance === 0) {
    score += 15;
    reasons.push("same posting day");
  } else {
    score += 8;
    reasons.push("posting day within tolerance");
  }

  const description = descriptionScore(a.rawDescription, b.rawDescription);
  if (description > 0) {
    score += description;
    reasons.push(description === 20 ? "same normalized description" : "compatible normalized description");
  }

  const counterpartyA = normalizeFingerprintText(a.counterparty?.name ?? "");
  const counterpartyB = normalizeFingerprintText(b.counterparty?.name ?? "");
  if (counterpartyA && counterpartyB && counterpartyA === counterpartyB) {
    score += 10;
    reasons.push("same normalized counterparty");
  }

  score = Math.min(99, score);
  const level: DuplicateMatchLevel = score >= 80 ? "likely" : score >= 65 ? "possible" : "none";
  return {
    level,
    autoMerge: false,
    score,
    reasons,
    fingerprintA,
    fingerprintB,
  };
}


export type OwnTransferConfidence = "high" | "medium" | "low" | "none";

export interface OwnTransferMatchOptions {
  dateToleranceDays?: number;
}

export interface OwnTransferMatch {
  confidence: OwnTransferConfidence;
  autoLink: boolean;
  score: number;
  sourceTransactionId?: string;
  destinationTransactionId?: string;
  transferGroupId?: string;
  reasons: readonly string[];
}

function ownTransferSignalScore(transaction: FinancialTransaction): { score: number; explicitSignals: number; reasons: string[] } {
  let score = 0;
  let explicitSignals = 0;
  const reasons: string[] = [];

  if (transaction.kind === "transfer") {
    score += 10;
    explicitSignals += 1;
    reasons.push("transaction kind is transfer");
  }
  if (transaction.category?.group === "transfers") {
    score += 5;
    reasons.push("category group is transfers");
  }
  if (transaction.counterparty?.kind === "self") {
    score += 10;
    explicitSignals += 1;
    reasons.push("counterparty marked as self");
  }

  return { score, explicitSignals, reasons };
}

export function buildTransferGroupId(a: FinancialTransaction, b: FinancialTransaction): string {
  const ids = [a.id, b.id].sort();
  return `xfer1_${fnv1a64(["xfer1", a.tenantId, ...ids].join("|"))}`;
}

export function evaluateOwnAccountTransfer(
  a: FinancialTransaction,
  accountA: FinancialAccount,
  b: FinancialTransaction,
  accountB: FinancialAccount,
  options: OwnTransferMatchOptions = {},
): OwnTransferMatch {
  assertTransactionBelongsToAccount(a, accountA);
  assertTransactionBelongsToAccount(b, accountB);

  const reasons: string[] = [];

  if (a.tenantId !== b.tenantId || accountA.tenantId !== accountB.tenantId) {
    return { confidence: "none", autoLink: false, score: 0, reasons: ["different tenant"] };
  }
  if (accountA.id === accountB.id) {
    return { confidence: "none", autoLink: false, score: 0, reasons: ["same account"] };
  }
  if (a.kind === "investment_transfer" || b.kind === "investment_transfer") {
    return { confidence: "none", autoLink: false, score: 0, reasons: ["investment transfer delegated to Phase 2.5"] };
  }
  if (a.direction === b.direction) {
    return { confidence: "none", autoLink: false, score: 0, reasons: ["transactions do not have opposite directions"] };
  }
  if (
    a.money.currency.toUpperCase() !== b.money.currency.toUpperCase() ||
    a.money.amountMinor !== b.money.amountMinor
  ) {
    return { confidence: "none", autoLink: false, score: 0, reasons: ["amount or currency differ"] };
  }

  const source = a.direction === "debit" ? a : b;
  const destination = a.direction === "credit" ? a : b;
  const tolerance = Math.max(0, options.dateToleranceDays ?? 2);
  const dayDistance = Math.abs(transactionDayNumber(source.postedAt) - transactionDayNumber(destination.postedAt));

  if (dayDistance > tolerance) {
    return { confidence: "none", autoLink: false, score: 0, reasons: ["posting dates outside transfer tolerance"] };
  }

  let score = 50;
  reasons.push("same tenant + different accounts + opposite directions + same amount/currency");

  if (dayDistance === 0) {
    score += 15;
    reasons.push("same posting day");
  } else if (dayDistance === 1) {
    score += 10;
    reasons.push("posting dates one day apart");
  } else {
    score += 5;
    reasons.push("posting dates within transfer tolerance");
  }

  const signalA = ownTransferSignalScore(a);
  const signalB = ownTransferSignalScore(b);
  score += signalA.score + signalB.score;
  reasons.push(...signalA.reasons, ...signalB.reasons);

  score = Math.min(99, score);
  const confidence: OwnTransferConfidence =
    score >= 85 ? "high" : score >= 70 ? "medium" : score >= 60 ? "low" : "none";
  const explicitSignals = signalA.explicitSignals + signalB.explicitSignals;
  const autoLink = confidence === "high" && explicitSignals >= 2;
  const transferGroupId = confidence === "none" ? undefined : buildTransferGroupId(source, destination);

  return {
    confidence,
    autoLink,
    score,
    sourceTransactionId: source.id,
    destinationTransactionId: destination.id,
    ...(transferGroupId ? { transferGroupId } : {}),
    reasons,
  };
}

export function applyOwnAccountTransferMatch(
  a: FinancialTransaction,
  b: FinancialTransaction,
  match: OwnTransferMatch,
): readonly [FinancialTransaction, FinancialTransaction] {
  const transferGroupId = match.transferGroupId;
  if (!match.autoLink || !transferGroupId) {
    throw new Error("Own-account transfer match is not eligible for automatic linking");
  }

  const category: TransactionCategoryAssignment = {
    group: "transfers",
    code: "transfers.internal",
    label: "Transferencia entre cuentas propias",
    source: "system",
  };

  const update = (transaction: FinancialTransaction): FinancialTransaction => ({
    ...transaction,
    kind: "transfer",
    transferGroupId,
    category: transaction.category?.source === "user" ? transaction.category : category,
  });

  return [update(a), update(b)];
}


export type InvestmentTransferDirection = "contribution" | "withdrawal";
export type InvestmentTransferConfidence = "high" | "medium" | "low" | "none";

export interface InvestmentTransferMatchOptions {
  dateToleranceDays?: number;
}

export interface InvestmentTransferMatch {
  confidence: InvestmentTransferConfidence;
  autoLink: boolean;
  score: number;
  direction?: InvestmentTransferDirection;
  cashTransactionId?: string;
  investmentTransactionId?: string;
  cashAccountId?: string;
  investmentAccountId?: string;
  transferGroupId?: string;
  moneyMatch?: "same_money" | "original_money";
  reasons: readonly string[];
}

function isInvestmentAccountDomain(domain: AccountDomain): boolean {
  return domain === "investment" || domain === "crypto";
}

function moneyEquals(a: Money, b: Money): boolean {
  return a.currency.toUpperCase() === b.currency.toUpperCase() && a.amountMinor === b.amountMinor;
}

function investmentTransferMoneyMatch(
  cashTransaction: FinancialTransaction,
  investmentTransaction: FinancialTransaction,
): "same_money" | "original_money" | null {
  if (moneyEquals(cashTransaction.money, investmentTransaction.money)) return "same_money";
  if (investmentTransaction.originalMoney && moneyEquals(cashTransaction.money, investmentTransaction.originalMoney)) {
    return "original_money";
  }
  if (cashTransaction.originalMoney && moneyEquals(cashTransaction.originalMoney, investmentTransaction.money)) {
    return "original_money";
  }
  if (
    cashTransaction.originalMoney &&
    investmentTransaction.originalMoney &&
    moneyEquals(cashTransaction.originalMoney, investmentTransaction.originalMoney)
  ) {
    return "original_money";
  }
  return null;
}

function investmentTransferSignalScore(
  transaction: FinancialTransaction,
): { score: number; explicitSignals: number; reasons: string[] } {
  let score = 0;
  let explicitSignals = 0;
  const reasons: string[] = [];

  if (transaction.kind === "investment_transfer") {
    score += 10;
    explicitSignals += 1;
    reasons.push("transaction kind is investment_transfer");
  }
  if (transaction.category?.group === "investments") {
    score += 5;
    reasons.push("category group is investments");
  }
  if (transaction.counterparty?.kind === "institution") {
    score += 3;
    reasons.push("counterparty is an institution");
  }

  return { score, explicitSignals, reasons };
}

export function buildInvestmentTransferGroupId(a: FinancialTransaction, b: FinancialTransaction): string {
  const ids = [a.id, b.id].sort();
  return `invxfer1_${fnv1a64(["invxfer1", a.tenantId, ...ids].join("|"))}`;
}

export function evaluateInvestmentTransfer(
  a: FinancialTransaction,
  accountA: FinancialAccount,
  b: FinancialTransaction,
  accountB: FinancialAccount,
  options: InvestmentTransferMatchOptions = {},
): InvestmentTransferMatch {
  assertTransactionBelongsToAccount(a, accountA);
  assertTransactionBelongsToAccount(b, accountB);

  if (a.tenantId !== b.tenantId || accountA.tenantId !== accountB.tenantId) {
    return { confidence: "none", autoLink: false, score: 0, reasons: ["different tenant"] };
  }
  if (accountA.id === accountB.id) {
    return { confidence: "none", autoLink: false, score: 0, reasons: ["same account"] };
  }

  const aIsInvestment = isInvestmentAccountDomain(accountA.domain);
  const bIsInvestment = isInvestmentAccountDomain(accountB.domain);
  if (aIsInvestment === bIsInvestment) {
    return {
      confidence: "none",
      autoLink: false,
      score: 0,
      reasons: ["requires exactly one cash account and one investment/crypto account"],
    };
  }

  const investmentTransaction = aIsInvestment ? a : b;
  const investmentAccount = aIsInvestment ? accountA : accountB;
  const cashTransaction = aIsInvestment ? b : a;
  const cashAccount = aIsInvestment ? accountB : accountA;

  if (cashAccount.domain !== "cash") {
    return {
      confidence: "none",
      autoLink: false,
      score: 0,
      reasons: ["funding side must be a cash-domain account"],
    };
  }

  let direction: InvestmentTransferDirection | null = null;
  if (cashTransaction.direction === "debit" && investmentTransaction.direction === "credit") {
    direction = "contribution";
  } else if (investmentTransaction.direction === "debit" && cashTransaction.direction === "credit") {
    direction = "withdrawal";
  }
  if (!direction) {
    return { confidence: "none", autoLink: false, score: 0, reasons: ["directions do not form contribution/withdrawal"] };
  }

  const moneyMatch = investmentTransferMoneyMatch(cashTransaction, investmentTransaction);
  if (!moneyMatch) {
    return {
      confidence: "none",
      autoLink: false,
      score: 0,
      reasons: ["no exact or original-money match"],
    };
  }

  const tolerance = Math.max(0, options.dateToleranceDays ?? 3);
  const dayDistance = Math.abs(
    transactionDayNumber(cashTransaction.postedAt) - transactionDayNumber(investmentTransaction.postedAt),
  );
  if (dayDistance > tolerance) {
    return {
      confidence: "none",
      autoLink: false,
      score: 0,
      reasons: ["posting dates outside investment-transfer tolerance"],
    };
  }

  let score = moneyMatch === "same_money" ? 55 : 50;
  const reasons: string[] = [
    "same tenant + cash/investment account pair + contribution/withdrawal directions",
    moneyMatch === "same_money" ? "same amount/currency" : "matched through originalMoney",
  ];

  if (dayDistance === 0) {
    score += 15;
    reasons.push("same posting day");
  } else if (dayDistance === 1) {
    score += 10;
    reasons.push("posting dates one day apart");
  } else {
    score += 5;
    reasons.push("posting dates within investment-transfer tolerance");
  }

  const cashSignal = investmentTransferSignalScore(cashTransaction);
  const investmentSignal = investmentTransferSignalScore(investmentTransaction);
  score += cashSignal.score + investmentSignal.score;
  reasons.push(...cashSignal.reasons, ...investmentSignal.reasons);

  score = Math.min(99, score);
  const confidence: InvestmentTransferConfidence =
    score >= 85 ? "high" : score >= 70 ? "medium" : score >= 60 ? "low" : "none";
  const explicitSignals = cashSignal.explicitSignals + investmentSignal.explicitSignals;
  const autoLink = confidence === "high" && explicitSignals >= 1;
  const transferGroupId =
    confidence === "none" ? undefined : buildInvestmentTransferGroupId(cashTransaction, investmentTransaction);

  return {
    confidence,
    autoLink,
    score,
    direction,
    cashTransactionId: cashTransaction.id,
    investmentTransactionId: investmentTransaction.id,
    cashAccountId: cashAccount.id,
    investmentAccountId: investmentAccount.id,
    ...(transferGroupId ? { transferGroupId } : {}),
    moneyMatch,
    reasons,
  };
}

export function applyInvestmentTransferMatch(
  a: FinancialTransaction,
  b: FinancialTransaction,
  match: InvestmentTransferMatch,
): readonly [FinancialTransaction, FinancialTransaction] {
  const transferGroupId = match.transferGroupId;
  const direction = match.direction;
  if (!match.autoLink || !transferGroupId || !direction) {
    throw new Error("Investment transfer match is not eligible for automatic linking");
  }

  const category: TransactionCategoryAssignment = {
    group: "investments",
    code: direction === "contribution" ? "investments.contribution" : "investments.withdrawal",
    label: direction === "contribution" ? "Aporte a portafolio" : "Retiro de portafolio",
    source: "system",
  };

  const update = (transaction: FinancialTransaction): FinancialTransaction => ({
    ...transaction,
    kind: "investment_transfer",
    transferGroupId,
    category: transaction.category?.source === "user" ? transaction.category : category,
  });

  return [update(a), update(b)];
}
