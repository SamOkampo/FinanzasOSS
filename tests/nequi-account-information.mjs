import assert from "node:assert/strict";
import {
  createNequiAccountInformationGate,
  NequiAccountInformationConfigurationError,
} from "../dist/packages/connector-sdk/src/nequi-account-information.js";

const syntheticEndpoints = {
  accountsEndpoint: "https://sandbox.example.invalid/nequi/accounts",
  balancesEndpoint: "https://sandbox.example.invalid/nequi/balances",
  transactionsEndpoint: "https://sandbox.example.invalid/nequi/transactions",
};

assert.throws(() => createNequiAccountInformationGate({
  consentVerified: true,
  ...syntheticEndpoints,
  grantedCapabilities: ["accounts"],
}), NequiAccountInformationConfigurationError);

assert.throws(() => createNequiAccountInformationGate({
  officialRouteVerified: true,
  ...syntheticEndpoints,
  grantedCapabilities: ["accounts"],
}), NequiAccountInformationConfigurationError);

assert.throws(() => createNequiAccountInformationGate({
  officialRouteVerified: true,
  consentVerified: true,
  grantedCapabilities: ["accounts"],
}), NequiAccountInformationConfigurationError);

assert.throws(() => createNequiAccountInformationGate({
  officialRouteVerified: true,
  consentVerified: true,
  accountsEndpoint: "http://sandbox.example.invalid/nequi/accounts",
  grantedCapabilities: ["accounts"],
}), NequiAccountInformationConfigurationError);

const gate = createNequiAccountInformationGate({
  officialRouteVerified: true,
  consentVerified: true,
  ...syntheticEndpoints,
  grantedCapabilities: ["accounts", "balances", "transactions"],
});
assert.equal(gate.canRead("accounts"), true);
assert.equal(gate.canRead("balances"), true);
assert.equal(gate.canRead("transactions"), true);
gate.revokeConsent();
assert.equal(gate.canRead("accounts"), false);
assert.equal(gate.canRead("balances"), false);
assert.equal(gate.canRead("transactions"), false);

console.log("nequi account information gate ok");
