import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {CLOSE_REPORTS_CSS,CLOSE_REPORTS_HOME,CLOSE_REPORTS_DIALOGS,CLOSE_REPORTS_JS} from "../dist/apps/quick-worker/src/dashboard-close-reports.js";
import {DASH_HTML} from "../dist/apps/quick-worker/src/dashboard-html.js";
import {handleQuickRequest} from "../dist/apps/quick-worker/src/index.js";

// These checksums are from the *currently deployed*, owner-protected
// staging Worker, not a new design. This makes source parity auditable.
const sha=text=>createHash("sha256").update(text,"utf8").digest("hex");
assert.equal(sha(CLOSE_REPORTS_CSS),"1fd2406ad71f75a66d7859e09ff7ebe1c1bf7ed699426c27dc5ec19189dd14a0");
assert.equal(sha(CLOSE_REPORTS_HOME),"4b114347564d0762d2fcc7b652e8b51ae3112ca78c7c569c2a1c1b3016f01f7d");
assert.equal(sha(CLOSE_REPORTS_DIALOGS),"edb8357f6517c05b39334e5b8a29021b1416da9b468f7ddc6d0e1c36d26c4ea4");
assert.equal(sha(CLOSE_REPORTS_JS),"16094fc867cd0bdae6e21c8e585704ac472d971d5448a098c769c90f2d37823a");

for(const id of ["close-reports","close-day-date","close-week-net","close-sheet","close-story","close-story-progress"]){
 assert.ok(DASH_HTML.includes('id="'+id+'"'),"Recovered reports UI missing "+id);
 assert.equal(DASH_HTML.split('id="'+id+'"').length,2,"Duplicate report element "+id);
}
assert.equal(DASH_HTML.split('src="/reports.js"').length,2);
assert.ok(DASH_HTML.indexOf('id="close-reports"')>DASH_HTML.indexOf('id="space-today"'));
assert.ok(DASH_HTML.indexOf('id="close-reports"')<DASH_HTML.indexOf('class="category-spend"'));
assert.ok(DASH_HTML.indexOf('id="close-reports"')<DASH_HTML.indexOf('id="space-movement"'));
assert.ok(DASH_HTML.indexOf('id="close-story"')>DASH_HTML.indexOf('id="space-settings"'));
assert.ok(DASH_HTML.includes('Historia del mes')&&DASH_HTML.includes('Tu año en cifras'));
assert.match(CLOSE_REPORTS_CSS,/\.close-reports\{/);
assert.match(CLOSE_REPORTS_CSS,/\.close-story\{/);
assert.ok(!/localStorage|sessionStorage|indexedDB|fetch\(/.test(CLOSE_REPORTS_JS),
 "Recovered stories must use only same-origin in-memory dashboard data");
assert.doesNotThrow(()=>new Function(CLOSE_REPORTS_JS),"Recovered script must parse");

// Exercise the deployed story model with fictitious COP minor units: Bogotá
// rollover, weekly boundaries, exact whole-month arithmetic and category rank.
const modelStart=CLOSE_REPORTS_JS.lastIndexOf("function ht(){");
assert.ok(modelStart>0&&CLOSE_REPORTS_JS.endsWith(")());"));
const modelSource=CLOSE_REPORTS_JS.slice(modelStart,-5);
const model=new Function("return ("+modelSource+")();")();
assert.equal(model.dayInBogota(new Date("2026-11-23T02:10:00.000Z")),"2026-11-22");
assert.equal(model.begin("week","2026-11-22"),"2026-11-16");
assert.equal(model.periodRange("month","2026-11-01").end,"2026-11-30");
const monthly=model.summarize({
 daily:[{day:"2026-11-20",minor:"250000",count:1},{day:"2026-11-21",minor:"90000",count:1},
        {day:"2026-10-31",minor:"9999999",count:1}],
 incomeDaily:[{day:"2026-11-20",minor:"500000",count:1}],
 categoryDaily:[{day:"2026-11-20",minor:"250000",category:"Alimentación"},
                {day:"2026-11-21",minor:"90000",category:"Transporte"}],
},model.periodRange("month","2026-11-01"));
assert.equal(monthly.income.total,500000n);
assert.equal(monthly.expense.total,340000n);
assert.equal(monthly.net,160000n);
assert.equal(monthly.expense.count,2);
assert.equal(monthly.top[0].name,"Alimentación");
assert.equal(monthly.series.length,30);
assert.equal(monthly.series.find(x=>x.day==="2026-11-20").total,250000n);

// Audit the actual deployed report model across the four period boundaries.
const fixture={
 daily:[{day:"2026-11-22",minor:"10001",count:1},{day:"2026-11-23",minor:"25050",count:1},{day:"2026-11-24",minor:"500",count:1},{day:"2026-12-01",minor:"30000",count:1},{day:"2027-01-01",minor:"99999",count:1}],
 incomeDaily:[{day:"2026-11-23",minor:"100000",count:1},{day:"2026-12-01",minor:"1000",count:1}],
 categoryDaily:[],debtPaymentsMinor:"900000",pendingTransferReviewMinor:"800000"
};
for(const [period,start,income,expense] of [
 ["day","2026-11-23",100000n,25050n],
 ["week","2026-11-23",100000n,25550n],
 ["month","2026-11-01",100000n,35551n],
 ["year","2026-01-01",101000n,65551n]
]){
 const report=model.summarize(fixture,model.periodRange(period,start));
 assert.equal(report.income.total,income,period);
 assert.equal(report.expense.total,expense,period);
 assert.equal(report.net,income-expense,period);
}
assert.equal(model.periodRange("month","2028-02-01").end,"2028-02-29");
assert.equal(model.dayInBogota(new Date("2027-01-01T04:59:59Z")),"2026-12-31");
assert.equal(model.dayInBogota(new Date("2027-01-01T05:00:00Z")),"2027-01-01");
console.log("v42.2 daily, weekly, monthly and annual report arithmetic and Bogotá cutoffs passed");
const origin="https://finanzasoss-quick-staging.socampoecheverry.workers.dev";
const env={DB:{},ACCESS_AUD:"qa-reports",ALLOW_WRITES:"false"};
const ctx={access:{aud:"qa-reports",async getIdentity(){return {user_uuid:"synthetic-owner"};}}};
const response=await handleQuickRequest(new Request(origin+"/reports.js"),env,ctx);
assert.equal(response.status,200,"Reports JS needs an authenticated Worker route");
assert.equal(await response.text(),CLOSE_REPORTS_JS);
assert.equal(response.headers.get("cache-control")?.includes("no-store"),true);
const unauthed=await handleQuickRequest(new Request(origin+"/reports.js"),env,{});
assert.equal(unauthed.status,401,"Reports script is not a public data endpoint");
console.log("Live reports recovery: deployed asset hashes, 4 report UIs, Bogotá calendar, money arithmetic and Access routing PASS");
