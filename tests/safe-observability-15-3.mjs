import assert from "node:assert/strict";
import {
  createSafeObservabilityEvent,
  safeObservabilityPolicy,
} from "../dist/packages/security/src/index.js";

const event = createSafeObservabilityEvent({
  level: "info",
  event: "connector.sync.completed",
  tenantId: "tenant-1",
  connectionId: "conn-1",
  correlationId: "corr-1",
  status: "ok",
  durationMs: 120,
  occurredAt: "2026-10-06T03:25:00Z",
});
assert.equal(event.event, "connector.sync.completed");
assert.equal(event.durationMs, 120);

assert.throws(
  () =>
    createSafeObservabilityEvent({
      level: "error",
      event: "bad",
      occurredAt: "2026-10-06T03:25:00Z",
      token: "should-never-log",
    }),
  /Sensitive observability field rejected/,
);

assert.throws(
  () =>
    createSafeObservabilityEvent({
      level: "info",
      event: "bad",
      occurredAt: "2026-10-06T03:25:00Z",
      balance: 100,
    }),
  /Sensitive observability field rejected/,
);

assert.equal(safeObservabilityPolicy.rawProviderPayloadAllowed, false);
assert.equal(safeObservabilityPolicy.rawFinancialPayloadAllowed, false);
assert.equal(safeObservabilityPolicy.secretMaterialAllowed, false);
assert.equal(safeObservabilityPolicy.accountNumbersAllowed, false);
assert.equal(safeObservabilityPolicy.allowlistRequired, true);

console.log("Phase 15.3 safe observability regression passed");
