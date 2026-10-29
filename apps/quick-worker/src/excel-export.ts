// Dependency-free, genuine Office Open XML workbook. Binary ZIP contains
// ONLY the authenticated owner's rows; no external references, macros,
// formulas, Google tokens, cached exports or remote links.
import type {QuickD1} from "./index.js";
import {ownerMovements,ruleCategory} from "./categorization.js";
const encoder=new TextEncoder();
const xml=(v:string)=>v.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&apos;"}[c]||c))
 .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,"");
const letter=(n:number)=>{let value=n,s="";do{s=String.fromCharCode(65+value%26)+s;value=Math.floor(value/26)-1;}while(value>=0);return s;};
function sheet(name:string,columns:string[],data:(string|number)[][]):string{
 let lines='<row r="1">'+columns.map((label,i)=>'<c r="'+letter(i)+'1" s="1" t="inlineStr"><is><t>'+xml(label)+'</t></is></c>').join("")+'</row>';
 for(let row=0;row<data.length;row++){
   const cols=data[row].map((val,i)=>{
     const cell=letter(i)+(row+2);
     if(typeof val==="number"&&Number.isFinite(val))return '<c r="'+cell+'" s="2"><v>'+String(val)+'</v></c>';
     return '<c r="'+cell+'" t="inlineStr"><is><t xml:space="preserve">'+xml(String(val))+'</t></is></c>';
   }).join("");
   lines+='<row r="'+(row+2)+'">'+cols+'</row>';
 }
 return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
  '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'+
  '<sheetViews><sheetView workbookViewId="0"/></sheetViews>'+
  '<cols>'+columns.map((_,i)=>'<col min="'+(i+1)+'" max="'+(i+1)+'" width="'+
   ([16,16,38,24,25,18,16,19,22,20,16,20][i]||18)+'" customWidth="1"/>').join("")+'</cols>'+
  '<sheetData>'+lines+'</sheetData><autoFilter ref="A1:'+letter(columns.length-1)+(data.length+1)+'"/></worksheet>';
}
const styles='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
 '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'+
 '<numFmts count="1"><numFmt numFmtId="165" formatCode="#,##0.00"/></numFmts>'+
 '<fonts count="2"><font><sz val="11"/><name val="Aptos"/></font>'+
 '<font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Aptos"/></font></fonts>'+
 '<fills count="3"><fill><patternFill patternType="none"/></fill>'+
 '<fill><patternFill patternType="gray125"/></fill>'+
 '<fill><patternFill patternType="solid"><fgColor rgb="FF23483D"/><bgColor indexed="64"/></patternFill></fill></fills>'+
 '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>'+
 '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'+
 '<cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>'+
 '<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFill="1" applyFont="1"/>'+
 '<xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs>'+
 '</styleSheet>';
function crc32(bytes:Uint8Array):number{
 let c=0xffffffff;for(const v of bytes){c^=v;for(let k=0;k<8;k++)c=c&1?(c>>>1)^0xedb88320:c>>>1;}return (c^0xffffffff)>>>0;
}
function zip(files:Array<{path:string;text:string}>):Uint8Array{
 const locals:Uint8Array[]=[],centrals:Uint8Array[]=[];
 let offset=0;
 const u16=(dv:DataView,i:number,v:number)=>dv.setUint16(i,v,true);
 const u32=(dv:DataView,i:number,v:number)=>dv.setUint32(i,v>>>0,true);
 for(const file of files){
   const name=encoder.encode(file.path),bytes=encoder.encode(file.text),crc=crc32(bytes);
   const header=new Uint8Array(30+name.length),h=new DataView(header.buffer);
   u32(h,0,0x04034b50);u16(h,4,20);u16(h,6,0x800);u16(h,8,0);
   u32(h,14,crc);u32(h,18,bytes.length);u32(h,22,bytes.length);u16(h,26,name.length);
   header.set(name,30);locals.push(header,bytes);
   const c=new Uint8Array(46+name.length),d=new DataView(c.buffer);
   u32(d,0,0x02014b50);u16(d,4,20);u16(d,6,20);u16(d,8,0x800);
   u32(d,16,crc);u32(d,20,bytes.length);u32(d,24,bytes.length);u16(d,28,name.length);
   u32(d,42,offset);c.set(name,46);centrals.push(c);
   offset+=header.length+bytes.length;
 }
 const length=centrals.reduce((n,c)=>n+c.length,0),end=new Uint8Array(22),dv=new DataView(end.buffer);
 u32(dv,0,0x06054b50);u16(dv,8,files.length);u16(dv,10,files.length);
 u32(dv,12,length);u32(dv,16,offset);
 const out=new Uint8Array(offset+length+end.length);
 let position=0;for(const part of [...locals,...centrals,end]){out.set(part,position);position+=part.length;}
 return out;
}
export async function excelExport(db:QuickD1,owner:string):Promise<Response>{
 const entries=await ownerMovements(db,owner,2000);
 const rows:(string|number)[][]=[],totals=new Map<string,{count:number;minor:number}>();
 for(const e of entries){
   const r=ruleCategory(e.merchant||"");
   const category=e.category||r.category,subcategory=e.subcategory||r.subcategory;
   const amount=e.amount_minor/100;
   rows.push([e.occurred_at.slice(0,10),e.occurred_at.slice(11,16),e.merchant||"Sin concepto",
     category,subcategory,amount,e.currency,e.payment_method,e.bank_label||"",
     e.kind,e.classification_source==="manual"?"Confirmada":"Sugerida",e.source]);
   if(e.kind==="purchase"&&e.currency==="COP"){
     const current=totals.get(category)||{count:0,minor:0};
     current.count++;current.minor+=e.amount_minor;totals.set(category,current);
   }
 }
 const summary=[...totals.entries()].sort((a,b)=>b[1].minor-a[1].minor)
  .map(([category,total])=>[category,total.count,total.minor/100]);
 const contentTypes='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
 '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'+
 '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'+
 '<Default Extension="xml" ContentType="application/xml"/>'+
 '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'+
 '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'+
 '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'+
 '<Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>';
 const workbook='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
 '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" '+
 'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'+
 '<sheets><sheet name="Movimientos" sheetId="1" r:id="rId1"/>'+
 '<sheet name="Resumen categorías" sheetId="2" r:id="rId2"/></sheets></workbook>';
 const bytes=zip([
  {path:"[Content_Types].xml",text:contentTypes},
  {path:"_rels/.rels",text:'<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'},
  {path:"xl/workbook.xml",text:workbook},
  {path:"xl/_rels/workbook.xml.rels",text:'<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'},
  {path:"xl/styles.xml",text:styles},
  {path:"xl/worksheets/sheet1.xml",text:sheet("Movimientos",["Fecha","Hora","Concepto","Categoría","Subcategoría","Importe (COP)","Moneda","Método","Banco","Tipo","Categoría estado","Origen"],rows)},
  {path:"xl/worksheets/sheet2.xml",text:sheet("Resumen categorías",["Categoría","Movimientos","Total COP"],summary)},
 ]);
 const date=new Date().toISOString().slice(0,10);
 return new Response(bytes,{status:200,headers:{
  "Content-Type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "Content-Disposition":'attachment; filename="FinanzasOSS-'+date+'.xlsx"',
  "Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff",
  "Content-Security-Policy":"default-src 'none'; frame-ancestors 'none'",
  "Referrer-Policy":"no-referrer",
  "X-Export-Limit":"2000",
 }});
}
