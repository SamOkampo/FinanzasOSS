import assert from "node:assert/strict";
import {
  AccountInformationGate,
  AccountInformationUnavailableError,
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

const grantWithoutEndpoint = new AccountInformationGate({
  grantedCapabilities: ["accounts", "transactions"],
});
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

assert.throws(
  () => new AccountInformationGate({
    accountsEndpoint: "http://bank.example.invalid/accounts",
    grantedCapabilities: ["accounts"],
  }),
  /HTTPS/,
);
assert.throws(
  () => new AccountInformationGate({
    transactionsEndpoint: "http://bank.example.invalid/transactions",
    grantedCapabilities: ["transactions"],
  }),
  /HTTPS/,
);

console.log("account information policy tests passed");
