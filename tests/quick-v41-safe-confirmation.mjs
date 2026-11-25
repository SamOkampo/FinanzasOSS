import assert from "node:assert/strict";
import {DatabaseSync} from "node:sqlite";
import {readFileSync} from "node:fs";
import {handleQuickRequest} from "../dist/apps/quick-worker/src/index.js";
import {DASH_HTML} from "../dist/apps/quick-worker/src/dashboard-html.js";
import {REVIEW_CONFIRM_JS} from "../dist/apps/quick-worker/src/dashboard-review-confirm-v41-js.js";

const sqlDb=new DatabaseSync(":memory:");
for(const name of ["0001_quick_d1","0002_shortcut_devices","0003_accountless_shortcut_expenses",
 "0004_staging_reset_challenges","0005_scoped_reset_confirmation","0006_push_subscriptions",
 "0007_spending_limits","0008_movement_edit_soft_delete","0009_push_test",
 "0010_categories_ai","0011_category_auto_questions","0012_statement_credits",
 "0013_income_capture","0014_verified_balance_snapshots",
 "0015_statement_review_confirmations","0019_agent_operational_alerts","0021_statement_review_drafts"]){
 sqlDb.exec(readFileSync(new URL("../apps/quick-worker/migrations/"+name+".sql",import.meta.url),"utf8"));
}
const store={
 prepare(query){
  let params=[];return {
   query,get params(){return params;},
   bind(...v){params=v;return this;},
   async first(){return sqlDb.prepare(query).get(...params)??null;},
   async all(){return {results:sqlDb.prepare(query).all(...params)};}
  };
 },
 async batch(statements){
  const output=[];sqlDb.exec("BEGIN");
  try{
   for(const stmt of statements){
    const result=sqlDb.prepare(stmt.query).run(...stmt.params);
    output.push({meta:{changes:result.changes}});
   }
   sqlDb.exec("COMMIT");return output;
  }catch(error){sqlDb.exec("ROLLBACK");throw error;}
 }
};
const A="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const B="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const seedId="11111111-1111-4111-8111-111111111111";
sqlDb.prepare("INSERT INTO quick_shortcut_expenses(id,owner_id,client_entry_id,amount_minor,currency,payment_method,kind,occurred_at,merchant,bank_label) VALUES(?,?,?,?,?,?,?,?,?,?)")
 .run(seedId,A,"existing-coffee-source",200000,"COP","debit_card","purchase",
  "2026-11-10T17:00:00.000Z","Cafe registrado","Banco Demo");
const url="https://finanzasoss-quick-staging.socampoecheverry.workers.dev";
const env={DB:store,ALLOW_WRITES:"true",ALLOW_V41_CONFIRM_WRITES:"true",ACCESS_AUD:"review-v41-test"};
const principal=id=>({access:{aud:env.ACCESS_AUD,async getIdentity(){return {user_uuid:id};}}});
async function call(path,user=A,body=null,options={}){
 const request=new Request(url+path,{method:body?"POST":"GET",
   ...(body?{headers:{Origin:url,"Content-Type":"application/json"},body:JSON.stringify(body)}:{})});
 const resp=await handleQuickRequest(request,{...env,...options},principal(user));
 return {status:resp.status,body:await resp.json()};
}
const rows=[
 {Fecha:"2026-11-10",Concepto:"Cafe registrado",Importe:"2000.00",Tipo:"debit",Referencia:"TX-001"},
 {Fecha:"2026-11-11",Concepto:"Transferencia Hapi",Importe:"10000",Tipo:"debit",Referencia:"TX-002"},
 {Fecha:"2026-11-12",Concepto:"Abono por aclarar",Importe:"5000",Tipo:"credit",Referencia:"TX-003"},
 {Fecha:"2026-11-12",Concepto:"Compra pan",Importe:"700",Tipo:"debit",Referencia:"TX-004"}
];
const input={rows,bankLabel:"Banco Demo",paymentMethod:"debit_card",
 mapping:{postedAt:"Fecha",description:"Concepto",amount:"Importe",direction:"Tipo",externalId:"Referencia"}};
const preview=await call("/api/quick/v41/reconcile/preview",A,input,{ALLOW_WRITES:"false"});
assert.equal(preview.status,200,JSON.stringify(preview.body));
assert.match(preview.body.reviewDigest,/^[a-f0-9]{64}$/);
assert.equal(preview.body.stored,false);
assert.equal(preview.body.rows[0].existing[0].id,seedId);
const draftPath="/api/quick/v41/reconcile/draft", draftEnv={ALLOW_V41_REVIEW_DRAFTS:"true"};
assert.equal((await call(draftPath,A,input)).status,503);
const storedDraft=await call(draftPath,A,{...input,rows:rows.map(row=>({...row,Extra:"No guardar columna sin asignar"}))},draftEnv);
assert.equal(storedDraft.status,200);
assert.equal(storedDraft.body.pending,4);
assert.equal((await call(draftPath,A,input,draftEnv)).body.id,storedDraft.body.id);
const resumePath=draftPath+"?id="+storedDraft.body.id;
assert.equal((await call(resumePath,B,null,draftEnv)).status,404);
const resume=await call(resumePath,A,null,draftEnv);
assert.equal(resume.body.result.reviewDigest,preview.body.reviewDigest);
assert.deepEqual(resume.body.result.rows.map(row=>row.index),[0,1,2,3]);
assert.ok(resume.body.input.rows.every(row=>!Object.hasOwn(row,"Extra")));
const decisions=[
 {index:0,action:"already_exists",existingSource:"accountless",existingId:seedId},
 {index:1,action:"own_transfer",counterpartyLabel:"Hapi bróker USD"},
 {index:2,action:"import"},
 {index:3,action:"import"}
];
const body={...input,expectedDigest:preview.body.reviewDigest,confirmed:true,decisions};
const before=sqlDb.prepare("SELECT count(*) AS n FROM quick_shortcut_expenses").get().n;
assert.equal((await call("/api/quick/v41/reconcile/confirm",A,body,
 {ALLOW_V41_CONFIRM_WRITES:"false"})).status,503);
assert.equal((await call("/api/quick/v41/reconcile/confirm",A,body,
 {ALLOW_WRITES:"false"})).status,503);
assert.equal(sqlDb.prepare("SELECT count(*) AS n FROM quick_statement_review_decisions").get().n,0);
const firstDecision=await call("/api/quick/v41/reconcile/confirm",A,{...body,decisions:[decisions[0]]});
assert.equal(firstDecision.status,200);
const remaining=await call(resumePath,A,null,draftEnv);
assert.deepEqual(remaining.body.result.rows.map(row=>row.index),[1,2,3]);
assert.equal(remaining.body.input.rows.length,4,"Resume preserves original indexes and confirmation fingerprint");
const saved=await call("/api/quick/v41/reconcile/confirm",A,body);
assert.equal(saved.status,200,JSON.stringify(saved.body));
assert.equal(saved.body.created,3);
assert.equal(saved.body.imported,2);
assert.equal(saved.body.ownTransfers,1);
assert.equal((await call(resumePath,A,null,draftEnv)).body.result.count,0);
await call(draftPath+"/discard",B,{id:storedDraft.body.id,confirmed:true},draftEnv);
assert.equal((await call(resumePath,A,null,draftEnv)).status,200);
assert.equal((await call(draftPath+"/discard",A,{id:storedDraft.body.id},draftEnv)).status,422);
await call(draftPath+"/discard",A,{id:storedDraft.body.id,confirmed:true},draftEnv);
assert.equal((await call(resumePath,A,null,draftEnv)).status,404);

assert.equal(sqlDb.prepare("SELECT count(*) AS n FROM quick_shortcut_expenses").get().n,before+1);
assert.equal(sqlDb.prepare("SELECT count(*) AS n FROM quick_statement_credits").get().n,1);
assert.equal(sqlDb.prepare("SELECT economic_purpose FROM quick_statement_credits").get().economic_purpose,"pending");
assert.equal(sqlDb.prepare("SELECT count(*) AS n FROM quick_income_entries").get().n,0);
assert.equal(sqlDb.prepare("SELECT count(*) AS n FROM quick_statement_review_audit").get().n,4);
assert.equal(sqlDb.prepare("SELECT count(*) AS n FROM quick_statement_review_decisions WHERE action='own_transfer'").get().n,1);
assert.equal((await call("/api/quick/v41/reconcile/confirm",A,body)).body.replayed,4,
 "identical confirmation must replay");
assert.equal(sqlDb.prepare("SELECT count(*) AS n FROM quick_statement_review_audit").get().n,4);
assert.equal(sqlDb.prepare("SELECT count(*) AS n FROM quick_shortcut_expenses").get().n,before+1);
const conflict=await call("/api/quick/v41/reconcile/confirm",A,
 {...body,decisions:[{index:1,action:"import"}]});
assert.equal(conflict.status,409);
const badDigest=await call("/api/quick/v41/reconcile/confirm",A,
 {...body,expectedDigest:"0".repeat(64)});
assert.equal(badDigest.status,409);
const omitted=await call("/api/quick/v41/reconcile/confirm",A,
 {...body,confirmed:false});
assert.equal(omitted.status,422);
const wrongMatch=await call("/api/quick/v41/reconcile/confirm",A,
 {...body,decisions:[{index:0,action:"already_exists",existingSource:"accountless",existingId:"a-fake-id"}]});
assert.equal(wrongMatch.status,409);
const noOverride=await call("/api/quick/v41/reconcile/confirm",A,
 {...body,decisions:[{index:0,action:"import"}]});
assert.equal(noOverride.status,409);
const aHistory=await call("/api/quick/v41/reconcile/history",A);
const bHistory=await call("/api/quick/v41/reconcile/history",B);
assert.equal(aHistory.status,200);
assert.equal(aHistory.body.count,4);
assert.equal(bHistory.body.count,0,"owner isolation on audit");
const bPreview=await call("/api/quick/v41/reconcile/preview",B,input);
assert.equal(bPreview.body.rows[0].existing.length,0,"owner isolation on matches");
const duplicateRef=[{...rows[0],Referencia:"DUP"}, {...rows[3],Referencia:"DUP"}];
const repeated={...input,rows:duplicateRef};
const repeatedPreview=await call("/api/quick/v41/reconcile/preview",B,repeated);
const repeatedConfirm=await call("/api/quick/v41/reconcile/confirm",B,{
 ...repeated,expectedDigest:repeatedPreview.body.reviewDigest,confirmed:true,
 decisions:[{index:0,action:"import"}]
});
assert.equal(repeatedConfirm.status,409,"same external reference in file cannot import twice");
assert.match(DASH_HTML,/v41-decision-dialog/);
assert.match(DASH_HTML,/ai-document-confirm-open/);
assert.match(REVIEW_CONFIRM_JS,/expectedDigest/);
new Function(REVIEW_CONFIRM_JS);
assert.match(REVIEW_CONFIRM_JS,/Corregir datos del extracto/);
assert.match(REVIEW_CONFIRM_JS,/reconcile\/preview/);
const flawed={...input,rows:[{Fecha:"2026-11-31",Concepto:"Corrector demo",Importe:"100",Tipo:"debit",Referencia:"FIX-DEMO-001"}]};
const invalidPreview=await call("/api/quick/v41/reconcile/preview",B,flawed);
assert.equal(invalidPreview.body.rows[0].status,"needs_correction");
const corrected={...flawed,rows:[{...flawed.rows[0],Fecha:"2026-11-20",Importe:"125.25"}]};
const correctedPreview=await call("/api/quick/v41/reconcile/preview",B,corrected,{ALLOW_WRITES:"false"});
assert.equal(correctedPreview.status,200);
assert.notEqual(correctedPreview.body.rows[0].status,"needs_correction");
assert.notEqual(correctedPreview.body.reviewDigest,invalidPreview.body.reviewDigest);
assert.equal(correctedPreview.body.rows[0].amountCOP,"125.25");
assert.equal((await call("/api/quick/v41/reconcile/history",B)).body.count,0);
assert.equal((await call("/api/quick/v41/reconcile/confirm",B,{...corrected,expectedDigest:invalidPreview.body.reviewDigest,confirmed:true,decisions:[{index:0,action:"import"}]})).status,409);
assert.equal((await call("/api/quick/v41/reconcile/history",B)).body.count,0);
console.log("v42.2 statement correction preview: no writes, recomputed digest, stale confirmation blocked");
// A repeated bank amount is not a duplicated purchase; only the read is shared.
let candidateQueries=0,activeQueries=0,maxActive=0;
const counted={...store,prepare(query){
 const stmt=store.prepare(query);
 if(!query.includes("AS source,merchant AS label")&&!query.includes("AS source,concept AS label"))return stmt;
 const all=stmt.all;
 stmt.all=async()=>{candidateQueries++;activeQueries++;maxActive=Math.max(maxActive,activeQueries);
  try{await Promise.resolve();return await all.call(stmt);}finally{activeQueries--;}};
 return stmt;
}};
const {previewReconciliationV41}=await import("../dist/apps/quick-worker/src/statement-reconcile-v41.js");
const many={...input,rows:Array.from({length:12},(_,i)=>({Fecha:"2026-11-20",Concepto:"Compra "+i,Importe:String(200+(i%6)),Tipo:"debit",Referencia:"PERF-"+i}))};
const perf=await (await previewReconciliationV41(counted,B,many)).json();
assert.equal(perf.rows.length,12);assert.deepEqual(perf.rows.map(x=>x.index),Array.from({length:12},(_,i)=>i));
assert.equal(candidateQueries,6);assert.ok(maxActive<=5&&maxActive>1);
assert.equal((await call("/api/quick/v41/reconcile/history",B)).body.count,0);
console.log("v42.3 statement lookup reuse and bounded concurrency passed");
sqlDb.close();
console.log("v41 confirmations: approval gate, exact-match binding, idempotency, transfers, pending credits, audit and owner isolation PASSED");