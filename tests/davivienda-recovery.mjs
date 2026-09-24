import assert from "node:assert/strict";
import { daviviendaRecoveryDecision } from "../dist/packages/connector-sdk/src/davivienda-recovery.js";

const checkedAt = "2026-09-24T10:00:00Z";

const auth = daviviendaRecoveryDecision({ status: 401, providerCode: "synthetic-auth" }, checkedAt);
assert.equal(auth.normalized.failure, "auth");
assert.equal(auth.health.state, "auth_required");
assert.deepEqual(auth.recovery, { action: "reauthorize", automatic: false, userActionRequired: true });

const consent = daviviendaRecoveryDecision({ status: 403 }, checkedAt);
assert.equal(consent.normalized.failure, "consent");
assert.equal(consent.health.state, "consent_expired");
assert.deepEqual(consent.recovery, { action: "renew_consent", automatic: false, userActionRequired: true });

const limited = daviviendaRecoveryDecision({ status: 429, retryAfterMs: 2500 }, checkedAt);
assert.equal(limited.health.state, "degraded");
assert.deepEqual(limited.recovery, {
  action: "retry",
  automatic: true,
  userActionRequired: false,
  retryAfterMs: 2500,
});

const upstream = daviviendaRecoveryDecision({ status: 503 }, checkedAt);
assert.equal(upstream.health.state, "api_down");
assert.equal(upstream.recovery.action, "retry");
assert.equal(upstream.recovery.automatic, true);

const invalid = daviviendaRecoveryDecision({ status: 422 }, checkedAt);
assert.equal(invalid.normalized.failure, "invalid_response");
assert.equal(invalid.normalized.retryable, false);

const unconfigured = daviviendaRecoveryDecision({}, checkedAt);
assert.equal(unconfigured.normalized.failure, "configuration");
assert.equal(unconfigured.normalized.retryable, false);

console.log("davivienda recovery tests passed");
