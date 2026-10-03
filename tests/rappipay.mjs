import assert from "node:assert/strict";
import {
  createRappiAccountInformationGate,
  RAPPICARD_IMPORT_PROFILE,
  RAPPICUENTA_IMPORT_PROFILE,
  RappiAccountInformationConfigurationError,
} from "../dist/packages/connector-sdk/src/rappipay.js";

assert.equal(RAPPICUENTA_IMPORT_PROFILE.institutionId, "rappipay");
assert.equal(RAPPICUENTA_IMPORT_PROFILE.legalInstitution, "RappiPay Compañía de Financiamiento S.A.");
assert.equal(RAPPICUENTA_IMPORT_PROFILE.accessMode, "statement_import");
assert.equal(RAPPICUENTA_IMPORT_PROFILE.environment, "local_import");
assert.equal(RAPPICUENTA_IMPORT_PROFILE.statementFormat, "not_verified");
assert.equal(RAPPICUENTA_IMPORT_PROFILE.officialAccountInformationRoute, "not_verified");
assert.equal(RAPPICUENTA_IMPORT_PROFILE.aggregatorRoute, "not_verified");
assert.deepEqual(
  RAPPICUENTA_IMPORT_PROFILE.officialStatementDelivery,
  ["rappipay_app", "email", "official_channels"],
);
assert.equal(RAPPICUENTA_IMPORT_PROFILE.parserAvailable, false);

assert.equal(RAPPICARD_IMPORT_PROFILE.institutionId, "davivienda-rappicard");
assert.equal(RAPPICARD_IMPORT_PROFILE.legalInstitution, "Banco Davivienda S.A.");
assert.equal(RAPPICARD_IMPORT_PROFILE.accessMode, "statement_import");
assert.equal(RAPPICARD_IMPORT_PROFILE.environment, "local_import");
assert.equal(RAPPICARD_IMPORT_PROFILE.statementFormat, "not_verified");
assert.equal(RAPPICARD_IMPORT_PROFILE.officialAccountInformationRoute, "not_verified");
assert.equal(RAPPICARD_IMPORT_PROFILE.aggregatorRoute, "not_verified");
assert.deepEqual(RAPPICARD_IMPORT_PROFILE.officialStatementDelivery, ["rappi_app", "official_channels"]);
assert.equal(RAPPICARD_IMPORT_PROFILE.parserAvailable, false);

for (const product of ["rappicuenta", "rappicard"]) {
  const syntheticEndpoints = {
    accountsEndpoint: `https://sandbox.example.invalid/${product}/accounts`,
    balancesEndpoint: `https://sandbox.example.invalid/${product}/balances`,
    transactionsEndpoint: `https://sandbox.example.invalid/${product}/transactions`,
  };

  for (const [label, config] of [
    ["official route", { product, consentVerified: true, grantedCapabilities: ["accounts"], ...syntheticEndpoints }],
    ["consent", { product, officialRouteVerified: true, grantedCapabilities: ["accounts"], ...syntheticEndpoints }],
    ["capability", { product, officialRouteVerified: true, consentVerified: true, grantedCapabilities: [], ...syntheticEndpoints }],
    ["endpoint", { product, officialRouteVerified: true, consentVerified: true, grantedCapabilities: ["accounts"] }],
    ["https", {
      product,
      officialRouteVerified: true,
      consentVerified: true,
      grantedCapabilities: ["accounts"],
      accountsEndpoint: `http://sandbox.example.invalid/${product}/accounts`,
    }],
  ]) {
    assert.throws(
      () => createRappiAccountInformationGate(config),
      RappiAccountInformationConfigurationError,
      `${product} must fail closed without verified ${label}`,
    );
  }

  const gate = createRappiAccountInformationGate({
    product,
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
}

console.log("rappipay/rappicard access gates: ok");
