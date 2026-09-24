import assert from "node:assert/strict";
import {
  createDaviviendaAccountInformationGate,
  DaviviendaAccountInformationConfigurationError,
} from "../dist/packages/connector-sdk/src/davivienda-account-information.js";

const syntheticEndpoints = {
  accountsEndpoint: "https://sandbox.example.invalid/accounts",
  balancesEndpoint: "https://sandbox.example.invalid/balances",
  transactionsEndpoint: "https://sandbox.example.invalid/transactions",
};

assert.throws(
  () => createDaviviendaAccountInformationGate({
    ...syntheticEndpoints,
    grantedCapabilities: ["accounts"],
  }),
  DaviviendaAccountInformationConfigurationError,
);

assert.throws(
  () => createDaviviendaAccountInformationGate({
    consentVerified: true,
    grantedCapabilities: ["accounts"],
  }),
  DaviviendaAccountInformationConfigurationError,
);

assert.throws(
  () => createDaviviendaAccountInformationGate({
    consentVerified: true,
    accountsEndpoint: "http://sandbox.example.invalid/accounts",
    grantedCapabilities: ["accounts"],
  }),
  DaviviendaAccountInformationConfigurationError,
);

const gate = createDaviviendaAccountInformationGate({
  consentVerified: true,
  ...syntheticEndpoints,
  grantedCapabilities: ["accounts", "balances", "transactions"],
});

assert.equal(gate.canRead("accounts"), true);
assert.equal(gate.canRead("balances"), true);
assert.equal(gate.canRead("transactions"), true);
assert.equal(gate.endpointFor("transactions").hostname, "sandbox.example.invalid");

gate.revokeConsent();
assert.equal(gate.canRead("accounts"), false);
assert.equal(gate.canRead("balances"), false);
assert.equal(gate.canRead("transactions"), false);

console.log("davivienda account information gate ok");
