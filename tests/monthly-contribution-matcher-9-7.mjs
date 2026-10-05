import assert from "node:assert/strict";
import {
  applyMonthlyContributionCandidate,
  matchMonthlyInvestmentContributions,
} from "../dist/packages/finance-core/src/monthly-contribution-matcher.js";

const cash = {
  id: "cash-account",
  tenantId: "tenant-1",
  connectionId: "conn-bank",
  institutionId: "bank",
  externalId: "cash-ext",
  name: "Cash",
  type: "checking",
  domain: "cash",
  currency: "COP",
};
const investment = {
  id: "investment-account",
  tenantId: "tenant-1",
  connectionId: "conn-broker",
  institutionId: "broker",
  externalId: "investment-ext",
  name: "Broker",
  type: "brokerage",
  domain: "investment",
  currency: "COP",
};
const provenance = { sourceType: "provider_api", observedAt: "2026-01-15T12:00:00Z" };
const base = {
  tenantId: "tenant-1",
  status: "posted",
  money: { amountMinor: 25000000n, currency: "COP" },
  rawDescription: "Synthetic contribution",
  provenance,
  kind: "investment_transfer",
};
const bankContribution = {
  ...base,
  id: "bank-contribution",
  connectionId: "conn-bank",
  accountId: cash.id,
  postedAt: "2026-01-15T12:00:00Z",
  direction: "debit",
};
const brokerContribution = {
  ...base,
  id: "broker-contribution",
  connectionId: "conn-broker",
  accountId: investment.id,
  postedAt: "2026-01-15T15:00:00Z",
  direction: "credit",
};
const bankWithdrawal = {
  ...base,
  id: "bank-withdrawal",
  connectionId: "conn-bank",
  accountId: cash.id,
  postedAt: "2026-01-20T12:00:00Z",
  direction: "credit",
};
const brokerWithdrawal = {
  ...base,
  id: "broker-withdrawal",
  connectionId: "conn-broker",
  accountId: investment.id,
  postedAt: "2026-01-20T12:00:00Z",
  direction: "debit",
};
const februaryContribution = {
  ...bankContribution,
  id: "bank-feb",
  postedAt: "2026-02-02T12:00:00Z",
};

const transactions = [
  bankContribution,
  brokerContribution,
  bankWithdrawal,
  brokerWithdrawal,
  februaryContribution,
];
const matches = matchMonthlyInvestmentContributions({
  month: "2026-01",
  transactions,
  accounts: [cash, investment],
});

assert.equal(matches.length, 1);
assert.equal(matches[0].cashTransactionId, "bank-contribution");
assert.equal(matches[0].investmentTransactionId, "broker-contribution");
assert.equal(matches[0].match.direction, "contribution");
assert.equal(matches[0].match.autoLink, true);

const linked = applyMonthlyContributionCandidate(transactions, matches[0]);
assert.ok(linked.every((transaction) => transaction.kind === "investment_transfer"));
assert.ok(linked.every((transaction) => transaction.category?.group === "investments"));

assert.throws(() => matchMonthlyInvestmentContributions({
  month: "2026-13",
  transactions,
  accounts: [cash, investment],
}), /YYYY-MM/);

console.log("Phase 9.7 monthly contribution matcher regression passed");
