import { reviewDigestV41 } from "./statement-review-digest-v41.js";
// FinanzasOSS v41.1 - read-only statement reconciliation explorer.
// Does NOT create/mutate any movements or attempt bank synchronization.
import { previewMappedImport, type ImportColumnMapping, type RawImportRow } from "../../../packages/import-engine/src/mapping-preview.js";
import type { QuickD1 } from "./index.js";

export class ReconcileInputError extends Error {
  constructor(message: string, readonly status=422) { super(message); }
}
type Body={rows:RawImportRow[];mapping:ImportColumnMapping;bankLabel:string;paymentMethod:string};
type Existing={id:string;source:string;label:string;amount_minor:number;occurred_at:string};
const methods=new Set(["bank_transfer","debit_card","credit_card"]);
const iso=/^\d{4}-\d{2}-\d{2}$/;
const response=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{
  "Content-Type":"application/json; charset=utf-8","Cache-Control":"private, no-store",
  "X-Content-Type-Options":"nosniff","Referrer-Policy":"no-referrer",
  "Content-Security-Policy":"default-src 'none'; frame-ancestors 'none'",
}});
function validate(input:unknown):Body {
  if(!input||typeof input!=="object"||Array.isArray(input))throw new ReconcileInputError("Se requiere un extracto CSV.");
  const p=input as Record<string,unknown>;
  if(Object.keys(p).some(k=>!["rows","mapping","bankLabel","paymentMethod"].includes(k)))
    throw new ReconcileInputError("Campo no admitido.");
  if(!Array.isArray(p.rows)||p.rows.length<1||p.rows.length>50)
    throw new ReconcileInputError("Se admiten de 1 a 50 filas por revisión.");
  const rows=p.rows.map(v=>{
    if(!v||typeof v!=="object"||Array.isArray(v))throw new ReconcileInputError("Fila inválida.");
    const row=v as Record<string,unknown>, keys=Object.keys(row);
    if(keys.length<3||keys.length>12||keys.some(k=>k.length<1||k.length>80||/[\u0000-\u001f\u007f]/.test(k)))
      throw new ReconcileInputError("Encabezados no válidos.");
    if(Object.values(row).some(c=>typeof c!=="string"||c.length>260||/[\u0000-\u001f\u007f]/.test(c)))
      throw new ReconcileInputError("Celda CSV no válida.");
    return row as Record<string,string>;
  });
  if(!p.mapping||typeof p.mapping!=="object"||Array.isArray(p.mapping))
    throw new ReconcileInputError("Asignación de columnas requerida.");
  const map=p.mapping as Record<string,unknown>;
  if(Object.keys(map).some(k=>!["postedAt","description","amount","direction","currency","externalId"].includes(k)))
    throw new ReconcileInputError("Asignación no permitida.");
  for(const k of ["postedAt","description","amount","direction"]){
    if(typeof map[k]!=="string"||!Object.hasOwn(rows[0]!,map[k]))throw new ReconcileInputError("Asigna fecha, concepto, importe y sentido.");
  }
  for(const k of ["currency","externalId"]){
    if(map[k]!==undefined&&(typeof map[k]!=="string"||!Object.hasOwn(rows[0]!,map[k])))
      throw new ReconcileInputError("Columna opcional inválida.");
  }
  if(typeof p.bankLabel!=="string"||!p.bankLabel.trim()||p.bankLabel.trim().length>80||/[\u0000-\u001f\u007f]/.test(p.bankLabel))
    throw new ReconcileInputError("Nombre del banco inválido.");
  if(!methods.has(p.paymentMethod as string))throw new ReconcileInputError("Medio de pago inválido.");
  return {rows,mapping:map as unknown as ImportColumnMapping,bankLabel:p.bankLabel.trim(),paymentMethod:p.paymentMethod as string};
}
const cents=(raw:string|null):number|null=>{
  if(!raw||!/^(?:0|[1-9][0-9]{0,9})(?:\.[0-9]{1,2})?$/.test(raw))return null;
  const [whole,fraction=""]=raw.split(".");
  const value=Number(whole)*100+Number(fraction.padEnd(2,"0"));
  return Number.isSafeInteger(value)&&value>0&&value<=1000000000000?value:null;
};
const localDay=(value:string):boolean=>{
  if(!iso.test(value))return false;
  const d=new Date(value+"T12:00:00Z");
  return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===value
    &&value>="2000-01-01"&&d.getTime()<=Date.now()+86400000;
};
const folded=(s:string)=>s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/\s+/g," ").trim();
async function existing(db:QuickD1,owner:string,bank:string,day:string,minor:number,direction:"credit"|"debit"):Promise<Existing[]>{
  const filter="owner_id=? AND lower(trim(bank_label))=lower(trim(?)) AND amount_minor=? "+
    "AND substr(datetime(occurred_at,'-5 hours'),1,10)=?";
  const sql=direction==="debit"?
    "SELECT id,'accountless' AS source,merchant AS label,amount_minor,occurred_at FROM quick_shortcut_expenses WHERE "+filter+
    " AND deleted_at IS NULL UNION ALL "+
    "SELECT id,'manual' AS source,merchant AS label,amount_minor,occurred_at FROM quick_manual_entries WHERE "+filter+
    " AND deleted_at IS NULL LIMIT 12"
    :"SELECT id,'income' AS source,concept AS label,amount_minor,occurred_at FROM quick_income_entries WHERE "+filter+
    " UNION ALL SELECT id,'statement_credit' AS source,merchant AS label,amount_minor,occurred_at FROM quick_statement_credits WHERE "+filter+" LIMIT 12";
  return (await db.prepare(sql).bind(owner,bank,minor,day,owner,bank,minor,day).all<Existing>()).results;
}
export async function previewReconciliationV41(db:QuickD1,owner:string,raw:unknown):Promise<Response>{
  const input=validate(raw);
  const rows=previewMappedImport(input.rows,input.mapping);
  const fingerprints=new Map<string,number>();
  const review=[];
  const counts={possibleMatch:0,needsPurpose:0,needsType:0,possibleTransfer:0,needsCorrection:0,repeatedInFile:0};
  for(const row of rows.rows){
    const c=row.candidate,issues=[...row.issues];
    const amount=cents(c.amount),description=(c.rawDescription||"").trim();
    if(!localDay(c.postedAt||""))issues.push("Fecha inválida o futura");
    if(!amount)issues.push("Importe COP positivo inválido");
    if(description.length<1||description.length>120)issues.push("Descripción inválida");
    if(c.currency&&c.currency!=="COP")issues.push("Moneda no compatible con la conciliación COP");
    if(!c.direction)issues.push("Indica debit o credit");
    if(issues.length){
      review.push({index:row.rowIndex,status:"needs_correction",direction:c.direction||null,
        date:c.postedAt,description,amountCOP:c.amount,issues,existing:[],requiresReview:true});
      counts.needsCorrection++;continue;
    }
    const direction=c.direction as "credit"|"debit";
    const records=await existing(db,owner,input.bankLabel,c.postedAt!,amount!,direction);
    const exact=records.filter(r=>folded(r.label||"")===folded(description));
    const candidates=(exact.length?exact:records).slice(0,3).map(r=>({
      source:r.source,id:r.id,date:r.occurred_at.slice(0,10),description:r.label,
      evidence:exact.length?"mismo importe, fecha, cuenta, sentido y concepto":"mismo importe, fecha, cuenta y sentido"
    }));
    // Same merchant and amount on the same day may represent multiple legitimate purchases.
    // File row index is never silently collapsed. A repeated identifier only triggers review.
    const fileKey=(c.externalId?.trim()?
      direction+"|"+input.bankLabel.toLowerCase()+"|reference|"+c.externalId.trim():
      direction+"|"+input.bankLabel.toLowerCase()+"|"+c.postedAt+"|"+amount+"|"+folded(description));
    const previous=fingerprints.get(fileKey);
    if(previous===undefined)fingerprints.set(fileKey,row.rowIndex);
    const repeated=previous!==undefined;
    const transferHint=direction==="debit"&&
      /(?:transfer|traspaso|entre cuentas|pago tarjeta|pago tdc|aporte hapi|inversion|bre-b)/i.test(folded(description));
    const status=candidates.length?"possible_match":
      repeated?"repeated_in_file":
      direction==="credit"?"needs_purpose":
      transferHint?"possible_transfer":"needs_type";
    if(status==="possible_match")counts.possibleMatch++;
    if(status==="repeated_in_file")counts.repeatedInFile++;
    if(status==="needs_purpose")counts.needsPurpose++;
    if(status==="needs_type")counts.needsType++;
    if(status==="possible_transfer")counts.possibleTransfer++;
    review.push({index:row.rowIndex,status,direction,date:c.postedAt,
      description,amountCOP:(amount!/100).toFixed(2),issues:[],
      existing:candidates,repeatOfIndex:repeated?previous:null,
      requiresReview:true,autoImport:false});
  }
  const reviewDigest=await reviewDigestV41(input.bankLabel,input.paymentMethod,review);
  return response({version:"v41.1-preview",reviewDigest,stored:false,persistenceAllowed:false,
    canCommit:false,requiresConfirmation:true,connectionStatus:"not_connected",
    bankLabel:input.bankLabel,currency:"COP",count:review.length,counts,rows:review,
    notice:"Revisión informativa: abonos no son ingresos confirmados, transferencias no son gastos confirmados. No se guardó ni cambió ningún movimiento."});
}
