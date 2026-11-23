// Genuine money received (income), never a negative expense or internal transfer.
// Owner identity is supplied by Cloudflare Access (browser) or existing device token (Shortcut).
import type { QuickD1 } from "./index.js";
import { amountToMinorUnits } from "../../../packages/finance-core/src/quick-entry.js";
import { normalizeShortcutAmount, normalizeShortcutBank, normalizeShortcutPaymentMethod, shortcutOption,
  ShortcutInputError, type ShortcutErrorCode } from "./shortcut-direct.js";

const KEY_RE = /^[A-Za-z0-9][A-Za-z0-9_-]{11,95}$/;
const METHODS = new Set(["cash","bank_transfer","digital_wallet","other"]);
const CATEGORIES = new Set(["payment","salary","sales","commission","interest","refund","other"]);
const CATEGORY_LABELS = new Map([
  ["pago recibido", "payment"], ["salario", "salary"], ["venta", "sales"], ["ventas", "sales"],
  ["comision", "commission"], ["comisiones", "commission"], ["intereses ganados", "interest"],
  ["intereses", "interest"], ["devolucion", "refund"], ["devoluciones", "refund"],
  ["otros ingresos", "other"], ["otro", "other"],
]);
type StoredIncome = {
  id:string; amount_minor:number; currency:string; concept:string;
  bank_label:string|null; payment_method:string; income_category:string;
};
function reply(body:unknown,status=200):Response {
  return new Response(JSON.stringify(body),{status,headers:{
    "Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store, private",
    "Referrer-Policy":"no-referrer","X-Content-Type-Options":"nosniff",
    "Content-Security-Policy":"default-src 'none'; frame-ancestors 'none'"
  }});
}
function object(body:unknown,allowed:string[]):Record<string,unknown> {
  if(!body || typeof body!=="object" || Array.isArray(body))throw new ShortcutInputError("Expected JSON object",422,"invalid_body");
  const o=body as Record<string,unknown>;
  if(Object.keys(o).some(x=>!allowed.includes(x)))throw new ShortcutInputError("Unsupported income field",422,"invalid_body");
  return o;
}
function text(value:unknown,max:number,name:string,code:ShortcutErrorCode):string {
  if(typeof value!=="string")throw new ShortcutInputError(name+" must be text",422,code);
  const clean=value.trim();
  if(clean.length<1||clean.length>max||/[\u0000-\u001f\u007f]/.test(clean))
    throw new ShortcutInputError(name+" is invalid",422,code);
  return clean;
}
function fields(body:unknown,requiresConfirmation:boolean) {
  const d=object(body,["clientEntryId","amount","concept","paymentMethod","bankLabel","incomeCategory",...(requiresConfirmation?["confirmed"]:[])]);
  if(requiresConfirmation && d.confirmed!==true)throw new ShortcutInputError("Confirm income before saving");
  const key=text(d.clientEntryId,96,"clientEntryId","invalid_entry_id");
  if(!KEY_RE.test(key))throw new ShortcutInputError("Invalid clientEntryId",422,"invalid_entry_id");
  const amount=requiresConfirmation?text(d.amount,10,"Amount","invalid_amount"):normalizeShortcutAmount(d.amount);
  if(requiresConfirmation && !/^[1-9][0-9]{0,9}$/.test(amount as string))
    throw new ShortcutInputError("Amount must be a positive integer in COP",422,"invalid_amount");
  const minor=Number(amountToMinorUnits(amount));
  const concept=text(d.concept,120,"Concept","invalid_concept");
  const method=requiresConfirmation?d.paymentMethod:normalizeShortcutPaymentMethod(d.paymentMethod);
  if(typeof method!=="string"||!METHODS.has(method))throw new ShortcutInputError("Unsupported receiving method",422,"invalid_method");
  const categoryOption=requiresConfirmation?d.incomeCategory:shortcutOption(d.incomeCategory,CATEGORY_LABELS);
  const category=categoryOption===undefined||(!requiresConfirmation&&(categoryOption===null||categoryOption===""))?"payment":categoryOption;
  if(typeof category!=="string"||!CATEGORIES.has(category))throw new ShortcutInputError("Unsupported income category",422,"invalid_category");
  const bank=requiresConfirmation?d.bankLabel:normalizeShortcutBank(d.bankLabel,method);
  const bankLabel=bank==null||bank===""?null:text(bank,80,"Bank","invalid_bank");
  if((method==="bank_transfer"||method==="digital_wallet")&&!bankLabel)
    throw new ShortcutInputError("Choose the receiving bank or wallet",422,"invalid_bank");
  if((method==="cash"||method==="other")&&bankLabel)
    throw new ShortcutInputError("Cash and other receipts do not have a bank",422,"invalid_bank");
  return {key,minor,concept,method,category,bankLabel};
}
export async function saveIncome(db:QuickD1,owner:string,body:unknown,confirmed:boolean):Promise<Response> {
  const d=fields(body,confirmed);
  const inserted=await db.prepare(
    "INSERT INTO quick_income_entries(id,owner_id,client_entry_id,amount_minor,currency,occurred_at,"+
    "concept,income_category,payment_method,bank_label) VALUES(?,?,?,?,'COP',?,?,?,?,?) "+
    "ON CONFLICT(owner_id,client_entry_id) DO NOTHING RETURNING id"
  ).bind(crypto.randomUUID(),owner,d.key,d.minor,new Date().toISOString(),
    d.concept,d.category,d.method,d.bankLabel).first<{id:string}>();
  if(inserted)return reply({entryId:inserted.id,replayed:false,direction:"credit",kind:"income"},201);
  const existing=await db.prepare(
    "SELECT id,amount_minor,currency,concept,bank_label,payment_method,income_category "+
    "FROM quick_income_entries WHERE owner_id=? AND client_entry_id=? LIMIT 1"
  ).bind(owner,d.key).first<StoredIncome>();
  if(!existing)return reply({error:"Unable to verify income save"},503);
  if(existing.amount_minor!==d.minor||existing.currency!=="COP"||
     existing.concept!==d.concept||existing.bank_label!==d.bankLabel||
     existing.payment_method!==d.method||existing.income_category!==d.category)
    return reply({error:"Entry key reused with different income details"},409);
  return reply({entryId:existing.id,replayed:true,direction:"credit",kind:"income"});
}
