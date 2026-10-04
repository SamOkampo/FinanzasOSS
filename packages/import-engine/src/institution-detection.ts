export type InstitutionConfidence = "unique_marker" | "not_detected";
export interface InstitutionDetectionResult {
  institutionId: string | null;
  institutionConfidence: InstitutionConfidence;
}

const MARKERS = Object.freeze([
  ["lulo-bank", ["LULO BANK"]],
  ["pibank", ["PIBANK"]],
  ["rappipay", ["RAPPIPAY"]],
  ["nu-colombia", ["NU COLOMBIA"]],
  ["bbva-colombia", ["BBVA COLOMBIA"]],
  ["banco-de-bogota", ["BANCO DE BOGOTÁ", "BANCO DE BOGOTA"]],
  ["bancolombia", ["BANCOLOMBIA"]],
  ["davivienda", ["DAVIVIENDA"]],
  ["nequi", ["NEQUI"]],
  ["daviplata", ["DAVIPLATA"]],
] as const);

export function detectInstitution(text: string): InstitutionDetectionResult {
  const normalized = text.normalize("NFKC").toUpperCase();
  const matches = MARKERS.filter(([, markers]) => markers.some((marker) => normalized.includes(marker)));
  if (matches.length !== 1) {
    return Object.freeze({ institutionId: null, institutionConfidence: "not_detected" as const });
  }
  const [institutionId] = matches[0]!;
  return Object.freeze({ institutionId, institutionConfidence: "unique_marker" as const });
}
