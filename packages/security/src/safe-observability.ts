export type ObservabilityLevel = "info" | "warn" | "error";

export interface SafeObservabilityEvent {
  level: ObservabilityLevel;
  event: string;
  tenantId?: string;
  connectionId?: string;
  correlationId?: string;
  status?: string;
  durationMs?: number;
  occurredAt: string;
}

const ALLOWED_KEYS = new Set([
  "level",
  "event",
  "tenantId",
  "connectionId",
  "correlationId",
  "status",
  "durationMs",
  "occurredAt",
]);

const FORBIDDEN_KEY =
  /token|secret|password|credential|authorization|cookie|account(number)?|balance|transaction|position|payload|body|seed|mnemonic|private.?key/i;

export function createSafeObservabilityEvent(
  input: SafeObservabilityEvent & Record<string, unknown>,
): SafeObservabilityEvent {
  for (const key of Object.keys(input)) {
    if (!ALLOWED_KEYS.has(key)) {
      if (FORBIDDEN_KEY.test(key)) {
        throw new Error(`Sensitive observability field rejected: ${key}`);
      }
      throw new Error(`Observability field is not allowlisted: ${key}`);
    }
  }

  if (!input.event.trim()) throw new Error("Observability event is required");
  if (Number.isNaN(Date.parse(input.occurredAt))) {
    throw new Error("Observability occurredAt must be a valid date");
  }
  if (input.durationMs !== undefined && (!Number.isFinite(input.durationMs) || input.durationMs < 0)) {
    throw new Error("Observability durationMs must be non-negative");
  }

  return Object.freeze({
    level: input.level,
    event: input.event.trim(),
    ...(input.tenantId?.trim() ? { tenantId: input.tenantId.trim() } : {}),
    ...(input.connectionId?.trim() ? { connectionId: input.connectionId.trim() } : {}),
    ...(input.correlationId?.trim() ? { correlationId: input.correlationId.trim() } : {}),
    ...(input.status?.trim() ? { status: input.status.trim() } : {}),
    ...(input.durationMs !== undefined ? { durationMs: input.durationMs } : {}),
    occurredAt: input.occurredAt,
  });
}

export const safeObservabilityPolicy = Object.freeze({
  rawProviderPayloadAllowed: false,
  rawFinancialPayloadAllowed: false,
  secretMaterialAllowed: false,
  accountNumbersAllowed: false,
  allowlistRequired: true,
});
