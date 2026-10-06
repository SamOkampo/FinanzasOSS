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


export interface VaultCiphertextEnvelope {
  algorithm: "AEAD";
  keyId: string;
  nonce: string;
  ciphertext: string;
  authTag: string;
}

export interface VaultCryptoProvider {
  currentKeyId(): Promise<string>;
  encrypt(input: {
    plaintext: string;
    additionalAuthenticatedData: string;
    keyId: string;
  }): Promise<VaultCiphertextEnvelope>;
  decrypt(input: {
    envelope: VaultCiphertextEnvelope;
    additionalAuthenticatedData: string;
  }): Promise<string>;
}

export interface EncryptedSecretRecord {
  reference: SecretReference;
  scope: VaultScope;
  envelope: VaultCiphertextEnvelope;
  version: number;
  createdAt: string;
  rotatedAt?: string;
  revokedAt?: string;
}

export interface EncryptedSecretStore {
  insert(record: EncryptedSecretRecord): Promise<void>;
  get(scope: VaultScope, reference: SecretReference): Promise<EncryptedSecretRecord | null>;
  replace(
    scope: VaultScope,
    reference: SecretReference,
    expectedVersion: number,
    record: EncryptedSecretRecord,
  ): Promise<boolean>;
}

export interface SecretReferenceFactory {
  create(scope: VaultScope): SecretReference;
}

export interface VaultClock {
  now(): string;
}

const VAULT_ENVELOPE_KEYS = new Set(["algorithm", "keyId", "nonce", "ciphertext", "authTag"]);

export function assertVaultCiphertextEnvelope(envelope: VaultCiphertextEnvelope): void {
  const raw = envelope as unknown as Record<string, unknown>;
  for (const key of Object.keys(raw)) {
    if (!VAULT_ENVELOPE_KEYS.has(key)) {
      throw new Error(`Unexpected vault envelope field: ${key}`);
    }
  }

  if (envelope.algorithm !== "AEAD") throw new Error("Vault encryption must use authenticated encryption");
  if (!envelope.keyId.trim()) throw new Error("Vault envelope keyId is required");
  if (!envelope.nonce.trim()) throw new Error("Vault envelope nonce is required");
  if (!envelope.ciphertext.trim()) throw new Error("Vault envelope ciphertext is required");
  if (!envelope.authTag.trim()) throw new Error("Vault envelope authTag is required");
}

export function vaultAdditionalAuthenticatedData(
  scope: VaultScope,
  reference: SecretReference,
): string {
  assertVaultScope(scope);
  return [
    "finanzasoss:vault:v1",
    `tenant=${encodeURIComponent(scope.tenantId)}`,
    `connection=${encodeURIComponent(scope.connectionId)}`,
    `reference=${encodeURIComponent(reference)}`,
  ].join("|");
}

function assertIsoTimestamp(value: string, label: string): void {
  if (Number.isNaN(Date.parse(value))) throw new Error(`${label} must be a valid date`);
}

function assertEncryptedSecretRecord(
  record: EncryptedSecretRecord,
  scope: VaultScope,
  reference: SecretReference,
): void {
  if (record.reference !== reference) throw new Error("Vault record reference mismatch");
  if (record.scope.tenantId !== scope.tenantId || record.scope.connectionId !== scope.connectionId) {
    throw new Error("Vault record scope mismatch");
  }
  if (!Number.isInteger(record.version) || record.version < 1) {
    throw new Error("Vault record version must be a positive integer");
  }
  assertIsoTimestamp(record.createdAt, "Vault record createdAt");
  if (record.rotatedAt !== undefined) assertIsoTimestamp(record.rotatedAt, "Vault record rotatedAt");
  if (record.revokedAt !== undefined) assertIsoTimestamp(record.revokedAt, "Vault record revokedAt");
  assertVaultCiphertextEnvelope(record.envelope);
}

function serializeConnectorSecret(secret: ConnectorSecretMaterial): string {
  assertConnectorSecretMaterial(secret);
  return JSON.stringify(secret);
}

function deserializeConnectorSecret(serialized: string): ConnectorSecretMaterial {
  let parsed: unknown;
  try {
    parsed = JSON.parse(serialized);
  } catch {
    throw new Error("Vault plaintext payload is not valid JSON");
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Vault plaintext payload must be an object");
  }

  const secret = parsed as ConnectorSecretMaterial;
  assertConnectorSecretMaterial(secret);
  return secret;
}

export class HardenedTokenVault implements TokenVault {
  constructor(
    private readonly crypto: VaultCryptoProvider,
    private readonly store: EncryptedSecretStore,
    private readonly references: SecretReferenceFactory,
    private readonly clock: VaultClock,
  ) {}

  async put(scope: VaultScope, secret: ConnectorSecretMaterial): Promise<SecretReference> {
    assertVaultScope(scope);
    assertConnectorSecretMaterial(secret);

    const reference = this.references.create(scope);
    const keyId = (await this.crypto.currentKeyId()).trim();
    if (!keyId) throw new Error("Vault crypto provider returned an empty keyId");

    const envelope = await this.crypto.encrypt({
      plaintext: serializeConnectorSecret(secret),
      additionalAuthenticatedData: vaultAdditionalAuthenticatedData(scope, reference),
      keyId,
    });
    assertVaultCiphertextEnvelope(envelope);
    if (envelope.keyId !== keyId) throw new Error("Vault envelope keyId mismatch");

    const now = this.clock.now();
    assertIsoTimestamp(now, "Vault clock");

    await this.store.insert(
      Object.freeze({
        reference,
        scope: Object.freeze({ ...scope }),
        envelope: Object.freeze({ ...envelope }),
        version: 1,
        createdAt: now,
      }),
    );

    return reference;
  }

  async get(scope: VaultScope, reference: SecretReference): Promise<ConnectorSecretMaterial> {
    assertVaultScope(scope);
    const record = await this.store.get(scope, reference);
    if (!record) throw new Error("Vault secret not found");
    assertEncryptedSecretRecord(record, scope, reference);
    if (record.revokedAt !== undefined) throw new Error("Vault secret is revoked");

    const plaintext = await this.crypto.decrypt({
      envelope: record.envelope,
      additionalAuthenticatedData: vaultAdditionalAuthenticatedData(scope, reference),
    });

    return deserializeConnectorSecret(plaintext);
  }

  async rotate(
    scope: VaultScope,
    reference: SecretReference,
    secret: ConnectorSecretMaterial,
  ): Promise<void> {
    assertVaultScope(scope);
    assertConnectorSecretMaterial(secret);

    const current = await this.store.get(scope, reference);
    if (!current) throw new Error("Vault secret not found");
    assertEncryptedSecretRecord(current, scope, reference);
    if (current.revokedAt !== undefined) throw new Error("Cannot rotate a revoked vault secret");

    const keyId = (await this.crypto.currentKeyId()).trim();
    if (!keyId) throw new Error("Vault crypto provider returned an empty keyId");

    const envelope = await this.crypto.encrypt({
      plaintext: serializeConnectorSecret(secret),
      additionalAuthenticatedData: vaultAdditionalAuthenticatedData(scope, reference),
      keyId,
    });
    assertVaultCiphertextEnvelope(envelope);
    if (envelope.keyId !== keyId) throw new Error("Vault envelope keyId mismatch");

    const now = this.clock.now();
    assertIsoTimestamp(now, "Vault clock");

    const replaced = await this.store.replace(scope, reference, current.version, {
      ...current,
      envelope: Object.freeze({ ...envelope }),
      version: current.version + 1,
      rotatedAt: now,
    });

    if (!replaced) throw new Error("Vault rotation conflict");
  }

  async revoke(scope: VaultScope, reference: SecretReference): Promise<void> {
    assertVaultScope(scope);

    const current = await this.store.get(scope, reference);
    if (!current) throw new Error("Vault secret not found");
    assertEncryptedSecretRecord(current, scope, reference);
    if (current.revokedAt !== undefined) return;

    const now = this.clock.now();
    assertIsoTimestamp(now, "Vault clock");

    const replaced = await this.store.replace(scope, reference, current.version, {
      ...current,
      version: current.version + 1,
      revokedAt: now,
    });

    if (!replaced) throw new Error("Vault revocation conflict");
  }
}

export const hardenedVaultPolicy = Object.freeze({
  plaintextPersistenceAllowed: false,
  authenticatedEncryptionRequired: true,
  tenantAndConnectionBoundAsAad: true,
  optimisticConcurrencyRequiredForRotation: true,
  secretReferencesRemainOpaque: true,
  productionKmsProviderRequiredBeforeRealSecrets: true,
});

export * from "./audit-consent.js";

export * from "./consent-management.js";

export * from "./support-access.js";

export * from "./production-access-readiness.js";

export * from "./legal-data-readiness.js";

export * from "./production-infrastructure-readiness.js";

export * from "./safe-observability.js";

export * from "./pentest-readiness.js";
