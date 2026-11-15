import { PDF } from "@libpdf/core";
import { HAPI_OUTFLOWS, type HapiActivityKind, type HapiActivityRow } from "./hapi-activity-data.js";

const LIMIT=4_000_000;
const MONTHS=["january","february","march","april","may","june","july","august","september","october","november","december"];
const USD="\\$?\\s*-?(?:\\d{1,3}(?:,\\d{3})+|\\d+)\\.\\d{2}";
const AMOUNTS=new RegExp(USD,"g");
const POSITION=new RegExp("^([A-Z][A-Z0-9./-]{0,15})\\s+(\\d+(?:\\.\\d{1,12})?)\\s+"+USD+"\\s+("+USD+")(?:\\s|$)");
const clean=(value:string)=>value.replace(/[$,\s]/g,"");
const minor=(value:string)=>BigInt(value.replace(".",""));
function periodDate(text:string):string|null{
  const english=[...text.matchAll(/\b([A-Za-z]+) (\d{1,2}), (20\d{2})\b/g)]
    .flatMap(m=>MONTHS.includes(m[1]!.toLowerCase())?[m[3]+"-"+String(MONTHS.indexOf(m[1]!.toLowerCase())+1).padStart(2,"0")+"-"+m[2]!.padStart(2,"0")]:[]);
  if(english.length!==2)return null;
  const [start,end]=english;
  const parsed=new Date(end+"T12:00:00Z");
  return end&&start&&start<=end&&Number.isFinite(+parsed)&&parsed.toISOString().slice(0,10)===end?end:null;
}
export function parseHapiReport(text:string) {
  if(!/\bhapi\b/i.test(text)||!(/\bapex clearing\b/i.test(text)))return null;
  const lines=text.split(/\r?\n/).map(line=>line.trim().replace(/[ \t]+/g," "));
  const dateLine=lines.find(line=>/\bstatement period\b/i.test(line))??lines.find(line=>periodDate(line)!==null);
  const asOf=dateLine?periodDate(dateLine):null;
  const matched=lines.filter(line=>/^total priced portfolio\b/i.test(line)).slice(0,2);
  const totalMatches=matched.length===1?matched[0]!.match(AMOUNTS):null;
  // The overview needs clearly printed opening and closing values on the same row.
  const totalUsd=totalMatches?.length===2?clean(totalMatches[1]!):null;
  const cashLine=lines.filter(line=>/^(?:net cash|cash balance|cash and cash equivalents)\b/i.test(line));
  const cashMatches=cashLine.length===1?cashLine[0]!.match(AMOUNTS):null;
  const cashUsd=cashMatches?.length===2?clean(cashMatches[1]!):null;
  if(!asOf||!totalUsd||!cashUsd)return null;
  const heading=lines.findIndex(line=>/^portfolio summary\b/i.test(line));
  if(heading<0)return null;
  const end=lines.findIndex((line,index)=>index>heading&&/^(?:account activity|funds paid and received|disclosures|cash activity|dividends and interest)\b/i.test(line));
  const section=lines.slice(heading+1,end>=0?end:lines.length);
  if(!section.some(line=>/^(?:asset|symbol|ticker|activo|s[ií]mbolo)\b/i.test(line)&&
    /\b(?:quantity|cantidad)\b/i.test(line)&&/\b(?:value|valor)\b/i.test(line)))return null;
  const positions=section.flatMap(line=>{
    const match=POSITION.exec(line);
    return match?[{symbol:match[1]!,quantity:match[2]!,marketValueUsd:clean(match[3]!)}]:[];
  });
  if(positions.length>60||new Set(positions.map(row=>row.symbol)).size!==positions.length||
    positions.some(row=>row.marketValueUsd.startsWith("-")||!/[1-9]/.test(row.quantity)))return null;
  const value=positions.reduce((sum,row)=>sum+minor(row.marketValueUsd),minor(cashUsd));
  if(value!==minor(totalUsd))return null;
  return {asOf,cashUsd,totalUsd,positions};
}
async function readHapiText(file:File) {
  if(!file.name.toLowerCase().endsWith(".pdf")||file.size<5||file.size>LIMIT)return null;
  const bytes=new Uint8Array(await file.arrayBuffer());
  if(new TextDecoder().decode(bytes.slice(0,5))!=="%PDF-")return null;
  try{
    const pdf=await PDF.load(bytes,{lenient:false});
    if(pdf.isEncrypted||pdf.getPageCount()>20)return null;
    return pdf.getPages().map(page=>page.extractText().text).join("\n");
  }catch{return null;}
}

const activitySection=/^(account activity|funds paid and received|cash activity|dividends and interest)(?:\s*\(continued\))?$/i;
const sectionEnd=/^(portfolio summary|pending settlement|disclosures|realized gain|margin information|tax information|securities positions|important information)\b/i;
const action="(BUY|BOUGHT|SELL|SOLD|DEPOSIT|WITHDRAWAL|DIVIDEND|INTEREST|FEE|COMMISSION|TAX WITHHELD|NON-RESIDENT TAX WITHHELD|REINVEST|REINVESTMENT)";
const dateToken="(20\\d{2}-\\d{2}-\\d{2}|\\d{1,2}/\\d{1,2}/(?:20)?\\d{2})";
const dateFirst=new RegExp("^"+dateToken+"\\s+"+action+"(?=\\b)\\s*(.*)$","i");
const dateSecond=new RegExp("^"+action+"\\s+"+dateToken+"(?=\\s|$)\\s*(.*)$","i");
const dated=new RegExp("^"+dateToken+"(?:\\s|$)");
const amountLabel=new RegExp("\\b(debit|credit|d[eé]bito|cr[eé]dito|amount|importe)\\s*:?\\s*("+USD+")","gi");
const trailingAmount=new RegExp("("+USD+")$");
const kinds:Record<string,HapiActivityKind>={
 BUY:"buy",BOUGHT:"buy",SELL:"sell",SOLD:"sell",DEPOSIT:"deposit",WITHDRAWAL:"withdrawal",
 DIVIDEND:"dividend",INTEREST:"interest",FEE:"fee",COMMISSION:"fee",REINVEST:"reinvestment",REINVESTMENT:"reinvestment",
 "TAX WITHHELD":"tax","NON-RESIDENT TAX WITHHELD":"tax",
};
function activityDate(raw:string){
 const [month,day,year]=raw.split("/");
 const iso=month&&day&&year?
  (year.length===2?"20"+year:year)+"-"+month.padStart(2,"0")+"-"+day.padStart(2,"0"):raw;
 const date=new Date(iso+"T12:00:00Z");
 return Number.isFinite(+date)&&date.toISOString().slice(0,10)===iso?iso:null;
}
type ActivityBlock={action:string;date:string;lines:string[];section:string};
function activityRow(block:ActivityBlock):HapiActivityRow|null {
 const date=activityDate(block.date),kind=kinds[block.action.toUpperCase()];
 if(!date||!kind)return null;
 const out=HAPI_OUTFLOWS.has(kind), text=block.lines.join(" ");
 const labeled=[...text.matchAll(amountLabel)];
 if(labeled.length>1)return null;
 const tail=labeled.length?null:trailingAmount.exec(text);
 if(!labeled.length&&(!tail||Array.from(text.matchAll(AMOUNTS)).length!==1))return null;
 const label=labeled[0]?.[1]?.toLowerCase()??"";
 if((/^d/.test(label)&&!out)||(/^cr/.test(label)&&out))return null;
 const numeric=clean(labeled[0]?.[2]??tail![1]!);
 if(numeric.startsWith("-")&&!out)return null;
 const amountUsd=numeric.replace(/^-/,"").replace(/^0+(?=\d)/,"");
 if(!/^(?:0|[1-9]\d{0,9})\.\d{2}$/.test(amountUsd)||Number(amountUsd)<=0||Number(amountUsd)>1000000000)return null;
 const quantity=/\b(?:qty|quantity|cantidad)\s*:?\s*(\d+(?:\.\d{1,12})?)(?=\s|$)/i.exec(text)?.[1];
 const symbol=/\b(?:symbol|ticker)\s*:\s*([A-Z0-9][A-Z0-9./-]{0,15})(?=\s|$)/i.exec(text)?.[1]?.toUpperCase()??
   /\(([A-Z][A-Z0-9./-]{0,15})\)/.exec(text)?.[1];
 const reference=/\b(?:ref(?:erence)?|transaction id)\s*[:#]\s*([A-Z0-9][A-Z0-9._/-]{0,79})/i.exec(text)?.[1];
 const details=text.slice(0,labeled[0]?.index??tail?.index).replace(/\s*(?:qty|quantity|cantidad|price|precio|symbol|ticker|ref(?:erence)?|transaction id)\s*:.*$/i,"").trim();
 const description=(details||block.action).slice(0,160);
 return {date,kind,description,amountUsd,...(symbol?{symbol}:{}),...(quantity&&/[1-9]/.test(quantity)?{quantity}:{}),...(reference?{reference}:{})};
}
export function parseHapiActivity(text:string){
 if(!/\bhapi\b/i.test(text)||!/\bapex clearing\b/i.test(text))return null;
 const lines=text.split(/\r?\n/).map(line=>line.trim().replace(/[ \t]+/g," "));
 const blocks:ActivityBlock[]=[];
 let section="",active:ActivityBlock|null=null,unread=0;
 for(const line of lines){
   if(!line||/^(page \d+|hapi.*apex clearing)/i.test(line))continue;
   const heading=activitySection.exec(line);
   if(heading){
     section=heading[1]!.toLowerCase();
     if(active?.section!==section)active=null;
     continue;
   }
   if(sectionEnd.test(line)){section="";active=null;continue;}
   if(!section)continue;
   const first=dateFirst.exec(line),second=dateSecond.exec(line);
   if(first||second){
     const m=first??second!;
     active={date:m[first?1:2]!,action:m[first?2:1]!,lines:m[3]?[m[3]]:[],section};
     blocks.push(active);
   }else if(dated.test(line)){unread++;active=null;}
   else if(active&&active.lines.length<8&&!/^(?:date|description|trade date|total)\b/i.test(line))active.lines.push(line);
 }
 const rows:HapiActivityRow[]=[];
 const seenInSection=new Map<string,string>();
 for(const block of blocks){
   const row=activityRow(block);
   if(!row){unread++;continue;}
   const key=JSON.stringify([row.date,row.kind,row.amountUsd,row.symbol??"",row.reference??"",row.description.toLowerCase()]);
   const existing=seenInSection.get(key);
   if(existing&&existing!==block.section){unread++;continue;}
   seenInSection.set(key,block.section);
   rows.push(row);
 }
 return {rows,total:rows.length,unread};
}
export async function readHapiPdf(file:File) {
 const text=await readHapiText(file);
 return text?parseHapiReport(text):null;
}
export async function readHapiActivityPdf(file:File) {
 const text=await readHapiText(file);
 return text?parseHapiActivity(text):null;
}
