import { PDF } from "@libpdf/core";
import { readDaviviendaPdf } from "./davivienda-pdf.js";

type Page = ReturnType<ReturnType<PDF["getPages"]>[number]["extractText"]>;
type Glyph = {char:string; x:number; right:number};
type Line = {text:string; baseline:number; x:number; glyphs:Glyph[]};
type Column = {kind:"description"|"debit"|"credit"|"amount"|"ignore"; x:number; right:number};
type Direction = "credit"|"debit"|null;
type Movement = {date:string; description:string; amount:string; direction:Direction; page:number};
type Preview = {
  title:string; groups:{title:string; rows:Movement[]}[];
  period?:string; issues:number; totalsDiffer?:boolean;
};
type LayoutResult = {preview:Preview|null; issue?:"no_text"|"page_limit"};

const MONTHS = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
const DATE_PREFIX = /^(\d{4}-\d{2}-\d{2}|\d{1,2}[/.\-]\d{1,2}[/.\-]\d{2,4}|\d{1,2}\s+[a-z]{3,10}\.?\s+\d{4})(?=\s|$)/i;
const MONEY = /(?<![\d,.])(?<sign>[+−-])?\s*(?<currency>COP|USD|EUR|\$|€)?\s*(?<number>(?:\d{1,3}(?:[,.]\d{3})+|\d+)(?:[.,]\d{2}))\s*(?<trailingCurrency>COP|USD|EUR)?\s*(?<trailingSign>[+−-])?\s*$/i;
const AMOUNT_ONLY = /^(?:[+−-]\s*)?(?:(?:COP|USD|EUR|\$|€)\s*)?\d[\d,.]*[.,]\d{2}(?:\s*(?:COP|USD|EUR))?(?:\s*[+−-])?$/i;
const clean = (value:string) => value.replace(/\s+/g," ").trim();
const fold = (value:string) => clean(value.normalize("NFD").replace(/[\u0300-\u036f]/g,"")).toLowerCase();
const signedDirection = (sign:string|undefined):Direction => sign==="+"?"credit":sign?"debit":null;

function dateFromPrinted(value:string):string|null{
  const named = /^(\d{1,2})\s+([a-z]{3,10})\.?\s+(\d{4})$/i.exec(value);
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const numeric = /^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{2,4})$/.exec(value);
  let day:string|undefined,month:string|undefined,year:string|undefined;
  if(named){
    day=named[1];month=String(MONTHS.indexOf(named[2]!.slice(0,3).toLowerCase())+1);year=named[3];
  }else if(iso){[,year,month,day]=iso;}
  else if(numeric){[,day,month,year]=numeric;if(year?.length===2)year="20"+year;}
  if(!day||!month||!year)return null;
  const date=year+"-"+month.padStart(2,"0")+"-"+day.padStart(2,"0");
  const parsed=new Date(date+"T12:00:00Z");
  return Number.isFinite(parsed.getTime())&&parsed.toISOString().slice(0,10)===date?date:null;
}

function linesOnPage(page:Page):Line[]{
  return page.lines.map(line=>{
    const spans=[...line.spans].sort((a,b)=>a.bbox.x-b.bbox.x);
    const glyphs=spans.flatMap(span=>span.chars.map(char=>({char:char.char,
      x:char.bbox.x,right:char.bbox.x+char.bbox.width}))).sort((a,b)=>a.x-b.x);
    return {text:clean(spans.map(span=>span.text).join(" ")),baseline:line.baseline,x:line.bbox.x,glyphs};
  }).filter(line=>line.text);
}

function columnsOnHeader(line:Line):Column[]{
  const text=fold(line.text);
  // LibPDF inserts spaces only in the line text for some producers. The
  // glyph stream may have no separators between adjacent headers.
  const glyphText=line.glyphs.map(glyph=>glyph.char.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase()).join("");
  if(!text.startsWith("fecha"))return [];
  const columns:Column[]=[];
  for(const match of glyphText.matchAll(/descripcion|concepto|detalle|comercio|movimiento|transaccion|debito[s]?|cargo[s]?|credito[s]?|abono[s]?|importe|valor|monto|saldo|cuotas?|inter[eé]s(?:es)?|capital/g)){
    const first=line.glyphs[match.index],last=line.glyphs[match.index+match[0].length-1];
    if(!first||!last)continue;
    const kind=/^(debito|cargo)/.test(match[0])?"debit":/^(credito|abono)/.test(match[0])?"credit":
      /^(importe|valor|monto)$/.test(match[0])?"amount":
      /^(descripcion|concepto|detalle|comercio|movimiento|transaccion)$/.test(match[0])?"description":"ignore";
    columns.push({kind,x:first.x,right:last.right});
  }
  return columns;
}

function readMultiAmount(line:Line,columns:Column[]):{description:string; data:Record<string,string>; direction:Direction}|null{
  const descriptionColumn=columns.find(column=>column.kind==="description");
  const numeric=columns.filter(column=>column.kind!=="description");
  if(!descriptionColumn||numeric.length<2)return null;
  const clusters:Glyph[][]=[];
  for(const glyph of line.glyphs.filter(glyph=>glyph.char.trim())){
    const current=clusters.at(-1),previous=current?.at(-1);
    if(current&&previous&&glyph.x-previous.right<13)current.push(glyph);
    else clusters.push([glyph]);
  }
  const textOf=(cluster:Glyph[])=>clean(line.glyphs.filter(glyph=>glyph.x>=cluster[0]!.x&&
    glyph.x<=cluster.at(-1)!.x).map(glyph=>glyph.char).join(""));
  const description=clusters.filter(cluster=>cluster[0]!.x>=descriptionColumn.x-10&&
    cluster[0]!.x<numeric[0]!.x-42).map(textOf).join(" ");
  const values=clusters.flatMap<{column:Column|undefined;data:Record<string,string>|undefined}>(cluster=>{
    const start=cluster[0]!.x,end=cluster.at(-1)!.right;
    if(start<numeric[0]!.x-42)return [];
    const distance=(column:Column)=>Math.min(Math.abs(start-column.x),Math.abs(end-column.right));
    const [column,alternate]=[...numeric].sort((a,b)=>distance(a)-distance(b));
    if(!column||distance(column)>42||alternate&&distance(alternate)-distance(column)<5)
      return [{column,data:undefined}];
    const text=textOf(cluster);
    if(column.kind==="ignore"||/^(?:\$\s*)?0+(?:[.,]00)?$/.test(text))return [];
    const amount=MONEY.exec(text);
    return [{column,data:amount?.index===0?amount.groups:undefined}];
  });
  const value=values.length===1?values[0]:undefined;
  if(!description||!value?.data||!value.column)return null;
  const columnType=value.column.kind==="debit"?"debit":value.column.kind==="credit"?"credit":null;
  const sign=signedDirection(value.data.sign||value.data.trailingSign);
  if(value.data.sign&&value.data.trailingSign&&value.data.sign!==value.data.trailingSign)return null;
  if(sign&&columnType&&sign!==columnType)return null;
  return {description,data:value.data,direction:columnType||sign};
}

function readTextTables(pages:Page[]):Preview|null{
  const first=fold(pages[0]?.text||"");
  const rappi=/\brappicuenta\b/.test(first);
  const card=/\btarjeta (?:de )?credito\b/.test(first);
  const rows:Movement[]=[];
  let issues=0, inTable=false, multiAmount=false;
  let columns:Column[]=[];
  for(const [pageIndex,page] of pages.entries()){
    const lines=linesOnPage(page);
    const matchedAmounts=new Set<Line>();
    for(const line of lines){
      const text=fold(line.text);
      if(/\bfecha\b.*\b(descripcion|concepto|detalle|comercio|movimiento|transaccion)\b.*\b(valor|importe|monto|cargos?|debitos?|creditos?|abonos?)\b/.test(text)){
        inTable=true;
        columns=columnsOnHeader(line);
        multiAmount=columns.filter(column=>column.kind!=="description").length>1||/\b(saldo|cuotas?|interes(?:es)?|capital)\b/.test(text)||/\b(debitos?|cargos?)\b.*\b(creditos?|abonos?)\b|\b(creditos?|abonos?)\b.*\b(debitos?|cargos?)\b/.test(text);
        continue;
      }
      if(/^(?:saldo final|resumen (?:del|de)|total (?:pagado|a pagar|movimientos)|contactanos)\b/.test(text))inTable=false;
      const printedDate=DATE_PREFIX.exec(line.text)?.[1];
      if(!inTable || !printedDate)continue;
      const date=dateFromPrinted(printedDate);
      if(multiAmount){
        const movement=readMultiAmount(line,columns);
        if(!date||!movement){issues++;continue;}
        const {data}=movement;
        rows.push({date,description:movement.description,
          amount:[data.currency,data.number,data.trailingCurrency].filter(Boolean).join(" "),
          direction:movement.direction,page:pageIndex+1});
        continue;
      }
      let rest=clean(line.text.slice(printedDate.length));
      let amount=MONEY.exec(rest);
      // A line break in the PDF can place a right-aligned amount on its own
      // baseline. Only pair within this page, within 5 points and to the right.
      if(!amount){
        const nearby=lines.filter(candidate=>candidate.x>page.width*.6 &&
          Math.abs(candidate.baseline-line.baseline)<=5 && AMOUNT_ONLY.test(candidate.text));
        const candidate=nearby.length===1?nearby[0]:undefined;
        if(candidate&&!matchedAmounts.has(candidate)){
          matchedAmounts.add(candidate);
          rest+=" "+candidate.text;
          amount=MONEY.exec(rest);
        }
      }
      const data=amount?.groups;
      const description=amount?rest.slice(0,amount.index).trim():"";
      if(!date||!description||!data?.number||data.sign&&data.trailingSign&&data.sign!==data.trailingSign){
        issues++;
        continue;
      }
      rows.push({date,description,amount:[data.currency,data.number,data.trailingCurrency].filter(Boolean).join(" "),
        direction:signedDirection(data.sign||data.trailingSign),page:pageIndex+1});
    }
  }
  if(!rows.length)return null;
  const unsigned=rows.filter(row=>!row.direction).length;
  const summary = rappi ? /\bAbonos\s*\+?\$\s*([\d,]+\.\d{2})[\s\S]*?\bRetiros\s*-?\$\s*([\d,]+\.\d{2})/i.exec(pages[0]?.text||"") : null;
  const sum = (direction:Direction)=>rows.filter(row=>row.direction===direction)
    .reduce((total,row)=>total+Number(row.amount.replace(/[^\d]/g,"")),0);
  const totalsDiffer=Boolean(summary && (sum("credit")!==Number(summary[1]!.replace(/[^\d]/g,""))||
    sum("debit")!==Number(summary[2]!.replace(/[^\d]/g,""))));
  const start=rows[0]!.date.slice(0,7);
  return {title:rappi?"Movimientos de RappiCuenta":card?"Movimientos de tarjeta":"Movimientos del extracto",
    groups:[{title:rappi?"Cuenta de ahorros":card?"Tarjeta de crédito":"Movimientos",rows}],
    ...(rows.every(row=>row.date.startsWith(start))?{period:start}:{}),issues:issues+unsigned,totalsDiffer};
}

export async function readStatementPdf(bytes:Uint8Array):Promise<LayoutResult>{
  const pdf=await PDF.load(bytes,{lenient:false});
  if(pdf.isEncrypted)return {preview:null};
  if(pdf.getPageCount()>20)return {preview:null,issue:"page_limit"};
  const pages=pdf.getPages().map(page=>page.extractText());
  const davivienda=await readDaviviendaPdf(bytes,pages);
  if(davivienda){
    const groups=[{title:"Cuenta de ahorros",rows:davivienda.savings},{title:"Bolsillo",rows:davivienda.pocket}];
    return {preview:{title:"Movimientos de Davivienda",period:davivienda.period,
      groups:groups.map(group=>({title:group.title,rows:group.rows.map(row=>({...row,amount:"$"+row.amount}))})),
      issues:davivienda.issues,totalsDiffer:davivienda.savingsTotals==="mismatch"}};
  }
  if(pages.every(page=>!page.text.trim()))return {preview:null,issue:"no_text"};
  return {preview:readTextTables(pages)};
}
