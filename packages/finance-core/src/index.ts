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
