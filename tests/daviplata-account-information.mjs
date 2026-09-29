import assert from "node:assert/strict";
import {
  createDaviPlataAccountInformationGate,
  DaviPlataAccountInformationConfigurationError,
} from "../dist/packages/connector-sdk/src/daviplata-account-information.js";

const valid = {
  officialRouteVerified: true,
  consentVerified: true,
  grantedCapabilities: ["accounts", "balances", "transactions"],
  accountsEndpoint: "https://sandbox.example.invalid/daviplata/accounts",
  balancesEndpoint: "https://sandbox.example.invalid/daviplata/balances",
  transactionsEndpoint: "https://sandbox.example.invalid/daviplata/transactions",
};

for (const [name, config] of [
  ["official route", { ...valid, officialRouteVerified: false }],
  ["consent", { ...valid, consentVerified: false }],
  ["capabilities", { ...valid, grantedCapabilities: [] }],
  ["endpoint", { ...valid, transactionsEndpoint: "" }],
  ["https", { ...valid, accountsEndpoint: "http://sandbox.example.invalid/daviplata/accounts" }],
]) {
  assert.throws(
    () => createDaviPlataAccountInformationGate(config),
    DaviPlataAccountInformationConfigurationError,
    `DaviPlata must fail closed without verified ${name}`,
  );
}

const gate = createDaviPlataAccountInformationGate(valid);
assert.equal(gate.canRead("accounts"), true);
assert.equal(gate.canRead("balances"), true);
assert.equal(gate.canRead("transactions"), true);

gate.revokeConsent();
assert.equal(gate.canRead("accounts"), false);
assert.equal(gate.canRead("balances"), false);
assert.equal(gate.canRead("transactions"), false);

console.log("daviplata-account-information regression: ok");
