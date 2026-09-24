import {
  normalizeAccountInformationError,
  type NormalizedAccountInformationError,
} from "./account-information.js";
import {
  ConnectorError,
  healthReportFromConnectorError,
  recoveryPlanForHealth,
  type ConnectorHealthReport,
  type ConnectorRecoveryPlan,
} from "./index.js";

export interface DaviviendaFailureInput {
  status?: number;
  providerCode?: string;
  retryAfterMs?: number;
}

export interface DaviviendaRecoveryDecision {
  normalized: NormalizedAccountInformationError;
  health: ConnectorHealthReport;
  recovery: ConnectorRecoveryPlan;
}

/**
 * Provider-neutral recovery mapping for Davivienda sandbox Account Information.
 * No provider-specific status/code is guessed: callers pass only values observed
 * from the verified official integration. Auth/consent failures always require
 * user action; only retryable upstream/rate-limit failures can retry automatically.
 */
export function daviviendaRecoveryDecision(
  input: DaviviendaFailureInput,
  checkedAt: string,
): DaviviendaRecoveryDecision {
  const normalized = normalizeAccountInformationError(input);
  const code = normalized.failure === "auth"
    ? "AUTH"
    : normalized.failure === "consent"
      ? "CONSENT"
      : normalized.failure === "rate_limit"
        ? "RATE_LIMIT"
        : normalized.failure === "upstream"
          ? "UPSTREAM"
          : normalized.failure === "invalid_response"
            ? "INVALID_RESPONSE"
            : "CONFIGURATION";

  const error = new ConnectorError(
    `Davivienda Account Information failure: ${normalized.failure}`,
    code,
    normalized.retryable,
    {
      ...(normalized.retryAfterMs !== undefined ? { retryAfterMs: normalized.retryAfterMs } : {}),
      ...(normalized.providerCode !== undefined ? { providerCode: normalized.providerCode } : {}),
    },
  );
  const health = healthReportFromConnectorError(error, checkedAt);
  return { normalized, health, recovery: recoveryPlanForHealth(health) };
}
