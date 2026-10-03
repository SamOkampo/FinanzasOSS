import assert from "node:assert/strict";
import {
  BBVA_COLOMBIA_CONSUMER_IMPORT_PROFILE,
  BBVA_COLOMBIA_ENTERPRISE_API_PROFILE,
  BbvaColombiaAccountInformationConfigurationError,
  createBbvaColombiaConsumerAccountInformationGate,
} from "../dist/packages/connector-sdk/src/bbva-colombia.js";

assert.equal(BBVA_COLOMBIA_CONSUMER_IMPORT_PROFILE.accessMode, "statement_import");
assert.equal(BBVA_COLOMBIA_CONSUMER_IMPORT_PROFILE.statementFormat, "pdf");
assert.equal(BBVA_COLOMBIA_CONSUMER_IMPORT_PROFILE.officialAccountInformationRoute, "not_verified");
assert.equal(BBVA_COLOMBIA_CONSUMER_IMPORT_PROFILE.aggregatorRoute, "not_verified");
assert.equal(BBVA_COLOMBIA_CONSUMER_IMPORT_PROFILE.persistDocumentPassword, false);
assert.equal(BBVA_COLOMBIA_CONSUMER_IMPORT_PROFILE.parserAvailable, false);
assert.equal(BBVA_COLOMBIA_ENTERPRISE_API_PROFILE.eligibility, "enterprise_only");
assert.equal(BBVA_COLOMBIA_ENTERPRISE_API_PROFILE.apiVisibility, "private");
assert.equal(BBVA_COLOMBIA_ENTERPRISE_API_PROFILE.consumerEligible, false);

assert.throws(
  () => createBbvaColombiaConsumerAccountInformationGate({}),
  BbvaColombiaAccountInformationConfigurationError,
);
assert.throws(
  () => createBbvaColombiaConsumerAccountInformationGate({ consumerRouteVerified: true }),
  BbvaColombiaAccountInformationConfigurationError,
);
assert.throws(
  () => createBbvaColombiaConsumerAccountInformationGate({
    consumerRouteVerified: true,
    consentVerified: true,
    grantedCapabilities: [],
  }),
  BbvaColombiaAccountInformationConfigurationError,
);

console.log("bbva colombia access boundaries: ok");
