export type SecretReference = string & { readonly __brand: "SecretReference" };

export interface TokenBundle {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string;
  scope?: string;
}

export interface TokenVault {
  put(tenantId: string, connectionId: string, tokens: TokenBundle): Promise<SecretReference>;
  get(tenantId: string, reference: SecretReference): Promise<TokenBundle>;
  rotate(tenantId: string, reference: SecretReference, tokens: TokenBundle): Promise<void>;
  revoke(tenantId: string, reference: SecretReference): Promise<void>;
}

const SENSITIVE_KEYS = /authorization|token|secret|password|client_secret|refresh_token|access_token/i;

export function redactForLog(input: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(input).map(([key, value]) => [key, SENSITIVE_KEYS.test(key) ? "[REDACTED]" : value]),
  );
}
