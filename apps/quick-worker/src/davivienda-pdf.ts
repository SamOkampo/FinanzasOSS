import { PDF } from "@libpdf/core";

export type DaviviendaRow = {
  date: string;
  amount: string;
  direction: "debit" | "credit";
  document: string;
  description: string;
};
export type DaviviendaStatement = {
  period: string;
  savings: DaviviendaRow[];
  pocket: DaviviendaRow[];
  issues: number;
  savingsTotals: "match" | "mismatch" | "unavailable";
};

const MONTHS = ["enero","febrero","marzo","abril","mayo","junio",
  "julio","agosto","septiembre","octubre","noviembre","diciembre"];
const HEADER = /^fecha valor doc\.? clase de movimiento oficina$/i;
const MOVEMENT = /^(\d{2})\s+(\d{2})\s+\$\s*((?:\d{1,3}(?:,\d{3})+|\d+)\.\d{2})\s*([+−-])\s+(\d{1,16})\s+(\S.*)$/u;

const toCents = (amount: string) => Number(amount.replace(".",""));

export async function readDaviviendaPdf(bytes: Uint8Array): Promise<DaviviendaStatement|null> {
  const pdf = await PDF.load(bytes, {lenient: false});
  if(pdf.isEncrypted || pdf.getPageCount()>20)return null;
  const pages = pdf.getPages().map(page=>page.extractText().lines.map(line=>{
    const spans = line.spans;
    return {
      spans,
      text: spans.map(span=>span.text).join(" ").replace(/\s+/g," ").trim(),
      // The office is a separate text span in this format. Keep the movement
      // description and document number, even when they share a PDF span.
      movement: spans.filter(span=>span.bbox.x<445)
        .map(span=>span.text).join(" ").replace(/\s+/g," ").trim(),
    };
  }));
  const first = pages[0]?.map(line=>line.text).join("\n")||"";
  if(!/\bBanco Davivienda S\.?\s*A\.?\b/i.test(first) ||
    !/^EXTRACTO CUENTA DE AHORROS$/im.test(first))return null;
  const report = /\bINFORME DEL MES:\s*([a-z]+)\s*\/\s*(20\d\d)\b/i.exec(first);
  const month = MONTHS.indexOf(report?.[1]?.toLowerCase()||"")+1;
  if(!month||!report?.[2])return null;
  const period = report[2]+"-"+String(month).padStart(2,"0");
  const statement: DaviviendaStatement = {period,savings:[],pocket:[],issues:0,savingsTotals:"unavailable"};
  let section: "savings" | "pocket" = "savings";
  for(const page of pages){
    let insideTable = false;
    for(const line of page){
      if(/^EXTRACTO BOLSILLO\b/i.test(line.text)){
        section = "pocket";
        insideTable = false;
      }
      if(HEADER.test(line.text)){insideTable=true;continue;}
      if(!insideTable || !/^\d{2}\s+\d{2}\s/.test(line.text))continue;
      const match = MOVEMENT.exec(line.movement);
      const date = period+"-"+(match?.[1]||"00");
      const dateObj = new Date(date+"T12:00:00Z");
      const dateMatches = Number.isFinite(dateObj.getTime()) && dateObj.toISOString().slice(0,10)===date;
      if(!match||Number(match[2])!==month||!dateMatches){
        statement.issues++;
        continue;
      }
      statement[section].push({date,amount:match[3]!.replace(/,/g,""),
        direction:match[4]==="+"?"credit":"debit",document:match[5]!,description:match[6]!});
    }
  }
  const firstSpans = pages[0]?.flatMap(line=>line.spans)||[];
  const totals = (["Más Créditos","Menos Débitos"] as const).map(label=>{
    const inline = pages[0]?.find(line=>line.text.startsWith(label+" $"));
    const onLine = inline?.text.slice(label.length).trim();
    if(onLine && /^\$\s*[\d,]+\.\d{2}$/.test(onLine))return toCents(onLine.replace(/[^\d.]/g,""));
    const heading = firstSpans.find(span=>span.text.trim()===label);
    if(!heading)return null;
    const amount = firstSpans.find(span=>span.bbox.x>heading.bbox.x&&
      Math.abs(span.bbox.y-heading.bbox.y)<=4&&/^\$\s*[\d,]+\.\d{2}$/.test(span.text.trim()));
    return amount ? toCents(amount.text.replace(/[^\d.]/g,"")) : null;
  });
  if(totals.every(value=>value!==null)){
    const credit = statement.savings.filter(row=>row.direction==="credit").reduce((sum,row)=>sum+toCents(row.amount),0);
    const debit = statement.savings.filter(row=>row.direction==="debit").reduce((sum,row)=>sum+toCents(row.amount),0);
    statement.savingsTotals = credit===totals[0]&&debit===totals[1]?"match":"mismatch";
  }
  return statement.savings.length||statement.pocket.length ? statement : null;
}
