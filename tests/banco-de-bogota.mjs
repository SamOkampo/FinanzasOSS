import assert from "node:assert/strict";
import {
  BANCO_DE_BOGOTA_IMPORT_PROFILE,
  BancoDeBogotaAccountInformationConfigurationError,
  createBancoDeBogotaAccountInformationGate,
} from "../dist/packages/connector-sdk/src/banco-de-bogota.js";

assert.equal(BANCO_DE_BOGOTA_IMPORT_PROFILE.accessMode, "statement_import");
assert.equal(BANCO_DE_BOGOTA_IMPORT_PROFILE.officialAccountInformationRoute, "not_verified");
assert.equal(BANCO_DE_BOGOTA_IMPORT_PROFILE.aggregatorRoute, "not_verified");
assert.equal(BANCO_DE_BOGOTA_IMPORT_PROFILE.persistDocumentPassword, false);
assert.equal(BANCO_DE_BOGOTA_IMPORT_PROFILE.parserAvailable, false);
assert.deepEqual(BANCO_DE_BOGOTA_IMPORT_PROFILE.officialStatementChannels, ["banca_movil", "banca_virtual"]);

assert.throws(() => createBancoDeBogotaAccountInformationGate({}), BancoDeBogotaAccountInformationConfigurationError);
assert.throws(() => createBancoDeBogotaAccountInformationGate({ officialRouteVerified: true }), BancoDeBogotaAccountInformationConfigurationError);
assert.throws(() => createBancoDeBogotaAccountInformationGate({ officialRouteVerified: true, consentVerified: true, grantedCapabilities: [] }), BancoDeBogotaAccountInformationConfigurationError);
assert.throws(() => createBancoDeBogotaAccountInformationGate({ officialRouteVerified: true, consentVerified: true, grantedCapabilities: ["accounts"] }), BancoDeBogotaAccountInformationConfigurationError);
assert.throws(() => createBancoDeBogotaAccountInformationGate({ officialRouteVerified: true, consentVerified: true, grantedCapabilities: ["accounts"], accountsEndpoint: "http://example.invalid/accounts" }), BancoDeBogotaAccountInformationConfigurationError);

console.log("banco de bogota access boundaries: ok");
