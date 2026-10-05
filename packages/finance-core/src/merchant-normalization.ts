export type MerchantCategory = "groceries" | "restaurants" | "transport" | "housing" | "utilities" | "health" | "education" | "entertainment" | "shopping" | "travel" | "income" | "fees" | "taxes" | "investment" | "transfer" | "other";

export interface MerchantNormalizationInput {
  description: string;
  merchantName?: string | null;
  providerCategory?: string | null;
  transactionType?: string | null;
}

export interface MerchantNormalizationResult {
  merchant: string | null;
  category: MerchantCategory | null;
  confidence: "high" | "medium" | "low";
  source: "merchant_name" | "description" | "provider_category" | "protected_type" | "unknown";
  needsReview: boolean;
}

const rules: ReadonlyArray<[MerchantCategory, RegExp]> = [
  ["groceries", /\b(exito|carulla|jumbo|d1|ara|supermercado|mercado)\b/i],
  ["restaurants", /\b(restaurante|restaurant|cafe|coffee|rappi food|ifood)\b/i],
  ["transport", /\b(uber|didi|cabify|taxi|transmilenio|metro)\b/i],
  ["utilities", /\b(energia|acueducto|gas natural|internet|telefonia|claro|movistar|tigo)\b/i],
  ["health", /\b(farmacia|drogueria|clinica|hospital|eps)\b/i],
  ["education", /\b(universidad|colegio|curso|matricula)\b/i],
  ["travel", /\b(avianca|latam|hotel|booking|airbnb)\b/i],
  ["fees", /\b(comision|fee|cuota de manejo)\b/i],
  ["taxes", /\b(impuesto|retencion|dian)\b/i],
];

function clean(value: string): string {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
}

export function normalizeMerchant(input: MerchantNormalizationInput): MerchantNormalizationResult {
  const txType = (input.transactionType ?? "").trim().toLowerCase();
  if (txType === "investment_transfer" || txType === "internal_transfer" || txType === "transfer") {
    return { merchant: null, category: txType === "investment_transfer" ? "investment" : "transfer", confidence: "high", source: "protected_type", needsReview: false };
  }
  const explicit = clean(input.merchantName ?? "");
  const description = clean(input.description);
  const candidate = explicit || description;
  const categoryText = [input.providerCategory ?? "", candidate].join(" ");
  for (const [category, pattern] of rules) {
    if (pattern.test(categoryText)) return { merchant: candidate || null, category, confidence: explicit ? "high" : "medium", source: explicit ? "merchant_name" : input.providerCategory ? "provider_category" : "description", needsReview: !explicit };
  }
  return { merchant: candidate || null, category: null, confidence: "low", source: candidate ? (explicit ? "merchant_name" : "description") : "unknown", needsReview: true };
}
