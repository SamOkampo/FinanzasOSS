import assert from "node:assert/strict";
import {
  AccountInformationGate,
  AccountInformationUnavailableError,
} from "../dist/packages/connector-sdk/src/account-information.js";

const closed = new AccountInformationGate({ grantedCapabilities: [] });
assert.equal(closed.canRead("accounts"), false);
assert.equal(closed.canRead("balances"), false);
assert.throws(() => closed.endpointFor("accounts"), AccountInformationUnavailableError);

const endpointWithoutGrant = new AccountInformationGate({
  accountsEndpoint: "https://example.invalid/accounts",
  grantedCapabilities: [],
});
assert.equal(endpointWithoutGrant.canRead("accounts"), false);

const grantWithoutEndpoint = new AccountInformationGate({
  grantedCapabilities: ["accounts"],
});
assert.equal(grantWithoutEndpoint.canRead("accounts"), false);

const verifiedFixture = new AccountInformationGate({
  accountsEndpoint: "https://example.invalid/accounts",
  balancesEndpoint: "https://example.invalid/balances",
  grantedCapabilities: ["accounts", "balances"],
});
assert.equal(verifiedFixture.endpointFor("accounts").hostname, "example.invalid");
assert.equal(verifiedFixture.endpointFor("balances").pathname, "/balances");

assert.throws(
  () => new AccountInformationGate({
    accountsEndpoint: "http://bank.example.invalid/accounts",
    grantedCapabilities: ["accounts"],
  }),
  /HTTPS/,
);

console.log("account information policy tests passed");
