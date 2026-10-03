export interface PdfImportSource {
  fileName: string;
  byteLength: number;
  mimeType?: string;
  encrypted?: boolean;
}

export interface IsolatedPdfParseJob {
  kind: "isolated_pdf_parse";
  trust: "untrusted_user_input";
  source: Readonly<PdfImportSource>;
  sandboxRequired: true;
  networkAccessAllowed: false;
  persistenceAllowed: false;
  passwordPersistenceAllowed: false;
  activeContentAllowed: false;
  ocrAllowed: false;
}

export class PdfImportValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PdfImportValidationError";
  }
}

const MAX_PDF_BYTES = 25 * 1024 * 1024;

export function prepareIsolatedPdfParse(source: PdfImportSource): IsolatedPdfParseJob {
  const fileName = source.fileName.trim();
  if (!fileName.toLowerCase().endsWith(".pdf")) {
    throw new PdfImportValidationError("Phase 8.2 accepts PDF files only");
  }
  if (!Number.isSafeInteger(source.byteLength) || source.byteLength <= 0) {
    throw new PdfImportValidationError("PDF byteLength must be a positive safe integer");
  }
  if (source.byteLength > MAX_PDF_BYTES) {
    throw new PdfImportValidationError("PDF exceeds the 25 MiB Phase 8 safety limit");
  }
  return Object.freeze({
    kind: "isolated_pdf_parse" as const,
    trust: "untrusted_user_input" as const,
    source: Object.freeze({
      fileName,
      byteLength: source.byteLength,
      ...(source.mimeType ? { mimeType: source.mimeType } : {}),
      ...(source.encrypted !== undefined ? { encrypted: source.encrypted } : {}),
    }),
    sandboxRequired: true as const,
    networkAccessAllowed: false as const,
    persistenceAllowed: false as const,
    passwordPersistenceAllowed: false as const,
    activeContentAllowed: false as const,
    ocrAllowed: false as const,
  });
}
