import {
  economicClassForKind,
  type Money,
  type TransactionEconomicClass,
  type TransactionKind,
} from "./index.js";

export type QuickPaymentMethod =
  | "cash"
  | "debit_card"
  | "credit_card"
  | "bank_transfer"
  | "digital_wallet"
  | "other";

export type QuickEntryClassification =
  | "expense"
  | "own_transfer"
  | "investment_transfer";

export interface QuickEntryInput {
  tenantId: string;
  actorId: string;
  clientEntryId: string;
  amount: string;
  currency: "COP" | "USD";
  paymentMethod: QuickPaymentMethod;
  classification: QuickEntryClassification;
  occurredAt: string;
  merchant?: string;
  bankLabel?: string;
}

export interface QuickEntryReview {
  readonly tenantId: string;
  readonly actorId: string;
  readonly clientEntryId: string;
  readonly money: Money;
  readonly occurredAt: string;
  readonly paymentMethod: QuickPaymentMethod;
  readonly bankLabel: string | null;
  readonly merchant: string | null;
  readonly classification: QuickEntryClassification;
  readonly kind: TransactionKind;
  readonly economicClass: TransactionEconomicClass;
  readonly direction: "debit";
  readonly sourceType: "manual";
  readonly requiresUserConfirmation: true;
  readonly persistenceEnabled: false;
  readonly accountSelectionRequiredBeforePosting: true;
}

const PAYMENT_METHODS = new Set<QuickPaymentMethod>([
  "cash", "debit_card", "credit_card", "bank_transfer", "digital_wallet", "other",
]);

const CLASSIFICATIONS = new Set<QuickEntryClassification>([
  "expense", "own_transfer", "investment_transfer",
]);

function requiredText(value: unknown, label: string, maxLength: number): string {
  if (typeof value !== "string") throw new Error(label + " must be text");
  const normalized = value.trim();
  if (!normalized || normalized.length > maxLength || /[\u0000-\u001f\u007f]/.test(normalized)) {
    throw new Error(label + " is invalid");
  }
  return normalized;
}

function optionalText(value: unknown, label: string, maxLength: number): string | null {
  if (value === undefined || value === null || value === "") return null;
  return requiredText(value, label, maxLength);
}

function amountToMinorUnits(value: unknown): bigint {
  // Canonical input is an ungrouped major-unit decimal, e.g. "25000" or "25000.50".
  // Never parse locale separators or use floating point for financial amounts.
  if (typeof value !== "string" || !/^(?:0|[1-9][0-9]{0,10})(?:\.[0-9]{1,2})?$/.test(value)) {
    throw new Error("Amount must be an ungrouped decimal with at most two fractional digits");
  }
  const parts = value.split(".");
  const major = parts[0]!;
  const fractional = (parts[1] ?? "").padEnd(2, "0");
  const minor = BigInt(major) * 100n + BigInt(fractional || "0");
  if (minor <= 0n || minor > 1_000_000_000_000n) {
    throw new Error("Amount must be positive and within the permitted limit");
  }
  return minor;
}

function canonicalTimestamp(value: unknown): string {
  if (typeof value !== "string" ||
      !/^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(?:\.[0-9]{3})?Z$/.test(value)) {
    throw new Error("occurredAt must be canonical UTC");
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime()) ||
      (value.endsWith(".000Z") ? date.toISOString() !== value :
        date.toISOString().replace(".000Z", "Z") !== value)) {
    throw new Error("occurredAt is invalid");
  }
  return value;
}

export function prepareQuickEntry(input: QuickEntryInput): QuickEntryReview {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("Quick entry input must be an object");
  }

  const tenantId = requiredText(input.tenantId, "tenantId", 128);
  const actorId = requiredText(input.actorId, "actorId", 128);
  const clientEntryId = requiredText(input.clientEntryId, "clientEntryId", 96);
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]{11,95}$/.test(clientEntryId)) {
    throw new Error("clientEntryId must be a stable, caller-generated idempotency key");
  }

  if (input.currency !== "COP" && input.currency !== "USD") {
    throw new Error("Only explicitly supported currencies COP and USD are allowed");
  }
  if (!PAYMENT_METHODS.has(input.paymentMethod)) {
    throw new Error("Payment method is not supported");
  }
  if (!CLASSIFICATIONS.has(input.classification)) {
    throw new Error("Classification must be explicitly selected");
  }

  const kind: TransactionKind = input.classification === "expense"
    ? "purchase"
    : input.classification === "own_transfer"
      ? "transfer"
      : "investment_transfer";
  const money: Money = Object.freeze({
    amountMinor: amountToMinorUnits(input.amount),
    currency: input.currency,
  });

  return Object.freeze({
    tenantId,
    actorId,
    clientEntryId,
    money,
    occurredAt: canonicalTimestamp(input.occurredAt),
    paymentMethod: input.paymentMethod,
    bankLabel: optionalText(input.bankLabel, "bankLabel", 80),
    merchant: optionalText(input.merchant, "merchant", 120),
    classification: input.classification,
    kind,
    economicClass: economicClassForKind(kind),
    direction: "debit" as const,
    sourceType: "manual" as const,
    requiresUserConfirmation: true as const,
    persistenceEnabled: false as const,
    accountSelectionRequiredBeforePosting: true as const,
  });
}
