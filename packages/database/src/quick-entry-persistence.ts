import {
  prepareQuickEntry,
  type QuickEntryInput,
  type QuickEntryReview,
} from "../../finance-core/src/quick-entry.js";

/**
 * These values MUST be provided by a verified backend/session adapter.
 * Never construct them from a JSON body, query string, client-supplied JWT
 * claims, account label, or a browser-provided tenant/actor ID.
 */
export interface VerifiedQuickPrincipal {
  readonly userId: string;
  readonly tenantId: string;
}

export interface ConfirmQuickClientInput
  extends Omit<QuickEntryInput, "tenantId" | "actorId"> {
  readonly accountId: string;
  readonly confirmed: boolean;
}

export interface QuickConfirmRpcParameters {
  readonly p_tenant_id: string;
  readonly p_account_id: string;
  readonly p_client_entry_id: string;
  readonly p_amount_minor: string;
  readonly p_currency: string;
  readonly p_payment_method: string;
  readonly p_kind: string;
  readonly p_occurred_at: string;
  readonly p_merchant: string | null;
  readonly p_bank_label: string | null;
  readonly p_confirmed: true;
}

export interface QuickConfirmResult {
  readonly entryId: string;
  readonly replayed: boolean;
}

export interface QuickConfirmPort {
  /**
   * Implement with authenticated Supabase/Postgres RPC
   * public.quick_confirm_manual_entry. The database derives auth.uid()
   * from a verified access token and checks manual-account ownership.
   */
  confirm(parameters: QuickConfirmRpcParameters): Promise<QuickConfirmResult>;
}

function verifiedId(value: unknown, label: string): string {
  if (typeof value !== "string" ||
      value.length > 128 ||
      !/^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(value)) {
    throw new Error(label + " is invalid");
  }
  return value;
}

function uuid(value: unknown): string {
  if (typeof value !== "string" ||
      !/^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$/.test(value)) {
    throw new Error("A selected manual account UUID is required");
  }
  return value.toLowerCase();
}

/**
 * Converts a reviewed draft to immutable RPC arguments, but does NOT
 * authenticate users, create accounts, read bank data or write by itself.
 */
export function prepareConfirmedQuickRpc(
  principal: VerifiedQuickPrincipal,
  input: ConfirmQuickClientInput,
): { readonly draft: QuickEntryReview; readonly params: QuickConfirmRpcParameters } {
  if (!principal || typeof principal !== "object") throw new Error("Verified principal is required");
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("Confirmation input must be an object");
  }
  if (input.confirmed !== true) throw new Error("Explicit confirmation is required");

  const userId = verifiedId(principal.userId, "Verified userId");
  const tenantId = verifiedId(principal.tenantId, "Verified tenantId");
  const accountId = uuid(input.accountId);

  // Any spoofed input.tenantId or input.actorId is ignored. Only the verified
  // session values can supply tenant + actor to the domain preparer.
  const draft = prepareQuickEntry({
    ...input,
    tenantId,
    actorId: userId,
  });
  const params = Object.freeze({
    p_tenant_id: draft.tenantId,
    p_account_id: accountId,
    p_client_entry_id: draft.clientEntryId,
    p_amount_minor: draft.money.amountMinor.toString(),
    p_currency: draft.money.currency,
    p_payment_method: draft.paymentMethod,
    p_kind: draft.kind,
    p_occurred_at: draft.occurredAt,
    p_merchant: draft.merchant,
    p_bank_label: draft.bankLabel,
    p_confirmed: true as const,
  });
  return Object.freeze({ draft, params });
}

/**
 * Server-side orchestration only. The SQL routine implements the atomic
 * idempotency key, cross-user isolation, account/currency foreign key and
 * append-only ledger. Do not expose this port with privileged credentials.
 */
export async function confirmQuickEntry(
  principal: VerifiedQuickPrincipal,
  input: ConfirmQuickClientInput,
  port: QuickConfirmPort,
): Promise<QuickConfirmResult> {
  if (!port || typeof port.confirm !== "function") throw new Error("Quick storage port is required");
  const { params } = prepareConfirmedQuickRpc(principal, input);
  const result = await port.confirm(params);
  if (!result || typeof result.entryId !== "string" ||
      !/^[a-fA-F0-9]{8}-(?:[a-fA-F0-9]{4}-){3}[a-fA-F0-9]{12}$/.test(result.entryId) ||
      typeof result.replayed !== "boolean") {
    throw new Error("Quick storage returned an invalid confirmation result");
  }
  return Object.freeze({
    entryId: result.entryId.toLowerCase(),
    replayed: result.replayed,
  });
}
