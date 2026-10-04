import {
  buildTransactionFingerprint,
  evaluateDuplicateTransactions,
  type FinancialTransaction,
} from "../../finance-core/src/index.js";

export interface IncrementalImportBatch {
  idempotencyKey: string;
  sourceId: string;
  previousCheckpoint: string | null;
  nextCheckpoint: string;
  transactions: readonly FinancialTransaction[];
}

export interface IncrementalImportPlan {
  idempotencyKey: string;
  sourceId: string;
  inserts: readonly FinancialTransaction[];
  duplicateIds: readonly string[];
  checkpointBefore: string | null;
  checkpointAfter: string;
  canCommit: true;
}

export class IncrementalImportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IncrementalImportError";
  }
}

function validateBatch(batch: IncrementalImportBatch): void {
  if (!batch.idempotencyKey.trim()) throw new IncrementalImportError("idempotencyKey is required");
  if (!batch.sourceId.trim()) throw new IncrementalImportError("sourceId is required");
  if (!batch.nextCheckpoint.trim()) throw new IncrementalImportError("nextCheckpoint is required");
  if (batch.transactions.length === 0) throw new IncrementalImportError("incremental import requires transactions");
  for (const transaction of batch.transactions) {
    if (transaction.provenance.sourceType !== "statement_import") {
      throw new IncrementalImportError("Phase 8.5 accepts statement_import transactions only");
    }
  }
}

export function planIncrementalImport(
  existing: readonly FinancialTransaction[],
  batch: IncrementalImportBatch,
): IncrementalImportPlan {
  validateBatch(batch);

  const accepted: FinancialTransaction[] = [];
  const duplicateIds: string[] = [];
  const seenFingerprints = new Set(existing.map((transaction) => buildTransactionFingerprint(transaction)));

  for (const transaction of batch.transactions) {
    const fingerprint = buildTransactionFingerprint(transaction);
    const exactDuplicate = existing.some((candidate) => {
      const evaluation = evaluateDuplicateTransactions(candidate, transaction);
      return evaluation.autoMerge || evaluation.fingerprintA === evaluation.fingerprintB;
    });
    const duplicateInBatch = seenFingerprints.has(fingerprint);

    if (exactDuplicate || duplicateInBatch) {
      duplicateIds.push(transaction.id);
      continue;
    }

    accepted.push({ ...transaction, fingerprint });
    seenFingerprints.add(fingerprint);
  }

  return Object.freeze({
    idempotencyKey: batch.idempotencyKey,
    sourceId: batch.sourceId,
    inserts: Object.freeze(accepted),
    duplicateIds: Object.freeze(duplicateIds),
    checkpointBefore: batch.previousCheckpoint,
    checkpointAfter: batch.nextCheckpoint,
    canCommit: true as const,
  });
}
