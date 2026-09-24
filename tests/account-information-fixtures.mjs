import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  AccountInformationGate,
  AccountInformationRevokedError,
  normalizeAccountInformationError,
} from "../dist/packages/connector-sdk/src/account-information.js";

const fixture = JSON.parse(
  await readFile(new URL("./fixtures/bancolombia-account-information.json", import.meta.url), "utf8"),
);

assert.equal(fixture.meta.synthetic, true);
assert.match(fixture.meta.notice, /No real customer/);

const gate = new AccountInformationGate(fixture.configuration);
for (const capability of fixture.configuration.grantedCapabilities) {
  assert.equal(gate.canRead(capability), true);
  assert.equal(gate.endpointFor(capability).hostname, "example.invalid");
}

gate.revokeConsent();
for (const capability of fixture.configuration.grantedCapabilities) {
  assert.equal(gate.canRead(capability), false);
  assert.throws(() => gate.endpointFor(capability), AccountInformationRevokedError);
}

for (const scenario of fixture.errors) {
  assert.deepEqual(normalizeAccountInformationError(scenario.input), scenario.expected);
}

console.log("synthetic account information fixtures passed");
