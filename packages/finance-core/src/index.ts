export type CurrencyCode = string;
export type Money = Readonly<{ amountMinor: bigint; currency: CurrencyCode }>;

export type TransactionDirection = "credit" | "debit";
export type TransactionStatus = "pending" | "posted" | "reversed";
export type TransactionKind =
  | "expense"
  | "income"
  | "transfer"
  | "investment_transfer"
  | "investment_activity"
  | "unknown";

export type AccountDomain = "cash" | "credit" | "investment" | "crypto";
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

export interface FinancialAccount {
  id: string;
  connectionId: string;
  externalId: string;
  name: string;
  type: "checking" | "savings" | "wallet" | "credit" | "investment" | "brokerage" | "exchange" | "crypto_wallet" | "other";
  domain: AccountDomain;
  currency: CurrencyCode;
  maskedNumber?: string;
}

export interface FinancialTransaction {
  id: string;
  connectionId: string;
  accountId: string;
  externalId?: string;
  authorizedAt?: string;
  postedAt: string;
  money: Money;
  direction: TransactionDirection;
  status: TransactionStatus;
  kind: TransactionKind;
  rawDescription: string;
  normalizedDescription?: string;
  merchant?: string;
  category?: string;
  subcategory?: string;
  fingerprint?: string;
  transferGroupId?: string;
  investmentActivityId?: string;
}

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
  asOf: string;
}

export interface InvestmentActivity {
  id: string;
  portfolioId: string;
  accountId: string;
  externalId?: string;
  assetId?: string;
  kind: InvestmentActivityKind;
  occurredAt: string;
  cashAmount?: Money;
  quantity?: number;
  unitPrice?: Money;
  fee?: Money;
  linkedTransactionId?: string;
}

export interface PortfolioSnapshot {
  id: string;
  portfolioId: string;
  asOf: string;
  marketValue: Money;
  cashValue?: Money;
  netContributions?: Money;
}

export interface TransferMatchCandidate {
  sourceTransactionId: string;
  destinationTransactionId?: string;
  externalInvestmentAccountId?: string;
  confidence: "exact" | "high" | "medium" | "low";
}

export function signedMinorUnits(tx: Pick<FinancialTransaction, "money" | "direction">): bigint {
  return tx.direction === "debit" ? -tx.money.amountMinor : tx.money.amountMinor;
}

export function isSpendingTransaction(tx: Pick<FinancialTransaction, "kind">): boolean {
  return tx.kind === "expense";
}

export function isPatrimonialTransfer(tx: Pick<FinancialTransaction, "kind">): boolean {
  return tx.kind === "transfer" || tx.kind === "investment_transfer";
}

export function netCashFlowMinor(transactions: readonly FinancialTransaction[]): bigint {
  return transactions.reduce((total, tx) => {
    if (isPatrimonialTransfer(tx) || tx.kind === "investment_activity") return total;
    return total + signedMinorUnits(tx);
  }, 0n);
}
