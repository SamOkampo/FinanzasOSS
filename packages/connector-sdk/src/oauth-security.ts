export type OAuthPkcePolicy = "S256_required" | "not_applicable";
export type OAuthNoncePolicy = "required" | "optional" | "not_applicable";
export type OAuthMtlsPolicy = "required" | "optional" | "not_applicable";

export interface VerifiedOAuthSecurityPolicy {
  providerId: string;
  environment: "sandbox" | "production";
  verificationSource: string;
  stateRequired: true;
  pkce: OAuthPkcePolicy;
  nonce: OAuthNoncePolicy;
  mtls: OAuthMtlsPolicy;
  maxIntentAgeSeconds: number;
}

export interface OpaqueMtlsBinding {
  certificateReference: string;
  keyHandleReference: string;
  signer: "external_kms" | "external_hsm";
}

export interface OAuthSecurityIntent {
  intentId: string;
  providerId: string;
  redirectUri: string;
  stateHash: string;
  pkceVerifierReference?: string;
  nonceHash?: string;
  createdAt: string;
  expiresAt: string;
  consumedAt?: string;
}

export class OAuthSecurityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OAuthSecurityError";
  }
}

function base64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return base64Url(new Uint8Array(digest));
}

function assertHttpsOrLocalhost(urlValue: string, label: string): void {
  let parsed: URL;
  try {
    parsed = new URL(urlValue);
  } catch {
    throw new OAuthSecurityError(`${label} must be an absolute URL`);
  }

  if (parsed.protocol === "https:") return;
  if (
    parsed.protocol === "http:" &&
    ["localhost", "127.0.0.1", "::1"].includes(parsed.hostname)
  ) {
    return;
  }

  throw new OAuthSecurityError(`${label} must use HTTPS outside localhost`);
}

function assertOpaqueReference(value: string, label: string): void {
  if (!value.trim()) throw new OAuthSecurityError(`${label} is required`);
  if (/\s/.test(value)) throw new OAuthSecurityError(`${label} cannot contain whitespace`);
  if (/-----BEGIN|PRIVATE KEY|CERTIFICATE/i.test(value)) {
    throw new OAuthSecurityError(`${label} must be an opaque reference, not key or certificate material`);
  }
}

export function validateOAuthSecurityPolicy(policy: VerifiedOAuthSecurityPolicy): void {
  if (!policy.providerId.trim()) throw new OAuthSecurityError("providerId is required");
  if (!policy.verificationSource.trim()) {
    throw new OAuthSecurityError("An official verification source is required");
  }
  if (policy.stateRequired !== true) {
    throw new OAuthSecurityError("OAuth state protection is mandatory");
  }
  if (
    !Number.isInteger(policy.maxIntentAgeSeconds) ||
    policy.maxIntentAgeSeconds < 30 ||
    policy.maxIntentAgeSeconds > 900
  ) {
    throw new OAuthSecurityError("OAuth intent lifetime must be between 30 and 900 seconds");
  }
}

export function validateMtlsBinding(binding: OpaqueMtlsBinding): void {
  assertOpaqueReference(binding.certificateReference, "mTLS certificate reference");
  assertOpaqueReference(binding.keyHandleReference, "mTLS key handle reference");
  if (!["external_kms", "external_hsm"].includes(binding.signer)) {
    throw new OAuthSecurityError("mTLS signer must be external KMS or HSM");
  }
}

export async function buildOAuthSecurityIntent(input: {
  intentId: string;
  providerId: string;
  redirectUri: string;
  state: string;
  pkceVerifierReference?: string;
  nonce?: string;
  createdAt: string;
  policy: VerifiedOAuthSecurityPolicy;
}): Promise<OAuthSecurityIntent> {
  validateOAuthSecurityPolicy(input.policy);

  if (!input.intentId.trim()) throw new OAuthSecurityError("intentId is required");
  if (input.providerId !== input.policy.providerId) {
    throw new OAuthSecurityError("OAuth intent provider mismatch");
  }
  assertHttpsOrLocalhost(input.redirectUri, "OAuth redirect URI");
  if (!input.state.trim()) throw new OAuthSecurityError("OAuth state is required");

  if (input.policy.pkce === "S256_required") {
    if (!input.pkceVerifierReference) {
      throw new OAuthSecurityError("PKCE verifier reference is required");
    }
    assertOpaqueReference(input.pkceVerifierReference, "PKCE verifier reference");
  }

  if (input.policy.nonce === "required" && !input.nonce?.trim()) {
    throw new OAuthSecurityError("OAuth nonce is required");
  }

  const createdMs = Date.parse(input.createdAt);
  if (Number.isNaN(createdMs)) throw new OAuthSecurityError("createdAt must be a valid date");

  const expiresAt = new Date(createdMs + input.policy.maxIntentAgeSeconds * 1000).toISOString();

  return Object.freeze({
    intentId: input.intentId,
    providerId: input.providerId,
    redirectUri: input.redirectUri,
    stateHash: await sha256(input.state),
    ...(input.pkceVerifierReference !== undefined
      ? { pkceVerifierReference: input.pkceVerifierReference }
      : {}),
    ...(input.nonce !== undefined ? { nonceHash: await sha256(input.nonce) } : {}),
    createdAt: new Date(createdMs).toISOString(),
    expiresAt,
  });
}

export async function consumeOAuthSecurityIntent(input: {
  intent: OAuthSecurityIntent;
  policy: VerifiedOAuthSecurityPolicy;
  returnedState: string;
  redirectUri: string;
  now: string;
  returnedNonce?: string;
  mtlsBinding?: OpaqueMtlsBinding;
}): Promise<OAuthSecurityIntent> {
  validateOAuthSecurityPolicy(input.policy);

  if (input.intent.providerId !== input.policy.providerId) {
    throw new OAuthSecurityError("OAuth callback provider mismatch");
  }
  if (input.intent.consumedAt !== undefined) {
    throw new OAuthSecurityError("OAuth intent has already been consumed");
  }
  if (input.redirectUri !== input.intent.redirectUri) {
    throw new OAuthSecurityError("OAuth redirect URI mismatch");
  }

  const nowMs = Date.parse(input.now);
  const expiresMs = Date.parse(input.intent.expiresAt);
  if (Number.isNaN(nowMs) || Number.isNaN(expiresMs)) {
    throw new OAuthSecurityError("OAuth callback timestamps are invalid");
  }
  if (nowMs > expiresMs) throw new OAuthSecurityError("OAuth intent has expired");

  if (!input.returnedState.trim()) throw new OAuthSecurityError("OAuth callback state is required");
  if ((await sha256(input.returnedState)) !== input.intent.stateHash) {
    throw new OAuthSecurityError("OAuth callback state mismatch");
  }

  if (input.policy.pkce === "S256_required" && !input.intent.pkceVerifierReference) {
    throw new OAuthSecurityError("PKCE verifier reference is missing");
  }

  if (input.policy.nonce === "required") {
    if (!input.returnedNonce?.trim() || !input.intent.nonceHash) {
      throw new OAuthSecurityError("OAuth callback nonce is required");
    }
    if ((await sha256(input.returnedNonce)) !== input.intent.nonceHash) {
      throw new OAuthSecurityError("OAuth callback nonce mismatch");
    }
  }

  if (input.policy.mtls === "required") {
    if (!input.mtlsBinding) throw new OAuthSecurityError("mTLS binding is required");
    validateMtlsBinding(input.mtlsBinding);
  } else if (input.mtlsBinding) {
    validateMtlsBinding(input.mtlsBinding);
  }

  return Object.freeze({
    ...input.intent,
    consumedAt: new Date(nowMs).toISOString(),
  });
}

export const oauthHardeningPolicy = Object.freeze({
  stateAlwaysRequired: true,
  pkceMethodWhenRequired: "S256" as const,
  rawPkceVerifierPersistenceAllowed: false,
  rawMtlsPrivateKeyMaterialAllowed: false,
  providerValuesMustComeFromVerifiedOfficialSource: true,
  intentsAreSingleUse: true,
});
