import assert from "node:assert/strict";
import {DatabaseSync} from "node:sqlite";
import {readFileSync} from "node:fs";
import {handleQuickRequest} from "../dist/apps/quick-worker/src/index.js";
import {mapDocumentTransactions,normalizeCOP,normalizeStatementDate,
 normalizeDirection,readMarkdownTable,reconciliationFromDocument
} from "../dist/apps/quick-worker/src/statement-document-bridge-v41.js";
import {DASH_HTML} from "../dist/apps/quick-worker/src/dashboard-html.js";
import {DOCUMENT_INSPECT_JS} from "../dist/apps/quick-worker/src/dashboard-document-inspect-js.js";
const db0=new DatabaseSync(":memory:");
for(const m of ["0001_quick_d1","0002_shortcut_devices","0003_accountless_shortcut_expenses",
 "0004_staging_reset_challenges","0005_scoped_reset_confirmation","0006_push_subscriptions",
 "0007_spending_limits","0008_movement_edit_soft_delete","0009_push_test",
 "0010_categories_ai","0011_category_auto_questions","0012_statement_credits",
 "0013_income_capture","0014_verified_balance_snapshots"]){
 db0.exec(readFileSync(new URL("../apps/quick-worker/migrations/"+m+".sql",import.meta.url),"utf8"));
}
const A="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",B="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
db0.prepare("INSERT INTO quick_shortcut_expenses(id,owner_id,client_entry_id,amount_minor,currency,payment_method,kind,occurred_at,merchant,bank_label) VALUES(?,?,?,?,?,?,?,?,?,?)")
 .run("11111111-1111-4111-8111-111111111111",A,"v41-bridge-coffee-0001",200000,"COP","debit_card","purchase","2026-11-10T17:00:00Z","Café existente","Banco Demo");
db0.prepare("INSERT INTO quick_income_entries(id,owner_id,client_entry_id,amount_minor,currency,occurred_at,concept,income_category,payment_method,bank_label) VALUES(?,?,?,?,?,?,?,?,?,?)")
 .run("22222222-2222-4222-8222-222222222222",A,"v41-bridge-payment-0001",120000,"COP","2026-11-11T18:00:00Z","Pago recibido","sales","bank_transfer","Banco Demo");
let selects=0,financialWrites=0;
const db={prepare(sql){
 if(/^\s*SELECT/i.test(sql))selects++;
 if(/^\s*(INSERT|UPDATE|DELETE|ALTER)/i.test(sql) && !sql.includes("quick_ai_daily_quotas"))financialWrites++;
 let args=[];
 return {bind(...v){args=v;return this;},
  async first(){return db0.prepare(sql).get(...args)??null;},
  async all(){return {results:db0.prepare(sql).all(...args)};}
 };
}};
const lines=[
 "## Banco Demo — Extracto de movimientos",
 "### Movimientos de la cuenta",
 "| Fecha | Concepto | Débito | Crédito | Saldo |",
 "| --- | --- | ---: | ---: | ---: |",
 "| 10/11/2026 | Café existente | 2.000 | | 7.000 |",
 "| 11/11/2026 | Pago recibido | | 1.200,00 | 8.200 |",
 "| 12/11/2026 | Abono sin finalidad | | 5.000 | 13.200 |",
 "| 12/11/2026 | Transferencia Hapi | 10.000 | | 3.200 |",
 "| 12/11/2026 | Empanada | 700 | | 2.500 |",
 "| 12/11/2026 | Empanada | 700 | | 1.800 |",
 "| 12/11/2026 | Movimiento confuso | 500 | 100 | 1.400 |",
 "| 14/11/2026 | Cargo USD | USD 45 | | 1.400 |",
 "",
 "### Resumen",
 "| Campo | Valor |",
 "| --- | --- |",
 "| Saldo final | 1.400 |",
].join("\n");
const table={index:0,heading:"Movimientos de la cuenta",headers:["Fecha","Concepto","Débito","Crédito","Saldo"],rowCount:8};
const proposal={index:0,role:"transactions",confidence:.98,
 mapping:{postedAt:"Fecha",description:"Concepto",debit:"Débito",credit:"Crédito",balance:"Saldo",amount:null,
 direction:null,externalId:null,currency:null}};
assert.equal(normalizeStatementDate("10/11/2026"),"2026-11-10");
assert.equal(normalizeStatementDate("31/02/2026"),null);
assert.equal(normalizeCOP("$1.234,50"),"1234.50");
assert.equal(normalizeCOP("COP 1,234.50"),"1234.50");
assert.equal(normalizeCOP("563.921"),"563921");
assert.equal(normalizeCOP("1.23.456"),null);
assert.equal(normalizeCOP("USD 20"),null);
assert.equal(normalizeDirection("DÉBITO"),"debit");
assert.equal(normalizeDirection("Abono"),"credit");
assert.equal(normalizeDirection("Saldo"),null);
assert.equal(readMarkdownTable(lines,0).rows.length,8);
const prepared=mapDocumentTransactions(lines,table,proposal);
assert.equal(prepared.eligible,true);
assert.equal(prepared.rows[0].Fecha,"2026-11-10");
assert.equal(prepared.rows[0].Importe,"2000");
assert.equal(prepared.rows[1].Importe,"1200.00");
assert.equal(prepared.rows[1].Tipo,"credit");
assert.equal(prepared.rows[6].Importe,"INVALIDO","Rows with simultaneous debit and credit must fail");
assert.equal(prepared.rows[7].Importe,"INVALIDO","Foreign currencies must not be COP");
assert.equal(mapDocumentTransactions(lines,table,{...proposal,mapping:{...proposal.mapping,debit:"Saldo"}}).eligible,true,
 "A wrong but plausible model mapping is still only a suggestion, never a write");
assert.equal(mapDocumentTransactions(lines,table,{...proposal,mapping:{...proposal.mapping,debit:"Inventado"}}).eligible,false);
assert.equal(mapDocumentTransactions(lines,{...table,rowCount:51},proposal).eligible,false);
const before=["quick_shortcut_expenses","quick_income_entries","quick_statement_credits",
 "quick_manual_entries","quick_balance_snapshots"].map(t=>db0.prepare("SELECT count(*) n FROM "+t).get().n);
const base="https://finanzasoss-quick-staging.socampoecheverry.workers.dev";
const env={DB:db,ACCESS_AUD:"v41-bridge-test",ALLOW_WRITES:"false",ALLOW_AI_SUGGESTIONS:"true",
 AI:{
   async toMarkdown(x){assert.equal(x.name,"extracto.csv");return {format:"markdown",data:lines};},
   async run(model,input){
     assert.equal(model,"@cf/qwen/qwen3.8-27b");
     assert.ok(!input.messages[1].content.includes("Café existente"));
     return {choices:[{message:{content:JSON.stringify({documentType:"bank_statement",
       explanation:"Tabla bancaria",tables:[proposal,{index:1,role:"summary",confidence:.5,mapping:{},note:"Resumen"}]
     })}}]};
   }
 }};
const principal=user=>({access:{aud:env.ACCESS_AUD,async getIdentity(){return {user_uuid:user};}}});
async function inspect(user=A,bankLabel="Banco Demo",type="bank_statement"){
 const form=new FormData();
 form.append("consent","true");
 form.append("bankLabel",bankLabel);
 form.append("paymentMethod","debit_card");
 form.append("file",new Blob(["Fecha,Concepto,Débito,Crédito,Saldo\n2026-11-10,Café,2000,,7000"],{type:"text/csv"}),"extracto.csv");
 const r=await handleQuickRequest(new Request(base+"/api/quick/v41/ai/document/inspect",
  {method:"POST",headers:{Origin:base},body:form}),env,principal(user));
 return {status:r.status,body:await r.json()};
}
const first=await inspect();
assert.equal(first.status,200,JSON.stringify(first.body));
const rec=first.body.reconciliation;
assert.equal(rec.available,true,JSON.stringify(rec));
assert.equal(rec.tableIndex,0);
assert.equal(rec.preview.canCommit,false);
assert.equal(rec.preview.stored,false);
assert.equal(rec.preview.count,8);
assert.deepEqual(rec.preview.rows.map(x=>x.status),[
 "possible_match","possible_match","needs_purpose","possible_transfer",
 "needs_type","repeated_in_file","needs_correction","needs_correction"]);
assert.equal(rec.preview.rows[0].existing[0].source,"accountless");
assert.equal(rec.preview.rows[1].existing[0].source,"income");
assert.equal(rec.preview.rows[5].repeatOfIndex,4);
assert.equal(rec.preview.rows[6].direction,null);
assert.ok(selects>0);
assert.equal(financialWrites,0);
const others=await inspect(B);
assert.equal(others.status,200);
assert.equal(others.body.reconciliation.preview.rows[0].existing.length,0,"cross-owner data must never leak");
assert.equal(others.body.reconciliation.preview.rows[1].existing.length,0,"credit must not leak");
const absentBank=await inspect(A,"");
assert.equal(absentBank.body.reconciliation.available,false);
assert.match(absentBank.body.reconciliation.reason,/banco/);
const badClassification=await reconciliationFromDocument(db,A,lines,"investment_statement",[table],[proposal],
 {bankLabel:"Banco Demo",paymentMethod:"debit_card"});
assert.equal(badClassification.available,false,"Do not classify investment statements as bank deposits");
assert.deepEqual(["quick_shortcut_expenses","quick_income_entries","quick_statement_credits",
 "quick_manual_entries","quick_balance_snapshots"].map(t=>db0.prepare("SELECT count(*) n FROM "+t).get().n),before,
 "Document reading MUST NOT change financial records");
assert.match(DASH_HTML,/id="ai-document-bank"/);
assert.match(DASH_HTML,/id="ai-document-reconcile"/);
assert.match(DOCUMENT_INSPECT_JS,/body.append\("bankLabel"/);
assert.match(DOCUMENT_INSPECT_JS,/Conciliación previa|coincidencias posibles/);
new Function(DOCUMENT_INSPECT_JS);
db0.close();
console.log("v41 Qwen document-to-reconciliation: signed columns, COP locale, owner isolation, safe preview/no ledger writes PASSED");
