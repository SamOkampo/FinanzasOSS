import {
  buildTransactionFingerprint,
  evaluateDuplicateTransactions,
  type DuplicateMatchLevel,
  type FinancialTransaction,
  type TransactionSourceType,
} from "../../finance-core/src/index.js";

export type ReconciliationSource =
  | "open_finance_api"
  | "provider_api"
  | "aggregator_api"
  | "statement_import"
  | "email_auxiliary";

export interface ReconciliationSuppression {
  candidateId: string;
  canonicalId: string;
  reason: "exact_duplicate";
}

export interface ReconciliationReview {
  candidateId: string;
  matchedId: string;
  level: Exclude<DuplicateMatchLevel, "exact" | "none">;
  score: number;
  reasons: readonly string[];
}

export interface ReconciliationReplacement {
  replacedId: string;
  replacement: FinancialTransaction;
  reason: "higher_authority_exact_duplicate";
}

export interface CrossSourceReconciliationPlan {
  inserts: readonly FinancialTransaction[];
  suppressions: readonly ReconciliationSuppression[];
  reviews: readonly ReconciliationReview[];
  replacements: readonly ReconciliationReplacement[];
  autoInsertCount: number;
  heldForReviewCount: number;
}

export class CrossSourceReconciliationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CrossSourceReconciliationError";
  }
}

const SOURCE_PRIORITY: Readonly<Record<ReconciliationSource, number>> = Object.freeze({
  open_finance_api: 50,
  provider_api: 40,
  aggregator_api: 30,
  statement_import: 20,
  email_auxiliary: 10,
});

function asReconciliationSource(sourceType: TransactionSourceType): ReconciliationSource {
  if (sourceType in SOURCE_PRIORITY) return sourceType as ReconciliationSource;
  throw new CrossSourceReconciliationError(
    `Unsupported reconciliation source: ${sourceType}`,
  );
}

function sourcePriority(transaction: FinancialTransaction): number {
  return SOURCE_PRIORITY[asReconciliationSource(transaction.provenance.sourceType)];
}

function exactEquivalent(a: FinancialTransaction, b: FinancialTransaction): boolean {
  const evaluation = evaluateDuplicateTransactions(a, b);
  return evaluation.autoMerge || evaluation.fingerprintA === evaluation.fingerprintB;
}

export function reconcileCrossSourceTransactions(
  existing: readonly FinancialTransaction[],
  candidates: readonly FinancialTransaction[],
): CrossSourceReconciliationPlan {
  const canonical: FinancialTransaction[] = existing.map((transaction) => {
    asReconciliationSource(transaction.provenance.sourceType);
    return transaction;
  });

  const inserts: FinancialTransaction[] = [];
  const suppressions: ReconciliationSuppression[] = [];
  const reviews: ReconciliationReview[] = [];
  const replacements: ReconciliationReplacement[] = [];

  for (const candidate of candidates) {
    asReconciliationSource(candidate.provenance.sourceType);

    let exactIndex = -1;
    for (let index = 0; index < canonical.length; index += 1) {
      const current = canonical[index]!;
      if (exactEquivalent(current, candidate)) {
        exactIndex = index;
        break;
      }
    }

    if (exactIndex >= 0) {
      const current = canonical[exactIndex]!;
      if (sourcePriority(candidate) > sourcePriority(current)) {
        const replacement = {
          ...candidate,
          fingerprint: buildTransactionFingerprint(candidate),
        };
        replacements.push(Object.freeze({
          replacedId: current.id,
          replacement,
          reason: "higher_authority_exact_duplicate" as const,
        }));
        canonical[exactIndex] = replacement;
      } else {
        suppressions.push(Object.freeze({
          candidateId: candidate.id,
          canonicalId: current.id,
          reason: "exact_duplicate" as const,
        }));
      }
      continue;
    }

    let best:
      | { matched: FinancialTransaction; level: "likely" | "possible"; score: number; reasons: readonly string[] }
      | null = null;

    for (const current of canonical) {
      const evaluation = evaluateDuplicateTransactions(current, candidate);
      if (evaluation.level !== "likely" && evaluation.level !== "possible") continue;
      if (!best || evaluation.score > best.score) {
        best = {
          matched: current,
          level: evaluation.level,
          score: evaluation.score,
          reasons: evaluation.reasons,
        };
      }
    }

    if (best) {
      reviews.push(Object.freeze({
        candidateId: candidate.id,
        matchedId: best.matched.id,
        level: best.level,
        score: best.score,
        reasons: Object.freeze([...best.reasons]),
      }));
      continue;
    }

    const accepted = {
      ...candidate,
      fingerprint: buildTransactionFingerprint(candidate),
    };
    inserts.push(accepted);
    canonical.push(accepted);
  }

  return Object.freeze({
    inserts: Object.freeze(inserts),
    suppressions: Object.freeze(suppressions),
    reviews: Object.freeze(reviews),
    replacements: Object.freeze(replacements),
    autoInsertCount: inserts.length + replacements.length,
    heldForReviewCount: reviews.length,
  });
}
