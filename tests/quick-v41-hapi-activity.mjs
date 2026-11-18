import assert from "node:assert/strict";
import {readFileSync,readdirSync} from "node:fs";
import {DatabaseSync} from "node:sqlite";
import {PDF} from "@libpdf/core";
import {handleQuickRequest} from "../dist/apps/quick-worker/src/index.js";
import {parseHapiActivity,readHapiActivityPdf} from "../dist/apps/quick-worker/src/hapi-statement-reader.js";
import {HAPI_JS} from "../dist/apps/quick-worker/src/dashboard-hapi.js";

const lines=[
 "Hapi / Apex Clearing","Account Activity","BOUGHT 10/02/26","Vanguard Total World (VT)",
 "Quantity: 0.20205","Price: $494.92","Debit: $100.05","Transaction ID: ORDER-001",
 "2026-10-03 SOLD Vanguard Total World (VT) Credit: $110.13",
 "10/04/26 DEPOSIT ACH completed Credit: $100.00 Ref: deposit-1",
 "2026-10-05 WITHDRAWAL ACH transfer $30.00",
 "2026-10-06 DIVIDEND ETF X (VT) Credit: $3.69",
 "2026-10-06 REINVEST ETF X (VT) Quantity: 0.00372 Debit: $3.69",
 "2026-10-06 NON-RESIDENT TAX WITHHELD ETF X (VT) Debit: $1.11",
 "2026-10-07 INTEREST Cash Credit: $0.25",
 "2026-10-08 COMMISSION Service Debit: $2.00",
 "2026-10-09 DIVIDEND Missing date amount",
 "2026-10-10 DEPOSIT Invalid debit Debit: $12.00",
 "2026-10-11 SPLIT Unsupported $120.00",
 "Funds Paid and Received","2026-10-06 DIVIDEND ETF X (VT) Credit: $3.69",
 "Pending Settlement","2026-10-12 BOUGHT Unsettled (QQQ) Debit: $500.00",
];
const parsed=parseHapiActivity(lines.join("\n"));
assert.deepEqual(parsed.rows.map(row=>row.kind),["buy","sell","deposit","withdrawal","dividend","reinvestment","tax","interest","fee"]);
assert.equal(parsed.unread,4);
assert.equal(parsed.rows[0].quantity,"0.20205");
assert.equal(parsed.rows[0].amountUsd,"100.05");
assert.equal(parsed.rows[0].symbol,"VT");
const pdf=PDF.create(),page=pdf.addPage({size:"letter"});
lines.forEach((line,index)=>page.drawText(line,{x:32,y:762-index*21,fontSize:10}));
const file=new File([await pdf.save()],"hapi-activity-synthetic.pdf",{type:"application/pdf"});
assert.deepEqual(await readHapiActivityPdf(file),parsed);
assert.equal(await readHapiActivityPdf(new File(["bad"],"test.pdf")),null);

const sql=new DatabaseSync(":memory:");
const dir=new URL("../apps/quick-worker/migrations/",import.meta.url);
for(const name of readdirSync(dir).sort())sql.exec(readFileSync(new URL(name,dir),"utf8"));
const DB={prepare(query){let args=[];return {
 bind(...params){args=params;return this;},
 async first(){return sql.prepare(query).get(...args)??null;},
 async all(){return {results:sql.prepare(query).all(...args)};},
};}};
const A="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",B="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const env={DB,ACCESS_AUD:"activity-test",ALLOW_WRITES:"true",ALLOW_V41_HAPI:"true",ALLOW_V41_HAPI_ACTIVITY:"true"};
async function call(path,data,owner=A,origin="https://qa.example",config=env){
 const ctx=owner?{access:{aud:config.ACCESS_AUD,async getIdentity(){return {user_uuid:owner};}}}:{};
 const response=await handleQuickRequest(new Request("https://qa.example/api/quick/v41/hapi/"+path,
  data?{method:"POST",headers:{Origin:origin,"Content-Type":"application/json"},body:JSON.stringify(data)}:undefined),config,ctx);
 assert.match(response.headers.get("Cache-Control"),/no-store/);
 return {status:response.status,data:await response.json()};
}
const rows=[...parsed.rows,parsed.rows[8]];
assert.equal((await call("activity",null,null)).status,401);
assert.equal((await call("activity",null,A,undefined,{...env,ALLOW_V41_HAPI_ACTIVITY:"false"})).status,503);
assert.equal((await call("activity/preview",{rows},A,"https://different.example")).status,403);
const preview=await call("activity/preview",{rows});
assert.equal(preview.status,200);
assert.equal(new Set(preview.data.items.map(row=>row.id)).size,10,"Two identical commissions can be legitimate");
assert.equal(sql.prepare("SELECT count(*) n FROM quick_hapi_activity").get().n,0);
const input={rows,digest:preview.data.digest,selected:[0,2,4,5,8,9],confirmed:true};
assert.equal((await call("activity/commit",{...input,confirmed:false})).status,422);
assert.equal((await call("activity/commit",{...input,rows:[{...rows[0],amountUsd:"500.00"},...rows.slice(1)]})).status,409);
assert.deepEqual((await call("activity/commit",input)).data,{created:6,alreadySaved:0});
assert.deepEqual((await call("activity/commit",input)).data,{created:0,alreadySaved:6});
assert.equal((await call("activity",null,B)).data.items.length,0);
const duplicate=await call("activity/preview",{rows:[rows[0],rows[0]]});
assert.deepEqual(duplicate.data.items.map(row=>row.status),["conflict","conflict"]);
const conflicting=await call("activity/preview",{rows:[{...rows[0],amountUsd:"101.00"}]});
assert.equal(conflicting.data.items[0].status,"conflict");
assert.equal((await call("activity/commit",{rows:[{...rows[0],amountUsd:"101.00"}],digest:conflicting.data.digest,selected:[0],confirmed:true})).status,409);
const source=await call("deposits",{requestKey:"source-activity-01",bank:"Banco ficticio",debitedOn:"2026-10-02",copAmount:"420000",confirmed:true});
const activityId=preview.data.items[2].id;
const link={activityId,depositId:source.data.id,confirmed:true};
assert.equal((await call("activity/link",link,B)).status,404);
assert.equal((await call("activity/link",link)).status,200);
assert.equal((await call("activity/link",link)).data.replayed,true);
let activity=(await call("activity")).data;
assert.equal(activity.items.find(row=>row.id===activityId).linkedDeposit,true);
assert.equal(activity.pending.length,0);
const second=await call("deposits",{requestKey:"source-activity-02",bank:"Banco ficticio",debitedOn:"2026-10-02",copAmount:"420000",confirmed:true});
assert.equal((await call("activity/link",{...link,depositId:second.data.id})).status,409);
assert.equal((await call("deposits")).data.items.find(row=>row.id===source.data.id).effectiveCopPerUsd,"4200.0000");
await call("activity/commit",{...input,selected:[1,3]});
const sale={activityId:preview.data.items[1].id,costUsd:"120.13",confirmed:true};
assert.equal((await call("activity/details",sale,B)).status,404);
assert.equal((await call("activity/details",{...sale,costUsd:"-1.00"})).status,422);
assert.equal((await call("activity/details",sale)).data.saved,true);
assert.equal((await call("activity/details",sale)).data.replayed,true);
assert.equal((await call("activity/details",{...sale,costUsd:"119.13"})).status,409);
const reinvestment={activityId:preview.data.items[5].id,dividendId:preview.data.items[4].id,confirmed:true};
assert.equal((await call("activity/details",reinvestment)).status,200);
const bankCredit="22222222-2222-4222-8222-222222222222";
const bankAbono=sql.prepare("INSERT INTO quick_statement_review_decisions(id,owner_id,row_key,row_hash,review_digest,bank_label,payment_method,direction,"+
 "occurred_on,amount_minor,description,action,counterparty_label) VALUES(?,?,'withdrawal','synthetic',?,'Banco ficticio','bank_transfer','credit',"+
 "'2026-10-06',12000000,'Retiro ficticio','own_transfer','Hapi')");
bankAbono.run(bankCredit,B,"0".repeat(64));
const withdrawal={activityId:preview.data.items[3].id,bankCreditId:bankCredit,confirmed:true};
assert.equal((await call("activity/details",withdrawal)).status,409);
bankAbono.run("33333333-3333-4333-8333-333333333333",A,"0".repeat(64));
const available=(await call("activity")).data.bankCredits;
assert.equal(available.length,1);
assert.equal((await call("activity/details",{...withdrawal,bankCreditId:available[0].id})).status,200);
activity=(await call("activity")).data;
assert.equal(activity.items.find(row=>row.id===sale.activityId).realizedMinor,"-1000");
assert.equal(activity.items.find(row=>row.id===reinvestment.activityId).dividendId,reinvestment.dividendId);
assert.equal(activity.items.find(row=>row.id===withdrawal.activityId).bankCreditId,available[0].id);
assert.equal(activity.bankCredits.length,0);
for(const table of ["quick_manual_entries","quick_shortcut_expenses","quick_statement_credits","quick_income_entries","quick_hapi_portfolio_snapshots"])
 assert.equal(sql.prepare("SELECT count(*) n FROM "+table).get().n,0);
new Function(HAPI_JS);
console.log("Hapi activity: local PDF, explicit row confirmation, exact amounts, reference conflicts, owner isolation, bank linking and unchanged ledger PASSED");
