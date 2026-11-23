// Verified snapshots and arithmetic reconciliation against labeled, already recorded bank movements.
// This is NOT a bank connection or a live balance. Never alter ledger records.
import type { QuickD1 } from "./index.js";

export class BalanceInputError extends Error {
  constructor(message:string,readonly status=422){super(message);}
}
type SqlAccount={id:string;owner_id:string;bank_label:string;account_type:string;currency:string};
type SqlSnapshot={id:string;account_id:string;request_key:string;amount_minor:number;as_of:string;created_at:string};
type Window={id:string;label:string;after:string;until:string;estimated:boolean};
type Flow={id:string;in_minor:string;out_minor:string;in_count:number;out_count:number;uncertain_count:number};
const KEY=/^[A-Za-z0-9][A-Za-z0-9_-]{11,95}$/;
const TYPES=new Set(["deposit","cash","credit"]);
function response(data:unknown,status=200):Response{
 return new Response(JSON.stringify(data),{status,headers:{
  "Content-Type":"application/json; charset=utf-8","Cache-Control":"private, no-store",
  "X-Content-Type-Options":"nosniff","Referrer-Policy":"no-referrer",
  "Content-Security-Policy":"default-src 'none'; frame-ancestors 'none'"
 }});
}
function payload(body:unknown):{bankLabel:string;accountType:string;requestKey:string;amountMinor:number;asOf:string}{
 if(!body||typeof body!=="object"||Array.isArray(body))throw new BalanceInputError("Se requiere un objeto JSON.");
 const o=body as Record<string,unknown>;
 const allowed=new Set(["bankLabel","accountType","requestKey","amount","asOf","confirmed"]);
 if(Object.keys(o).some(k=>!allowed.has(k)))throw new BalanceInputError("Campo no admitido.");
 if(o.confirmed!==true)throw new BalanceInputError("Confirma el saldo leído en tu banco.");
 if(typeof o.bankLabel!=="string"||o.bankLabel.trim().length<1||o.bankLabel.trim().length>80||
   /[\u0000-\u001f\u007f]/.test(o.bankLabel))throw new BalanceInputError("Especifica el banco o billetera.");
 if(typeof o.accountType!=="string"||!TYPES.has(o.accountType))throw new BalanceInputError("Tipo de cuenta inválido.");
 if(typeof o.requestKey!=="string"||!KEY.test(o.requestKey))throw new BalanceInputError("Identificador inválido.");
 if(typeof o.amount!=="string"||!/^(?:0|[1-9][0-9]{0,9})$/.test(o.amount))throw new BalanceInputError("Saldo COP entero inválido.");
 const amountMinor=Number(o.amount)*100;
 if(!Number.isSafeInteger(amountMinor)||amountMinor>1000000000000)throw new BalanceInputError("Saldo fuera del límite permitido.");
 if(typeof o.asOf!=="string"||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(o.asOf)||
   !Number.isFinite(Date.parse(o.asOf))||new Date(o.asOf).toISOString()!==o.asOf||
   Date.parse(o.asOf)>Date.now()+5*60000)throw new BalanceInputError("Fecha de saldo inválida o futura.");
 return {bankLabel:o.bankLabel.trim(),accountType:o.accountType,requestKey:o.requestKey,
   amountMinor,asOf:o.asOf};
}
export async function saveVerifiedBalance(db:QuickD1,owner:string,body:unknown):Promise<Response>{
 const d=payload(body);
 // A replay or conflicting request key must be resolved BEFORE inserting an
 // account. Otherwise an invalid replay with a different bank creates a
 // phantom balance account even though the request returns HTTP 409.
 const prior=await db.prepare("SELECT id,account_id,request_key,amount_minor,as_of,created_at "+
  "FROM quick_balance_snapshots WHERE owner_id=? AND request_key=? LIMIT 1")
  .bind(owner,d.requestKey).first<SqlSnapshot>();
 if(prior){
  const originalAccount=await db.prepare("SELECT id,owner_id,bank_label,account_type,currency "+
   "FROM quick_balance_accounts WHERE owner_id=? AND bank_label=? COLLATE NOCASE LIMIT 1")
   .bind(owner,d.bankLabel).first<SqlAccount>();
  if(!originalAccount||originalAccount.account_type!==d.accountType||
     prior.account_id!==originalAccount.id||prior.amount_minor!==d.amountMinor||prior.as_of!==d.asOf)
    return response({error:"El identificador ya corresponde a otro saldo."},409);
  return response({snapshotId:prior.id,replayed:true,source:"user_verified"});
 }
 await db.prepare("INSERT INTO quick_balance_accounts(id,owner_id,bank_label,account_type) VALUES(?,?,?,?) "+
  "ON CONFLICT(owner_id,bank_label) DO NOTHING RETURNING id")
  .bind(crypto.randomUUID(),owner,d.bankLabel,d.accountType).first();
 const account=await db.prepare("SELECT id,owner_id,bank_label,account_type,currency FROM quick_balance_accounts "+
   "WHERE owner_id=? AND bank_label=? COLLATE NOCASE LIMIT 1")
   .bind(owner,d.bankLabel).first<SqlAccount>();
 if(!account)throw new BalanceInputError("No se pudo verificar la cuenta.",503);
 if(account.account_type!==d.accountType)throw new BalanceInputError(
  "Esta entidad ya está registrada con otro tipo de cuenta; no se combinan saldos y deudas.",409);
 const row=await db.prepare("INSERT INTO quick_balance_snapshots("+
  "id,owner_id,account_id,request_key,amount_minor,as_of) VALUES(?,?,?,?,?,?) "+
  "ON CONFLICT DO NOTHING RETURNING id")
  .bind(crypto.randomUUID(),owner,account.id,d.requestKey,d.amountMinor,d.asOf).first<{id:string}>();
 if(!row){
  // Another concurrent request may have won after the initial replay check.
  // Confirm that the winning snapshot has the same details before replaying.
  const winner=await db.prepare("SELECT id,account_id,request_key,amount_minor,as_of,created_at "+
    "FROM quick_balance_snapshots WHERE owner_id=? AND request_key=? LIMIT 1")
    .bind(owner,d.requestKey).first<SqlSnapshot>();
  if(winner&&winner.account_id===account.id&&winner.amount_minor===d.amountMinor&&winner.as_of===d.asOf)
   return response({snapshotId:winner.id,replayed:true,source:"user_verified"});
  return response({error:"Ya existe otro saldo con esa hora, o el envío se duplicó. Revisa antes de reintentar."},409);
 }
 return response({snapshotId:row.id,replayed:false,source:"user_verified"},201);
}
async function bankFlows(db:QuickD1,owner:string,windows:Window[]):Promise<Map<string,Flow>>{
 if(!windows.length)return new Map();
 const from=windows.map(w=>w.after).sort()[0]!;
 const through=windows.map(w=>w.until).sort().at(-1)!;
 // Imported statements store a synthetic midday timestamp. Keep the whole
 // cutoff day in range so the projection can identify these ambiguous rows.
 const rangeStart=new Date(Date.parse(from)-86400000).toISOString();
 const rangeEnd=new Date(Date.parse(through)+86400000).toISOString();
 const query=`
  WITH periods AS (
    SELECT json_extract(value,'$.id') id, lower(trim(json_extract(value,'$.label'))) label,
      json_extract(value,'$.after') start_at, json_extract(value,'$.until') end_at,
      date(json_extract(value,'$.after'),'-5 hours') start_day,
      date(json_extract(value,'$.until'),'-5 hours') end_day,
      json_extract(value,'$.estimated') estimated
    FROM json_each(?)
  ), movements AS (
    SELECT bank_label,occurred_at,amount_minor,'debit' direction,
      (client_entry_id GLOB 'import_*' OR client_entry_id GLOB 'v41_*') date_only, 0 estimate_only
    FROM quick_shortcut_expenses
    WHERE owner_id=? AND occurred_at BETWEEN ? AND ? AND currency='COP' AND kind='purchase' AND deleted_at IS NULL
      AND payment_method IN ('debit_card','bank_transfer','digital_wallet')
    UNION ALL
    SELECT bank_label,occurred_at,amount_minor,'debit',0,(kind<>'purchase')
    FROM quick_manual_entries
    WHERE owner_id=? AND occurred_at BETWEEN ? AND ? AND currency='COP' AND deleted_at IS NULL
      AND payment_method IN ('debit_card','bank_transfer','digital_wallet')
    UNION ALL
    SELECT bank_label,occurred_at,amount_minor,'credit',0,0
    FROM quick_income_entries
    WHERE owner_id=? AND occurred_at BETWEEN ? AND ? AND currency='COP'
      AND payment_method IN ('bank_transfer','digital_wallet')
    UNION ALL
    SELECT bank_label,occurred_at,amount_minor,'credit',1,0
    FROM quick_statement_credits
    WHERE owner_id=? AND occurred_at BETWEEN ? AND ? AND currency='COP'
  ), candidates AS (
    SELECT p.id,m.amount_minor,m.direction,
      CASE WHEN p.estimated AND m.date_only THEN
        date(m.occurred_at,'-5 hours') > p.start_day AND date(m.occurred_at,'-5 hours') <= p.end_day
      ELSE m.occurred_at > p.start_at AND m.occurred_at <= p.end_at END included,
      (p.estimated AND m.date_only AND date(m.occurred_at,'-5 hours')=p.start_day) uncertain
    FROM periods p JOIN movements m ON p.label=lower(trim(m.bank_label))
    WHERE p.estimated OR NOT m.estimate_only
  )
  SELECT id,
    CAST(SUM(CASE WHEN included AND direction='credit' THEN amount_minor ELSE 0 END) AS TEXT) in_minor,
    CAST(SUM(CASE WHEN included AND direction='debit' THEN amount_minor ELSE 0 END) AS TEXT) out_minor,
    SUM(CASE WHEN included AND direction='credit' THEN 1 ELSE 0 END) in_count,
    SUM(CASE WHEN included AND direction='debit' THEN 1 ELSE 0 END) out_count,
    SUM(CASE WHEN uncertain THEN 1 ELSE 0 END) uncertain_count
  FROM candidates GROUP BY id`;
 const bounds=[owner,rangeStart,rangeEnd] as const;
 const rows=await db.prepare(query).bind(JSON.stringify(windows),...bounds,...bounds,...bounds,...bounds).all<Flow>();
 return new Map(rows.results.map(row=>[row.id,row]));
}
type VerifiedBalance = {
 id:string;label:string;type:string;currency:string;hasSnapshot:boolean;
 latest:{amountMinor:string;asOf:string;source:string}|null;
 previous:{amountMinor:string;asOf:string}|null;
 reconciliation:{status:string;expectedMinor:string;differenceMinor:string;incomingMinor:string;
  outgoingMinor:string;incomingCount:number;outgoingCount:number;after:string;until:string;scope:string}|null;
 estimate:{amountMinor:string;asOf:string;incomingMinor:string;outgoingMinor:string;
   incomingCount:number;outgoingCount:number;uncertainCount:number}|null;
 connectionStatus:string;
};
export async function readVerifiedBalances(db:QuickD1,owner:string,estimateAt?:string):Promise<VerifiedBalance[]>{
 const accounts=await db.prepare("SELECT id,owner_id,bank_label,account_type,currency "+
  "FROM quick_balance_accounts WHERE owner_id=? ORDER BY bank_label LIMIT 50").bind(owner).all<SqlAccount>();
 const items:VerifiedBalance[]=[];
 const windows:Window[]=[];
 for(const account of accounts.results){
  const rows=await db.prepare("SELECT id,account_id,request_key,amount_minor,as_of,created_at "+
    "FROM quick_balance_snapshots WHERE owner_id=? AND account_id=? "+
    "ORDER BY as_of DESC,id DESC LIMIT 2").bind(owner,account.id).all<SqlSnapshot>();
  const [latest,previous]=rows.results;
  const item:VerifiedBalance={
    id:account.id,label:account.bank_label,type:account.account_type,currency:account.currency,
    hasSnapshot:Boolean(latest),latest:latest?{amountMinor:String(latest.amount_minor),asOf:latest.as_of,source:"user_verified"}:null,
    previous:previous?{amountMinor:String(previous.amount_minor),asOf:previous.as_of}:null,
    reconciliation:null,estimate:null,connectionStatus:"not_connected"
  };
  if(latest&&account.account_type==="deposit"){
    if(previous)windows.push({id:account.id,label:account.bank_label,after:previous.as_of,until:latest.as_of,estimated:false});
    if(estimateAt&&latest.as_of<=estimateAt)
      windows.push({id:account.id+":estimate",label:account.bank_label,after:latest.as_of,until:estimateAt,estimated:true});
  }
  items.push(item);
 }
 const flows=await bankFlows(db,owner,windows);
 const empty={in_minor:"0",out_minor:"0",in_count:0,out_count:0,uncertain_count:0};
 for(const item of items){
  const {latest,previous}=item;
  if(!latest||item.type!=="deposit")continue;
  if(previous){
    const flow=flows.get(item.id)??empty;
    const expected=BigInt(previous.amountMinor)+BigInt(flow.in_minor)-BigInt(flow.out_minor);
    const difference=BigInt(latest.amountMinor)-expected;
    item.reconciliation={
      status:difference===0n?"matches_recorded_movements":"difference_requires_review",
      expectedMinor:String(expected),differenceMinor:String(difference),
      incomingMinor:String(flow.in_minor),outgoingMinor:String(flow.out_minor),
      incomingCount:flow.in_count,outgoingCount:flow.out_count,
      after:previous.asOf,until:latest.asOf,
      scope:"Only exact-bank-label movements; not an official bank reconciliation"
    };
  }
  if(estimateAt&&latest.asOf<=estimateAt){
    const flow=flows.get(item.id+":estimate")??empty;
    item.estimate={
      amountMinor:String(BigInt(latest.amountMinor)+BigInt(flow.in_minor)-BigInt(flow.out_minor)),asOf:estimateAt,
      incomingMinor:String(flow.in_minor),outgoingMinor:String(flow.out_minor),
      incomingCount:flow.in_count,outgoingCount:flow.out_count,uncertainCount:flow.uncertain_count
    };
  }
 }
 return items;
}
export async function verifiedBalances(db:QuickD1,owner:string):Promise<Response>{
 const items=await readVerifiedBalances(db,owner,new Date().toISOString());
 const aliases=await db.prepare(
  "SELECT bank_label AS label FROM quick_shortcut_expenses WHERE owner_id=? AND deleted_at IS NULL "+
  "AND bank_label IS NOT NULL UNION SELECT bank_label FROM quick_income_entries "+
  "WHERE owner_id=? AND bank_label IS NOT NULL UNION SELECT bank_label "+
  "FROM quick_statement_credits WHERE owner_id=? UNION SELECT bank_label "+
  "FROM quick_manual_entries WHERE owner_id=? AND deleted_at IS NULL AND bank_label IS NOT NULL "+
  "ORDER BY label LIMIT 50"
 ).bind(owner,owner,owner,owner).all<{label:string}>();
 return response({accounts:items,bankLabels:aliases.results.map(x=>x.label),
  connectionStatus:"not_connected",balanceSource:"user_verified",
  note:"La estimación parte del último saldo confirmado y los movimientos en COP de la misma cuenta. La deuda de tarjetas y el efectivo informado se muestran por separado."});
}
