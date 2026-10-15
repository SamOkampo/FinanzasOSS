import {
  buildTransactionFingerprint,
  economicClassForKind,
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
  | "email_auxiliary"
  | "manual";

export interface ReconciliationSuppression {
  candidateId: string;
  canonicalId: string;
  reason: "exact_duplicate";
}

export interface ReconciliationReview {
  candidateId: string;
  matchedId: string;
  level: Exclude<DuplicateMatchLevel, "none">;
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
  // Manual entries are never automatically replaced or imported by this planner.
  manual: 0,
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

function possibleManualOverlap(a: FinancialTransaction, b: FinancialTransaction): boolean {
  if (a.status !== "posted" || b.status !== "posted") return false;
  if (a.tenantId !== b.tenantId || a.accountId !== b.accountId) return false;
  if (a.direction !== b.direction ||
      a.money.currency.toUpperCase() !== b.money.currency.toUpperCase() ||
      a.money.amountMinor !== b.money.amountMinor ||
      economicClassForKind(a.kind) !== economicClassForKind(b.kind)) return false;

  const first = Date.parse(a.postedAt);
  const second = Date.parse(b.postedAt);
  if (!Number.isFinite(first) || !Number.isFinite(second)) return false;
  const dayDistance = Math.abs(Math.floor(first / 86_400_000) - Math.floor(second / 86_400_000));
  return dayDistance <= 1;
}

export function reconcileCrossSourceTransactions(
  existing: readonly FinancialTransaction[],
  candidates: readonly FinancialTransaction[],
): CrossSourceReconciliationPlan {
  // A mixed-tenant batch must never be planned for a shared ledger write.
  const batch = [...existing, ...candidates];
  const tenantIds = new Set(batch.map((transaction) => transaction.tenantId));
  if (tenantIds.size > 1 || (batch.length > 0 && [...tenantIds].some((tenantId) => !tenantId?.trim()))) {
    throw new CrossSourceReconciliationError("Cross-tenant reconciliation denied");
  }
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
    // A manual item is recorded only through the authenticated, explicitly
    // confirmed Quick flow, not silently through an import/reconciliation batch.
    if (candidate.provenance.sourceType === "manual") {
      throw new CrossSourceReconciliationError("Manual candidates require an explicit recording flow");
    }

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
      if (current.provenance.sourceType === "manual") {
        // Even an exact fingerprint is not authorization to delete the user's
        // manual record or insert an imported charge a second time.
        reviews.push(Object.freeze({
          candidateId: candidate.id,
          matchedId: current.id,
          level: "exact" as const,
          score: 100,
          reasons: Object.freeze(["matching manual entry requires user reconciliation"]),
        }));
        continue;
      }
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
      const manualOverlap =
        current.provenance.sourceType === "manual" && possibleManualOverlap(current, candidate);
      if (evaluation.level !== "likely" && evaluation.level !== "possible" && !manualOverlap) continue;
      const score = manualOverlap ? Math.max(65, evaluation.score) : evaluation.score;
      const level = evaluation.level === "likely" || evaluation.level === "possible"
        ? evaluation.level
        : "possible" as const;
      if (!best || score > best.score) {
        best = {
          matched: current,
          level,
          score,
          reasons: manualOverlap
            ? [...evaluation.reasons, "possible manual overlap requires user reconciliation"]
            : evaluation.reasons,
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
