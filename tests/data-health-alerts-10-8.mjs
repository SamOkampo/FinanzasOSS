import assert from "node:assert/strict";
import { buildDataHealthAlerts } from "../dist/packages/finance-core/src/data-health-alerts.js";

const alerts = buildDataHealthAlerts({
  connections: [
    { connectionId:"c1", status:"connected" },
    { connectionId:"c2", status:"reauth_required" },
    { connectionId:"c3", status:"degraded" },
  ],
  syncs: [
    { connectionId:"c1", status:"idle", lastSuccessAt:"2026-10-01T00:00:00Z" },
    { connectionId:"c2", status:"failed", lastAttemptAt:"2026-10-05T10:00:00Z", lastSuccessAt:"2026-10-05T08:00:00Z" },
    { connectionId:"c3", status:"partial", lastSuccessAt:"2026-10-05T11:00:00Z" },
  ],
  imports: [
    { importId:"i1", status:"complete" },
    { importId:"i2", status:"needs_review" },
    { importId:"i3", status:"failed" },
  ],
  asOf:"2026-10-05T12:00:00Z",
  staleAfterHours:48,
});

assert.equal(alerts.filter((a) => a.kind === "connection_action_required").length, 2);
assert.equal(alerts.filter((a) => a.kind === "sync_failed").length, 1);
assert.equal(alerts.filter((a) => a.kind === "sync_partial").length, 1);
assert.equal(alerts.filter((a) => a.kind === "sync_stale").length, 1);
assert.equal(alerts.filter((a) => a.kind === "import_incomplete").length, 2);
assert.ok(alerts.every((a) => a.needsReview));

const healthy = buildDataHealthAlerts({
  connections:[{ connectionId:"c1", status:"connected" }],
  syncs:[{ connectionId:"c1", status:"idle", lastSuccessAt:"2026-10-05T11:00:00Z" }],
  imports:[{ importId:"i1", status:"complete" }],
  asOf:"2026-10-05T12:00:00Z",
});
assert.equal(healthy.length, 0);

assert.throws(() => buildDataHealthAlerts({
  connections:[],
  syncs:[],
  imports:[],
  asOf:"not-a-date",
}), /asOf must be a valid date/);

console.log("Phase 10.8 data health alerts regression passed");
