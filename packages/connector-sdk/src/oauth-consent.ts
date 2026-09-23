export interface SandboxOAuthConsentConfig {
  authorizationEndpoint?: string;
  clientId?: string;
  redirectUri?: string;
  scopes?: readonly string[];
}

export interface SandboxOAuthAuthorizationRequest {
  authorizationUrl: string;
  state: string;
  codeVerifier: string;
}

export class SandboxOAuthConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SandboxOAuthConfigurationError";
  }
}

function base64Url(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64url");
}

async function sha256(value: string): Promise<string> {
  const { createHash } = await import("node:crypto");
  return createHash("sha256").update(value).digest("base64url");
}

async function randomUrlSafe(bytes: number): Promise<string> {
  const { randomBytes } = await import("node:crypto");
  return base64Url(randomBytes(bytes));
}

/**
 * Builds an authorization request only when every provider-specific value has
 * been explicitly configured from official sandbox documentation. Nothing is
 * inferred and no client secret or bank credential is accepted here.
 */
export async function buildSandboxOAuthAuthorizationRequest(
  config: SandboxOAuthConsentConfig,
): Promise<SandboxOAuthAuthorizationRequest> {
  const endpoint = config.authorizationEndpoint?.trim();
  const clientId = config.clientId?.trim();
  const redirectUri = config.redirectUri?.trim();
  const scopes = config.scopes?.map((scope) => scope.trim()).filter(Boolean) ?? [];

  if (!endpoint || !clientId || !redirectUri || scopes.length === 0) {
    throw new SandboxOAuthConfigurationError(
      "Official sandbox authorization endpoint, client id, redirect URI and scopes must be configured explicitly",
    );
  }

  const parsedEndpoint = new URL(endpoint);
  const parsedRedirect = new URL(redirectUri);
  if (parsedEndpoint.protocol !== "https:" || !["https:", "http:"].includes(parsedRedirect.protocol)) {
    throw new SandboxOAuthConfigurationError("OAuth URLs use an unsupported protocol");
  }
  if (parsedRedirect.protocol === "http:" && !["localhost", "127.0.0.1", "::1"].includes(parsedRedirect.hostname)) {
    throw new SandboxOAuthConfigurationError("Non-local redirect URIs must use HTTPS");
  }

  const state = await randomUrlSafe(32);
  const codeVerifier = await randomUrlSafe(48);
  const codeChallenge = await sha256(codeVerifier);

  parsedEndpoint.searchParams.set("response_type", "code");
  parsedEndpoint.searchParams.set("client_id", clientId);
  parsedEndpoint.searchParams.set("redirect_uri", redirectUri);
  parsedEndpoint.searchParams.set("scope", scopes.join(" "));
  parsedEndpoint.searchParams.set("state", state);
  parsedEndpoint.searchParams.set("code_challenge", codeChallenge);
  parsedEndpoint.searchParams.set("code_challenge_method", "S256");

  return { authorizationUrl: parsedEndpoint.toString(), state, codeVerifier };
}

export function verifyOAuthCallbackState(expectedState: string, returnedState: string): void {
  if (!expectedState || !returnedState || expectedState !== returnedState) {
    throw new SandboxOAuthConfigurationError("OAuth callback state mismatch");
  }
}
