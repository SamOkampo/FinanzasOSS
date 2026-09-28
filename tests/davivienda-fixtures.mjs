import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createDaviviendaAccountInformationGate } from "../dist/packages/connector-sdk/src/davivienda-account-information.js";
import { daviviendaRecoveryDecision } from "../dist/packages/connector-sdk/src/davivienda-recovery.js";

const fixture = JSON.parse(
  await readFile(new URL("./fixtures/davivienda-account-information.json", import.meta.url), "utf8"),
);

assert.equal(fixture.meta.synthetic, true);
assert.match(fixture.meta.notice, /No real customer/);

const gate = createDaviviendaAccountInformationGate(fixture.configuration);
for (const capability of fixture.configuration.grantedCapabilities) {
  assert.equal(gate.canRead(capability), true);
  assert.equal(gate.endpointFor(capability).hostname, "sandbox.example.invalid");
}

gate.revokeConsent();
for (const capability of fixture.configuration.grantedCapabilities) {
  assert.equal(gate.canRead(capability), false);
}

const checkedAt = "2026-09-24T12:00:00Z";
for (const scenario of fixture.recovery) {
  const decision = daviviendaRecoveryDecision(scenario.input, checkedAt);
  assert.equal(decision.normalized.failure, scenario.failure);
  if (scenario.health) assert.equal(decision.health.state, scenario.health);
  if (scenario.action) assert.equal(decision.recovery.action, scenario.action);
  assert.equal(decision.recovery.automatic, scenario.automatic);
  if (scenario.retryAfterMs) assert.equal(decision.recovery.retryAfterMs, scenario.retryAfterMs);
}

console.log("synthetic Davivienda fixtures passed");
