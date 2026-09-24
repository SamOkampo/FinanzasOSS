import assert from "node:assert/strict";
import {
  assertDaviviendaConsentReady,
  DaviviendaConsentConfigurationError,
} from "../dist/packages/connector-sdk/src/davivienda-consent.js";

const blocked = [
  {},
  { consentEndpoint: "https://sandbox.example.invalid/consent" },
  { consentEndpoint: "https://sandbox.example.invalid/consent", clientId: "synthetic-client" },
  { clientId: "synthetic-client", scopes: ["synthetic.read"] },
  { consentEndpoint: "http://sandbox.example.invalid/consent", clientId: "synthetic-client", scopes: ["synthetic.read"] },
];

for (const config of blocked) {
  assert.throws(() => assertDaviviendaConsentReady(config), DaviviendaConsentConfigurationError);
}

assert.doesNotThrow(() =>
  assertDaviviendaConsentReady({
    consentEndpoint: "https://sandbox.example.invalid/consent",
    clientId: "synthetic-client",
    scopes: ["synthetic.read"],
  }),
);

console.log("davivienda consent gate ok");
