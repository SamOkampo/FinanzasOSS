export type TransactionUsageContext = "personal" | "business" | "mixed" | "unknown" | "not_applicable";
export type TransactionUsageContextSource =
  | "protected_type"
  | "user_override"
  | "account_context"
  | "category"
  | "rule"
  | "unknown";

export interface TransactionUsageContextInput {
  description: string;
  merchantName?: string | null;
  categoryGroup?: string | null;
  transactionType?: string | null;
  userOverride?: Exclude<TransactionUsageContext, "unknown" | "not_applicable"> | null;
  accountContext?: Exclude<TransactionUsageContext, "unknown" | "not_applicable"> | null;
}

export interface TransactionUsageContextResult {
  context: TransactionUsageContext;
  confidence: "high" | "medium" | "low";
  source: TransactionUsageContextSource;
  needsReview: boolean;
  reasons: readonly string[];
}

const PROTECTED_TRANSACTION_TYPES = new Set([
  "transfer",
  "internal_transfer",
  "investment_transfer",
  "investment_activity",
]);

const BUSINESS_SIGNALS: readonly RegExp[] = [
  /\b(factura|invoice|proveedor|supplier)\b/i,
  /\b(nomina|payroll|honorarios)\b/i,
  /\b(publicidad|advertising|ads)\b/i,
  /\b(hosting|dominio|domain|licencia|license)\b/i,
  /\b(oficina|office|papeleria)\b/i,
];

function normalizeText(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function classifyTransactionUsageContext(
  input: TransactionUsageContextInput,
): TransactionUsageContextResult {
  const transactionType = (input.transactionType ?? "").trim().toLowerCase();

  if (PROTECTED_TRANSACTION_TYPES.has(transactionType)) {
    return {
      context: "not_applicable",
      confidence: "high",
      source: "protected_type",
      needsReview: false,
      reasons: ["transaction type is excluded from personal/business spending classification"],
    };
  }

  if (input.userOverride) {
    return {
      context: input.userOverride,
      confidence: "high",
      source: "user_override",
      needsReview: input.userOverride === "mixed",
      reasons: ["explicit user classification"],
    };
  }

  if (input.accountContext) {
    return {
      context: input.accountContext,
      confidence: "high",
      source: "account_context",
      needsReview: input.accountContext === "mixed",
      reasons: ["user-defined account context"],
    };
  }

  const categoryGroup = (input.categoryGroup ?? "").trim().toLowerCase();
  if (categoryGroup === "business") {
    return {
      context: "business",
      confidence: "medium",
      source: "category",
      needsReview: true,
      reasons: ["business category is suggestive but not an explicit user decision"],
    };
  }

  const text = normalizeText([input.merchantName ?? "", input.description].join(" "));
  if (BUSINESS_SIGNALS.some((pattern) => pattern.test(text))) {
    return {
      context: "business",
      confidence: "medium",
      source: "rule",
      needsReview: true,
      reasons: ["description or merchant contains a business-use signal"],
    };
  }

  return {
    context: "unknown",
    confidence: "low",
    source: "unknown",
    needsReview: true,
    reasons: ["no reliable personal/business evidence"],
  };
}
