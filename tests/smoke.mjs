import assert from "node:assert/strict";
import {
  assertAccountBelongsToConnection,
  assertBalanceBelongsToAccount,
  assertTenantScope,
  applyInvestmentTransferMatch,
  applyOwnAccountTransferMatch,
  assertTransactionBelongsToAccount,
  assertTransactionSchema,
  buildTransactionFingerprint,
  economicClassForKind,
  evaluateDuplicateTransactions,
  evaluateInvestmentTransfer,
  evaluateOwnAccountTransfer,
  isConsentActive,
  isPatrimonialTransfer,
  isSpendingTransaction,
  netAccountMovementMinor,
  netEconomicCashFlowMinor,
  normalizeFingerprintText,
  signedMinorUnits,
  withTransactionFingerprint,
} from "../dist/packages/finance-core/src/index.js";
import { redactForLog } from "../dist/packages/security/src/index.js";
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


assert.deepEqual(redactForLog({ merchant: "Uber", accessToken: "secret", client_secret: "secret2" }), {
  merchant: "Uber",
  accessToken: "[REDACTED]",
  client_secret: "[REDACTED]",
});
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
