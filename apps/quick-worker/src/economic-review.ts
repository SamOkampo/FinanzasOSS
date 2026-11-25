/**
 * Distinguish the economic purpose of a movement from how money was paid.
 * Text rules and high-confidence owner-scoped Qwen suggestions inform read
 * projections only: never mutate the immutable amount, direction or ledger kind.
 * Explicit human review always wins over AI.
 */
export type QuickEconomicGroup = "income" | "expense" | "debt_payment" | "review" |
  "internal_transfer" | "investment_flow" | "other";
export interface QuickEconomicMovement {
  kind: string;
  merchant: string | null;
  paymentMethod: string;
  manualCategory?: string | null;
  manualSubcategory?: string | null;
  autoCategory?: string | null;
  autoSubcategory?: string | null;
  autoConfidence?: number | null;
  autoNeedsReview?: boolean | null;
}
function fold(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}
function clearOwnTransfer(concept: string): boolean {
  return /(?:entre mis cuentas|a mi otra cuenta|de mi cuenta a mi|a mi cuenta de|a mi plata|de mi bancolombia a (?:mi )?plata|pas[eo] dinero a mi cuenta|traspaso entre mis cuentas)/.test(concept);
}
function clearDebtPayment(concept: string): boolean {
  return /^(?:pago (?:de |del )?(?:prestamo|credito|tarjeta de credito)|abono (?:a |de |al )?(?:prestamo|credito)|cuota (?:de |del )?prestamo|pague (?:el |un )?prestamo)/.test(concept) ||
    /(?:devolvi|devolucion|le pague|me prestaron|me habia prestado)/.test(concept) &&
    /(?:prestamo|deuda|debia|me prest|lo prestado)/.test(concept);
}
function unclearTransfer(concept: string, method: string): boolean {
  return method === "bank_transfer" &&
    /^(?:bre-b|transferencia(?:\s|$)|transferi|le transferi|envio (?:a|de) dinero|envie dinero|paso plata|le mande plata|le pague a\b)/.test(concept);
}
export function classifyQuickEconomicMovement(m: QuickEconomicMovement): QuickEconomicGroup {
  if (m.kind === "income") return "income";
  if (m.kind === "transfer") return "internal_transfer";
  if (m.kind === "investment_transfer") return "investment_flow";
  if (m.kind !== "purchase") return "other";
  const concept=fold(m.merchant || "");
  if (m.manualCategory) {
    if (m.manualCategory === "Otros") return "review";
    if (m.manualCategory === "Deudas y obligaciones") return "debt_payment";
    if (m.manualCategory === "Inversiones") return "investment_flow";
    if (m.manualCategory === "Pagos y transferencias") {
      if (m.manualSubcategory === "Entre cuentas propias") return "internal_transfer";
      if (m.manualSubcategory === "Pagos a terceros") return "expense";
      return "review";
    }
    return "expense";
  }
  if (clearDebtPayment(concept)) return "debt_payment";
  if (clearOwnTransfer(concept)) return "internal_transfer";
  const confident=m.autoNeedsReview===false && (m.autoConfidence ?? 0) >= 0.9;
  if (confident && m.autoCategory === "Deudas y obligaciones") return "debt_payment";
  if (confident && m.autoCategory === "Inversiones") return "investment_flow";
  if (confident && m.autoCategory === "Pagos y transferencias") {
    // The model cannot invent account ownership from a transfer description.
    return m.autoSubcategory === "Entre cuentas propias" && clearOwnTransfer(concept) ?
      "internal_transfer" : "review";
  }
  if (unclearTransfer(concept,m.paymentMethod)) return "review";
  return "expense";
}

/**
 * SQL equivalent for read-only dashboard and budget aggregates.
 * Expects m (ledger), c (confirmed categories), a (AI suggestions) joined
 * with owner_id, source and movement_id. Strings are static SQL literals.
 */
export function quickEconomicGroupSql(): string {
  // SQLite lower() only folds ASCII. Normalize the Spanish characters before
  // comparison so the SQL projection and interactive classifier agree.
  const t=["á","é","í","ó","ú","Á","É","Í","Ó","Ú","ü","Ü","Ñ"].reduce((expr,ch,i)=>
    "replace("+expr+",'"+ch+"','"+["a","e","i","o","u","a","e","i","o","u","u","u","ñ"][i]+"')",
    "lower(trim(coalesce(m.merchant,'')))");
  const like=(patterns:string[])=>"("+patterns.map(p=>t+" LIKE '"+p+"'").join(" OR ")+")";
  const debt="("+like([
    "pago prestamo%","pago de prestamo%","pago del prestamo%","pago credito%","pago de credito%","pago del credito%",
    "pago tarjeta de credito%","pago de tarjeta de credito%","pago del tarjeta de credito%",
    "abono prestamo%","abono a prestamo%","abono de prestamo%","abono al prestamo%",
    "abono credito%","abono a credito%","abono de credito%","abono al credito%",
    "cuota prestamo%","cuota de prestamo%","cuota del prestamo%",
    "pague el prestamo%","pague un prestamo%"
  ])+" OR ("+like(["%devolvi%","%devolucion%","%le pague%","%me prestaron%","%me habia prestado%"])+" AND "+like(["%prestamo%","%deuda%","%debia%","%me prest%","%lo prestado%"])+"))";
  const own=like(["%entre mis cuentas%","%a mi otra cuenta%","%de mi cuenta a mi%","%a mi cuenta de%","%a mi plata%",
    "%de mi bancolombia a plata%","%de mi bancolombia a mi plata%","%pase dinero a mi cuenta%","%paso dinero a mi cuenta%"]);
  const unclear="(m.payment_method='bank_transfer' AND "+like([
    "bre-b%","transferencia","transferencia %","transferi%","le transferi%","envio a dinero%","envio de dinero%",
    "envie dinero%","paso plata%","le mande plata%","le pague a","le pague a %"
  ])+")";
  const confident="(a.needs_review=0 AND a.confidence>=0.9)";
  return "CASE " +
    "WHEN m.kind='income' THEN 'income' " +
    "WHEN m.kind='transfer' THEN 'internal_transfer' " +
    "WHEN m.kind='investment_transfer' THEN 'investment_flow' " +
    "WHEN m.kind!='purchase' THEN 'other' " +
    "WHEN c.category='Deudas y obligaciones' THEN 'debt_payment' " +
    "WHEN c.category='Inversiones' THEN 'investment_flow' " +
    "WHEN c.category='Pagos y transferencias' AND c.subcategory='Entre cuentas propias' THEN 'internal_transfer' " +
    "WHEN c.category='Pagos y transferencias' AND c.subcategory='Pagos a terceros' THEN 'expense' " +
    "WHEN c.category='Pagos y transferencias' THEN 'review' " +
    "WHEN c.category='Otros' THEN 'review' " +
    "WHEN c.category IS NOT NULL THEN 'expense' " +
    "WHEN "+debt+" THEN 'debt_payment' " +
    "WHEN "+own+" THEN 'internal_transfer' " +
    "WHEN "+confident+" AND a.category='Deudas y obligaciones' THEN 'debt_payment' " +
    "WHEN "+confident+" AND a.category='Inversiones' THEN 'investment_flow' " +
    "WHEN "+confident+" AND a.category='Pagos y transferencias' THEN 'review' " +
    "WHEN "+unclear+" THEN 'review' " +
    "ELSE 'expense' END";
}
