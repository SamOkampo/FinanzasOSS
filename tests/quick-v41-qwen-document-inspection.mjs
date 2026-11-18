import assert from "node:assert/strict";
import {DatabaseSync} from "node:sqlite";
import {readFileSync} from "node:fs";
import {handleQuickRequest} from "../dist/apps/quick-worker/src/index.js";
import {scanDocumentTables,validateDocumentInference} from "../dist/apps/quick-worker/src/document-inspection-v41.js";
import {QWEN_MODEL,qwenJson} from "../dist/apps/quick-worker/src/ai-model.js";
import {DASH_HTML} from "../dist/apps/quick-worker/src/dashboard-html.js";
import {DOCUMENT_INSPECT_JS} from "../dist/apps/quick-worker/src/dashboard-document-inspect-js.js";
const sql=new DatabaseSync(":memory:");
for(const n of ["0001_quick_d1","0002_shortcut_devices","0003_accountless_shortcut_expenses",
 "0004_staging_reset_challenges","0005_scoped_reset_confirmation","0006_push_subscriptions",
 "0007_spending_limits","0008_movement_edit_soft_delete","0009_push_test",
 "0010_categories_ai","0011_category_auto_questions","0012_statement_credits",
 "0013_income_capture","0014_verified_balance_snapshots"])
 sql.exec(readFileSync(new URL("../apps/quick-worker/migrations/"+n+".sql",import.meta.url),"utf8"));
const A="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", B="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const db={prepare(query){let args=[];return {
 bind(...p){args=p;return this;},
 async first(){return sql.prepare(query).get(...args)??null;},
 async all(){return {results:sql.prepare(query).all(...args)};}
};}};
const markdown=`## Extracto Banco de Prueba

Cuenta 123456789012. Saldo COP 563.921.

### Tabla de movimientos
| Fecha | Descripción | Débito | Crédito | Saldo |
| :--- | :--- | ---: | ---: | ---: |
| 2026-11-10 | Café de prueba | 2.000 | | 563.921 |
| 2026-11-11 | Transferencia | | 4.000 | 567.921 |

### Resumen de cuenta
| Tipo | Valor |
| --- | --- |
| Saldo inicial | 565.921 |
`;
const scan=scanDocumentTables(markdown);
assert.equal(scan.tables.length,2);
assert.equal(scan.tables[0].rowCount,2);
assert.deepEqual(scan.tables[0].headers,["Fecha","Descripción","Débito","Crédito","Saldo"]);
assert.equal(scan.tables[1].rowCount,1);
const parsed=validateDocumentInference({documentType:"bank_statement",tables:[{
 index:0,role:"transactions",confidence:0.93,
 mapping:{postedAt:"Fecha",description:"Descripción",credit:"Crédito",balance:"Saldo",
  externalId:"FALSO - NO ESTA EN EXTRACTO"}
}]},scan.tables);
assert.equal(parsed.tables[0].mapping.externalId,null,"hallucinated column is rejected");
assert.equal(parsed.tables[1].role,"other");
assert.equal(qwenJson({choices:[{message:{content:'```json\n{"documentType":"bank_statement"}\n```'}}]}).documentType,"bank_statement");
assert.equal(QWEN_MODEL,"@cf/qwen/qwen3.8-27b");
let convertCount=0,modelCount=0;
const ai={
 async toMarkdown(file){
  convertCount++;
  assert.equal(file.name,"extracto.csv","no original filename sent to conversion");
  assert.ok(file.blob instanceof Blob);
  return {name:file.name,format:"markdown",data:markdown};
 },
 async run(model,input){
  modelCount++;
  assert.equal(model,QWEN_MODEL);
  assert.equal(input.stream,false);
  assert.ok(input.max_completion_tokens>=800);
  const prompt=input.messages[1].content;
  assert.match(prompt,/Tabla de movimientos/);
  assert.ok(!prompt.includes("563.921"),"raw amounts cannot be passed to Qwen");
  assert.ok(!prompt.includes("123456789012"),"account identifiers cannot be passed to Qwen");
  assert.ok(!prompt.includes("Café de prueba"),"transaction descriptions cannot be passed to Qwen");
  return {choices:[{message:{content:'```json\n'+JSON.stringify({
    documentType:"bank_statement",explanation:"Extracto bancario con tabla de movimientos",
    tables:[{index:0,role:"transactions",confidence:0.95,
      mapping:{postedAt:"Fecha",description:"Descripción",debit:"Débito",credit:"Crédito",
        balance:"Saldo",amount:"Inexistente"},note:"Revisar columna crédito y débito"},
      {index:1,role:"summary",confidence:0.6,mapping:{amount:"Valor"},note:"Saldo resumido"}]
  })+'\n```'} }]};
 }
};
const base="https://finanzasoss-quick-staging.socampoecheverry.workers.dev";
const env={DB:db,ACCESS_AUD:"v41-document-test",ALLOW_WRITES:"false",ALLOW_AI_SUGGESTIONS:"true",AI:ai};
const principal=user=>({access:{aud:env.ACCESS_AUD,async getIdentity(){return {user_uuid:user};}}});
function form(approve=true,name="bank.csv",body="Fecha,Descripción,Débito,Crédito,Saldo\n2026-11-10,Café,2000,,563921"){
 const fd=new FormData();
 fd.append("file",new Blob([body],{type:"text/csv"}),name);
 if(approve)fd.append("consent","true");
 return fd;
}
async function call(f=form(),user=A,origin=base,extra=env){
 const response=await handleQuickRequest(new Request(base+"/api/quick/v41/ai/document/inspect",{
  method:"POST",headers:{Origin:origin},body:f
 }),extra,principal(user));
 return {status:response.status,data:await response.json()};
}
const counts=()=>["quick_shortcut_expenses","quick_manual_entries","quick_income_entries",
 "quick_statement_credits","quick_balance_snapshots","quick_movement_categories"]
 .map(t=>sql.prepare("SELECT count(*) n FROM "+t).get().n);
const before=counts();
assert.equal((await call(form(false))).status,403,"Explicit consent mandatory");
assert.equal(convertCount,0);
assert.equal((await call(form(),A,"https://evil.invalid")).status,403,"Origin required");
assert.equal(convertCount,0);
const anon=await handleQuickRequest(new Request(base+"/api/quick/v41/ai/document/inspect",{
 method:"POST",headers:{Origin:base},body:form()
}),env,{});
assert.equal(anon.status,401);
assert.equal((await call(form(true,"invalid.pdf","not pdf"))).status,422);
assert.equal((await call(form(true,"too-large.csv","x".repeat(4000001)))).status,413);
assert.equal(convertCount,0);
const p=await call();
assert.equal(p.status,200,JSON.stringify(p.data));
assert.equal(p.data.documentType,"bank_statement");
assert.equal(p.data.model,"@cf/qwen/qwen3.8-27b");
assert.equal(p.data.tables.length,2);
assert.equal(p.data.tables[0].analysis.mapping.debit,"Débito");
assert.equal(p.data.tables[0].analysis.mapping.amount,null,"model cannot add fake columns");
assert.equal(p.data.tables[1].analysis.role,"summary");
assert.equal(p.data.stored,false);
assert.equal(p.data.financialRecordsModified,false);
assert.equal(p.data.canCommit,false);
assert.equal(p.data.requiresManualReview,true);
assert.equal(convertCount,1);
assert.equal(modelCount,1);
assert.deepEqual(counts(),before,"No financial tables changed");
const p2=await call(form(),B);
assert.equal(p2.status,200,"Second owner can inspect independently");
assert.deepEqual(counts(),before);
const quota=sql.prepare("SELECT owner_id,hits FROM quick_ai_daily_quotas ORDER BY owner_id").all();
assert.deepEqual(quota.map(x=>x.hits),[1,1]);
const disabled=await call(form(),A,base,{...env,ALLOW_AI_SUGGESTIONS:"false"});
assert.equal(disabled.status,503,"Model must remain switchable off");
const errorAi={...ai,async toMarkdown(){return {format:"error"};}};
const unreadable=await call(form(true,"ficticio.pdf","%PDF-1.7 ficticio"),A,base,{...env,AI:errorAi});
assert.equal(unreadable.status,422);
assert.equal(unreadable.data.code,"document_unreadable");
assert.match(unreadable.data.error,/PDF original del banco/);
assert.deepEqual(counts(),before);

const dashboard=async extra=>handleQuickRequest(new Request(base+"/dashboard"),extra,principal(A));
const isolatedAnalysis={...env,ALLOW_AI_SUGGESTIONS:"false",ALLOW_DOCUMENT_ANALYSIS:"true"};
assert.match(await (await dashboard(isolatedAnalysis)).text(),/data-analysis-available="true"/);
assert.match(await (await dashboard({...isolatedAnalysis,ALLOW_DOCUMENT_ANALYSIS:"false"})).text(),
 /data-analysis-available="false"/);
assert.ok(DASH_HTML.indexOf('id="ai-document-pick"')<DASH_HTML.indexOf('Importar CSV manualmente'));
assert.match(DASH_HTML,/id="ai-document-password-open"[^>]+aria-controls="ai-document-password-form"/);
assert.match(DASH_HTML,/id="ai-document-consent"/);
assert.match(DASH_HTML,/\/document-inspect\.js/);
assert.match(DOCUMENT_INSPECT_JS,/\/api\/quick\/v41\/ai\/document\/inspect/);
assert.ok(!DOCUMENT_INSPECT_JS.includes("localStorage"));
new Function(DOCUMENT_INSPECT_JS);
sql.close();
console.log("v41 Qwen document inspector: PDF/Excel/CSV structure, consent, isolation, no writes, PII minimization, Qwen3.8 PASSED");
