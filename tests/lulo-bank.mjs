import assert from "node:assert/strict";
import {
  createLuloBankAccountInformationGate,
  LULO_BANK_IMPORT_PROFILE,
  LuloBankAccountInformationConfigurationError,
} from "../dist/packages/connector-sdk/src/lulo-bank.js";

assert.equal(LULO_BANK_IMPORT_PROFILE.institutionId, "lulo-bank");
assert.equal(LULO_BANK_IMPORT_PROFILE.accessMode, "statement_import");
assert.equal(LULO_BANK_IMPORT_PROFILE.environment, "local_import");
assert.equal(LULO_BANK_IMPORT_PROFILE.statementFormat, "pdf");
assert.equal(LULO_BANK_IMPORT_PROFILE.officialAccountInformationRoute, "not_verified");
assert.equal(LULO_BANK_IMPORT_PROFILE.aggregatorRoute, "not_verified");
assert.equal(LULO_BANK_IMPORT_PROFILE.requiresUserProvidedDocument, true);
assert.equal(LULO_BANK_IMPORT_PROFILE.statementMayBePasswordProtected, true);
assert.equal(LULO_BANK_IMPORT_PROFILE.persistDocumentPassword, false);
assert.equal(LULO_BANK_IMPORT_PROFILE.parserAvailable, false);

const syntheticEndpoints = {
  accountsEndpoint: "https://sandbox.example.invalid/lulo/accounts",
  balancesEndpoint: "https://sandbox.example.invalid/lulo/balances",
  transactionsEndpoint: "https://sandbox.example.invalid/lulo/transactions",
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
    accountsEndpoint: "http://sandbox.example.invalid/lulo/accounts",
  }],
]) {
  assert.throws(
    () => createLuloBankAccountInformationGate(config),
    LuloBankAccountInformationConfigurationError,
    `Lulo Bank must fail closed without verified ${label}`,
  );
}

const gate = createLuloBankAccountInformationGate({
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

console.log("lulo bank access gates: ok");
