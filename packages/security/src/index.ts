export type SecretReference = string & { readonly __brand: "SecretReference" };

export interface VaultScope {
  tenantId: string;
  connectionId: string;
}

export interface OAuthSecretMaterial {
  kind: "oauth";
  accessToken: string;
  refreshToken?: string;
  tokenType?: string;
  expiresAt?: string;
  scopes?: readonly string[];
}

export interface ApiKeySecretMaterial {
  kind: "api_key";
  apiKey: string;
  apiSecret?: string;
  passphrase?: string;
}

export type ConnectorSecretMaterial = OAuthSecretMaterial | ApiKeySecretMaterial;

/** @deprecated Use ConnectorSecretMaterial. */
export type TokenBundle = OAuthSecretMaterial;

export interface TokenVault {
  put(scope: VaultScope, secret: ConnectorSecretMaterial): Promise<SecretReference>;
  get(scope: VaultScope, reference: SecretReference): Promise<ConnectorSecretMaterial>;
  rotate(scope: VaultScope, reference: SecretReference, secret: ConnectorSecretMaterial): Promise<void>;
  revoke(scope: VaultScope, reference: SecretReference): Promise<void>;
}

const SENSITIVE_KEYS =
  /authorization|token|secret|password|passphrase|api[_-]?key|seed|mnemonic|private[_-]?key|client[_-]?secret/i;
const FORBIDDEN_CREDENTIAL_KEYS = /password|seed|mnemonic|private[_-]?key/i;

export function assertVaultScope(scope: VaultScope): void {
  if (!scope.tenantId.trim()) throw new Error("Vault scope tenantId is required");
  if (!scope.connectionId.trim()) throw new Error("Vault scope connectionId is required");
}

function assertNoForbiddenCredentialKeys(value: unknown, path = "secret"): void {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoForbiddenCredentialKeys(item, `${path}[${index}]`));
    return;
  }

  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    if (FORBIDDEN_CREDENTIAL_KEYS.test(key)) {
      throw new Error(`Forbidden credential field at ${path}.${key}`);
    }
    assertNoForbiddenCredentialKeys(nested, `${path}.${key}`);
  }
}

function assertNonEmptySecret(value: string | undefined, label: string): void {
  if (value !== undefined && !value.trim()) throw new Error(`${label} cannot be empty`);
}

export function assertConnectorSecretMaterial(secret: ConnectorSecretMaterial): void {
  assertNoForbiddenCredentialKeys(secret);

  if (secret.kind === "oauth") {
    if (!secret.accessToken.trim()) throw new Error("OAuth accessToken is required");
    assertNonEmptySecret(secret.refreshToken, "OAuth refreshToken");
    assertNonEmptySecret(secret.tokenType, "OAuth tokenType");
    if (secret.expiresAt !== undefined && Number.isNaN(Date.parse(secret.expiresAt))) {
      throw new Error("OAuth expiresAt must be a valid date");
    }
    if (secret.scopes?.some((scope) => !scope.trim())) {
      throw new Error("OAuth scopes cannot contain empty values");
    }
    return;
  }

  if (secret.kind === "api_key") {
    if (!secret.apiKey.trim()) throw new Error("API key is required");
    assertNonEmptySecret(secret.apiSecret, "API secret");
    assertNonEmptySecret(secret.passphrase, "API passphrase");
    return;
  }

  throw new Error("Unsupported connector secret material");
}

export function asSecretReference(value: string): SecretReference {
  if (!value.trim()) throw new Error("Secret reference cannot be empty");
  if (/\s/.test(value)) throw new Error("Secret reference cannot contain whitespace");
  return value as SecretReference;
}

function redactValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map((item) => redactValue(item));
  if (!value || typeof value !== "object") return value;

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, nested]) => [
      key,
      SENSITIVE_KEYS.test(key) ? "[REDACTED]" : redactValue(nested),
    ]),
  );
}

export function redactForLog(input: Record<string, unknown>): Record<string, unknown> {
  return redactValue(input) as Record<string, unknown>;
}
