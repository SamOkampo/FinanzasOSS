export type HapiStatementKind = "statement" | "confirmation" | "report";

export interface HapiStatementRecord {
  documentKind: HapiStatementKind;
  accountReference: string;
  occurredAt: string;
  currency: string;
  amount: number;
  description: string;
  source: "official_statement";
}

export interface NormalizedHapiStatementRecord extends HapiStatementRecord {
  provider: "hapi";
  readOnly: true;
}

const KINDS = new Set<HapiStatementKind>(["statement", "confirmation", "report"]);

export function normalizeHapiStatementRecord(input: HapiStatementRecord): NormalizedHapiStatementRecord {
  if (!KINDS.has(input.documentKind)) throw new Error("Unsupported Hapi document kind");
  if (input.source !== "official_statement") throw new Error("Hapi adapter requires an official statement source");
  if (!input.accountReference.trim()) throw new Error("Hapi account reference is required");
  if (!input.description.trim()) throw new Error("Hapi statement description is required");
  if (!/^[A-Z]{3}$/.test(input.currency)) throw new Error("Hapi statement currency must be ISO-like uppercase code");
  if (!Number.isFinite(input.amount)) throw new Error("Hapi statement amount must be finite");
  if (Number.isNaN(Date.parse(input.occurredAt))) throw new Error("Hapi statement occurredAt must be a valid date");

  return Object.freeze({ ...input, provider: "hapi", readOnly: true });
}

/**
 * Phase 9.4 deliberately does not parse provider-specific PDF layouts here.
 * Extraction belongs to the isolated import parser; this boundary validates
 * already-extracted official statement records before finance normalization.
 */
