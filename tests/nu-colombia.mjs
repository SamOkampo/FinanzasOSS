import assert from "node:assert/strict";
import {
  createNuColombiaAccountInformationGate,
  NU_COLOMBIA_IMPORT_PROFILE,
  NuColombiaAccountInformationConfigurationError,
} from "../dist/packages/connector-sdk/src/nu-colombia.js";

assert.equal(NU_COLOMBIA_IMPORT_PROFILE.institutionId, "nu-colombia");
assert.equal(NU_COLOMBIA_IMPORT_PROFILE.legalInstitution, "Nu Colombia Compañía de Financiamiento S.A.");
assert.equal(NU_COLOMBIA_IMPORT_PROFILE.accessMode, "statement_import");
assert.equal(NU_COLOMBIA_IMPORT_PROFILE.environment, "local_import");
assert.equal(NU_COLOMBIA_IMPORT_PROFILE.statementFormat, "pdf");
assert.equal(NU_COLOMBIA_IMPORT_PROFILE.officialAccountInformationRoute, "not_verified");
assert.equal(NU_COLOMBIA_IMPORT_PROFILE.aggregatorRoute, "not_verified");
assert.deepEqual(NU_COLOMBIA_IMPORT_PROFILE.officialStatementDelivery, ["nu_app", "email"]);
assert.equal(NU_COLOMBIA_IMPORT_PROFILE.requiresUserProvidedDocument, true);
assert.equal(NU_COLOMBIA_IMPORT_PROFILE.persistDocumentPassword, false);
assert.equal(NU_COLOMBIA_IMPORT_PROFILE.parserAvailable, false);

const syntheticEndpoints = {
  accountsEndpoint: "https://sandbox.example.invalid/nu/accounts",
  balancesEndpoint: "https://sandbox.example.invalid/nu/balances",
  transactionsEndpoint: "https://sandbox.example.invalid/nu/transactions",
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
    accountsEndpoint: "http://sandbox.example.invalid/nu/accounts",
  }],
]) {
  assert.throws(
    () => createNuColombiaAccountInformationGate(config),
    NuColombiaAccountInformationConfigurationError,
    `Nu Colombia must fail closed without verified ${label}`,
  );
}

const gate = createNuColombiaAccountInformationGate({
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

console.log("nu colombia access gates: ok");
