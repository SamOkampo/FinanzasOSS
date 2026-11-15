import { PDF } from "@libpdf/core";

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
export async function readHapiPdf(file:File) {
  if(!file.name.toLowerCase().endsWith(".pdf")||file.size<5||file.size>LIMIT)return null;
  const bytes=new Uint8Array(await file.arrayBuffer());
  if(new TextDecoder().decode(bytes.slice(0,5))!=="%PDF-")return null;
  try{
    const pdf=await PDF.load(bytes,{lenient:false});
    if(pdf.isEncrypted||pdf.getPageCount()>20)return null;
    return parseHapiReport(pdf.getPages().map(page=>page.extractText().text).join("\n"));
  }catch{return null;}
}
