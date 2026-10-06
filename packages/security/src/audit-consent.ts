const AUDIT_FORBIDDEN_KEY =
  /authorization|token|secret|password|credential|cookie|seed|mnemonic|private[_-]?key|api[_-]?key/i;

export type AuditActorType = "user" | "system" | "provider";

export interface AuditEventInput {
  eventId: string;
  tenantId: string;
  actorType: AuditActorType;
  actorReference?: string;
  action: string;
  resourceType: string;
  resourceReference?: string;
  occurredAt: string;
  metadata?: Readonly<Record<string, unknown>>;
}

export interface AuditEvent {
  eventId: string;
  tenantId: string;
  actorType: AuditActorType;
  actorReference?: string;
  action: string;
  resourceType: string;
  resourceReference?: string;
  occurredAt: string;
  sequence: number;
  previousHash: string | null;
  metadataCanonical: string;
  eventHash: string;
}

function assertNonEmpty(value: string, label: string): void {
  if (!value.trim()) throw new Error(`${label} is required`);
}

function assertTimestamp(value: string, label: string): number {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) throw new Error(`${label} must be a valid date`);
  return parsed;
}

function validateAuditMetadata(value: unknown, path = "metadata"): void {
  if (value === null || value === undefined) return;
  if (["string", "boolean"].includes(typeof value)) return;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error(`${path} must contain finite numbers`);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => validateAuditMetadata(item, `${path}[${index}]`));
    return;
  }
  if (typeof value !== "object") throw new Error(`${path} contains an unsupported value`);

  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    if (AUDIT_FORBIDDEN_KEY.test(key)) {
      throw new Error(`Sensitive audit metadata key is forbidden at ${path}.${key}`);
    }
    validateAuditMetadata(nested, `${path}.${key}`);
  }
}

function canonicalize(value: unknown): string {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return `[${value.map((item) => canonicalize(item)).join(",")}]`;

  const entries = Object.entries(value as Record<string, unknown>)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, nested]) => `${JSON.stringify(key)}:${canonicalize(nested)}`);
  return `{${entries.join(",")}}`;
}

function auditHash(value: string): string {
  let hash = 0xcbf29ce484222325n;
  const prime = 0x100000001b3n;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= BigInt(value.charCodeAt(index));
    hash = BigInt.asUintN(64, hash * prime);
  }
  return hash.toString(16).padStart(16, "0");
}

function auditPayload(event: Omit<AuditEvent, "eventHash">): string {
  return [
    "audit:v1",
    event.eventId,
    event.tenantId,
    event.actorType,
    event.actorReference ?? "",
    event.action,
    event.resourceType,
    event.resourceReference ?? "",
    event.occurredAt,
    String(event.sequence),
    event.previousHash ?? "",
    event.metadataCanonical,
  ].join("|");
}

export function appendAuditEvent(
  chain: readonly AuditEvent[],
  input: AuditEventInput,
): AuditEvent {
  assertNonEmpty(input.eventId, "Audit eventId");
  assertNonEmpty(input.tenantId, "Audit tenantId");
  assertNonEmpty(input.action, "Audit action");
  assertNonEmpty(input.resourceType, "Audit resourceType");
  if (input.actorReference !== undefined) assertNonEmpty(input.actorReference, "Audit actorReference");
  if (input.resourceReference !== undefined) {
    assertNonEmpty(input.resourceReference, "Audit resourceReference");
  }
  const occurredAtMs = assertTimestamp(input.occurredAt, "Audit occurredAt");
  validateAuditMetadata(input.metadata);

  const previous = chain.at(-1);
  if (previous) {
    validateAuditChain(chain);
    if (previous.tenantId !== input.tenantId) throw new Error("Audit chain tenant cannot change");
    if (occurredAtMs < Date.parse(previous.occurredAt)) {
      throw new Error("Audit event time cannot move backwards");
    }
  }

  const base: Omit<AuditEvent, "eventHash"> = {
    eventId: input.eventId,
    tenantId: input.tenantId,
    actorType: input.actorType,
    ...(input.actorReference !== undefined ? { actorReference: input.actorReference } : {}),
    action: input.action,
    resourceType: input.resourceType,
    ...(input.resourceReference !== undefined
      ? { resourceReference: input.resourceReference }
      : {}),
    occurredAt: input.occurredAt,
    sequence: chain.length + 1,
    previousHash: previous?.eventHash ?? null,
    metadataCanonical: canonicalize(input.metadata ?? {}),
  };

  return Object.freeze({ ...base, eventHash: auditHash(auditPayload(base)) });
}

export function validateAuditChain(chain: readonly AuditEvent[]): void {
  for (let index = 0; index < chain.length; index += 1) {
    const event = chain[index];
    if (!event) throw new Error("Audit chain contains an empty event");
    if (event.sequence !== index + 1) throw new Error("Audit sequence is invalid");

    const previous = index === 0 ? undefined : chain[index - 1];
    const expectedPreviousHash = previous?.eventHash ?? null;
    if (event.previousHash !== expectedPreviousHash) throw new Error("Audit hash chain is broken");
    if (previous) {
      if (event.tenantId !== previous.tenantId) throw new Error("Audit chain tenant cannot change");
      if (Date.parse(event.occurredAt) < Date.parse(previous.occurredAt)) {
        throw new Error("Audit event time cannot move backwards");
      }
    }

    const { eventHash, ...base } = event;
    if (auditHash(auditPayload(base)) !== eventHash) throw new Error("Audit event hash mismatch");
  }
}

export type ConsentLedgerEvent = "granted" | "revoked" | "expired";

export interface ConsentGrantInput {
  consentId: string;
  tenantId: string;
  connectionId: string;
  providerId: string;
  purpose: string;
  scopeReferences: readonly string[];
  occurredAt: string;
}

export interface ConsentLedgerEntry extends ConsentGrantInput {
  sequence: number;
  event: ConsentLedgerEvent;
  reason?: string;
}

export function createConsentLedger(input: ConsentGrantInput): readonly ConsentLedgerEntry[] {
  assertNonEmpty(input.consentId, "Consent consentId");
  assertNonEmpty(input.tenantId, "Consent tenantId");
  assertNonEmpty(input.connectionId, "Consent connectionId");
  assertNonEmpty(input.providerId, "Consent providerId");
  assertNonEmpty(input.purpose, "Consent purpose");
  assertTimestamp(input.occurredAt, "Consent occurredAt");
  if (input.scopeReferences.length === 0) throw new Error("Consent requires scope references");
  if (input.scopeReferences.some((reference) => !reference.trim() || /\s/.test(reference))) {
    throw new Error("Consent scope references must be opaque non-empty references");
  }

  return Object.freeze([
    Object.freeze({
      ...input,
      scopeReferences: Object.freeze([...input.scopeReferences]),
      sequence: 1,
      event: "granted" as const,
    }),
  ]);
}

export function appendConsentTransition(
  ledger: readonly ConsentLedgerEntry[],
  input: { event: Exclude<ConsentLedgerEvent, "granted">; occurredAt: string; reason?: string },
): ConsentLedgerEntry {
  if (ledger.length === 0) throw new Error("Consent ledger must start with a grant");
  const first = ledger[0];
  const previous = ledger.at(-1);
  if (!first || !previous || first.event !== "granted") {
    throw new Error("Consent ledger must start with a grant");
  }
  if (previous.event !== "granted") {
    throw new Error("Terminal consent cannot be reactivated or transitioned again");
  }

  const occurredAtMs = assertTimestamp(input.occurredAt, "Consent transition occurredAt");
  if (occurredAtMs < Date.parse(previous.occurredAt)) {
    throw new Error("Consent transition time cannot move backwards");
  }
  if (input.reason !== undefined) assertNonEmpty(input.reason, "Consent transition reason");

  return Object.freeze({
    consentId: first.consentId,
    tenantId: first.tenantId,
    connectionId: first.connectionId,
    providerId: first.providerId,
    purpose: first.purpose,
    scopeReferences: first.scopeReferences,
    occurredAt: input.occurredAt,
    sequence: ledger.length + 1,
    event: input.event,
    ...(input.reason !== undefined ? { reason: input.reason } : {}),
  });
}

export const auditConsentPolicy = Object.freeze({
  appendOnlyRequired: true,
  tenantBound: true,
  secretMaterialAllowedInAuditMetadata: false,
  consentHistoryMayBeRewritten: false,
  terminalConsentRequiresNewIdentityForFutureGrant: true,
  productionImmutableStoreRequiredBeforeRealData: true,
});
