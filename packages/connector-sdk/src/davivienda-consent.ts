export interface DaviviendaConsentConfig {
  consentEndpoint?: string;
  clientId?: string;
  scopes?: readonly string[];
}

export class DaviviendaConsentConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DaviviendaConsentConfigurationError";
  }
}

/**
 * Fail-closed gate for Davivienda sandbox consent.
 *
 * This deliberately does not guess Davivienda endpoints, scopes, widget
 * parameters, or consent payloads. It only enables a consent flow after those
 * values have been verified from official sandbox documentation and supplied
 * explicitly by the caller.
 */
export function assertDaviviendaConsentReady(config: DaviviendaConsentConfig): void {
  const endpoint = config.consentEndpoint?.trim();
  const clientId = config.clientId?.trim();
  const scopes = config.scopes?.map((scope) => scope.trim()).filter(Boolean) ?? [];

  if (!endpoint || !clientId || scopes.length === 0) {
    throw new DaviviendaConsentConfigurationError(
      "Verified Davivienda sandbox consent endpoint, client id and scopes are required",
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(endpoint);
  } catch {
    throw new DaviviendaConsentConfigurationError("Davivienda consent endpoint must be a valid URL");
  }

  if (parsed.protocol !== "https:") {
    throw new DaviviendaConsentConfigurationError("Davivienda consent endpoint must use HTTPS");
  }
}
