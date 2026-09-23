import assert from "node:assert/strict";
import {
  buildSandboxOAuthAuthorizationRequest,
  verifyOAuthCallbackState,
  SandboxOAuthConfigurationError,
} from "../dist/packages/connector-sdk/src/oauth-consent.js";

await assert.rejects(
  () => buildSandboxOAuthAuthorizationRequest({}),
  SandboxOAuthConfigurationError,
  "OAuth must fail closed when official provider config is absent",
);

const request = await buildSandboxOAuthAuthorizationRequest({
  authorizationEndpoint: "https://sandbox.example.invalid/oauth/authorize",
  clientId: "fixture-client",
  redirectUri: "http://localhost:3000/callback",
  scopes: ["fixture.read"],
});
const url = new URL(request.authorizationUrl);
assert.equal(url.searchParams.get("response_type"), "code");
assert.equal(url.searchParams.get("code_challenge_method"), "S256");
assert.equal(url.searchParams.get("state"), request.state);
assert.ok(url.searchParams.get("code_challenge"));
assert.ok(request.codeVerifier.length >= 43);
verifyOAuthCallbackState(request.state, request.state);
assert.throws(() => verifyOAuthCallbackState(request.state, "wrong-state"), SandboxOAuthConfigurationError);

console.log("oauth consent tests passed");
