export interface RateLimitPolicy {
  windowMs: number;
  maxRequests: number;
}

export interface RateLimitState {
  windowStartedAtMs: number;
  count: number;
}

export interface RateLimitDecision {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
  nextState: RateLimitState;
}

export function evaluateFixedWindowRateLimit(
  policy: RateLimitPolicy,
  state: RateLimitState | null,
  nowMs: number,
): RateLimitDecision {
  if (!Number.isInteger(policy.windowMs) || policy.windowMs < 1000) {
    throw new Error("Rate-limit windowMs must be an integer >= 1000");
  }
  if (!Number.isInteger(policy.maxRequests) || policy.maxRequests < 1) {
    throw new Error("Rate-limit maxRequests must be a positive integer");
  }
  if (!Number.isFinite(nowMs) || nowMs < 0) throw new Error("Rate-limit clock is invalid");

  const expired = !state || nowMs >= state.windowStartedAtMs + policy.windowMs;
  const current = expired ? { windowStartedAtMs: nowMs, count: 0 } : state;
  if (nowMs < current.windowStartedAtMs) throw new Error("Rate-limit clock moved backwards");

  if (current.count >= policy.maxRequests) {
    return Object.freeze({
      allowed: false,
      remaining: 0,
      retryAfterMs: Math.max(0, current.windowStartedAtMs + policy.windowMs - nowMs),
      nextState: Object.freeze({ ...current }),
    });
  }

  const nextCount = current.count + 1;
  return Object.freeze({
    allowed: true,
    remaining: Math.max(0, policy.maxRequests - nextCount),
    retryAfterMs: 0,
    nextState: Object.freeze({ windowStartedAtMs: current.windowStartedAtMs, count: nextCount }),
  });
}

export interface CsrfBinding {
  sessionHash: string;
  tokenHash: string;
  issuedAt: string;
  expiresAt: string;
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

function parseTimestamp(value: string, label: string): number {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) throw new Error(`${label} must be a valid timestamp`);
  return parsed;
}

function normalizedOrigin(value: string): string {
  const parsed = new URL(value);
  if (parsed.protocol !== "https:" && !(parsed.protocol === "http:" && parsed.hostname === "localhost")) {
    throw new Error("Security origin must use HTTPS outside localhost");
  }
  return parsed.origin;
}

export async function createCsrfBinding(input: {
  sessionId: string;
  token: string;
  issuedAt: string;
  lifetimeMs: number;
}): Promise<CsrfBinding> {
  if (!input.sessionId.trim()) throw new Error("CSRF sessionId is required");
  if (input.token.length < 32) throw new Error("CSRF token must contain at least 32 characters");
  if (!Number.isInteger(input.lifetimeMs) || input.lifetimeMs < 60_000 || input.lifetimeMs > 86_400_000) {
    throw new Error("CSRF lifetime must be between one minute and one day");
  }

  const issuedMs = parseTimestamp(input.issuedAt, "CSRF issuedAt");
  return Object.freeze({
    sessionHash: await sha256(input.sessionId),
    tokenHash: await sha256(input.token),
    issuedAt: new Date(issuedMs).toISOString(),
    expiresAt: new Date(issuedMs + input.lifetimeMs).toISOString(),
  });
}

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export async function verifyCsrfRequest(input: {
  method: string;
  sessionId: string;
  token?: string;
  origin?: string;
  allowedOrigins: readonly string[];
  binding?: CsrfBinding;
  now: string;
}): Promise<void> {
  const method = input.method.trim().toUpperCase();
  if (SAFE_METHODS.has(method)) return;

  if (!input.binding) throw new Error("CSRF binding is required for state-changing requests");
  if (!input.token) throw new Error("CSRF token is required for state-changing requests");
  if (!input.origin) throw new Error("Origin is required for state-changing requests");

  const nowMs = parseTimestamp(input.now, "CSRF now");
  if (nowMs > parseTimestamp(input.binding.expiresAt, "CSRF expiresAt")) {
    throw new Error("CSRF binding has expired");
  }

  const allowed = new Set(input.allowedOrigins.map((origin) => normalizedOrigin(origin)));
  if (!allowed.has(normalizedOrigin(input.origin))) {
    throw new Error("CSRF origin is not allowed");
  }

  if ((await sha256(input.sessionId)) !== input.binding.sessionHash) {
    throw new Error("CSRF session mismatch");
  }
  if ((await sha256(input.token)) !== input.binding.tokenHash) {
    throw new Error("CSRF token mismatch");
  }
}

export function escapeUntrustedText(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function stripIpv6Brackets(hostname: string): string {
  return hostname.startsWith("[") && hostname.endsWith("]") ? hostname.slice(1, -1) : hostname;
}

function isPrivateIpv4(hostname: string): boolean {
  if (!/^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname)) return false;
  const octets = hostname.split(".").map(Number);
  if (octets.some((octet) => octet < 0 || octet > 255)) return true;
  const [a = 0, b = 0] = octets;

  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
}

function isPrivateIpv6(hostname: string): boolean {
  const host = stripIpv6Brackets(hostname).toLowerCase();
  return (
    host === "::" ||
    host === "::1" ||
    host.startsWith("fc") ||
    host.startsWith("fd") ||
    /^fe[89ab]/.test(host)
  );
}

export function assertAllowedOutboundUrl(
  value: string,
  allowedOrigins: readonly string[],
): URL {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error("Outbound URL must be absolute");
  }

  if (parsed.protocol !== "https:") throw new Error("Outbound URL must use HTTPS");
  if (parsed.username || parsed.password) throw new Error("Outbound URL cannot contain credentials");
  if (parsed.hash) throw new Error("Outbound URL cannot contain fragments");

  const hostname = stripIpv6Brackets(parsed.hostname).toLowerCase();
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    isPrivateIpv4(hostname) ||
    isPrivateIpv6(hostname)
  ) {
    throw new Error("Outbound URL targets a local or private network");
  }

  const allowed = new Set(
    allowedOrigins.map((origin) => {
      const candidate = new URL(origin);
      if (candidate.protocol !== "https:") throw new Error("Outbound allowlist origins must use HTTPS");
      const candidateHost = stripIpv6Brackets(candidate.hostname).toLowerCase();
      if (
        candidateHost === "localhost" ||
        candidateHost.endsWith(".localhost") ||
        isPrivateIpv4(candidateHost) ||
        isPrivateIpv6(candidateHost)
      ) {
        throw new Error("Outbound allowlist cannot contain local or private origins");
      }
      return candidate.origin;
    }),
  );

  if (!allowed.has(parsed.origin)) throw new Error("Outbound origin is not allowlisted");
  return parsed;
}

export const apiSecurityHeaders = Object.freeze({
  "content-security-policy":
    "default-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'",
  "x-content-type-options": "nosniff",
  "referrer-policy": "no-referrer",
  "x-frame-options": "DENY",
});

export const requestSecurityPolicy = Object.freeze({
  rateLimitKeysMustBeServerDerived: true,
  stateChangingRequestsRequireCsrf: true,
  providerHtmlMayBeRendered: false,
  arbitraryOutboundUrlsAllowed: false,
  outboundRedirectsMustBeRevalidated: true,
  productionDnsAndEgressEnforcementRequired: true,
});
