import type {
  FinancialAccount,
  FinancialTransaction,
  InvestmentTransferMatch,
} from "./index.js";
import {
  applyInvestmentTransferMatch,
  evaluateInvestmentTransfer,
  isSpendingTransaction,
} from "./index.js";

export interface MonthlyContributionMatchRequest {
  month: string;
  transactions: readonly FinancialTransaction[];
  accounts: readonly FinancialAccount[];
  dateToleranceDays?: number;
}

export interface MonthlyContributionCandidate {
  month: string;
  cashTransactionId: string;
  investmentTransactionId: string;
  match: InvestmentTransferMatch;
  requiresReview: boolean;
}

function assertMonth(month: string): void {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    throw new Error("Month must use YYYY-MM");
  }
}

export function matchMonthlyInvestmentContributions(
  request: MonthlyContributionMatchRequest,
): readonly MonthlyContributionCandidate[] {
  assertMonth(request.month);

  const accounts = new Map(request.accounts.map((account) => [account.id, account]));
  if (accounts.size !== request.accounts.length) throw new Error("Duplicate account id in contribution matcher");

  const posted = request.transactions.filter((transaction) => transaction.status === "posted");
  const cashTransactions = posted.filter((transaction) => {
    const account = accounts.get(transaction.accountId);
    if (!account) throw new Error(`Missing account for transaction ${transaction.id}`);
    return account.domain === "cash" && transaction.postedAt.slice(0, 7) === request.month;
  });
  const investmentTransactions = posted.filter((transaction) => {
    const account = accounts.get(transaction.accountId);
    if (!account) throw new Error(`Missing account for transaction ${transaction.id}`);
    return account.domain === "investment" || account.domain === "crypto";
  });

  const candidates: MonthlyContributionCandidate[] = [];
  for (const cashTransaction of cashTransactions) {
    const cashAccount = accounts.get(cashTransaction.accountId)!;
    for (const investmentTransaction of investmentTransactions) {
      const investmentAccount = accounts.get(investmentTransaction.accountId)!;
      const match = evaluateInvestmentTransfer(
        cashTransaction,
        cashAccount,
        investmentTransaction,
        investmentAccount,
        { dateToleranceDays: request.dateToleranceDays },
      );
      if (match.confidence === "none" || match.direction !== "contribution") continue;
      candidates.push({
        month: request.month,
        cashTransactionId: cashTransaction.id,
        investmentTransactionId: investmentTransaction.id,
        match,
        requiresReview: !match.autoLink,
      });
    }
  }

  candidates.sort((left, right) =>
    right.match.score - left.match.score ||
    left.cashTransactionId.localeCompare(right.cashTransactionId) ||
    left.investmentTransactionId.localeCompare(right.investmentTransactionId),
  );

  const usedCash = new Set<string>();
  const usedInvestment = new Set<string>();
  const selected: MonthlyContributionCandidate[] = [];
  for (const candidate of candidates) {
    if (usedCash.has(candidate.cashTransactionId) || usedInvestment.has(candidate.investmentTransactionId)) continue;
    usedCash.add(candidate.cashTransactionId);
    usedInvestment.add(candidate.investmentTransactionId);
    selected.push(Object.freeze(candidate));
  }
  return Object.freeze(selected);
}

export function applyMonthlyContributionCandidate(
  transactions: readonly FinancialTransaction[],
  candidate: MonthlyContributionCandidate,
): readonly [FinancialTransaction, FinancialTransaction] {
  if (candidate.match.direction !== "contribution") {
    throw new Error("Monthly matcher only applies contribution matches");
  }
  const cashTransaction = transactions.find((transaction) => transaction.id === candidate.cashTransactionId);
  const investmentTransaction = transactions.find((transaction) => transaction.id === candidate.investmentTransactionId);
  if (!cashTransaction || !investmentTransaction) throw new Error("Contribution match transaction is missing");

  const linked = applyInvestmentTransferMatch(cashTransaction, investmentTransaction, candidate.match);
  if (linked.some((transaction) => transaction.kind !== "investment_transfer" || isSpendingTransaction(transaction))) {
    throw new Error("Contribution linking must remain an investment transfer, never spending");
  }
  return linked;
}
