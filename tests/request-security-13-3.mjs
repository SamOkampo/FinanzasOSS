import assert from "node:assert/strict";
import {
  apiSecurityHeaders,
  assertAllowedOutboundUrl,
  createCsrfBinding,
  escapeUntrustedText,
  evaluateFixedWindowRateLimit,
  requestSecurityPolicy,
  verifyCsrfRequest,
} from "../dist/apps/api/src/request-security.js";

const ratePolicy = { windowMs:60_000, maxRequests:2 };
const first = evaluateFixedWindowRateLimit(ratePolicy, null, 1_000);
assert.equal(first.allowed, true);
assert.equal(first.remaining, 1);

const second = evaluateFixedWindowRateLimit(ratePolicy, first.nextState, 2_000);
assert.equal(second.allowed, true);
assert.equal(second.remaining, 0);

const blocked = evaluateFixedWindowRateLimit(ratePolicy, second.nextState, 3_000);
assert.equal(blocked.allowed, false);
assert.equal(blocked.remaining, 0);
assert.ok(blocked.retryAfterMs > 0);

const reset = evaluateFixedWindowRateLimit(ratePolicy, blocked.nextState, 61_000);
assert.equal(reset.allowed, true);
assert.equal(reset.nextState.count, 1);

assert.throws(
  () => evaluateFixedWindowRateLimit(ratePolicy, { windowStartedAtMs:10_000, count:1 }, 9_000),
  /clock moved backwards/,
);

const csrf = await createCsrfBinding({
  sessionId:"session-fixture",
  token:"0123456789abcdef0123456789abcdef",
  issuedAt:"2026-10-06T00:55:00Z",
  lifetimeMs:300_000,
});

await assert.doesNotReject(() => verifyCsrfRequest({
  method:"GET",
  sessionId:"session-fixture",
  allowedOrigins:[],
  now:"2026-10-06T00:56:00Z",
}));

await assert.doesNotReject(() => verifyCsrfRequest({
  method:"POST",
  sessionId:"session-fixture",
  token:"0123456789abcdef0123456789abcdef",
  origin:"https://app.example.test",
  allowedOrigins:["https://app.example.test"],
  binding:csrf,
  now:"2026-10-06T00:56:00Z",
}));

await assert.rejects(
  () => verifyCsrfRequest({
    method:"POST",
    sessionId:"session-fixture",
    token:"ffffffffffffffffffffffffffffffff",
    origin:"https://app.example.test",
    allowedOrigins:["https://app.example.test"],
    binding:csrf,
    now:"2026-10-06T00:56:00Z",
  }),
  /token mismatch/,
);

await assert.rejects(
  () => verifyCsrfRequest({
    method:"POST",
    sessionId:"session-fixture",
    token:"0123456789abcdef0123456789abcdef",
    origin:"https://evil.example.test",
    allowedOrigins:["https://app.example.test"],
    binding:csrf,
    now:"2026-10-06T00:56:00Z",
  }),
  /origin is not allowed/,
);

await assert.rejects(
  () => verifyCsrfRequest({
    method:"POST",
    sessionId:"session-fixture",
    token:"0123456789abcdef0123456789abcdef",
    origin:"https://app.example.test",
    allowedOrigins:["https://app.example.test"],
    binding:csrf,
    now:"2026-10-06T01:01:00Z",
  }),
  /expired/,
);

const escaped = escapeUntrustedText('<img src=x onerror="boom">& test');
assert.equal(escaped, "&lt;img src=x onerror=&quot;boom&quot;&gt;&amp; test");
assert.doesNotMatch(escaped, /<img/);

const outbound = assertAllowedOutboundUrl(
  "https://api.fixture.example/accounts",
  ["https://api.fixture.example"],
);
assert.equal(outbound.origin, "https://api.fixture.example");

assert.throws(
  () => assertAllowedOutboundUrl("https://evil.example/accounts", ["https://api.fixture.example"]),
  /not allowlisted/,
);
assert.throws(
  () => assertAllowedOutboundUrl("https://127.0.0.1/internal", ["https://127.0.0.1"]),
  /local or private/,
);
assert.throws(
  () => assertAllowedOutboundUrl("https://169.254.169.254/metadata", ["https://169.254.169.254"]),
  /local or private/,
);
assert.throws(
  () => assertAllowedOutboundUrl("http://api.fixture.example/accounts", ["https://api.fixture.example"]),
  /must use HTTPS/,
);
assert.throws(
  () => assertAllowedOutboundUrl("https://user:pass@api.fixture.example/accounts", ["https://api.fixture.example"]),
  /cannot contain credentials/,
);

assert.match(apiSecurityHeaders["content-security-policy"], /object-src 'none'/);
assert.doesNotMatch(apiSecurityHeaders["content-security-policy"], /unsafe-inline|unsafe-eval/);
assert.equal(apiSecurityHeaders["x-content-type-options"], "nosniff");

assert.equal(requestSecurityPolicy.rateLimitKeysMustBeServerDerived, true);
assert.equal(requestSecurityPolicy.stateChangingRequestsRequireCsrf, true);
assert.equal(requestSecurityPolicy.providerHtmlMayBeRendered, false);
assert.equal(requestSecurityPolicy.arbitraryOutboundUrlsAllowed, false);
assert.equal(requestSecurityPolicy.outboundRedirectsMustBeRevalidated, true);
assert.equal(requestSecurityPolicy.productionDnsAndEgressEnforcementRequired, true);

console.log("Phase 13.3 request security regression passed");
