export type UniversalImportFormat = "csv" | "xlsx" | "ofx";

export interface ImportSource {
  fileName: string;
  byteLength: number;
  mimeType?: string;
}

export interface ImportEnvelope {
  format: UniversalImportFormat;
  source: ImportSource;
  persistenceAllowed: false;
  trust: "untrusted_user_input";
}

export class UniversalImportValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UniversalImportValidationError";
  }
}

const MAX_IMPORT_BYTES = 25 * 1024 * 1024;
const EXTENSIONS: Readonly<Record<UniversalImportFormat, readonly string[]>> = Object.freeze({
  csv: [".csv"],
  xlsx: [".xlsx"],
  ofx: [".ofx"],
});

export function prepareUniversalImport(format: UniversalImportFormat, source: ImportSource): ImportEnvelope {
  const fileName = source.fileName.trim();
  if (!fileName) throw new UniversalImportValidationError("Import filename is required");
  if (!Number.isSafeInteger(source.byteLength) || source.byteLength <= 0) {
    throw new UniversalImportValidationError("Import byteLength must be a positive safe integer");
  }
  if (source.byteLength > MAX_IMPORT_BYTES) {
    throw new UniversalImportValidationError("Import exceeds the 25 MiB Phase 8 safety limit");
  }
  const lower = fileName.toLowerCase();
  if (!EXTENSIONS[format].some((extension) => lower.endsWith(extension))) {
    throw new UniversalImportValidationError(`Filename extension does not match declared format: ${format}`);
  }
  return Object.freeze({
    format,
    source: Object.freeze({ fileName, byteLength: source.byteLength, ...(source.mimeType ? { mimeType: source.mimeType } : {}) }),
    persistenceAllowed: false as const,
    trust: "untrusted_user_input" as const,
  });
}

export function assertImportFormat(value: string): UniversalImportFormat {
  if (value === "csv" || value === "xlsx" || value === "ofx") return value;
  throw new UniversalImportValidationError("Only CSV, XLSX and OFX are allowed in Phase 8.1");
}
