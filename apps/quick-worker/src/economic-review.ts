/**
 * Conservative economic interpretation of manually recorded outflows.
 * A payment channel (Bre-B, bank transfer) never proves an own-account transfer.
 * These flags are presentation-only: neither ledger kind nor original amount changes.
 */
export type QuickEconomicGroup =
  "expense" | "debt_payment" | "review" | "internal_transfer" | "investment_flow" | "other";
export interface QuickEconomicMovement {
  kind: string;
  merchant: string | null;
  paymentMethod: string;
  manualCategory?: string | null;
  manualSubcategory?: string | null;
}
function fold(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}
export function classifyQuickEconomicMovement(m: QuickEconomicMovement): QuickEconomicGroup {
  if (m.kind === "transfer") return "internal_transfer";
  if (m.kind === "investment_transfer") return "investment_flow";
  if (m.kind !== "purchase") return "other";
  if (m.manualCategory === "Deudas y obligaciones") return "debt_payment";
  if (m.manualCategory === "Pagos y transferencias" && m.manualSubcategory === "Transferencias") {
    return "internal_transfer";
  }
  // Explicit human categorization takes precedence over keyword guesses.
  if (m.manualCategory && m.manualCategory !== "Pagos y transferencias") return "expense";
  const concept = fold(m.merchant ?? "");
  if (/^(pago (de |del )?(prestamo|credito|tarjeta de credito)|abono (a |de |al )?(prestamo|credito)|cuota (de |del )?prestamo)\b/.test(concept)) {
    return "debt_payment";
  }
  if (m.paymentMethod === "bank_transfer" &&
    /^(bre-b|transferencia(?:\s|$)|envio (a|de) dinero\b|paso plata\b)/.test(concept)) {
    return "review";
  }
  return "expense";
}
