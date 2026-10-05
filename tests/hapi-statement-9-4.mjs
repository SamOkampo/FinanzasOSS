import assert from "node:assert/strict";
import { normalizeHapiStatementRecord } from "../dist/packages/connector-sdk/src/hapi-statement.js";

const fixture = {
  documentKind: "statement",
  accountReference: "SYNTHETIC-ACCOUNT",
  occurredAt: "2026-01-15T12:00:00Z",
  currency: "USD",
  amount: 125.5,
  description: "Synthetic investment activity",
  source: "official_statement",
};
const normalized = normalizeHapiStatementRecord(fixture);
assert.equal(normalized.provider, "hapi");
assert.equal(normalized.readOnly, true);
assert.equal(normalized.amount, 125.5);
assert.throws(() => normalizeHapiStatementRecord({ ...fixture, source: "screen_scrape" }));
assert.throws(() => normalizeHapiStatementRecord({ ...fixture, amount: Number.NaN }));
assert.throws(() => normalizeHapiStatementRecord({ ...fixture, currency: "usd" }));
assert.throws(() => normalizeHapiStatementRecord({ ...fixture, occurredAt: "not-a-date" }));
console.log("Phase 9.4 Hapi statement regression passed");
