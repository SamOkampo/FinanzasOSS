import assert from "node:assert/strict";
import vm from "node:vm";
import { BALANCES_JS } from "../dist/apps/quick-worker/src/dashboard-balances-js.js";
import { DASH_HTML } from "../dist/apps/quick-worker/src/dashboard-html.js";

class FakeElement {
  constructor(tag="div",id=""){
    this.tag=tag;this.id=id;this.children=[];this.listeners=new Map();this.attrs={};
    this.value="";this.textContent="";this.dataset={};this.disabled=false;this.hidden=false;
    this.classList={contains:()=>false};
  }
  addEventListener(name,fn){const a=this.listeners.get(name)||[];a.push(fn);this.listeners.set(name,a);}
  click(){for(const fn of this.listeners.get("click")||[])fn({target:this});}
  setAttribute(k,v){this.attrs[k]=v;}
  removeAttribute(k){delete this.attrs[k];}
  replaceChildren(...nodes){this.children=nodes;}
  append(...nodes){this.children.push(...nodes);}
  appendChild(x){this.append(x);}
  focus(){}
  scrollIntoView(){}
  querySelector(selector){for(const c of this.children){if(c.tag===selector)return c;const x=c.querySelector?.(selector);if(x)return x;}return null;}
  querySelectorAll(){return [];}
}
const ids=[
  "verify-balance-form","balance-list","balance-summary","verify-balance-bank",
  "verify-balance-type","verify-balance-amount","balance-feedback","balance-review",
  "verify-balance-submit","balance-bank-labels","reload","refresh-balances",
  "balance-refresh-state","space-connections",
];
const els=Object.fromEntries(ids.map(id=>[id,new FakeElement("div",id)]));
const documentEvents=new Map();
const document={
  visibilityState:"visible",
  addEventListener:(name,fn)=>documentEvents.set(name,fn),
  getElementById:id=>els[id]||null,
  createElement:tag=>new FakeElement(tag),
  createTextNode:value=>Object.assign(new FakeElement("text"),{textContent:value}),
  querySelector:()=>null,
  querySelectorAll:()=>[],
};
const window={addEventListener(){}};
function snapshot(withStaleDifference){
  const a={label:"Plata Pay",type:"deposit",hasSnapshot:true,
    latest:{amountMinor:"56392100",asOf:"2026-11-15T00:13:01.324Z"}};
  a.reconciliation=withStaleDifference?{
    status:"difference_requires_review",after:"2026-11-15T00:10:56.260Z",
    until:"2026-11-15T00:13:01.324Z",
    expectedMinor:"56342000",differenceMinor:"50100",
    incomingMinor:"0",outgoingMinor:"0",incomingCount:0,outgoingCount:0
  }:null;
  return {accounts:[a],bankLabels:["Plata Pay"]};
}
let current=snapshot(true),requests=0;
const fetch=async(uri,options)=>{
  assert.equal(uri,"/api/quick/balances");
  assert.equal(options.cache,"no-store");
  assert.equal(options.credentials,"same-origin");
  requests++;
  const payload=current;
  return {ok:true,json:async()=>payload};
};
vm.runInNewContext(BALANCES_JS,{document,window,fetch,Intl,Date,console});
const tick=()=>new Promise(resolve=>setImmediate(resolve));
await tick();
const texts=node=>[node.textContent,...node.children.flatMap(texts)].join(" | ");
assert.match(texts(els["balance-list"]),/Diferencia por revisar:.*501/);
assert.equal(requests,1);
current=snapshot(false);
els.reload.click();
await tick();
assert.equal(requests,2,"The top-right circular button must also fetch balances");
assert.doesNotMatch(texts(els["balance-list"]),/Diferencia por revisar|563\\.420/);
assert.match(texts(els["balance-list"]),/Para comparar movimientos, registra otro saldo/);
assert.match(els["balance-refresh-state"].textContent,/Saldos actualizados desde FinanzasOSS/);
assert.equal(els["refresh-balances"].disabled,false);
els["refresh-balances"].click();
await tick();
assert.equal(requests,3,"The panel has a dedicated refresh button");
current.accounts[0].estimate={amountMinor:"57392100",incomingCount:1,outgoingCount:0,
  incomingMinor:"1000000",outgoingMinor:"0",uncertainCount:1};
documentEvents.get("visibilitychange")();
await tick();
assert.equal(requests,4,"Returning to Saldos after an external income refetches it");
assert.match(texts(els["balance-list"]),/Saldo estimado.*573\.921.*Confirmado el.*563\.921/);
assert.match(texts(els["balance-list"]),/día del corte.*sin hora/);
assert.match(texts(els["balance-summary"]),/573\.921/);
assert.match(DASH_HTML,/id="refresh-balances"/);
assert.match(DASH_HTML,/id="balance-refresh-state"/);
assert.match(DASH_HTML,/aria-label="Actualizar movimientos y saldos"/);
console.log("Balances refresh: global button and panel button refetch D1 data; stale $501 difference disappears PASSED");
