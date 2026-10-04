export type DetectedImportFormat = "csv" | "xlsx" | "ofx" | "pdf";
export type DetectionConfidence = "extension_only" | "signature_verified";

export interface ImportDetectionInput {
  fileName: string;
  leadingBytes?: readonly number[];
}

export interface ImportDetectionResult {
  format: DetectedImportFormat;
  confidence: DetectionConfidence;
  institutionId: null;
  institutionDetectionDeferred: true;
}

export class ImportDetectionError extends Error {
  constructor(message: string) { super(message); this.name = "ImportDetectionError"; }
}

function extensionFormat(fileName: string): DetectedImportFormat {
  const lower = fileName.trim().toLowerCase();
  if (lower.endsWith(".csv")) return "csv";
  if (lower.endsWith(".xlsx")) return "xlsx";
  if (lower.endsWith(".ofx")) return "ofx";
  if (lower.endsWith(".pdf")) return "pdf";
  throw new ImportDetectionError("Unsupported or missing import extension");
}

export function detectImportFormat(input: ImportDetectionInput): ImportDetectionResult {
  const format = extensionFormat(input.fileName);
  const bytes = input.leadingBytes ?? [];
  let signatureVerified = false;

  if (format === "pdf" && bytes.length >= 4) {
    signatureVerified = bytes.slice(0, 4).join(",") === "37,80,68,70";
    if (!signatureVerified) throw new ImportDetectionError("PDF extension contradicts file signature");
  }

  if (format === "xlsx" && bytes.length >= 4) {
    signatureVerified = bytes[0] === 0x50 && bytes[1] === 0x4b;
    if (!signatureVerified) throw new ImportDetectionError("XLSX extension contradicts file signature");
  }

  if (format === "ofx" && bytes.length > 0) {
    const ascii = String.fromCharCode(...bytes.slice(0, 256)).toUpperCase();
    signatureVerified = ascii.includes("<OFX") || ascii.includes("OFXHEADER");
    if (!signatureVerified) throw new ImportDetectionError("OFX extension contradicts file signature");
  }

  // CSV has no reliable magic signature; extension is only a hint until content parsing.
  return Object.freeze({
    format,
    confidence: signatureVerified ? "signature_verified" : "extension_only",
    institutionId: null,
    institutionDetectionDeferred: true as const,
  });
}
