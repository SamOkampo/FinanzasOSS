import assert from "node:assert/strict";
import {
  assertAccountBelongsToConnection,
  assertAssetBelongsToTenant,
  assertBalanceBelongsToAccount,
  assertDecimalString,
  assertInvestmentActivityBelongsToPortfolio,
  assertPortfolioAccountMembership,
  assertPortfolioSnapshotBelongsToPortfolio,
  assertPositionBelongsToPortfolio,
  assertTenantScope,
  applyInvestmentTransferMatch,
  applyOwnAccountTransferMatch,
  assertTransactionBelongsToAccount,
  assertTransactionSchema,
  buildTransactionFingerprint,
  derivePortfolioMetrics,
  economicClassForKind,
  evaluateDuplicateTransactions,
  evaluateInvestmentTransfer,
  evaluateOwnAccountTransfer,
  isConsentActive,
  isPatrimonialTransfer,
  isValidDecimalString,
  isSpendingTransaction,
  netAccountMovementMinor,
  netEconomicCashFlowMinor,
  normalizeFingerprintText,
  signedMinorUnits,
  withTransactionFingerprint,
} from "../dist/packages/finance-core/src/index.js";
import {
  assertConnectorSupports,
  buildConnectorCapabilityMatrix,
  buildSyncIdempotencyKey,
  CONNECTOR_CAPABILITIES,
  ConnectorSyncEngine,
  ConnectorError,
  connectorSupports,
  findConnectorsSupporting,
  healthReportFromConnectorError,
  recoveryPlanForHealth,
  validateConnectorContract,
  validateConnectorDescriptor,
  validateHealthReport,
} from "../dist/packages/connector-sdk/src/index.js";
import {
  asSecretReference,
  assertConnectorSecretMaterial,
  assertVaultScope,
  redactForLog,
} from "../dist/packages/security/src/index.js";
import { health } from "../dist/apps/api/src/index.js";
import { elevationFor, resolveMotionDuration, touchTokens } from "../dist/packages/ui/src/index.js";
import {
  accessibilityPolicy,
  assertSurfaceForSensitiveMoney,
  navigate,
  primaryNavigation,
  togglePrivacyMode,
} from "../dist/apps/web/src/index.js";

const connection = {
  id: "conn-1",
  tenantId: "tenant-1",
  institutionId: "davivienda",
  accessMode: "open_finance_oauth",
  status: "connected",
  capabilities: ["accounts", "balances", "transactions"],
  secretReference: "vault://connection/conn-1",
  createdAt: "2026-09-23T12:00:00Z",
  updatedAt: "2026-09-23T12:00:00Z",
};

const account = {
  id: "acc-1",
  tenantId: "tenant-1",
  connectionId: "conn-1",
  institutionId: "davivienda",
  externalId: "external-acc-1",
  name: "Cuenta principal",
  type: "savings",
  domain: "cash",
  currency: "COP",
};

const balance = {
  id: "bal-1",
  tenantId: "tenant-1",
  connectionId: "conn-1",
  accountId: "acc-1",
  current: { amountMinor: 250000n, currency: "COP" },
  available: { amountMinor: 240000n, currency: "COP" },
  asOf: "2026-09-23T12:05:00Z",
};

const expense = {
  id: "tx-expense",
  tenantId: "tenant-1",
  connectionId: "conn-1",
  accountId: "acc-1",
  postedAt: "2026-09-03",
  money: { amountMinor: 20000n, currency: "COP" },
  direction: "debit",
  status: "posted",
  kind: "purchase",
  rawDescription: "Food",
  category: { group: "food", code: "food.restaurant", source: "system", confidence: 0.98 },
  provenance: { sourceType: "open_finance_api", observedAt: "2026-09-03T12:00:00Z", provider: "davivienda" },
};

assert.doesNotThrow(() => assertTenantScope("tenant-1", account, "account"));
assert.throws(() => assertTenantScope("tenant-2", account, "account"), /Tenant scope mismatch/);
assert.doesNotThrow(() => assertAccountBelongsToConnection(account, connection));
assert.throws(
  () => assertAccountBelongsToConnection({ ...account, connectionId: "conn-2" }, connection),
  /Account connection mismatch/,
);
assert.doesNotThrow(() => assertBalanceBelongsToAccount(balance, account));
assert.throws(
  () => assertBalanceBelongsToAccount({ ...balance, tenantId: "tenant-2" }, account),
  /Tenant scope mismatch/,
);
assert.doesNotThrow(() => assertTransactionBelongsToAccount(expense, account));
assert.throws(
  () => assertTransactionBelongsToAccount({ ...expense, accountId: "acc-2" }, account),
  /Transaction account mismatch/,
);

assert.equal(
  isConsentActive(
    {
      id: "consent-1",
      tenantId: "tenant-1",
      connectionId: "conn-1",
      status: "active",
      capabilities: ["accounts", "balances", "transactions"],
      expiresAt: "2026-10-23T00:00:00Z",
      createdAt: "2026-09-23T00:00:00Z",
      updatedAt: "2026-09-23T00:00:00Z",
    },
    "2026-09-24T00:00:00Z",
  ),
  true,
);
assert.equal(
  isConsentActive(
    {
      id: "consent-2",
      tenantId: "tenant-1",
      connectionId: "conn-1",
      status: "active",
      capabilities: ["accounts"],
      expiresAt: "2026-09-20T00:00:00Z",
      createdAt: "2026-09-01T00:00:00Z",
      updatedAt: "2026-09-01T00:00:00Z",
    },
    "2026-09-24T00:00:00Z",
  ),
  false,
);

assert.equal(signedMinorUnits({ money: { amountMinor: 1200n, currency: "COP" }, direction: "debit" }), -1200n);
assert.equal(signedMinorUnits({ money: { amountMinor: 1200n, currency: "COP" }, direction: "credit" }), 1200n);
assert.equal(isSpendingTransaction({ kind: "purchase" }), true);
assert.equal(isSpendingTransaction({ kind: "investment_transfer" }), false);
assert.equal(isPatrimonialTransfer({ kind: "investment_transfer" }), true);
assert.equal(economicClassForKind("purchase"), "expense");
assert.equal(economicClassForKind("investment_transfer"), "investment_flow");
assert.equal(economicClassForKind("cash_withdrawal"), "cash_movement");
assert.doesNotThrow(() => assertTransactionSchema(expense));
assert.throws(
  () => assertTransactionSchema({ ...expense, money: { amountMinor: -1n, currency: "COP" } }),
  /absolute minor units/,
);
assert.throws(
  () =>
    assertTransactionSchema({
      ...expense,
      category: { group: "food", code: "food.restaurant", source: "model", confidence: 1.1 },
    }),
  /confidence/,
);
assert.throws(
  () => assertTransactionSchema({ ...expense, exchangeRate: 0 }),
  /exchangeRate/,
);

const incomeTransaction = {
  id: "1",
  tenantId: "tenant-1",
  connectionId: "c",
  accountId: "a",
  postedAt: "2026-09-01",
  money: { amountMinor: 100000n, currency: "COP" },
  direction: "credit",
  status: "posted",
  kind: "income",
  rawDescription: "Income",
  provenance: { sourceType: "manual", observedAt: "2026-09-01T12:00:00Z" },
};

const investmentTransfer = {
  id: "2",
  tenantId: "tenant-1",
  connectionId: "c",
  accountId: "a",
  postedAt: "2026-09-02",
  money: { amountMinor: 30000n, currency: "COP" },
  direction: "debit",
  status: "posted",
  kind: "investment_transfer",
  rawDescription: "Hapi funding",
  counterparty: { kind: "institution", name: "Hapi" },
  category: { group: "investments", code: "investments.contribution", source: "system" },
  provenance: { sourceType: "manual", observedAt: "2026-09-02T12:00:00Z" },
};

assert.equal(
  netEconomicCashFlowMinor([
    incomeTransaction,
    investmentTransfer,
    expense,
  ]),
  80000n,
);
assert.equal(netAccountMovementMinor([incomeTransaction, investmentTransfer, expense]), 50000n);

assert.equal(normalizeFingerprintText("  UBER *TRIP Bogotá  "), "uber trip bogota");
const fingerprintA = buildTransactionFingerprint(expense);
const fingerprintB = buildTransactionFingerprint({
  ...expense,
  id: "tx-expense-copy",
  rawDescription: "FOOD",
  provenance: { sourceType: "email_auxiliary", observedAt: "2026-09-03T12:05:00Z" },
});
assert.equal(fingerprintA, fingerprintB);
assert.equal(withTransactionFingerprint(expense).fingerprint, fingerprintA);

const exactDuplicate = evaluateDuplicateTransactions(
  {
    ...expense,
    externalId: "provider-123",
    provenance: {
      sourceType: "open_finance_api",
      observedAt: "2026-09-03T12:00:00Z",
      provider: "davivienda",
      sourceRecordId: "provider-123",
    },
  },
  {
    ...expense,
    id: "tx-exact-copy",
    externalId: "provider-123",
    provenance: {
      sourceType: "open_finance_api",
      observedAt: "2026-09-03T12:01:00Z",
      provider: "davivienda",
      sourceRecordId: "provider-123",
    },
  },
);
assert.equal(exactDuplicate.level, "exact");
assert.equal(exactDuplicate.autoMerge, true);

const likelyDuplicate = evaluateDuplicateTransactions(
  {
    ...expense,
    rawDescription: "UBER *TRIP",
    counterparty: { kind: "merchant", name: "Uber" },
  },
  {
    ...expense,
    id: "tx-likely-copy",
    rawDescription: "Uber Trip",
    counterparty: { kind: "merchant", name: "UBER" },
    provenance: { sourceType: "statement_import", observedAt: "2026-09-03T14:00:00Z" },
  },
);
assert.equal(likelyDuplicate.level, "likely");
assert.equal(likelyDuplicate.autoMerge, false);

const possibleDifferentDay = evaluateDuplicateTransactions(
  {
    ...expense,
    rawDescription: "PAYU UBER",
    postedAt: "2026-09-03T00:00:00Z",
    counterparty: { kind: "merchant", name: "Uber" },
  },
  {
    ...expense,
    id: "tx-possible-copy",
    rawDescription: "UBER",
    postedAt: "2026-09-04T00:00:00Z",
    counterparty: { kind: "merchant", name: "Uber" },
    provenance: { sourceType: "statement_import", observedAt: "2026-09-04T13:00:00Z" },
  },
);
assert.equal(possibleDifferentDay.level, "none");
assert.equal(possibleDifferentDay.autoMerge, false);

const differentTenant = evaluateDuplicateTransactions(
  expense,
  { ...expense, id: "tx-other-tenant", tenantId: "tenant-2" },
);
assert.equal(differentTenant.level, "none");
assert.equal(differentTenant.autoMerge, false);

const sameLookingButDifferentScope = evaluateDuplicateTransactions(
  expense,
  { ...expense, id: "tx-other-account", accountId: "acc-2" },
);
assert.equal(sameLookingButDifferentScope.level, "none");


const accountB = {
  ...account,
  id: "acc-2",
  externalId: "external-acc-2",
  name: "Cuenta secundaria",
};

const ownTransferOut = {
  ...expense,
  id: "tx-transfer-out",
  kind: "transfer",
  accountId: "acc-1",
  money: { amountMinor: 50000n, currency: "COP" },
  direction: "debit",
  rawDescription: "Transferencia a cuenta propia",
  category: { group: "transfers", code: "transfers.internal", source: "system" },
  counterparty: { kind: "self", name: "Cuenta secundaria" },
  provenance: { sourceType: "open_finance_api", observedAt: "2026-09-05T10:00:00Z", provider: "davivienda" },
  postedAt: "2026-09-05T00:00:00Z",
};

const ownTransferIn = {
  ...ownTransferOut,
  id: "tx-transfer-in",
  accountId: "acc-2",
  direction: "credit",
  rawDescription: "Transferencia recibida",
  counterparty: { kind: "self", name: "Cuenta principal" },
};

const ownTransferMatch = evaluateOwnAccountTransfer(ownTransferOut, account, ownTransferIn, accountB);
assert.equal(ownTransferMatch.confidence, "high");
assert.equal(ownTransferMatch.autoLink, true);
assert.ok(ownTransferMatch.transferGroupId?.startsWith("xfer1_"));

const [linkedOut, linkedIn] = applyOwnAccountTransferMatch(ownTransferOut, ownTransferIn, ownTransferMatch);
assert.equal(linkedOut.kind, "transfer");
assert.equal(linkedIn.kind, "transfer");
assert.equal(linkedOut.transferGroupId, linkedIn.transferGroupId);
assert.equal(linkedOut.category?.group, "transfers");

const weakOwnTransferCandidate = evaluateOwnAccountTransfer(
  { ...ownTransferOut, kind: "unknown", category: undefined, counterparty: undefined },
  account,
  { ...ownTransferIn, kind: "unknown", category: undefined, counterparty: undefined },
  accountB,
);
assert.equal(weakOwnTransferCandidate.confidence, "low");
assert.equal(weakOwnTransferCandidate.autoLink, false);

const differentAmountTransfer = evaluateOwnAccountTransfer(
  ownTransferOut,
  account,
  { ...ownTransferIn, money: { amountMinor: 49999n, currency: "COP" } },
  accountB,
);
assert.equal(differentAmountTransfer.confidence, "none");

const investmentTransferDelegated = evaluateOwnAccountTransfer(
  { ...ownTransferOut, kind: "investment_transfer" },
  account,
  ownTransferIn,
  accountB,
);
assert.equal(investmentTransferDelegated.confidence, "none");

const investmentAccount = {
  id: "acc-hapi",
  tenantId: "tenant-1",
  connectionId: "conn-hapi",
  institutionId: "hapi",
  externalId: "hapi-account-1",
  name: "Hapi",
  type: "brokerage",
  domain: "investment",
  currency: "USD",
};

const bankContribution = {
  ...expense,
  id: "tx-bank-contribution",
  accountId: "acc-1",
  connectionId: "conn-1",
  money: { amountMinor: 200000n, currency: "COP" },
  direction: "debit",
  kind: "investment_transfer",
  rawDescription: "Aporte Hapi",
  category: { group: "investments", code: "investments.contribution", source: "system" },
  counterparty: { kind: "institution", name: "Hapi" },
  postedAt: "2026-09-29T00:00:00Z",
  provenance: { sourceType: "open_finance_api", observedAt: "2026-09-29T10:00:00Z", provider: "davivienda" },
};

const hapiContribution = {
  ...expense,
  id: "tx-hapi-contribution",
  accountId: "acc-hapi",
  connectionId: "conn-hapi",
  money: { amountMinor: 5000n, currency: "USD" },
  originalMoney: { amountMinor: 200000n, currency: "COP" },
  direction: "credit",
  kind: "investment_transfer",
  rawDescription: "Deposit",
  category: { group: "investments", code: "investments.contribution", source: "system" },
  counterparty: { kind: "institution", name: "Davivienda" },
  postedAt: "2026-09-29T00:00:00Z",
  provenance: { sourceType: "statement_import", observedAt: "2026-09-30T10:00:00Z", provider: "hapi" },
};

const investmentContributionMatch = evaluateInvestmentTransfer(
  bankContribution,
  account,
  hapiContribution,
  investmentAccount,
);
assert.equal(investmentContributionMatch.direction, "contribution");
assert.equal(investmentContributionMatch.moneyMatch, "original_money");
assert.equal(investmentContributionMatch.confidence, "high");
assert.equal(investmentContributionMatch.autoLink, true);
assert.ok(investmentContributionMatch.transferGroupId?.startsWith("invxfer1_"));

const [linkedContributionBank, linkedContributionHapi] = applyInvestmentTransferMatch(
  bankContribution,
  hapiContribution,
  investmentContributionMatch,
);
assert.equal(linkedContributionBank.kind, "investment_transfer");
assert.equal(linkedContributionHapi.kind, "investment_transfer");
assert.equal(linkedContributionBank.transferGroupId, linkedContributionHapi.transferGroupId);
assert.equal(isSpendingTransaction(linkedContributionBank), false);

const hapiWithdrawal = {
  ...hapiContribution,
  id: "tx-hapi-withdrawal",
  money: { amountMinor: 2500n, currency: "USD" },
  originalMoney: { amountMinor: 100000n, currency: "COP" },
  direction: "debit",
  rawDescription: "Withdrawal",
  category: { group: "investments", code: "investments.withdrawal", source: "system" },
  postedAt: "2026-10-15T00:00:00Z",
};
const bankWithdrawal = {
  ...bankContribution,
  id: "tx-bank-withdrawal",
  money: { amountMinor: 100000n, currency: "COP" },
  direction: "credit",
  rawDescription: "Retiro Hapi",
  category: { group: "investments", code: "investments.withdrawal", source: "system" },
  postedAt: "2026-10-16T00:00:00Z",
};
const investmentWithdrawalMatch = evaluateInvestmentTransfer(
  hapiWithdrawal,
  investmentAccount,
  bankWithdrawal,
  account,
);
assert.equal(investmentWithdrawalMatch.direction, "withdrawal");
assert.equal(investmentWithdrawalMatch.confidence, "high");
assert.equal(investmentWithdrawalMatch.autoLink, true);

const weakInvestmentCandidate = evaluateInvestmentTransfer(
  { ...bankContribution, kind: "unknown", category: undefined, counterparty: undefined },
  account,
  {
    ...hapiContribution,
    kind: "unknown",
    category: undefined,
    counterparty: undefined,
    money: { amountMinor: 200000n, currency: "COP" },
    originalMoney: undefined,
  },
  { ...investmentAccount, currency: "COP" },
);
assert.equal(weakInvestmentCandidate.confidence, "medium");
assert.equal(weakInvestmentCandidate.autoLink, false);

const unrelatedInvestmentAccounts = evaluateInvestmentTransfer(
  hapiContribution,
  investmentAccount,
  { ...hapiContribution, id: "tx-other-investment", accountId: "acc-invest-2" },
  { ...investmentAccount, id: "acc-invest-2", externalId: "hapi-account-2" },
);
assert.equal(unrelatedInvestmentAccounts.confidence, "none");


assert.equal(isValidDecimalString("0.123456789"), true);
assert.equal(isValidDecimalString("-0.5"), true);
assert.equal(isValidDecimalString("42"), true);
assert.equal(isValidDecimalString("01.2"), false);
assert.equal(isValidDecimalString("1e-5"), false);
assert.equal(isValidDecimalString(""), false);
assert.doesNotThrow(() => assertDecimalString("0.00000001", "fractional quantity"));
assert.throws(() => assertDecimalString("01.2", "fractional quantity"), /canonical decimal string/);

const portfolio = {
  id: "portfolio-main",
  tenantId: "tenant-1",
  name: "Portafolio principal",
  baseCurrency: "USD",
  status: "active",
  accountIds: ["acc-hapi"],
};

const qqqmAsset = {
  id: "asset-qqqm",
  tenantId: "tenant-1",
  symbol: "QQQM",
  name: "Invesco NASDAQ 100 ETF",
  assetClass: "etf",
  currency: "USD",
  identifiers: [
    { kind: "ticker", value: "QQQM", namespace: "NASDAQ" },
    { kind: "provider", value: "hapi:QQQM", namespace: "hapi" },
  ],
};

assert.doesNotThrow(() => assertPortfolioAccountMembership(portfolio, investmentAccount));
assert.throws(
  () => assertPortfolioAccountMembership(portfolio, account),
  /Account is not part of portfolio|investment or crypto domain/,
);
assert.doesNotThrow(() => assertAssetBelongsToTenant(qqqmAsset, "tenant-1"));
assert.throws(
  () => assertAssetBelongsToTenant({ ...qqqmAsset, tenantId: "tenant-2" }, "tenant-1"),
  /Tenant scope mismatch/,
);
assert.throws(
  () => assertAssetBelongsToTenant({ ...qqqmAsset, identifiers: [{ kind: "ticker", value: "" }] }, "tenant-1"),
  /identifiers cannot be empty/,
);

const fractionalPosition = {
  id: "position-qqqm",
  tenantId: "tenant-1",
  portfolioId: "portfolio-main",
  accountId: "acc-hapi",
  assetId: "asset-qqqm",
  quantity: "1.23456789",
  averageCostPerUnit: { amountMinor: 18000n, currency: "USD" },
  marketPrice: { amountMinor: 19000n, currency: "USD" },
  marketValue: { amountMinor: 23456n, currency: "USD" },
  costBasis: { amountMinor: 22222n, currency: "USD" },
  unrealizedPnl: { amountMinor: 1234n, currency: "USD" },
  asOf: "2026-09-23T17:00:00Z",
};

assert.doesNotThrow(() =>
  assertPositionBelongsToPortfolio(fractionalPosition, portfolio, investmentAccount, qqqmAsset),
);
assert.doesNotThrow(() =>
  assertPositionBelongsToPortfolio(
    { ...fractionalPosition, quantity: "-0.5" },
    portfolio,
    investmentAccount,
    qqqmAsset,
  ),
);
assert.throws(
  () =>
    assertPositionBelongsToPortfolio(
      { ...fractionalPosition, portfolioId: "portfolio-other" },
      portfolio,
      investmentAccount,
      qqqmAsset,
    ),
  /Position portfolio mismatch/,
);
assert.throws(
  () =>
    assertPositionBelongsToPortfolio(
      { ...fractionalPosition, quantity: "1e-8" },
      portfolio,
      investmentAccount,
      qqqmAsset,
    ),
  /canonical decimal string/,
);

const buyActivity = {
  id: "activity-buy-qqqm",
  tenantId: "tenant-1",
  portfolioId: "portfolio-main",
  accountId: "acc-hapi",
  assetId: "asset-qqqm",
  kind: "buy",
  occurredAt: "2026-09-20T15:00:00Z",
  cashAmount: { amountMinor: 5000n, currency: "USD" },
  quantity: "0.25",
  unitPrice: { amountMinor: 20000n, currency: "USD" },
  fee: { amountMinor: 0n, currency: "USD" },
};

assert.doesNotThrow(() =>
  assertInvestmentActivityBelongsToPortfolio(buyActivity, portfolio, investmentAccount, qqqmAsset),
);
assert.throws(
  () =>
    assertInvestmentActivityBelongsToPortfolio(
      { ...buyActivity, quantity: "0.2.5" },
      portfolio,
      investmentAccount,
      qqqmAsset,
    ),
  /canonical decimal string/,
);

const portfolioSnapshot = {
  id: "snapshot-1",
  tenantId: "tenant-1",
  portfolioId: "portfolio-main",
  asOf: "2026-09-23T17:00:00Z",
  marketValue: { amountMinor: 100000n, currency: "USD" },
  cashValue: { amountMinor: 5000n, currency: "USD" },
  netContributions: { amountMinor: 80000n, currency: "USD" },
};

assert.doesNotThrow(() => assertPortfolioSnapshotBelongsToPortfolio(portfolioSnapshot, portfolio));
assert.throws(
  () => assertPortfolioSnapshotBelongsToPortfolio({ ...portfolioSnapshot, asOf: "not-a-date" }, portfolio),
  /valid date/,
);
assert.throws(
  () =>
    assertPortfolioSnapshotBelongsToPortfolio(
      { ...portfolioSnapshot, tenantId: "tenant-2" },
      portfolio,
    ),
  /Tenant scope mismatch/,
);


const portfolioActivities = [
  { ...buyActivity },
  {
    id: "activity-deposit",
    tenantId: "tenant-1",
    portfolioId: "portfolio-main",
    accountId: "acc-hapi",
    kind: "deposit",
    occurredAt: "2026-09-01T12:00:00Z",
    cashAmount: { amountMinor: 80000n, currency: "USD" },
  },
  {
    id: "activity-sell",
    tenantId: "tenant-1",
    portfolioId: "portfolio-main",
    accountId: "acc-hapi",
    assetId: "asset-qqqm",
    kind: "sell",
    occurredAt: "2026-09-21T12:00:00Z",
    cashAmount: { amountMinor: 25000n, currency: "USD" },
    quantity: "0.1",
    realizedPnl: { amountMinor: 5000n, currency: "USD" },
  },
  {
    id: "activity-dividend",
    tenantId: "tenant-1",
    portfolioId: "portfolio-main",
    accountId: "acc-hapi",
    assetId: "asset-qqqm",
    kind: "dividend",
    occurredAt: "2026-09-22T12:00:00Z",
    cashAmount: { amountMinor: 1000n, currency: "USD" },
  },
  {
    id: "activity-interest",
    tenantId: "tenant-1",
    portfolioId: "portfolio-main",
    accountId: "acc-hapi",
    kind: "interest",
    occurredAt: "2026-09-22T12:00:00Z",
    cashAmount: { amountMinor: 200n, currency: "USD" },
  },
  {
    id: "activity-fee",
    tenantId: "tenant-1",
    portfolioId: "portfolio-main",
    accountId: "acc-hapi",
    kind: "fee",
    occurredAt: "2026-09-22T12:00:00Z",
    cashAmount: { amountMinor: 100n, currency: "USD" },
  },
  {
    id: "activity-tax",
    tenantId: "tenant-1",
    portfolioId: "portfolio-main",
    accountId: "acc-hapi",
    kind: "tax",
    occurredAt: "2026-09-22T12:00:00Z",
    cashAmount: { amountMinor: 50n, currency: "USD" },
  },
];

const portfolioMetrics = derivePortfolioMetrics({
  portfolio,
  positions: [fractionalPosition],
  activities: portfolioActivities,
  snapshot: portfolioSnapshot,
  asOf: "2026-09-23T17:00:00Z",
});
assert.equal(portfolioMetrics.marketValue.amountMinor, 100000n);
assert.equal(portfolioMetrics.cashValue.amountMinor, 5000n);
assert.equal(portfolioMetrics.totalValue.amountMinor, 105000n);
assert.equal(portfolioMetrics.netContributions.amountMinor, 80000n);
assert.equal(portfolioMetrics.realizedPnl.amountMinor, 5000n);
assert.equal(portfolioMetrics.unrealizedPnl.amountMinor, 1234n);
assert.equal(portfolioMetrics.income.amountMinor, 1200n);
assert.equal(portfolioMetrics.fees.amountMinor, 100n);
assert.equal(portfolioMetrics.taxes.amountMinor, 50n);
assert.equal(portfolioMetrics.netPerformance.amountMinor, 7284n);
assert.equal(portfolioMetrics.completeness.isComplete, true);

const contributionDerivedMetrics = derivePortfolioMetrics({
  portfolio,
  positions: [fractionalPosition],
  activities: [
    {
      id: "activity-deposit-derived",
      tenantId: "tenant-1",
      portfolioId: "portfolio-main",
      accountId: "acc-hapi",
      kind: "deposit",
      occurredAt: "2026-09-01T12:00:00Z",
      cashAmount: { amountMinor: 80000n, currency: "USD" },
    },
    {
      id: "activity-withdrawal-derived",
      tenantId: "tenant-1",
      portfolioId: "portfolio-main",
      accountId: "acc-hapi",
      kind: "withdrawal",
      occurredAt: "2026-09-10T12:00:00Z",
      cashAmount: { amountMinor: 10000n, currency: "USD" },
    },
  ],
  asOf: "2026-09-23T17:00:00Z",
});
assert.equal(contributionDerivedMetrics.netContributions.amountMinor, 70000n);
assert.equal(contributionDerivedMetrics.netPerformance.amountMinor, 1234n);
assert.equal(contributionDerivedMetrics.completeness.cashValueMissing, true);
assert.equal(contributionDerivedMetrics.completeness.isComplete, false);

const fxIncompleteMetrics = derivePortfolioMetrics({
  portfolio,
  positions: [
    {
      ...fractionalPosition,
      marketValue: { amountMinor: 90000n, currency: "EUR" },
      unrealizedPnl: { amountMinor: -500n, currency: "EUR" },
    },
  ],
  activities: [
    {
      id: "activity-eur-dividend",
      tenantId: "tenant-1",
      portfolioId: "portfolio-main",
      accountId: "acc-hapi",
      kind: "dividend",
      occurredAt: "2026-09-22T12:00:00Z",
      cashAmount: { amountMinor: 100n, currency: "EUR" },
    },
  ],
  asOf: "2026-09-23T17:00:00Z",
});
assert.deepEqual(fxIncompleteMetrics.completeness.excludedCurrencies, ["EUR"]);
assert.equal(fxIncompleteMetrics.completeness.isComplete, false);
assert.equal(fxIncompleteMetrics.income.amountMinor, 0n);

const lossMetrics = derivePortfolioMetrics({
  portfolio,
  positions: [{ ...fractionalPosition, unrealizedPnl: { amountMinor: -1000n, currency: "USD" } }],
  activities: [
    {
      id: "activity-loss-sale",
      tenantId: "tenant-1",
      portfolioId: "portfolio-main",
      accountId: "acc-hapi",
      kind: "sell",
      occurredAt: "2026-09-22T12:00:00Z",
      realizedPnl: { amountMinor: -500n, currency: "USD" },
    },
  ],
  snapshot: portfolioSnapshot,
  asOf: "2026-09-23T17:00:00Z",
});
assert.equal(lossMetrics.netPerformance.amountMinor, -1500n);


const validConnector = {
  descriptor: {
    connectorId: "davivienda-sandbox",
    institutionId: "davivienda",
    displayName: "Davivienda Sandbox",
    version: "0.1.0",
    environment: "sandbox",
    accessMode: "open_finance_oauth",
    capabilities: ["accounts", "balances", "transactions"],
    dataAccess: "read_only",
  },
  async createConsent() {
    return {
      authorizationUrl: "https://example.test/oauth",
      stateReference: "state-ref",
      expiresAt: "2026-09-23T18:30:00Z",
    };
  },
  async getAccounts() {
    return [];
  },
  async getBalances() {
    return [];
  },
  async getTransactions() {
    return { items: [] };
  },
  async healthCheck() {
    return { state: "connected", checkedAt: "2026-09-23T18:00:00Z" };
  },
};

assert.doesNotThrow(() => validateConnectorContract(validConnector));
assert.equal(connectorSupports(validConnector, "transactions"), true);
assert.equal(connectorSupports(validConnector, "positions"), false);
assert.throws(
  () => assertConnectorSupports(validConnector, "positions"),
  (error) => error instanceof ConnectorError && error.code === "UNSUPPORTED",
);

assert.throws(
  () =>
    validateConnectorDescriptor({
      ...validConnector.descriptor,
      capabilities: ["transactions"],
    }),
  /must expose accounts/,
);
assert.throws(
  () =>
    validateConnectorDescriptor({
      ...validConnector.descriptor,
      capabilities: ["accounts", "accounts"],
    }),
  /cannot contain duplicates/,
);
assert.throws(
  () =>
    validateConnectorDescriptor({
      ...validConnector.descriptor,
      dataAccess: "read_write",
    }),
  /read-only/,
);
assert.throws(
  () =>
    validateConnectorContract({
      ...validConnector,
      descriptor: {
        ...validConnector.descriptor,
        capabilities: ["accounts", "positions"],
      },
    }),
  /declares positions/,
);


assert.deepEqual(CONNECTOR_CAPABILITIES, [
  "accounts",
  "balances",
  "transactions",
  "positions",
  "investment_activities",
  "portfolio_snapshots",
]);

const capabilityMatrix = buildConnectorCapabilityMatrix([
  validConnector.descriptor,
  {
    connectorId: "hapi-statements",
    institutionId: "hapi",
    displayName: "Hapi Statements",
    version: "0.1.0",
    environment: "local_import",
    accessMode: "statement_import",
    capabilities: ["accounts", "positions", "investment_activities", "portfolio_snapshots"],
    dataAccess: "read_only",
  },
]);
assert.equal(capabilityMatrix.length, 2);
assert.equal(capabilityMatrix[0].institutionId, "davivienda");
assert.equal(capabilityMatrix[0].capabilities.transactions, true);
assert.equal(capabilityMatrix[0].capabilities.positions, false);
assert.equal(capabilityMatrix[1].institutionId, "hapi");
assert.equal(capabilityMatrix[1].capabilities.positions, true);
assert.equal(capabilityMatrix[1].capabilities.transactions, false);

assert.deepEqual(
  findConnectorsSupporting(capabilityMatrix, ["accounts", "transactions"], "sandbox").map((row) => row.connectorId),
  ["davivienda-sandbox"],
);
assert.deepEqual(
  findConnectorsSupporting(capabilityMatrix, ["positions"], "local_import").map((row) => row.connectorId),
  ["hapi-statements"],
);

assert.doesNotThrow(() =>
  buildConnectorCapabilityMatrix([
    validConnector.descriptor,
    { ...validConnector.descriptor, environment: "production" },
  ]),
);
assert.throws(
  () => buildConnectorCapabilityMatrix([validConnector.descriptor, validConnector.descriptor]),
  /Duplicate connector descriptor/,
);


const connectedHealth = { state: "connected", checkedAt: "2026-09-23T18:00:00Z" };
const authHealth = { state: "auth_required", checkedAt: "2026-09-23T18:00:00Z" };
const consentHealth = { state: "consent_expired", checkedAt: "2026-09-23T18:00:00Z" };
assert.deepEqual(recoveryPlanForHealth(connectedHealth), {
  action: "none",
  automatic: false,
  userActionRequired: false,
});
assert.deepEqual(recoveryPlanForHealth(authHealth), {
  action: "reauthorize",
  automatic: false,
  userActionRequired: true,
});
assert.deepEqual(recoveryPlanForHealth(consentHealth), {
  action: "renew_consent",
  automatic: false,
  userActionRequired: true,
});
assert.equal(connectorCanSync(connectedHealth), true);
assert.equal(
  connectorCanSync({ state: "degraded", checkedAt: "2026-09-23T18:00:00Z", retryAfterMs: 1000 }),
  true,
);
assert.equal(
  connectorCanSync({ state: "api_down", checkedAt: "2026-09-23T18:00:00Z" }),
  false,
);
assert.throws(
  () => validateHealthReport({ state: "connected", checkedAt: "invalid-date" }),
  /valid date/,
);
assert.throws(
  () => validateHealthReport({ state: "degraded", checkedAt: "2026-09-23T18:00:00Z", retryAfterMs: -1 }),
  /non-negative/,
);

const rateLimitHealth = healthReportFromConnectorError(
  new ConnectorError("Too many requests", "RATE_LIMIT", true, { retryAfterMs: 5000 }),
  "2026-09-23T18:00:00Z",
);
assert.equal(rateLimitHealth.state, "degraded");
assert.equal(rateLimitHealth.retryAfterMs, 5000);
assert.deepEqual(recoveryPlanForHealth(rateLimitHealth), {
  action: "retry",
  automatic: true,
  userActionRequired: false,
  retryAfterMs: 5000,
});

const upstreamHealth = healthReportFromConnectorError(
  new ConnectorError("Provider unavailable", "UPSTREAM", true),
  "2026-09-23T18:00:00Z",
);
assert.equal(upstreamHealth.state, "api_down");
assert.equal(recoveryPlanForHealth(upstreamHealth).action, "retry");


const syncContext = { tenantId: "tenant-1", connectionId: "conn-sync" };
const syncTx1 = {
  ...expense,
  id: "sync-tx-1",
  connectionId: "conn-sync",
  accountId: "acc-sync",
  externalId: "ext-sync-1",
};
const syncTx2 = {
  ...expense,
  id: "sync-tx-2",
  connectionId: "conn-sync",
  accountId: "acc-sync",
  externalId: "ext-sync-2",
  money: { amountMinor: 21000n, currency: "COP" },
};

assert.equal(
  buildSyncIdempotencyKey(syncContext, "sync-test", "transactions", undefined, [syncTx1, syncTx2]),
  buildSyncIdempotencyKey(syncContext, "sync-test", "transactions", undefined, [syncTx2, syncTx1]),
);

function createMemoryCheckpointStore() {
  const values = new Map();
  const saves = [];
  const key = (ctx, resource) => `${ctx.tenantId}|${ctx.connectionId}|${resource}`;
  return {
    values,
    saves,
    async load(ctx, resource) {
      return values.get(key(ctx, resource)) ?? null;
    },
    async save(ctx, checkpoint) {
      values.set(key(ctx, checkpoint.resource), checkpoint);
      saves.push({ ctx, checkpoint });
    },
  };
}

function createRecordingSink() {
  const writes = [];
  return {
    writes,
    async writeAccounts(ctx, items, metadata) {
      writes.push({ resource: "accounts", ctx, items: [...items], metadata });
    },
    async writeBalances(ctx, items, metadata) {
      writes.push({ resource: "balances", ctx, items: [...items], metadata });
    },
    async writeTransactions(ctx, items, metadata) {
      writes.push({ resource: "transactions", ctx, items: [...items], metadata });
    },
    async writePositions(ctx, items, metadata) {
      writes.push({ resource: "positions", ctx, items: [...items], metadata });
    },
    async writeInvestmentActivities(ctx, items, metadata) {
      writes.push({ resource: "investment_activities", ctx, items: [...items], metadata });
    },
    async writePortfolioSnapshots(ctx, items, metadata) {
      writes.push({ resource: "portfolio_snapshots", ctx, items: [...items], metadata });
    },
  };
}

const transactionCursorCalls = [];
const pagedSyncConnector = {
  descriptor: {
    connectorId: "sync-test",
    institutionId: "test-bank",
    displayName: "Sync Test",
    version: "0.1.0",
    environment: "sandbox",
    accessMode: "open_finance_oauth",
    capabilities: ["accounts", "transactions"],
    dataAccess: "read_only",
  },
  async getAccounts() {
    return [];
  },
  async getTransactions(_ctx, cursor) {
    transactionCursorCalls.push(cursor ?? "root");
    if (cursor === undefined) return { items: [syncTx1], nextCursor: "page-2" };
    if (cursor === "page-2") return { items: [syncTx2], checkpointCursor: "sync-2" };
    if (cursor === "sync-2") return { items: [], checkpointCursor: "sync-2" };
    throw new Error(`Unexpected cursor ${cursor}`);
  },
  async healthCheck() {
    return "connected";
  },
};

const checkpointStore = createMemoryCheckpointStore();
const recordingSink = createRecordingSink();
let syncClockTick = 0;
const syncEngine = new ConnectorSyncEngine(
  checkpointStore,
  recordingSink,
  () => `2026-09-23T18:10:0${syncClockTick++}Z`,
);

const firstSync = await syncEngine.sync(pagedSyncConnector, syncContext, {
  resources: ["transactions"],
  maxPagesPerResource: 10,
});
assert.equal(firstSync.resources[0].pages, 2);
assert.equal(firstSync.resources[0].items, 2);
assert.equal(firstSync.resources[0].truncated, false);
assert.equal(firstSync.resources[0].checkpointCursor, "sync-2");
assert.equal(recordingSink.writes.length, 2);
assert.notEqual(
  recordingSink.writes[0].metadata.idempotencyKey,
  recordingSink.writes[1].metadata.idempotencyKey,
);
assert.equal(
  checkpointStore.values.get("tenant-1|conn-sync|transactions").cursor,
  "sync-2",
);

const secondSync = await syncEngine.sync(pagedSyncConnector, syncContext, {
  resources: ["transactions"],
});
assert.equal(secondSync.resources[0].pages, 1);
assert.equal(secondSync.resources[0].items, 0);
assert.equal(recordingSink.writes.length, 2);
assert.deepEqual(transactionCursorCalls, ["root", "page-2", "sync-2"]);

const failingCheckpointStore = createMemoryCheckpointStore();
const failingSink = createRecordingSink();
failingSink.writeTransactions = async () => {
  throw new Error("database unavailable");
};
const failingEngine = new ConnectorSyncEngine(failingCheckpointStore, failingSink, () => "2026-09-23T18:20:00Z");
await assert.rejects(
  () =>
    failingEngine.sync(pagedSyncConnector, { tenantId: "tenant-1", connectionId: "conn-fail" }, {
      resources: ["transactions"],
    }),
  /database unavailable/,
);
assert.equal(failingCheckpointStore.values.size, 0);

const endlessConnector = {
  ...pagedSyncConnector,
  descriptor: {
    ...pagedSyncConnector.descriptor,
    connectorId: "endless-test",
  },
  async getTransactions(_ctx, cursor) {
    const current = cursor ?? "root";
    const next = current === "root" ? "page-1" : `page-${Number(current.split("-")[1]) + 1}`;
    return { items: [syncTx1], nextCursor: next };
  },
};
const boundedStore = createMemoryCheckpointStore();
const boundedSink = createRecordingSink();
const boundedEngine = new ConnectorSyncEngine(boundedStore, boundedSink, () => "2026-09-23T18:30:00Z");
const boundedResult = await boundedEngine.sync(endlessConnector, syncContext, {
  resources: ["transactions"],
  maxPagesPerResource: 2,
});
assert.equal(boundedResult.resources[0].pages, 2);
assert.equal(boundedResult.resources[0].truncated, true);
assert.equal(boundedResult.resources[0].checkpointCursor, "page-2");
assert.equal(boundedSink.writes.length, 2);

assert.doesNotThrow(() => assertVaultScope({ tenantId: "tenant-1", connectionId: "conn-1" }));
assert.throws(
  () => assertVaultScope({ tenantId: "", connectionId: "conn-1" }),
  /tenantId is required/,
);
assert.doesNotThrow(() =>
  assertConnectorSecretMaterial({
    kind: "oauth",
    accessToken: "access-secret",
    refreshToken: "refresh-secret",
    expiresAt: "2026-10-01T00:00:00Z",
    scopes: ["accounts", "transactions"],
  }),
);
assert.doesNotThrow(() =>
  assertConnectorSecretMaterial({
    kind: "api_key",
    apiKey: "read-only-key",
    apiSecret: "signed-read-secret",
  }),
);
assert.throws(
  () =>
    assertConnectorSecretMaterial({
      kind: "oauth",
      accessToken: "token",
      expiresAt: "not-a-date",
    }),
  /valid date/,
);
assert.throws(
  () =>
    assertConnectorSecretMaterial({
      kind: "api_key",
      apiKey: "key",
      privateKey: "must-never-enter-vault",
    }),
  /Forbidden credential field/,
);
assert.equal(asSecretReference("vault://tenant-1/conn-1/secret-1"), "vault://tenant-1/conn-1/secret-1");
assert.throws(() => asSecretReference("vault ref with spaces"), /whitespace/);

assert.deepEqual(
  redactForLog({
    merchant: "Uber",
    accessToken: "secret",
    nested: {
      apiKey: "key",
      safe: "visible",
      deeper: [{ refresh_token: "refresh" }, { amount: 42 }],
    },
  }),
  {
    merchant: "Uber",
    accessToken: "[REDACTED]",
    nested: {
      apiKey: "[REDACTED]",
      safe: "visible",
      deeper: [{ refresh_token: "[REDACTED]" }, { amount: 42 }],
    },
  },
);
assert.equal(health("0.1.0").status, "ok");
assert.equal(elevationFor("modal"), 50);
assert.equal(resolveMotionDuration("expressive", "reduced"), 120);
assert.ok(touchTokens.minimumTargetPx >= 44);
assert.equal(primaryNavigation.length, 5);
assert.ok(primaryNavigation.some((item) => item.id === "portfolio"));
assert.equal(navigate({ activeSpace: "today", privacyMode: true }, "portfolio").previousSpace, "today");
assert.equal(togglePrivacyMode({ activeSpace: "today", privacyMode: true }).privacyMode, false);
assert.doesNotThrow(() => assertSurfaceForSensitiveMoney("solid"));
assert.throws(() => assertSurfaceForSensitiveMoney("glass"));
assert.equal(accessibilityPolicy.minimumTouchTargetPx, 44);
console.log("smoke tests: ok");
