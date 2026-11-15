// v41.2: deterministic bridge from Qwen's verified table headers to the read-only
// owner-scoped reconciliation engine. This module NEVER persists financial rows.
import type { QuickD1 } from "./index.js";
import { previewReconciliationV41 } from "./statement-reconcile-v41.js";

export type DocumentTable = {
  index:number; heading:string; headers:string[]; rowCount:number;
};
export type TableProposal = {
  index:number; role:string; confidence:number; mapping:Record<string,string|null>;
};
type PlanningOptions={bankLabel:string;paymentMethod:string};
const COP_MAX_ROWS=50;
const normalize=(text:string)=>text.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
function cells(raw:string):string[]{
  return raw.trim().replace(/^\|/,"").replace(/\|$/,"")
    .split(/(?<!\\)\|/).map(x=>x.trim().replace(/\\\|/g,"|").slice(0,260));
}
const separator=(line:string)=>cells(line).length>=2 &&
  cells(line).every(x=>/^:?-{3,}:?$/.test(x));
export function readMarkdownTable(markdown:string,index:number):
  {headers:string[];rows:string[][]}|null{
  const lines=markdown.split(/\r?\n/);
  let found=-1;
  for(let i=0;i<lines.length-1;i++){
    const current=lines[i]!.trim();
    if(!current.startsWith("|")||!lines[i+1]!.trim().startsWith("|")||
       !separator(lines[i+1]!))continue;
    const headers=cells(current);
    if(headers.length<2||headers.length>24)continue;
    found++;
    const rows:string[][]=[];
    let end=i+2;
    while(end<lines.length&&lines[end]!.trim().startsWith("|")){
      const row=cells(lines[end]!);
      if(row.length!==headers.length)break;
      if(rows.length<=COP_MAX_ROWS)rows.push(row);
      end++;
      if(end-i>20002)break;
    }
    if(found===index)return {headers,rows};
    i=end-1;
  }
  return null;
}
export function normalizeStatementDate(raw:string):string|null{
  const value=raw.trim();
  if(/^\d{4}-\d{2}-\d{2}$/.test(value))return value;
  // Colombian formats are DD/MM/YYYY, never silently interpreted as MM/DD/YYYY.
  const match=/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/.exec(value);
  if(!match)return null;
  const [,dd,mm,yyyy]=match;
  if(!dd||!mm||!yyyy)return null;
  const date=yyyy+"-"+mm.padStart(2,"0")+"-"+dd.padStart(2,"0");
  const parsed=new Date(date+"T12:00:00Z");
  return Number.isFinite(parsed.getTime())&&parsed.toISOString().slice(0,10)===date?
    date:null;
}
export function normalizeCOP(raw:string):string|null{
  let s=raw.trim().replace(/^(?:COP|COL\$|\$)\s*/i,"").replace(/\s*(?:COP|COL\$)$/i,"").trim();
  // Signs are not independently trusted for transaction direction. The selected
  // direction or mutually-exclusive debit/credit columns must establish it.
  if(!s||/[^\d,.]/.test(s))return null;
  if(!/^\d[\d.,]*$/.test(s))return null;
  let whole=s, fraction="";
  const comma=s.lastIndexOf(","),dot=s.lastIndexOf(".");
  if(comma>=0&&dot>=0){
    const sep=comma>dot?",":".";
    const thousands=sep===","?".":",";
    const chunks=s.split(sep);
    if(chunks.length!==2||!new RegExp("^\\d{1,3}(?:\\"+thousands+"\\d{3})+$").test(chunks[0]!)||
      !/^\d{1,2}$/.test(chunks[1]!))return null;
    whole=chunks[0]!.split(thousands).join("");
    fraction=chunks[1]!;
  }else{
    const sep=comma>=0?",":dot>=0?".":null;
    if(sep){
      const parts=s.split(sep);
      if(parts.length===2&&parts[1]!.length<=2&&/^\d{1,2}$/.test(parts[1]!)){
        whole=parts[0]!;
        fraction=parts[1]!;
      }else if(parts.length>1 && parts[0]!.length>=1&&parts[0]!.length<=3 &&
        parts.slice(1).every(v=>/^\d{3}$/.test(v))){
        whole=parts.join("");
      }else return null;
    }
  }
  if(!/^\d{1,10}$/.test(whole)||!/^\d{0,2}$/.test(fraction))return null;
  const minor=Number(whole)*100+Number(fraction.padEnd(2,"0"));
  if(!Number.isSafeInteger(minor)||minor<=0||minor>1_000_000_000_000)return null;
  return whole.replace(/^0+(?=\d)/,"")+(fraction?"."+fraction.padEnd(2,"0"):"");
}
export function normalizeDirection(raw:string):"debit"|"credit"|null{
  const v=normalize(raw.trim()).replace(/\s+/g," ");
  if(/^(debit|debito|cargo|retiro|salida|egreso|d|dr)$/.test(v))return "debit";
  if(/^(credit|credito|abono|ingreso|entrada|c|cr)$/.test(v))return "credit";
  return null;
}
function getCell(row:string[],headers:string[],column:string|null|undefined):string{
  if(!column)return "";
  const i=headers.indexOf(column);
  return i>=0?row[i]??"":"";
}
export function mapDocumentTransactions(
 markdown:string,table:DocumentTable,proposal:TableProposal,
):{rows:Array<Record<string,string>>;warnings:string[];eligible:boolean}{
  const parsed=readMarkdownTable(markdown,table.index);
  if(!parsed||JSON.stringify(parsed.headers)!==JSON.stringify(table.headers)||
    table.rowCount> COP_MAX_ROWS || parsed.rows.length!==table.rowCount)
    return {rows:[],warnings:["Tabla inconsistente o de más de 50 filas; no se ha preparado ninguna conciliación."],eligible:false};
  if(table.headers.length>12||new Set(table.headers).size!==table.headers.length)
    return {rows:[],warnings:["La tabla tiene columnas duplicadas o más de 12 columnas."],eligible:false};
  const m=proposal.mapping;
  const date=m.postedAt,desc=m.description;
  const dual=Boolean(m.debit && m.credit && m.debit!==m.credit);
  const simple=Boolean(m.amount && m.direction && m.amount!==m.direction);
  if(!date||!desc||(!dual&&!simple))
    return {rows:[],warnings:["Faltan fecha, concepto o columnas inequívocas de cargo y abono."],eligible:false};
  if(!Object.values(m).every(x=>x===null||table.headers.includes(x)))
    return {rows:[],warnings:["Qwen propuso columnas que no existen en la tabla."],eligible:false};
  if(new Set([date,desc,...(dual?[m.debit,m.credit]:[m.amount,m.direction])].filter(Boolean)).size!==4)
    return {rows:[],warnings:["Qwen asignó la misma columna a campos incompatibles."],eligible:false};
  const warnings=["Vista previa de extracto en COP; fechas DD/MM/AAAA se interpretan como día/mes/año. Verifica todos los movimientos."];
  const rows=parsed.rows.map(row=>{
    const postedAt=normalizeStatementDate(getCell(row,table.headers,date));
    const description=getCell(row,table.headers,desc).trim();
    let amount:string|null=null,direction:"credit"|"debit"|null=null;
    if(dual){
      const debitRaw=getCell(row,table.headers,m.debit).trim();
      const creditRaw=getCell(row,table.headers,m.credit).trim();
      const debit=normalizeCOP(debitRaw),credit=normalizeCOP(creditRaw);
      const hasDebit=Boolean(debitRaw && !/^0+(?:[.,]0+)?$/.test(debitRaw));
      const hasCredit=Boolean(creditRaw && !/^0+(?:[.,]0+)?$/.test(creditRaw));
      if(hasDebit&&!hasCredit&&debit){amount=debit;direction="debit";}
      else if(hasCredit&&!hasDebit&&credit){amount=credit;direction="credit";}
    }else{
      amount=normalizeCOP(getCell(row,table.headers,m.amount));
      direction=normalizeDirection(getCell(row,table.headers,m.direction));
    }
    const currency=m.currency?getCell(row,table.headers,m.currency).trim():"COP";
    return {
      Fecha:postedAt||"INVALIDA",
      Concepto:description||"INVALIDO",
      Importe:amount||"INVALIDO",
      Tipo:direction||"INVALIDO",
      Moneda:currency||"INVALIDA",
      Referencia:getCell(row,table.headers,m.externalId).trim(),
    };
  });
  return {rows,warnings,eligible:true};
}
export async function reconciliationFromDocument(
 db:QuickD1,owner:string,markdown:string,documentType:string,
 tables:DocumentTable[],proposals:TableProposal[],opts:PlanningOptions,
):Promise<{available:boolean;reason:string;tableIndex:number|null;warnings:string[];
  preview:unknown|null}>{
 if(documentType!=="bank_statement")
   return {available:false,reason:"Solo se concilian extractos de cuentas bancarias COP; las tarjetas y las inversiones requieren otro libro contable.",tableIndex:null,warnings:[],preview:null};
 const bank=opts.bankLabel.trim();
 if(!bank||bank.length>80||/[\u0000-\u001f\u007f]/.test(bank))
   return {available:false,reason:"Especifica y verifica el banco del extracto para comparar movimientos.",tableIndex:null,warnings:[],preview:null};
 if(!["bank_transfer","debit_card"].includes(opts.paymentMethod))
   return {available:false,reason:"Selecciona un medio de pago bancario admitido.",tableIndex:null,warnings:[],preview:null};
 const ordered=proposals.filter(x=>x.role==="transactions"&&x.confidence>=.75)
   .sort((a,b)=>b.confidence-a.confidence);
 if(!ordered.length)
   return {available:false,reason:"Qwen no encontró una tabla de movimientos con confianza suficiente; revisa las columnas manualmente.",tableIndex:null,warnings:[],preview:null};
 const best=ordered[0]!;
 const table=tables.find(x=>x.index===best.index);
 if(!table)return {available:false,reason:"No se pudo localizar la tabla elegida.",tableIndex:null,warnings:[],preview:null};
 const mapping=mapDocumentTransactions(markdown,table,best);
 if(!mapping.eligible)
   return {available:false,reason:mapping.warnings[0]||"No se pudo preparar una tabla.",tableIndex:best.index,
     warnings:mapping.warnings,preview:null};
 const result=await previewReconciliationV41(db,owner,{
   rows:mapping.rows,
   mapping:{postedAt:"Fecha",description:"Concepto",amount:"Importe",direction:"Tipo",
     currency:"Moneda",externalId:"Referencia"},
   bankLabel:bank,paymentMethod:opts.paymentMethod,
 });
 if(!result.ok)
   return {available:false,reason:"La tabla requiere corrección antes de conciliar.",tableIndex:best.index,
     warnings:mapping.warnings,preview:null};
 return {available:true,reason:"",tableIndex:best.index,warnings:mapping.warnings,
   preview:await result.json()};
}
