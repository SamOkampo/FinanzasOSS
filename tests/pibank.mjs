import assert from "node:assert/strict";
import {
  createPibankAccountInformationGate,
  PIBANK_IMPORT_PROFILE,
  PibankAccountInformationConfigurationError,
} from "../dist/packages/connector-sdk/src/pibank.js";

assert.equal(PIBANK_IMPORT_PROFILE.institutionId, "pibank");
assert.equal(PIBANK_IMPORT_PROFILE.legalInstitution, "Banco Pichincha S.A.");
assert.equal(PIBANK_IMPORT_PROFILE.accessMode, "statement_import");
assert.equal(PIBANK_IMPORT_PROFILE.environment, "local_import");
assert.equal(PIBANK_IMPORT_PROFILE.statementFormat, "not_verified");
assert.equal(PIBANK_IMPORT_PROFILE.officialAccountInformationRoute, "not_verified");
assert.equal(PIBANK_IMPORT_PROFILE.aggregatorRoute, "not_verified");
assert.deepEqual(PIBANK_IMPORT_PROFILE.officialStatementDelivery, ["email", "official_digital_channels"]);
assert.equal(PIBANK_IMPORT_PROFILE.requiresUserProvidedDocument, true);
assert.equal(PIBANK_IMPORT_PROFILE.persistDocumentPassword, false);
assert.equal(PIBANK_IMPORT_PROFILE.parserAvailable, false);

const syntheticEndpoints = {
  accountsEndpoint: "https://sandbox.example.invalid/pibank/accounts",
  balancesEndpoint: "https://sandbox.example.invalid/pibank/balances",
  transactionsEndpoint: "https://sandbox.example.invalid/pibank/transactions",
};

for (const [label, config] of [
  ["official route", { consentVerified: true, grantedCapabilities: ["accounts"], ...syntheticEndpoints }],
  ["consent", { officialRouteVerified: true, grantedCapabilities: ["accounts"], ...syntheticEndpoints }],
  ["capability", { officialRouteVerified: true, consentVerified: true, grantedCapabilities: [], ...syntheticEndpoints }],
  ["endpoint", { officialRouteVerified: true, consentVerified: true, grantedCapabilities: ["accounts"] }],
  ["https", {
    officialRouteVerified: true,
    consentVerified: true,
    grantedCapabilities: ["accounts"],
    accountsEndpoint: "http://sandbox.example.invalid/pibank/accounts",
  }],
]) {
  assert.throws(
    () => createPibankAccountInformationGate(config),
    PibankAccountInformationConfigurationError,
    `Pibank must fail closed without verified ${label}`,
  );
}

const gate = createPibankAccountInformationGate({
  officialRouteVerified: true,
  consentVerified: true,
  grantedCapabilities: ["accounts", "balances", "transactions"],
  ...syntheticEndpoints,
});
assert.equal(gate.canRead("accounts"), true);
assert.equal(gate.canRead("balances"), true);
assert.equal(gate.canRead("transactions"), true);
gate.revokeConsent();
assert.equal(gate.canRead("accounts"), false);
assert.equal(gate.canRead("balances"), false);
assert.equal(gate.canRead("transactions"), false);

console.log("pibank access gates: ok");
