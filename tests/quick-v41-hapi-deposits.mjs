import assert from "node:assert/strict";
import {readFileSync,readdirSync} from "node:fs";
import {DatabaseSync} from "node:sqlite";
import {handleQuickRequest} from "../dist/apps/quick-worker/src/index.js";
import {HAPI_JS} from "../dist/apps/quick-worker/src/dashboard-hapi.js";
import {PDF} from "@libpdf/core";
import {parseHapiReport,readHapiPdf} from "../dist/apps/quick-worker/src/hapi-statement-reader.js";

const sql=new DatabaseSync(":memory:");
const migrations=new URL("../apps/quick-worker/migrations/",import.meta.url);
for(const name of readdirSync(migrations).sort())sql.exec(readFileSync(new URL(name,migrations),"utf8"));
const DB={prepare(query){let args=[];return {
  bind(...params){args=params;return this;},
  async first(){return sql.prepare(query).get(...args)??null;},
  async all(){return {results:sql.prepare(query).all(...args)};},
};}};
const A="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",B="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const transfer="11111111-1111-4111-8111-111111111111";
sql.prepare("INSERT INTO quick_statement_review_decisions(id,owner_id,row_key,row_hash,review_digest,bank_label,payment_method,"+
  "direction,occurred_on,amount_minor,description,action,counterparty_label) VALUES(?,?,?,?,?,?,'bank_transfer','debit',?,?,?,'own_transfer','Hapi')")
  .run(transfer,A,"fictitious-row","fictitious-hash","0".repeat(64),"Banco ficticio","2026-10-01",42000000,"Aporte ficticio");
const original=sql.prepare("SELECT * FROM quick_statement_review_decisions").all();
const env={DB,ACCESS_AUD:"hapi-test",ALLOW_WRITES:"true",ALLOW_V41_HAPI:"true"};
async function req(path,data,owner=A,origin="https://qa.example"){
  const init=data?{method:"POST",headers:{Origin:origin,"Content-Type":"application/json"},body:JSON.stringify(data)}:undefined;
  const ctx=owner?{access:{aud:env.ACCESS_AUD,async getIdentity(){return {user_uuid:owner};}}}:{};
  const r=await handleQuickRequest(new Request("https://qa.example/api/quick/v41/hapi/"+path,init),env,ctx);
  assert.match(r.headers.get("Cache-Control"),/no-store/);
  return {status:r.status,data:await r.json()};
}
const initial=await req("deposits");
assert.equal(initial.data.connection,"manual");
assert.equal(initial.data.currency,"USD");
assert.equal(initial.data.origins[0].id,transfer);
assert.equal((await req("deposits",null,B)).data.origins.length,0);
assert.equal((await req("deposits",null,null)).status,401);
const payload={origin:"statement:"+transfer,requestKey:"hapi-fixture-deposit-01",confirmed:true};
assert.equal((await req("deposits",payload,B)).status,404);
assert.equal((await req("deposits",payload,A,"https://wrong.example")).status,403);
assert.equal((await req("deposits",{...payload,confirmed:false})).status,422);
const pending=await req("deposits",payload);
assert.equal(pending.status,201);
assert.equal(pending.data.status,"pending");
assert.equal(pending.data.copMinor,"42000000");
assert.equal((await req("deposits",payload)).data.id,pending.data.id);
assert.equal((await req("deposits",{...payload,requestKey:"hapi-fixture-deposit-02"})).status,409);
const credit={id:pending.data.id,creditedOn:"2026-10-02",usdAmount:"100",feeCop:"5000",reference:"DEMO-001",confirmed:true};
assert.equal((await req("credit",credit,B)).status,404);
assert.equal((await req("credit",{...credit,creditedOn:"2026-09-30"})).status,422);
const credited=await req("credit",credit);
assert.equal(credited.data.usdMinor,"10000");
assert.equal(credited.data.effectiveCopPerUsd,"4200.0000");
assert.equal(credited.data.feeCopMinor,"500000");
assert.deepEqual(await req("credit",credit),credited);
assert.equal((await req("credit",{...credit,usdAmount:"99.25"})).status,409);
const manual=await req("deposits",{bank:"Banco ficticio",debitedOn:"2026-10-01",copAmount:"100000.50",
  requestKey:"hapi-fixture-deposit-03",confirmed:true});
assert.equal(manual.data.copMinor,"10000050");
assert.equal((await req("credit",{...credit,id:manual.data.id})).status,409);
assert.equal((await req("deposits",null,B)).data.items.length,0);
assert.deepEqual(sql.prepare("SELECT * FROM quick_statement_review_decisions").all(),original);
for(const table of ["quick_manual_entries","quick_shortcut_expenses","quick_statement_credits","quick_income_entries"])
  assert.equal(sql.prepare("SELECT count(*) AS n FROM "+table).get().n,0);
const positions=[
  {symbol:"vt",quantity:"0.123456789012",marketValueUsd:"93.11"},
  {symbol:"QQQM",quantity:"1.500000",marketValueUsd:"200.50"},
];
const snapshot={asOf:"2026-10-13",cashUsd:"-1.70",positions,confirmed:true};
assert.equal((await req("portfolio",{...snapshot,confirmed:false})).status,422);
assert.equal((await req("portfolio",{...snapshot,positions:[positions[0],{...positions[0],symbol:"VT"}]})).status,422);
assert.equal((await req("portfolio",{...snapshot,positions:[{...positions[0],quantity:"0.0000000000001"}]})).status,422);
assert.equal((await req("portfolio",{...snapshot,printedTotalUsd:"291.92"})).status,422,"Independent report total must match cent-exact holdings");
const cut=await req("portfolio",{...snapshot,printedTotalUsd:"291.91"});
assert.equal(cut.status,201);
assert.equal(cut.data.cashMinor,"-170");
assert.equal(cut.data.marketValueMinor,"29361");
assert.equal(cut.data.totalMinor,"29191");
assert.equal(cut.data.positions[0].quantity,"1.5");
assert.equal(cut.data.positions[1].quantity,"0.123456789012");
assert.equal((await req("portfolio",{...snapshot,positions:[...positions].reverse()})).data.id,cut.data.id);
assert.equal((await req("portfolio",{...snapshot,cashUsd:"1.70"})).status,409);
await req("portfolio",{...snapshot,asOf:"2026-10-12",cashUsd:"0",positions:[]});
assert.equal((await req("portfolio")).data.latest.id,cut.data.id);
assert.deepEqual((await req("portfolio")).data.history.map(x=>x.asOf),["2026-10-13","2026-10-12"]);
assert.equal((await req("portfolio",null,B)).data.latest,null);
// Synthetic Apex layout with independently reconciled opening/closing totals.
const apexText=[
 "Apex Clearing Corporation", "HAPI", "October 1, 2026 - October 31, 2026",
 "Cash account $0.00 $50.00", "NET ACCOUNT BALANCE 0.00 50.00",
 "Securities 150.00 125.00", "TOTAL PRICED PORTFOLIO 150.00 125.00",
 "Total Equity Holdings $150.00 $175.00",
 "SYMBOL/ ACCOUNT MARKET LAST PERIOD'S EST. ANNUAL % OF TOTAL",
 "DESCRIPTION CUSIP TYPE QUANTITY PRICE VALUE MARKET VALUE % CHANGE INCOME PORTFOLIO",
 "* EXAMPLE FUND TESTA C 0.5 $100.00 $50.00 $60.00 -16 28.57%",
 "EXAMPLE HOLDINGS TESTB C 1.25 60.00 75.00 90.00 -16 42.86%",
 "Total Equities $125.00 $3 71.429%",
 "Total Cash (Net Portfolio Balance) $50.00 28.571%",
 "TOTAL PRICED PORTFOLIO $175.00 $3",
].join("\n");
const apex=parseHapiReport(apexText);
assert.deepEqual(apex,{asOf:"2026-10-31",cashUsd:"50.00",totalUsd:"175.00",positions:[
 {symbol:"TESTA",quantity:"0.5",marketValueUsd:"50.00"},
 {symbol:"TESTB",quantity:"1.25",marketValueUsd:"75.00"}
]});
assert.equal(parseHapiReport(apexText.replace("75.00 90.00","75.01 90.00")),null);
assert.equal(parseHapiReport(apexText.replace("TOTAL PRICED PORTFOLIO $175.00","TOTAL PRICED PORTFOLIO $125.00")),null);
assert.equal(parseHapiReport(apexText.replace("Net Portfolio Balance) $50.00","Net Portfolio Balance) $51.00")),null);
const apexPdf=PDF.create(),apexPage=apexPdf.addPage({size:"letter"});
apexText.split("\n").forEach((row,index)=>apexPage.drawText(row,{x:25,y:765-index*20,fontSize:8}));
assert.deepEqual(await readHapiPdf(new File([await apexPdf.save()],"synthetic-apex.pdf",{type:"application/pdf"})),apex);
console.log("v42.2 Apex Clearing report: overview and holdings reconciliation passed");

const reportText=[
  "Hapi · Apex Clearing", "Statement period: October 1, 2026 - October 31, 2026",
  "Cash Balance $15.00 $10.00", "Total Priced Portfolio $150.00 $210.00",
  "Portfolio Summary", "Symbol Quantity Price Market Value", "VT 1.12345678 $100.00 $112.35",
  "QQQM 0.43825 $200.00 $87.65", "Account Activity", "VT 1.00 $1.00 $1.00",
];
assert.equal(parseHapiReport(reportText.join("\n")).totalUsd,"210.00");
assert.equal(parseHapiReport(reportText.join("\n").replace("$210.00","$210.01")),null);
assert.equal(parseHapiReport(reportText.join("\n").replace("Cash Balance","Buying Power")),null);
const pdf=PDF.create(),page=pdf.addPage({size:"letter"});
reportText.forEach((row,index)=>page.drawText(row.replace("·","/"),{x:32,y:765-index*20,fontSize:11}));
const pdfFile=new File([await pdf.save()],"estado-hapi-ficticio.pdf",{type:"application/pdf"});
const snapshotPreview=await readHapiPdf(pdfFile);
assert.equal(snapshotPreview.positions[0].quantity,"1.12345678");
assert.equal(sql.prepare("SELECT count(*) AS n FROM quick_hapi_portfolio_snapshots").get().n,2);
const imported={asOf:snapshotPreview.asOf,cashUsd:snapshotPreview.cashUsd,positions:snapshotPreview.positions,confirmed:true};
assert.equal((await req("portfolio",imported)).status,201);
assert.equal((await req("portfolio",imported)).status,200);
assert.equal((await req("portfolio",null,B)).data.latest,null);
const fx={copPerUsd:"4100.010000",source:"Reporte ficticio",observedAt:"2026-11-01T04:59:00Z"};
const typed={asOf:"2026-10-31",cashUsd:"-1.50",positions:[
  {...positions[0],assetType:"security",costBasisUsd:"80.00"},
  {symbol:"BTC",quantity:"0.001",marketValueUsd:"15.00",assetType:"crypto",costBasisUsd:"20.00"},
],fx,confirmed:true};
assert.equal((await req("portfolio",{...typed,fx:{...fx,observedAt:"2026-11-01T05:00:00Z"}})).status,422);
assert.equal((await req("portfolio",{...typed,fx:{...fx,copPerUsd:"0"}})).status,422);
assert.equal((await req("portfolio",{...typed,fx:{...fx,source:"   "}})).status,422);
assert.equal((await req("portfolio",{...typed,asOf:"2026-11-01",fx:{...fx,observedAt:"2026-11-01T24:00:00Z"}})).status,422);
const enriched=await req("portfolio",{...typed,asOf:"2026-10-30",fx:{...fx,observedAt:"2026-10-31T04:59:00Z"}});
assert.equal(enriched.status,201);
assert.equal(enriched.data.fx.copPerUsd,"4100.01");
assert.equal(enriched.data.fx.totalCopMinor,"43710207");
assert.deepEqual(enriched.data.allocation,{security:"9311",crypto:"1500",unclassified:"0"});
assert.deepEqual(enriched.data.positions.map(p=>p.unrealizedMinor),["-500","1311"]);
assert.equal((await req("portfolio")).data.latest.fx,null,"Older snapshots do not acquire an unverified rate");
new Function(HAPI_JS);
assert.match(HAPI_JS,/getTextContent/);
assert.match(HAPI_JS,/hapi-text/);
assert.match(HAPI_JS,/printedTotalUsd/);
assert.match(HAPI_JS,/verifiedPdfTotal/);
console.log("v42.2 independent printed-total server guard and rotation-aware local fallback present");
console.log("v41 Hapi: isolated manual COP/USD transfers, explicit confirmations, exact FX, unique source and receipt, no ledger writes PASSED");
