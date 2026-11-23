// FinanzasOSS v41.3: explicit, idempotent and owner-scoped statement decisions.
// Import debit -> purchase; import credit -> unclassified received credit, NEVER income.
// Own-account transfers and existing records are AUDIT DECISIONS, not ledger expenses.
import type {QuickD1} from "./index.js";
import {previewReconciliationV41} from "./statement-reconcile-v41.js";
import {reviewDigestV41} from "./statement-review-digest-v41.js";

export class ReviewConfirmationError extends Error {
 constructor(message:string,readonly status=422){super(message);}
}
type DecisionAction="import"|"already_exists"|"own_transfer"|"skip";
type Decision={index:number;action:DecisionAction;existingSource?:string;existingId?:string;
 counterpartyLabel?:string;overridePossibleMatch?:boolean};
export type PreviewRow={index:number;status:string;direction:"credit"|"debit"|null;date:string|null;
 description:string;amountCOP:string|null;existing:{source:string;id:string}[];
 repeatOfIndex?:number|null;issues:string[]};
export type Preview={reviewDigest:string;rows:PreviewRow[];bankLabel:string};
type Entry={id:string;row_key:string;row_hash:string;review_digest:string;action:string;
 existing_source:string|null;existing_id:string|null;counterparty_label:string|null;
 ledger_entry_id:string|null};
type Pending={row:PreviewRow;decision:Decision;rowKey:string;rowHash:string;reviewDigest:string;
 entryId:string|null;existingSource:string|null;existingId:string|null;counterparty:string|null};
const actions=new Set(["import","already_exists","own_transfer","skip"]);
const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{
 "Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store, private",
 "Content-Security-Policy":"default-src 'none'; frame-ancestors 'none'",
 "X-Content-Type-Options":"nosniff","Referrer-Policy":"no-referrer",
}});
const normalize=(s:string)=>s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/\s+/g," ").trim();
async function digest(text:string):Promise<string>{
 const data=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(text));
 return Array.from(new Uint8Array(data),b=>b.toString(16).padStart(2,"0")).join("");
}
function textField(v:unknown,max:number):string{
 if(typeof v!=="string"||!v.trim()||v.trim().length>max||/[\u0000-\u001f\u007f]/.test(v))
  throw new ReviewConfirmationError("Texto de revisión inválido");
 return v.trim();
}
function minorOf(raw:string|null):number{
 if(typeof raw!=="string"||!/^[0-9]{1,10}(?:\.[0-9]{1,2})?$/.test(raw))
  throw new ReviewConfirmationError("Importe no confirmado");
 const [whole,fraction=""]=raw.split(".");
 const minor=Number(whole)*100+Number(fraction.padEnd(2,"0"));
 if(!Number.isSafeInteger(minor)||minor<=0||minor>1000000000000)
  throw new ReviewConfirmationError("Importe inválido");
 return minor;
}
function getObject(v:unknown):Record<string,unknown>{
 if(!v||typeof v!=="object"||Array.isArray(v))throw new ReviewConfirmationError("Confirmación inválida");
 return v as Record<string,unknown>;
}
function validate(body:unknown){
 const d=getObject(body);
 const allowed=new Set(["rows","mapping","bankLabel","paymentMethod","expectedDigest","confirmed","decisions"]);
 if(Object.keys(d).some(x=>!allowed.has(x)))throw new ReviewConfirmationError("Campo de confirmación no admitido");
 if(d.confirmed!==true)throw new ReviewConfirmationError("Confirma expresamente tus decisiones");
 if(typeof d.expectedDigest!=="string"||!/^[a-f0-9]{64}$/.test(d.expectedDigest))
  throw new ReviewConfirmationError("Primero revisa una vista previa vigente",409);
 if(!Array.isArray(d.decisions)||d.decisions.length<1||d.decisions.length>50)
  throw new ReviewConfirmationError("Selecciona al menos una decisión");
 const found=new Set<number>();
 const decisions:Decision[]=d.decisions.map(v=>{
  const x=getObject(v);
  if(Object.keys(x).some(k=>!["index","action","existingSource","existingId","counterpartyLabel","overridePossibleMatch"].includes(k)))
   throw new ReviewConfirmationError("Campo de decisión no admitido");
  if(!Number.isSafeInteger(x.index)||Number(x.index)<0||Number(x.index)>49||
     found.has(x.index as number))throw new ReviewConfirmationError("Índice repetido o inválido");
  found.add(x.index as number);
  if(!actions.has(x.action as string))throw new ReviewConfirmationError("Decisión no admitida");
  if(x.overridePossibleMatch!==undefined&&typeof x.overridePossibleMatch!=="boolean")
   throw new ReviewConfirmationError("Confirmación de similitud inválida");
  if(x.existingId!==undefined)textField(x.existingId,128);
  if(x.existingSource!==undefined)textField(x.existingSource,32);
  if(x.counterpartyLabel!==undefined)textField(x.counterpartyLabel,80);
  return x as unknown as Decision;
 });
 return {d,decisions};
}
function same(saved:Entry,p:Pending):boolean{
 return saved.row_hash===p.rowHash&&saved.review_digest===p.reviewDigest&&saved.action===p.decision.action&&
  saved.existing_source===p.existingSource&&saved.existing_id===p.existingId&&
  saved.counterparty_label===p.counterparty&&saved.ledger_entry_id===p.entryId;
}
export async function statementRowKeys(preview:Preview,paymentMethod:string,rawRows:readonly Record<string,string>[],
 mapping:{externalId?:string}){
 const occurrences=new Map<string,number>();
 const keys=new Map<number,{rowKey:string;rowHash:string}>();
 const externalRefs=new Set<string>();
 for(const row of preview.rows){
  if(row.status==="needs_correction"||!row.direction||!row.date)continue;
  const amount=minorOf(row.amountCOP);
  const ref=mapping.externalId?String(rawRows[row.index]?.[mapping.externalId]||"").trim():"";
  const common=JSON.stringify([normalize(preview.bankLabel),paymentMethod,row.direction,
    row.date,amount,normalize(row.description)]);
  const extKey=JSON.stringify([normalize(preview.bankLabel),paymentMethod,"ref",ref]);
  if(ref){
   if(externalRefs.has(extKey))throw new ReviewConfirmationError("Referencia bancaria repetida en el extracto; revisa el archivo",409);
   externalRefs.add(extKey);
  }
  const occurrence=occurrences.get(common)||0;
  occurrences.set(common,occurrence+1);
  const source=ref?extKey:common+"|"+occurrence;
  const rowKey="v41_"+await digest(source);
  const rowHash=await digest(JSON.stringify([common,ref,occurrence]));
  keys.set(row.index,{rowKey,rowHash});
 }
 return keys;
}
export async function confirmReviewedStatementV41(db:QuickD1,owner:string,raw:unknown):Promise<Response>{
 const {d,decisions}=validate(raw);
 if(!db.batch)throw new ReviewConfirmationError("La transacción atómica D1 no está disponible",503);
 // Rebuild the preview on the server from the supplied rows; check the exact
 // digest the user saw. No Qwen output is ever trusted as a final ledger action.
 const input={rows:d.rows,mapping:d.mapping,bankLabel:d.bankLabel,paymentMethod:d.paymentMethod};
 const previewResponse=await previewReconciliationV41(db,owner,input);
 if(!previewResponse.ok)throw new ReviewConfirmationError("Extracto inválido",422);
 const preview=await previewResponse.json() as Preview;
 const digestChanged=preview.reviewDigest!==d.expectedDigest ||
  preview.reviewDigest!==await reviewDigestV41(preview.bankLabel,d.paymentMethod as string,preview.rows);
 const rawRows=d.rows as Record<string,string>[];
 const mapping=d.mapping as {externalId?:string};
 const keys=await statementRowKeys(preview,d.paymentMethod as string,rawRows,mapping);
 const prepared:Pending[]=[];
 for(const choice of decisions){
  const row=preview.rows.find(x=>x.index===choice.index);
  if(!row||row.status==="needs_correction"||!row.direction||!row.date||!keys.has(choice.index))
   throw new ReviewConfirmationError("Fila inválida; corrígela antes de confirmar",422);
  const k=keys.get(choice.index)!;
  let existingSource:string|null=null,existingId:string|null=null,counterparty:string|null=null;
  if(choice.action==="already_exists"){
   existingSource=textField(choice.existingSource,32);
   existingId=textField(choice.existingId,128);
   if(!row.existing?.some(x=>x.id===existingId&&x.source===existingSource))
    throw new ReviewConfirmationError("El movimiento existente elegido no está verificado para esta cuenta",409);
  }else if(choice.existingSource!==undefined||choice.existingId!==undefined)
   throw new ReviewConfirmationError("Solo la decisión 'Ya existe' admite un enlace previo");
  if(choice.action==="own_transfer"){
   counterparty=textField(choice.counterpartyLabel,80);
   // An account name is mandatory; never infer which bank or Hapi account owns the other side.
   if(normalize(counterparty)===normalize(preview.bankLabel))
    throw new ReviewConfirmationError("Identifica la otra cuenta, no solo el mismo nombre de banco");
  }else if(choice.counterpartyLabel!==undefined)
   throw new ReviewConfirmationError("La cuenta contraparte solo aplica a transferencias propias");
  const entryId=choice.action==="import"?"v41_"+await digest(k.rowKey+"|ledger"):null;
  prepared.push({row,decision:choice,rowKey:k.rowKey,rowHash:k.rowHash,reviewDigest:d.expectedDigest as string,
   existingSource,existingId,counterparty,entryId});
 }
 // Preflight: deterministic fingerprint replays exactly; divergent meaning is
 // a conflict and never rewrites an existing audit decision.
 let replayed=0;
 const newEntries:Pending[]=[];
 for(const item of prepared){
  const old=await db.prepare("SELECT id,row_key,row_hash,review_digest,action,existing_source,existing_id,counterparty_label,ledger_entry_id "+
   "FROM quick_statement_review_decisions WHERE owner_id=? AND row_key=? LIMIT 1")
   .bind(owner,item.rowKey).first<Entry>();
  if(old){
   if(!same(old,item))throw new ReviewConfirmationError("Este movimiento ya fue revisado con otra decisión",409);
   replayed++;
  }else newEntries.push(item);
 }
 // Prior imports will now appear as possible matches; only NEW imports
 // require the extra override. Replaying an identical decision does not.
 for(const item of newEntries){
  if(item.decision.action==="import"&&
    ((item.row.existing||[]).length>0||item.row.repeatOfIndex!=null)&&
    item.decision.overridePossibleMatch!==true)
   throw new ReviewConfirmationError("Debes aceptar expresamente las posibles coincidencias antes de importar",409);
 }
 // A full idempotent replay is allowed even if these imports now appear in
 // the live matching list. Any NEW decision requires a fresh preview digest.
 if(digestChanged && newEntries.length>0)
  throw new ReviewConfirmationError("La conciliación cambió. Vuelve a revisarla antes de confirmar",409);
 if(newEntries.length){
  const now=new Date().toISOString();
  const stmts=[];
  for(const item of newEntries){
   const {row,decision,rowKey,rowHash,entryId,existingSource,existingId,counterparty}=item;
   const amount=minorOf(row.amountCOP);
   const decisionId=crypto.randomUUID();
   stmts.push(db.prepare("INSERT INTO quick_statement_review_decisions("+
    "id,owner_id,row_key,row_hash,review_digest,bank_label,payment_method,direction,occurred_on,amount_minor,description,"+
    "action,existing_source,existing_id,counterparty_label,ledger_entry_id,created_at) "+
    "VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(owner_id,row_key) DO NOTHING")
    .bind(decisionId,owner,rowKey,rowHash,item.reviewDigest,preview.bankLabel,d.paymentMethod as string,row.direction,
      row.date,amount,row.description,decision.action,existingSource,existingId,counterparty,entryId,now));
   if(decision.action==="import"){
    const date=row.date+"T17:00:00.000Z";
    const clientId=rowKey;
    const condition="SELECT 1 FROM quick_statement_review_decisions WHERE owner_id=? AND row_key=? "+
     "AND row_hash=? AND action='import' AND ledger_entry_id=?";
    if(row.direction==="debit"){
     stmts.push(db.prepare("INSERT INTO quick_shortcut_expenses("+
      "id,owner_id,client_entry_id,amount_minor,currency,payment_method,kind,occurred_at,merchant,bank_label,created_at) "+
      "SELECT ?,?,?,?,'COP',?,'purchase',?,?,?,? WHERE EXISTS("+condition+") "+
      "ON CONFLICT(owner_id,client_entry_id) DO NOTHING")
      .bind(entryId,owner,clientId,amount,d.paymentMethod as string,date,row.description,preview.bankLabel,now,
       owner,rowKey,rowHash,entryId));
    }else{
     // Classify as an unclassified bank credit. Never call it salary/income by default.
     stmts.push(db.prepare("INSERT INTO quick_statement_credits("+
      "id,owner_id,client_entry_id,amount_minor,currency,occurred_at,merchant,bank_label,kind,direction,economic_purpose,created_at) "+
      "SELECT ?,?,?,?,'COP',?,?,?,'received_transfer','credit','pending',? WHERE EXISTS("+condition+") "+
      "ON CONFLICT(owner_id,client_entry_id) DO NOTHING")
      .bind(entryId,owner,clientId,amount,date,row.description,preview.bankLabel,now,
       owner,rowKey,rowHash,entryId));
    }
   }
   stmts.push(db.prepare("INSERT INTO quick_statement_review_audit(id,owner_id,row_key,decision_id,event,recorded_at) "+
    "SELECT ?,owner_id,row_key,id,'confirmed',? FROM quick_statement_review_decisions "+
    "WHERE owner_id=? AND row_key=? AND row_hash=? AND action=? "+
    "AND COALESCE(existing_source,'')=? AND COALESCE(existing_id,'')=? "+
    "AND COALESCE(counterparty_label,'')=? "+
    "ON CONFLICT(owner_id,row_key) DO NOTHING")
    .bind(crypto.randomUUID(),now,owner,rowKey,rowHash,decision.action,
      existingSource||"",existingId||"",counterparty||""));
  }
  await db.batch(stmts);
 }
 // Verify winners after the transaction so racing conflicting decisions are
 // never reported as if they had been accepted.
 for(const item of prepared){
  const saved=await db.prepare("SELECT id,row_key,row_hash,review_digest,action,existing_source,existing_id,counterparty_label,ledger_entry_id "+
   "FROM quick_statement_review_decisions WHERE owner_id=? AND row_key=? LIMIT 1")
   .bind(owner,item.rowKey).first<Entry>();
  if(!saved||!same(saved,item))
   throw new ReviewConfirmationError("Otra confirmación ganó la carrera; vuelve a revisar el historial",409);
 }
 return reply({confirmed:true,count:prepared.length,created:newEntries.length,
  replayed,imported:newEntries.filter(x=>x.decision.action==="import").length,
  alreadyExists:newEntries.filter(x=>x.decision.action==="already_exists").length,
  ownTransfers:newEntries.filter(x=>x.decision.action==="own_transfer").length,
  skipped:newEntries.filter(x=>x.decision.action==="skip").length,
  notice:"Las transferencias propias no se contabilizan como gastos ni ingresos. Los abonos importados no se consideran ingresos hasta clasificarse."});
}
export async function statementReviewHistoryV41(db:QuickD1,owner:string):Promise<Response>{
 const {results}=await db.prepare("SELECT d.id,d.row_key,d.bank_label,d.payment_method,d.direction,d.occurred_on,"+
  "d.amount_minor,d.description,d.action,d.existing_source,d.existing_id,d.counterparty_label,"+
  "d.ledger_entry_id,a.recorded_at FROM quick_statement_review_decisions d "+
  "JOIN quick_statement_review_audit a ON a.decision_id=d.id AND a.owner_id=d.owner_id "+
  "WHERE d.owner_id=? ORDER BY a.recorded_at DESC,d.id DESC LIMIT 100").bind(owner).all<{
   id:string;row_key:string;bank_label:string;payment_method:string;direction:string;
   occurred_on:string;amount_minor:number;description:string;action:string;
   existing_source:string|null;existing_id:string|null;counterparty_label:string|null;
   ledger_entry_id:string|null;recorded_at:string;
  }>();
 return reply({count:results.length,items:results,readOnly:true});
}
