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
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return base64Url(new Uint8Array(digest));
}

function randomUrlSafe(bytes: number): string {
  return base64Url(crypto.getRandomValues(new Uint8Array(bytes)));
}

/** Builds PKCE authorization only from explicitly verified sandbox config. */
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

  const state = randomUrlSafe(32);
  const codeVerifier = randomUrlSafe(48);
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
