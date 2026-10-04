export type RawImportCell = string | number | null | undefined;
export type RawImportRow = Readonly<Record<string, RawImportCell>>;

export interface ImportColumnMapping {
  postedAt: string;
  description: string;
  amount: string;
  direction?: string;
  currency?: string;
  externalId?: string;
}

export interface MappedImportCandidate {
  postedAt: string | null;
  rawDescription: string | null;
  amount: string | null;
  direction: "credit" | "debit" | null;
  currency: string | null;
  externalId: string | null;
}

export interface ImportPreviewRow {
  rowIndex: number;
  status: "ready" | "needs_attention";
  issues: readonly string[];
  candidate: Readonly<MappedImportCandidate>;
}

export interface ImportMappingPreview {
  rows: readonly ImportPreviewRow[];
  readyCount: number;
  attentionCount: number;
  persistenceAllowed: false;
  requiresUserConfirmation: true;
}

export class ImportMappingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImportMappingError";
  }
}

const MAX_PREVIEW_ROWS = 100;

function validateMapping(mapping: ImportColumnMapping): void {
  for (const [field, column] of [
    ["postedAt", mapping.postedAt],
    ["description", mapping.description],
    ["amount", mapping.amount],
  ] as const) {
    if (!column.trim()) throw new ImportMappingError(`Mapping for ${field} is required`);
  }
}

function readCell(row: RawImportRow, column?: string): string | null {
  if (!column) return null;
  const value = row[column];
  if (value === null || value === undefined) return null;
  return String(value).trim();
}

function activeContentIssue(value: string | null, field: string): string | null {
  if (!value) return null;
  return value.startsWith("=") ? `active_content_not_allowed:${field}` : null;
}

export function previewMappedImport(
  rows: readonly RawImportRow[],
  mapping: ImportColumnMapping,
): ImportMappingPreview {
  validateMapping(mapping);
  if (rows.length === 0) throw new ImportMappingError("At least one import row is required");
  if (rows.length > MAX_PREVIEW_ROWS) {
    throw new ImportMappingError(`Preview is limited to ${MAX_PREVIEW_ROWS} rows`);
  }

  const previewRows = rows.map((row, index): ImportPreviewRow => {
    const postedAt = readCell(row, mapping.postedAt);
    const rawDescription = readCell(row, mapping.description);
    const amount = readCell(row, mapping.amount);
    const directionRaw = readCell(row, mapping.direction)?.toLowerCase() ?? null;
    const currencyRaw = readCell(row, mapping.currency);
    const externalId = readCell(row, mapping.externalId);
    const issues: string[] = [];

    if (!postedAt) issues.push("missing:postedAt");
    if (!rawDescription) issues.push("missing:description");
    if (!amount) issues.push("missing:amount");

    const direction =
      directionRaw === "credit" || directionRaw === "debit" ? directionRaw : null;
    if (directionRaw && direction === null) issues.push("invalid:direction");

    for (const [value, field] of [
      [postedAt, "postedAt"],
      [rawDescription, "description"],
      [amount, "amount"],
      [currencyRaw, "currency"],
      [externalId, "externalId"],
    ] as const) {
      const issue = activeContentIssue(value, field);
      if (issue) issues.push(issue);
    }

    const candidate = Object.freeze({
      postedAt,
      rawDescription,
      amount,
      direction,
      currency: currencyRaw ? currencyRaw.toUpperCase() : null,
      externalId,
    });

    return Object.freeze({
      rowIndex: index,
      status: issues.length === 0 ? "ready" as const : "needs_attention" as const,
      issues: Object.freeze(issues),
      candidate,
    });
  });

  const readyCount = previewRows.filter((row) => row.status === "ready").length;
  return Object.freeze({
    rows: Object.freeze(previewRows),
    readyCount,
    attentionCount: previewRows.length - readyCount,
    persistenceAllowed: false as const,
    requiresUserConfirmation: true as const,
  });
}
