// Layout QA in a real headless Chromium, with synthetic data only. No production
// account, browser cookie, Cloudflare key, customer information or remote network.
import assert from "node:assert/strict";
import {createServer} from "node:http";
import {chromium,webkit} from "playwright";
import {DASH_HTML} from "../dist/apps/quick-worker/src/dashboard-html.js";
import {DASH_CSS} from "../dist/apps/quick-worker/src/dashboard-css.js";
import {DASH_JS} from "../dist/apps/quick-worker/src/dashboard-js.js";
import {STUDIO_JS} from "../dist/apps/quick-worker/src/dashboard-studio-js.js";
import {BUDGET_JS} from "../dist/apps/quick-worker/src/dashboard-budgets-js.js";
import {MOVEMENT_EDITOR_JS} from "../dist/apps/quick-worker/src/dashboard-movement-editor-js.js";
import {IMPORT_JS} from "../dist/apps/quick-worker/src/dashboard-import-js.js";
import {INSIGHTS_JS} from "../dist/apps/quick-worker/src/dashboard-insights-js.js";
const assets={
 "/dashboard":DASH_HTML,"/dashboard.css":DASH_CSS,"/dashboard.js":DASH_JS,
 "/studio.js":STUDIO_JS,"/budgets.js":BUDGET_JS,
 "/movement-editor.js":MOVEMENT_EDITOR_JS,"/statement-import.js":IMPORT_JS,
 "/insights.js":INSIGHTS_JS,
};
const entries=[
 {id:"aaaaaaaa-0000-4000-8000-aaaaaaaaaaaa",account_id:null,amount_minor:"129000",
 currency:"COP",kind:"purchase",payment_method:"digital_wallet",
 merchant:"Refrigerio y onces universidad",bank_label:"Daviplata",
 occurred_at:"2026-10-27T17:03:00Z",revision:0},
 {id:"bbbbbbbb-0000-4000-8000-bbbbbbbbbbbb",account_id:null,amount_minor:"3000000",
 currency:"COP",kind:"purchase",payment_method:"debit_card",
 merchant:"Suscripción plataforma digital",bank_label:"Daviplata",
 occurred_at:"2026-10-27T13:11:00Z",revision:0},
];
const responses={
 "/api/quick/profile":{email:"test@example.invalid",profile:"personal"},
 "/api/quick/dashboard/overview":{timezone:"America/Bogota",currency:"COP",movementCount:2,
 excludedUsd:0,transfersAndInvestments:0,truncated:false,
 daily:[{day:"2026-10-27",method:"digital_wallet",minor:"129000",count:1},
 {day:"2026-10-27",method:"debit_card",minor:"3000000",count:1}]},
 "/api/quick/dashboard/movements":{page:0,hasMore:false,entries},
 "/api/quick/budgets":{budgets:[]},
 "/api/quick/categories":{entries:[],summary:[],taxonomy:{}},
 "/api/quick/studio/capabilities":{product:"FinanzasOSS",banks:{connected:0},investments:{connected:0}},
 "/api/quick/push/config":{enabled:false,deliveryEnabled:false},
};
const server=createServer((req,res)=>{
 const url=new URL(req.url||"/","http://localhost");
 const path=url.pathname;
 if(path in assets){
  res.writeHead(200,{"Content-Type":path==="/dashboard"?"text/html; charset=utf-8":
    path.endsWith(".css")?"text/css; charset=utf-8":"application/javascript; charset=utf-8",
   "Cache-Control":"no-store"});
  res.end(assets[path]);return;
 }
 if(path.startsWith("/api/quick/")){
  const body=responses[path]||{status:"unavailable",enabled:false};
  res.writeHead(200,{"Content-Type":"application/json","Cache-Control":"no-store"});
  res.end(JSON.stringify(body));return;
 }
 res.writeHead(404);res.end();
});
await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
const port=server.address().port;
const browsers=[
 {name:"Chromium",engine:await chromium.launch({headless:true,args:["--disable-dev-shm-usage"]})},
 {name:"WebKit",engine:await webkit.launch({headless:true})},
 ];
const screens=["today","movement","portfolio","plan","map","imports","connections","settings"];
const layouts=[
 {name:"iPhone SE 320",width:320,height:568,mobile:true},
 {name:"small iPhone 375",width:375,height:667,mobile:true},
 {name:"iPhone 393",width:393,height:852,mobile:true},
 {name:"large iPhone 430",width:430,height:932,mobile:true},
 {name:"tablet 768",width:768,height:1024,mobile:true},
 {name:"desktop 1024",width:1024,height:768,mobile:false},
 {name:"desktop 1440",width:1440,height:900,mobile:false},
];
const errors=[],records=[];
const output=path=>new URL(path,"http://127.0.0.1:"+port).href;
const assertFits=async(page,width,label)=>{
 const result=await page.evaluate(()=>{
  const sel=[".main",".masthead",".page-intro",".editorial-hero",".metrics",".metric",
   ".module",".budget-grid",".budget-card",".settings-panel",".setting-row",
   ".table-panel",".table-scroll",".connections-grid",".connection",
   ".import-studio",".import-options",".category-list",".category-entry",
   ".category-select-row",".flow-panel",".more-dialog[open]",
   ".expense-dialog[open]",".reset-dialog[open]",".mobile-nav"];
  const items=[];
  for(const selector of sel)for(const el of document.querySelectorAll(selector)){
   if(el.closest("[hidden]")||getComputedStyle(el).display==="none")continue;
   const b=el.getBoundingClientRect();
   if(!b.width||!b.height)continue;
   if(b.right>window.innerWidth+2||b.left< -2||
     b.width>window.innerWidth+2)items.push({selector,box:[b.left,b.right,b.width]});
  }
  return {items,scrollWidth:document.documentElement.scrollWidth,innerWidth:window.innerWidth,
   visible:[...document.querySelectorAll(".space")].filter(el=>!el.hidden).map(x=>x.dataset.space)};
 });
 assert.equal(result.visible.length,1,label+": exactly one financial screen visible");
 assert.ok(result.scrollWidth<=result.innerWidth+2,label+": page horizontal overflow "+
   JSON.stringify(result));
 assert.deepEqual(result.items,[],label+": responsive element protrusion");
};
try{
 for(const browser of browsers)for(const layout of
   (browser.name==="WebKit"?layouts.filter(x=>[320,393,768,1440].includes(x.width)):layouts)){
  console.log("Visual QA "+browser.name+" @ "+layout.width+"px");
  const context=await browser.engine.newContext({viewport:{width:layout.width,height:layout.height},
   deviceScaleFactor:layout.mobile?2:1,isMobile:layout.mobile,hasTouch:layout.mobile,
   serviceWorkers:"block",reducedMotion:"no-preference"});
  const page=await context.newPage();
  page.setDefaultTimeout(10000);page.setDefaultNavigationTimeout(12000);
  page.on("pageerror",error=>errors.push(layout.name+": "+error.message));
  await page.goto(output("/dashboard"),{waitUntil:"networkidle"});
  for(const name of screens){
   if(name!=="today"){
    if(layout.width<=980){
     if(["today","movement","portfolio"].includes(name))
      await page.locator('.mobile-nav button[data-view="'+name+'"]').click();
     else{
      await page.locator("#open-more").click();
      await page.locator('#more-dialog button[data-view="'+name+'"]').click();
     }
    }else await page.locator('.rail button[data-view="'+name+'"]').click();
   }
   await page.waitForTimeout(250);
   assert.equal(await page.locator("#space-"+name).evaluate(el=>el.hidden),false,
    layout.name+" cannot navigate to "+name);
   await assertFits(page,layout.width,layout.name+" "+name);
   records.push(browser.name+" / "+layout.name+" / "+name);
  }
  // Native back-swipe / browser history must restore screen selection.
  await page.goBack({waitUntil:"domcontentloaded",timeout:10000});
  await page.waitForTimeout(80);
  assert.equal(await page.locator("#space-connections").evaluate(el=>el.hidden),false,
    browser.name+" "+layout.name+" browser Back");
  await page.goForward({waitUntil:"domcontentloaded",timeout:10000});
  await page.waitForTimeout(80);
  assert.equal(await page.locator("#space-settings").evaluate(el=>el.hidden),false,
    browser.name+" "+layout.name+" browser Forward");
  // Dark theme has to preserve layout and accessible colors.
  await page.locator("#theme-setting").click();
  assert.equal(await page.locator("#studio").evaluate(el=>el.classList.contains("theme-night")),true,
    browser.name+" "+layout.name+" dark theme");
  await assertFits(page,layout.width,browser.name+" "+layout.name+" dark settings");
  await page.locator("#theme-setting").click();
  // Reset dialog must fit even at 320px; no reset action or server write.
  await page.locator("#reset-open").click();
  assert.equal(await page.locator("#reset-dialog").evaluate(el=>el.open),true);
  await assertFits(page,layout.width,browser.name+" "+layout.name+" reset modal");
  await page.locator("#reset-close").click();
  if(layout.width<=980){
   await page.locator("#add-mobile").click();
   assert.equal(await page.locator("#expense-dialog").evaluate(el=>el.open),true);
   await assertFits(page,layout.width,layout.name+" expense modal");
   assert.ok(await page.locator("#expense-amount").isVisible());
   assert.ok(await page.locator("#expense-submit").isVisible());
   await page.locator("#expense-amount").fill("1234");
   await page.locator("#expense-concept").fill("Gasto de prueba");
   await page.locator("#expense-method").selectOption("bank_transfer");
   await assertFits(page,layout.width,layout.name+" expense inputs");
   await page.locator("#close-expense").click();
  }
  const reduced=await browser.engine.newContext({viewport:{width:layout.width,height:layout.height},
   reducedMotion:"reduce",serviceWorkers:"block"});
  const reducePage=await reduced.newPage();
  reducePage.setDefaultTimeout(10000);reducePage.setDefaultNavigationTimeout(12000);
  await reducePage.goto(output("/dashboard"),{waitUntil:"domcontentloaded"});
  const animation=await reducePage.locator("#space-today").evaluate(el=>getComputedStyle(el).animationName);
  assert.ok(animation==="none",layout.name+" must honor prefers-reduced-motion");
  await reduced.close();
  await context.close();
 }
 assert.deepEqual(errors,[],"Browser runtime errors");
 console.log("Chromium + WebKit PWA visual QA: "+records.length+" screen/viewport combinations, all responsive.");
 console.log("Dark theme, native back/forward, expense & reset sheets, touch controls and reduced motion passed.");
}finally{
 for(const browser of browsers)await browser.engine.close();
 await new Promise(resolve=>server.close(resolve));
}
