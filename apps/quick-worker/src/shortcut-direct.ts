import { runCategoryAutomation } from "./category-automation.js";
import { notifyCreatedMovement } from "./push.js";
// Personal iPhone Shortcut endpoint. Deliberately disabled without explicit flags.
// Requires Cloudflare Access Service Auth at the edge AND a separate, revocable device token.
import type { QuickD1, QuickWorkerEnv, QuickWorkerContext } from "./index.js";
import { prepareQuickEntry } from "../../../packages/finance-core/src/quick-entry.js";

type StoredExpense = {
  id: string;
  amount_minor: number;
  currency: string;
  payment_method: string;
  kind: string;
  merchant: string | null;
  bank_label: string | null;
};
const TOKEN_RE = /^fosq_[0-9a-f]{64}$/;
const ID_RE = /^[A-Za-z0-9][A-Za-z0-9_-]{11,95}$/;
const METHODS = new Set(["cash", "debit_card", "credit_card", "bank_transfer", "digital_wallet", "other"]);
const BANK_METHODS = new Set(["debit_card", "credit_card", "bank_transfer"]);
const METHOD_LABELS = new Map([
  ["efectivo", "cash"], ["tarjeta debito", "debit_card"], ["tarjeta de debito", "debit_card"],
  ["tarjeta credito", "credit_card"], ["tarjeta de credito", "credit_card"],
  ["transferencia", "bank_transfer"], ["transferencia bancaria", "bank_transfer"],
  ["billetera digital", "digital_wallet"], ["otro", "other"],
]);
const NO_BANK_LABELS = new Set(["", "no aplica", "n/a", "sin banco", "efectivo"]);
const SHORTCUT_MESSAGES = {
  access_required: "El atajo necesita la autorización de Cloudflare Access.",
  shortcuts_disabled: "El registro desde Atajos está desactivado.",
  device_token_missing: "Falta el token del dispositivo en el encabezado Authorization del atajo.",
  device_token_inactive: "El token del atajo está vencido, revocado o es incorrecto.",
  invalid_body: "En Obtener contenido de URL, usa POST con cuerpo JSON y revisa sus campos.",
  invalid_amount: "Ingresa un monto positivo en pesos colombianos, por ejemplo 12000.",
  invalid_method: "Revisa el método de pago asignado en el menú del atajo.",
  invalid_category: "Revisa la categoría de ingreso asignada en el menú del atajo.",
  invalid_bank: "Revisa el banco o billetera. Para efectivo deja ese campo vacío.",
  invalid_entry_id: "Asigna el UUID generado por Atajos al campo clientEntryId.",
  invalid_concept: "Revisa el concepto del movimiento. Debe ser texto de hasta 120 caracteres.",
  wrong_endpoint: "Usa /api/quick/shortcut/income para ingresos y /api/quick/shortcut/expense para gastos.",
  invalid_request: "Revisa los campos del atajo antes de volver a enviar el movimiento.",
  internal_error: "El servidor no pudo procesar el registro. Consulta Movimientos antes de reintentar.",
} as const;
export type ShortcutErrorCode = keyof typeof SHORTCUT_MESSAGES;

export class ShortcutInputError extends Error {
  constructor(message: string, readonly status = 422, readonly code: ShortcutErrorCode = "invalid_request") {
    super(message);
  }
}

function reply(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store, private",
      "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer",
      "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
    },
  });
}
function strict(body: unknown, allowed: readonly string[]): Record<string, unknown> {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new ShortcutInputError("JSON object required", 422, "invalid_body");
  }
  const obj = body as Record<string, unknown>;
  if (Object.keys(obj).some((k) => !allowed.includes(k))) {
    throw new ShortcutInputError("Unsupported field", 422, "invalid_body");
  }
  return obj;
}
function requiredText(input: unknown, max: number, label: string, code?: ShortcutErrorCode): string {
  if (typeof input !== "string") throw new ShortcutInputError(label + " must be text", 422, code);
  const normalized = input.trim();
  if (!normalized || normalized.length > max || /[\u0000-\u001f\u007f]/.test(normalized)) {
    throw new ShortcutInputError(label + " is invalid", 422, code);
  }
  return normalized;
}
function optionalText(input: unknown, max: number, label: string, code?: ShortcutErrorCode): string | null {
  if (input === null || input === undefined || input === "") return null;
  return requiredText(input, max, label, code);
}
async function json(request: Request): Promise<unknown> {
  if (request.headers.get("Content-Type")?.split(";")[0]?.trim().toLowerCase() !== "application/json") {
    throw new ShortcutInputError("Content-Type must be application/json", 415, "invalid_body");
  }
  const len = Number(request.headers.get("Content-Length") ?? "0");
  if (!Number.isFinite(len) || len < 0 || len > 4096) throw new ShortcutInputError("Body too large", 413, "invalid_body");
  const raw = await request.text();
  if (raw.length > 4096) throw new ShortcutInputError("Body too large", 413, "invalid_body");
  try { return JSON.parse(raw); } catch { throw new ShortcutInputError("Invalid JSON", 422, "invalid_body"); }
}
function uniqueToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return "fosq_" + Array.from(bytes, (n) => n.toString(16).padStart(2, "0")).join("");
}
async function digestToken(token: string): Promise<string> {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Array.from(new Uint8Array(bytes), (n) => n.toString(16).padStart(2, "0")).join("");
}
function requiresBank(method: string): boolean { return BANK_METHODS.has(method); }

export async function enrollShortcut(db: QuickD1, owner: string, body: unknown): Promise<Response> {
  const data = strict(body, ["label", "confirmed"]);
  if (data.confirmed !== true) throw new ShortcutInputError("Enrollment confirmation required");
  const label = requiredText(data.label, 50, "Device label");
  const token = uniqueToken();
  const expiresAt = new Date(Date.now() + 90 * 86400000).toISOString();
  const id = crypto.randomUUID();
  // Rotate all previous device tokens, so forgotten tokens cannot remain active.
  await db.prepare(
    "UPDATE quick_shortcut_devices SET revoked_at=? WHERE owner_id=? AND revoked_at IS NULL RETURNING id",
  ).bind(new Date().toISOString(), owner).all();
  await db.prepare(
    "INSERT INTO quick_shortcut_devices(id,owner_id,token_hash,label,expires_at) VALUES(?,?,?,?,?) RETURNING id",
  ).bind(id, owner, await digestToken(token), label, expiresAt).first();
  return reply({ deviceId: id, token, expiresAt }, 201); // one-time display only
}
export async function shortcutStatus(db: QuickD1, owner: string): Promise<Response> {
  const result = await db.prepare(
    "SELECT id,label,expires_at FROM quick_shortcut_devices WHERE owner_id=? " +
    "AND revoked_at IS NULL ORDER BY created_at DESC LIMIT 5",
  ).bind(owner).all<{ id: string; label: string; expires_at: string }>();
  return reply({ devices: result.results });
}
export async function revokeShortcut(db: QuickD1, owner: string, body: unknown): Promise<Response> {
  const data = strict(body, ["confirmed"]);
  if (data.confirmed !== true) throw new ShortcutInputError("Revocation confirmation required");
  await db.prepare(
    "UPDATE quick_shortcut_devices SET revoked_at=? WHERE owner_id=? AND revoked_at IS NULL RETURNING id",
  ).bind(new Date().toISOString(), owner).all();
  return reply({ revoked: true });
}

function replayOrConflict(
  prior: StoredExpense,
  expected: {
    amountMinor: number; paymentMethod: string; kind: string;
    merchant: string | null; bankLabel: string | null;
  },
): Response {
  if (prior.amount_minor !== expected.amountMinor || prior.currency !== "COP" ||
    prior.payment_method !== expected.paymentMethod || prior.kind !== expected.kind ||
    prior.merchant !== expected.merchant || prior.bank_label !== expected.bankLabel) {
    return reply({ error: "Entry idempotency key reused with different data" }, 409);
  }
  return reply({ entryId: prior.id, replayed: true });
}

export async function authenticatedShortcutOwner(
  request:Request,env:QuickWorkerEnv,ctx:QuickWorkerContext,
):Promise<string> {
  // A Cloudflare Access *Service Auth* policy must validate the separate
  // CF-Access-Client-Id/Secret headers. Never configure a Bypass policy here.
  if (!env.ACCESS_AUD || ctx.access?.aud !== env.ACCESS_AUD) {
    throw new ShortcutInputError("Cloudflare Access required", 401, "access_required");
  }
  if (env.ALLOW_WRITES !== "true" || env.ALLOW_SHORTCUT_WRITES !== "true") {
    throw new ShortcutInputError("Direct shortcuts disabled", 503, "shortcuts_disabled");
  }
  const auth = request.headers.get("Authorization")?.trim() ?? "";
  const token = /^Bearer[ \t]+([^\s]+)$/i.exec(auth)?.[1] ?? "";
  if (!TOKEN_RE.test(token)) throw new ShortcutInputError("Device authorization required", 401, "device_token_missing");
  const row = await env.DB.prepare(
    "SELECT owner_id FROM quick_shortcut_devices WHERE token_hash=? AND revoked_at IS NULL " +
    "AND expires_at>? LIMIT 1",
  ).bind(await digestToken(token), new Date().toISOString()).first<{ owner_id: string }>();
  if (!row) throw new ShortcutInputError("Device authorization expired or revoked", 401, "device_token_inactive");

  return row.owner_id;
}
export async function parseShortcutJson(request: Request, flow: "income" | "expense"): Promise<unknown> {
  if (request.method !== "POST") throw new ShortcutInputError("Use POST", 405, "invalid_body");
  const payload = await json(request);
  const foreignField = flow === "income" ? "movementType" : "incomeCategory";
  if (payload && typeof payload === "object" && Object.hasOwn(payload, foreignField)) {
    throw new ShortcutInputError("Fields for the other shortcut", 422, "wrong_endpoint");
  }
  return payload;
}

export function shortcutOption(value: unknown, labels: ReadonlyMap<string, string>): unknown {
  if (typeof value !== "string") return value;
  const option = value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase().replace(/\s+/g, " ");
  return labels.get(option) ?? option;
}

export function normalizeShortcutPaymentMethod(method: unknown): unknown {
  return shortcutOption(method, METHOD_LABELS);
}

export function normalizeShortcutAmount(value: unknown): unknown {
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value !== "string") return value;
  const amount = value.trim().replace(/^(?:COP\s*\$?|\$)\s*/i, "");
  // A dot is a thousands separator only in full three-digit groups. Keep the
  // established ungrouped dot-decimal API and accept the Colombian comma.
  if (/^[1-9]\d{0,2}(?:\.\d{3})+(?:,\d{1,2})?$/.test(amount)) {
    return amount.replace(/\./g, "").replace(",", ".");
  }
  return /^\d+,\d{1,2}$/.test(amount) ? amount.replace(",", ".") : amount;
}

export function normalizeShortcutBank(value: unknown, method: unknown): unknown {
  if (typeof value !== "string") return value;
  const bank = value.trim();
  if ((method === "cash" || method === "other") && NO_BANK_LABELS.has(bank.toLowerCase())) return null;
  return bank;
}

export async function shortcutExpense(
  request: Request, env: QuickWorkerEnv, ctx: QuickWorkerContext,
): Promise<Response> {
  const owner = await authenticatedShortcutOwner(request,env,ctx);
  const data = strict(await parseShortcutJson(request, "expense"), ["clientEntryId", "amount", "concept", "paymentMethod", "bankLabel", "movementType"]);
  data.paymentMethod = normalizeShortcutPaymentMethod(data.paymentMethod);
  data.amount = normalizeShortcutAmount(data.amount);
  data.bankLabel = normalizeShortcutBank(data.bankLabel, data.paymentMethod);
  const response=await saveAccountlessExpense(env.DB,owner,data);
  if(data.movementType!=="debt_repayment")await notifyCreatedMovement(response,env,ctx,owner,"expense");
  if(response.status===201){
    try{
      const created=await response.clone().json() as {entryId?:string};
      if(created.entryId)await runCategoryAutomation(env.DB,owner,env,{source:"accountless",id:created.entryId});
    }catch{ /* Never convert successful iPhone Shortcut expense into a retry. */ }
  }
  return response;
}

// The browser flow reuses the SAME append-only write routine as iOS Atajos.
// Human Access authentication, feature flag and same-origin CSRF gate live in index.ts.
export async function browserExpense(db: QuickD1, owner: string, body: unknown): Promise<Response> {
  const data = strict(body, ["clientEntryId", "amount", "concept", "paymentMethod", "bankLabel", "movementType", "confirmed"]);
  if (data.confirmed !== true) throw new ShortcutInputError("Expense confirmation required");
  return saveAccountlessExpense(db, owner, data);
}

async function saveAccountlessExpense(
  db: QuickD1, owner: string, data: Record<string, unknown>,
): Promise<Response> {
  const key = requiredText(data.clientEntryId, 96, "clientEntryId", "invalid_entry_id");
  if (!ID_RE.test(key)) throw new ShortcutInputError("Invalid clientEntryId", 422, "invalid_entry_id");
  // Old iPhone shortcuts remain valid. A new explicit choice lets the user
  // distinguish repayment of borrowed money from consumption without changing
  // the append-only SQLite table or inventing a lender.
  const movementType = data.movementType === undefined ? "auto" : data.movementType;
  if (movementType !== "expense" && movementType !== "auto" && movementType !== "debt_repayment") {
    throw new ShortcutInputError("Unsupported movementType");
  }
  const rawConcept = requiredText(data.concept, 120, "Concept", "invalid_concept");
  const concept = movementType === "debt_repayment" &&
    !/^pago de pr[eé]stamo(?:[ :]|$)/i.test(rawConcept)
    ? "Pago de préstamo: " + rawConcept : rawConcept;
  if (concept.length > 120) throw new ShortcutInputError("Concept is too long", 422, "invalid_concept");
  if (typeof data.amount !== "string") throw new ShortcutInputError("Amount must be text", 422, "invalid_amount");
  const method = data.paymentMethod;
  if (typeof method !== "string" || !METHODS.has(method)) throw new ShortcutInputError("Invalid payment method", 422, "invalid_method");
  const bankLabel = optionalText(data.bankLabel, 80, "Bank", "invalid_bank");
  if (requiresBank(method) && !bankLabel)
    throw new ShortcutInputError("Bank is required for cards and transfers", 422, "invalid_bank");
  if ((method === "cash" || method === "other") && bankLabel !== null)
    throw new ShortcutInputError("Cash and other payments do not have a bank", 422, "invalid_bank");


  // Do not require, infer or secretly create an account: the user explicitly
  // wants account-free expense capture. Keep the method and optional bank.
  const draft = prepareQuickEntry({
    tenantId: owner, actorId: owner,
    clientEntryId: key, amount: data.amount,
    currency: "COP", paymentMethod: method as "cash" | "debit_card" | "credit_card" | "bank_transfer" | "digital_wallet" | "other",
    classification: "expense", occurredAt: new Date().toISOString(), merchant: concept,
    ...(bankLabel === null ? {} : { bankLabel }),
  });
  const minor = Number(draft.money.amountMinor);
  if (!Number.isSafeInteger(minor)) throw new ShortcutInputError("Invalid amount");
  const fields = {
    ownerId: owner, clientEntryId: key,
    amountMinor: minor, paymentMethod: draft.paymentMethod,
    kind: draft.kind, merchant: draft.merchant, bankLabel: draft.bankLabel,
  };
  // Compatibility for retrying an expense sent before the account-free
  // migration: return the existing entry rather than creating a duplicate.
  const legacy = await db.prepare(
    "SELECT id,amount_minor,currency,payment_method,kind,merchant,bank_label " +
    "FROM quick_manual_entries WHERE owner_id=? AND client_entry_id=? LIMIT 1",
  ).bind(fields.ownerId, key).first<StoredExpense>();
  if (legacy) return replayOrConflict(legacy, fields);

  // Append-only, account-free table; owner-scoped idempotency is enforced in
  // SQLite atomically, not with a preflight race-prone SELECT.
  const inserted = await db.prepare(
    "INSERT INTO quick_shortcut_expenses(" +
    "id,owner_id,client_entry_id,amount_minor,currency,payment_method,kind,occurred_at,merchant,bank_label) " +
    "VALUES(?,?,?,?,?,?,?,?,?,?) " +
    "ON CONFLICT(owner_id,client_entry_id) DO NOTHING RETURNING id",
  ).bind(
    crypto.randomUUID(), fields.ownerId, key, minor, "COP", draft.paymentMethod,
    draft.kind, draft.occurredAt, draft.merchant, draft.bankLabel,
  ).first<{ id: string }>();
  if (inserted) return reply({ entryId: inserted.id, replayed: false }, 201);
  const prior = await db.prepare(
    "SELECT id,amount_minor,currency,payment_method,kind,merchant,bank_label " +
    "FROM quick_shortcut_expenses WHERE owner_id=? AND client_entry_id=? LIMIT 1",
  ).bind(fields.ownerId, key).first<StoredExpense>();
  if (!prior) return reply({ error: "Unable to verify write" }, 503);
  return replayOrConflict(prior, fields);
}


export function shortcutFailure(error: unknown, flow: "income" | "expense"): Response {
  const invalid = error instanceof ShortcutInputError ? error : undefined;
  const invalidAmount = error instanceof Error && error.message.startsWith("Amount ");
  const code = invalid?.code ?? (invalidAmount ? "invalid_amount" : "internal_error");
  const status = invalid?.status ?? (invalidAmount ? 422 : 500);
  const reference = crypto.randomUUID();
  // Only fixed codes and a generated reference. Never log headers, amounts, or input text.
  console.warn({ event: "finanzasoss_shortcut_rejected", flow, code, status, reference });
  const response = reply({ error: invalid?.message ?? (invalidAmount ? "Invalid financial entry" : "Unable to process request"), code, message: SHORTCUT_MESSAGES[code], reference }, status);
  if (status === 405) response.headers.set("Allow", "POST");
  return response;
}
