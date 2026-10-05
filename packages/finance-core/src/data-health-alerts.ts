export type ConnectionHealthStatus =
  | "pending"
  | "connected"
  | "degraded"
  | "reauth_required"
  | "consent_expired"
  | "revoked"
  | "disconnected";

export interface ConnectionHealthInput {
  connectionId: string;
  status: ConnectionHealthStatus;
}

export interface SyncHealthInput {
  connectionId: string;
  status: "idle" | "running" | "failed" | "partial";
  lastAttemptAt?: string | null;
  lastSuccessAt?: string | null;
}

export interface ImportHealthInput {
  importId: string;
  status: "complete" | "partial" | "failed" | "needs_review";
}

export type DataHealthAlertKind =
  | "connection_action_required"
  | "sync_failed"
  | "sync_partial"
  | "sync_stale"
  | "import_incomplete";

export interface DataHealthAlert {
  kind: DataHealthAlertKind;
  severity: "info" | "warning";
  entityId: string;
  message: string;
  needsReview: boolean;
}

function parseTime(value: string, label: string): number {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) throw new Error(`${label} must be a valid date`);
  return parsed;
}

export function buildDataHealthAlerts(input: {
  connections: readonly ConnectionHealthInput[];
  syncs: readonly SyncHealthInput[];
  imports: readonly ImportHealthInput[];
  asOf: string;
  staleAfterHours?: number;
}): readonly DataHealthAlert[] {
  const asOfMs = parseTime(input.asOf, "asOf");
  const staleAfterHours = input.staleAfterHours ?? 48;
  if (!Number.isFinite(staleAfterHours) || staleAfterHours <= 0) {
    throw new Error("staleAfterHours must be positive");
  }
  const staleThresholdMs = staleAfterHours * 60 * 60 * 1000;
  const alerts: DataHealthAlert[] = [];

  for (const connection of input.connections) {
    if (connection.status === "connected" || connection.status === "pending") continue;
    alerts.push({
      kind: "connection_action_required",
      severity:
        connection.status === "degraded" || connection.status === "disconnected"
          ? "info"
          : "warning",
      entityId: connection.connectionId,
      message: `Connection state requires attention: ${connection.status}`,
      needsReview: true,
    });
  }

  for (const sync of input.syncs) {
    if (sync.lastAttemptAt) parseTime(sync.lastAttemptAt, "lastAttemptAt");
    if (sync.lastSuccessAt) parseTime(sync.lastSuccessAt, "lastSuccessAt");

    if (sync.status === "failed") {
      alerts.push({
        kind: "sync_failed",
        severity: "warning",
        entityId: sync.connectionId,
        message: "Latest sync failed and requires review",
        needsReview: true,
      });
      continue;
    }
    if (sync.status === "partial") {
      alerts.push({
        kind: "sync_partial",
        severity: "warning",
        entityId: sync.connectionId,
        message: "Latest sync completed only partially",
        needsReview: true,
      });
    }

    if (sync.lastSuccessAt) {
      const lastSuccessMs = parseTime(sync.lastSuccessAt, "lastSuccessAt");
      if (asOfMs - lastSuccessMs > staleThresholdMs) {
        alerts.push({
          kind: "sync_stale",
          severity: "info",
          entityId: sync.connectionId,
          message: "Last successful sync is older than the configured freshness threshold",
          needsReview: true,
        });
      }
    }
  }

  for (const item of input.imports) {
    if (item.status === "complete") continue;
    alerts.push({
      kind: "import_incomplete",
      severity: item.status === "failed" ? "warning" : "info",
      entityId: item.importId,
      message: `Import is not complete: ${item.status}`,
      needsReview: true,
    });
  }

  return alerts;
}
