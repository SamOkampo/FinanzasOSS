import assert from "node:assert/strict";
import {
  buildOAuthSecurityIntent,
  consumeOAuthSecurityIntent,
  OAuthSecurityError,
  oauthHardeningPolicy,
  validateMtlsBinding,
  validateOAuthSecurityPolicy,
} from "../dist/packages/connector-sdk/src/oauth-security.js";

const policy = {
  providerId:"fixture-provider",
  environment:"sandbox",
  verificationSource:"official-doc://fixture-provider/security-profile",
  stateRequired:true,
  pkce:"S256_required",
  nonce:"required",
  mtls:"required",
  maxIntentAgeSeconds:300,
};

assert.doesNotThrow(() => validateOAuthSecurityPolicy(policy));

const intent = await buildOAuthSecurityIntent({
  intentId:"intent-1",
  providerId:"fixture-provider",
  redirectUri:"http://localhost:3000/callback",
  state:"fixture-state",
  pkceVerifierReference:"vault://tenant-1/conn-1/pkce-1",
  nonce:"fixture-nonce",
  createdAt:"2026-10-06T00:50:00Z",
  policy,
});

assert.equal(intent.providerId, "fixture-provider");
assert.equal(intent.pkceVerifierReference, "vault://tenant-1/conn-1/pkce-1");
assert.notEqual(intent.stateHash, "fixture-state");
assert.notEqual(intent.nonceHash, "fixture-nonce");
assert.equal(intent.expiresAt, "2026-10-06T00:55:00.000Z");

const binding = {
  certificateReference:"cert-store://fixture-provider/client-cert",
  keyHandleReference:"kms://fixture/key-handle",
  signer:"external_kms",
};
assert.doesNotThrow(() => validateMtlsBinding(binding));

const consumed = await consumeOAuthSecurityIntent({
  intent,
  policy,
  returnedState:"fixture-state",
  returnedNonce:"fixture-nonce",
  redirectUri:"http://localhost:3000/callback",
  now:"2026-10-06T00:52:00Z",
  mtlsBinding:binding,
});
assert.equal(consumed.consumedAt, "2026-10-06T00:52:00.000Z");

await assert.rejects(
  () => consumeOAuthSecurityIntent({
    intent:consumed,
    policy,
    returnedState:"fixture-state",
    returnedNonce:"fixture-nonce",
    redirectUri:"http://localhost:3000/callback",
    now:"2026-10-06T00:53:00Z",
    mtlsBinding:binding,
  }),
  /already been consumed/,
);

await assert.rejects(
  () => consumeOAuthSecurityIntent({
    intent,
    policy,
    returnedState:"wrong-state",
    returnedNonce:"fixture-nonce",
    redirectUri:"http://localhost:3000/callback",
    now:"2026-10-06T00:52:00Z",
    mtlsBinding:binding,
  }),
  /state mismatch/,
);

await assert.rejects(
  () => consumeOAuthSecurityIntent({
    intent,
    policy,
    returnedState:"fixture-state",
    returnedNonce:"wrong-nonce",
    redirectUri:"http://localhost:3000/callback",
    now:"2026-10-06T00:52:00Z",
    mtlsBinding:binding,
  }),
  /nonce mismatch/,
);

await assert.rejects(
  () => consumeOAuthSecurityIntent({
    intent,
    policy,
    returnedState:"fixture-state",
    returnedNonce:"fixture-nonce",
    redirectUri:"http://localhost:3000/callback",
    now:"2026-10-06T00:56:00Z",
    mtlsBinding:binding,
  }),
  /expired/,
);

await assert.rejects(
  () => consumeOAuthSecurityIntent({
    intent,
    policy,
    returnedState:"fixture-state",
    returnedNonce:"fixture-nonce",
    redirectUri:"http://localhost:3000/other",
    now:"2026-10-06T00:52:00Z",
    mtlsBinding:binding,
  }),
  /redirect URI mismatch/,
);

await assert.rejects(
  () => consumeOAuthSecurityIntent({
    intent,
    policy,
    returnedState:"fixture-state",
    returnedNonce:"fixture-nonce",
    redirectUri:"http://localhost:3000/callback",
    now:"2026-10-06T00:52:00Z",
  }),
  /mTLS binding is required/,
);

assert.throws(
  () => validateMtlsBinding({
    certificateReference:"-----BEGIN CERTIFICATE-----",
    keyHandleReference:"kms://fixture/key-handle",
    signer:"external_kms",
  }),
  /opaque reference/,
);

assert.throws(
  () => validateOAuthSecurityPolicy({
    ...policy,
    verificationSource:"",
  }),
  OAuthSecurityError,
);

await assert.rejects(
  () => buildOAuthSecurityIntent({
    intentId:"intent-2",
    providerId:"fixture-provider",
    redirectUri:"https://app.example.test/callback",
    state:"fixture-state",
    nonce:"fixture-nonce",
    createdAt:"2026-10-06T00:50:00Z",
    policy,
  }),
  /PKCE verifier reference is required/,
);

assert.equal(oauthHardeningPolicy.stateAlwaysRequired, true);
assert.equal(oauthHardeningPolicy.pkceMethodWhenRequired, "S256");
assert.equal(oauthHardeningPolicy.rawPkceVerifierPersistenceAllowed, false);
assert.equal(oauthHardeningPolicy.rawMtlsPrivateKeyMaterialAllowed, false);
assert.equal(oauthHardeningPolicy.providerValuesMustComeFromVerifiedOfficialSource, true);
assert.equal(oauthHardeningPolicy.intentsAreSingleUse, true);

console.log("Phase 13.2 OAuth security regression passed");
