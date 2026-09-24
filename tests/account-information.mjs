import assert from "node:assert/strict";
import {
  AccountInformationGate,
  AccountInformationRevokedError,
  AccountInformationUnavailableError,
  normalizeAccountInformationError,
} from "../dist/packages/connector-sdk/src/account-information.js";

const closed = new AccountInformationGate({ grantedCapabilities: [] });
assert.equal(closed.canRead("accounts"), false);
assert.equal(closed.canRead("balances"), false);
assert.equal(closed.canRead("transactions"), false);
assert.throws(() => closed.endpointFor("accounts"), AccountInformationUnavailableError);
assert.throws(() => closed.endpointFor("transactions"), AccountInformationUnavailableError);

const endpointWithoutGrant = new AccountInformationGate({
  accountsEndpoint: "https://example.invalid/accounts",
  transactionsEndpoint: "https://example.invalid/transactions",
  grantedCapabilities: [],
});
assert.equal(endpointWithoutGrant.canRead("accounts"), false);
assert.equal(endpointWithoutGrant.canRead("transactions"), false);

const grantWithoutEndpoint = new AccountInformationGate({ grantedCapabilities: ["accounts", "transactions"] });
assert.equal(grantWithoutEndpoint.canRead("accounts"), false);
assert.equal(grantWithoutEndpoint.canRead("transactions"), false);

const verifiedFixture = new AccountInformationGate({
  accountsEndpoint: "https://example.invalid/accounts",
  balancesEndpoint: "https://example.invalid/balances",
  transactionsEndpoint: "https://example.invalid/transactions",
  grantedCapabilities: ["accounts", "balances", "transactions"],
});
assert.equal(verifiedFixture.endpointFor("accounts").hostname, "example.invalid");
assert.equal(verifiedFixture.endpointFor("balances").pathname, "/balances");
assert.equal(verifiedFixture.endpointFor("transactions").pathname, "/transactions");
verifiedFixture.revokeConsent();
assert.equal(verifiedFixture.isConsentActive(), false);
assert.equal(verifiedFixture.canRead("accounts"), false);
assert.equal(verifiedFixture.canRead("transactions"), false);
assert.throws(() => verifiedFixture.endpointFor("accounts"), AccountInformationRevokedError);

assert.deepEqual(normalizeAccountInformationError({ status: 401 }), { failure: "auth", retryable: false });
assert.deepEqual(normalizeAccountInformationError({ status: 403 }), { failure: "consent", retryable: false });
assert.deepEqual(normalizeAccountInformationError({ status: 429, retryAfterMs: 1500 }), { failure: "rate_limit", retryable: true, retryAfterMs: 1500 });
assert.deepEqual(normalizeAccountInformationError({ status: 503, providerCode: "TEMP" }), { failure: "upstream", retryable: true, providerCode: "TEMP" });
assert.deepEqual(normalizeAccountInformationError({ status: 400 }), { failure: "invalid_response", retryable: false });
assert.deepEqual(normalizeAccountInformationError({}), { failure: "configuration", retryable: false });

assert.throws(() => new AccountInformationGate({ accountsEndpoint: "http://bank.example.invalid/accounts", grantedCapabilities: ["accounts"] }), /HTTPS/);
assert.throws(() => new AccountInformationGate({ transactionsEndpoint: "http://bank.example.invalid/transactions", grantedCapabilities: ["transactions"] }), /HTTPS/);

console.log("account information policy tests passed");
