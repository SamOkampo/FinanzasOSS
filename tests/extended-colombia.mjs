import assert from "node:assert/strict";
import { EXTENDED_COLOMBIA_IMPORT_PROFILES, getExtendedColombiaImportProfile } from "../dist/packages/connector-sdk/src/extended-colombia.js";

assert.equal(EXTENDED_COLOMBIA_IMPORT_PROFILES.length, 4);
for (const profile of EXTENDED_COLOMBIA_IMPORT_PROFILES) {
  assert.equal(profile.accessMode, "statement_import");
  assert.equal(profile.environment, "local_import");
  assert.equal(profile.officialAccountInformationRoute, "not_verified");
  assert.equal(profile.aggregatorRoute, "not_verified");
  assert.equal(profile.persistDocumentPassword, false);
  assert.equal(profile.parserAvailable, false);
}
assert.equal(getExtendedColombiaImportProfile("banco-caja-social").statementAccess, "verified");
assert.equal(getExtendedColombiaImportProfile("banco-falabella-colombia").statementFormat, "pdf");
assert.equal(getExtendedColombiaImportProfile("itau-colombia").evidenceScope, "enterprise_only");
assert.equal(getExtendedColombiaImportProfile("scotiabank-colpatria").statementAccess, "not_verified");

console.log("extended colombia coverage boundaries: ok");
