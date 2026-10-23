import assert from "node:assert/strict";
import {DASH_CSS} from "../dist/apps/quick-worker/src/dashboard-css.js";
import {STUDIO_JS} from "../dist/apps/quick-worker/src/dashboard-studio-js.js";
import {DASH_HTML} from "../dist/apps/quick-worker/src/dashboard-html.js";

const marker="/* Native-feeling adaptive PWA shell, October 2026.";
const index=DASH_CSS.indexOf(marker);
assert.ok(index>0,"Native mobile shell must be present");
const css=DASH_CSS.slice(index);
for(const expected of [
 "safe-area-inset-bottom","safe-area-inset-top","max-width:360px",
 "max-width:720px","max-width:980px","min-width:981px",
 ".mobile-nav{width:100%","grid-template-columns:1fr 1fr 1.05fr 1fr 1fr",
 ".table-panel tbody tr{display:grid","tbody tr>td:nth-child(5)",
 "dialog.more-dialog[open]","dialog.expense-dialog[open]",
 "dialog.movement-editor[open]","native-screen-forward",
 "native-screen-back","native-sheet-rise","prefers-reduced-motion:reduce",
 ".studio.no-motion .space.is-visible",
 "dialog[open]::backdrop","overflow-x:clip"
])assert.ok(css.includes(expected),"Missing expected adaptive behavior: "+expected);
assert.doesNotMatch(css,/!important/,"No forced CSS overrides: honor existing theme");
assert.doesNotMatch(css,/url\(https?:/,"No third-party assets");
assert.match(DASH_HTML,/name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"/);
for(const screen of ["today","movement","portfolio","plan","map","imports","connections","settings"])
 assert.ok(DASH_HTML.includes('data-space="'+screen+'"'));
for(const element of ["mobile-nav","more-dialog","expense-dialog","movement-edit-dialog"])
 assert.ok(DASH_HTML.includes(element));
assert.doesNotThrow(()=>new Function(STUDIO_JS),"Browser application syntax must remain valid");
assert.doesNotMatch(STUDIO_JS,/localStorage|sessionStorage|innerHTML/,
 "Financial state must never be stored or interpolated into markup");

// Execute actual navigation implementation in a fake DOM. Tests one visible
// panel, arrow direction, tab state and reduced motion. No PII in stubs.
const start=STUDIO_JS.indexOf('  const moreDialog=byId("more-dialog");');
const end=STUDIO_JS.indexOf('  window.addEventListener("hashchange"',start);
assert.ok(start>0&&end>start,"Test must extract actual navigation logic");
const source=STUDIO_JS.slice(start,end);
function harness(reducedMotion=false){
 const screens=["today","movement","portfolio","plan","map","imports","connections","settings"];
 const ids=new Map(),events=[];
 function classes(initial=[]){const items=new Set(initial);return {
  toggle(name,v){if(v)items.add(name);else items.delete(name);return items.has(name);},
  contains(name){return items.has(name);}
 };}
 for(const name of screens){
  const node={hidden:name!=="today",classList:classes(name==="today"?["is-visible"]:[]),
   dataset:{space:name},attrs:{},setAttribute(k,v){this.attrs[k]=v;},
   focus(){events.push("focus:"+name);}};
  ids.set("space-"+name,node);
  ids.set("heading-"+name,node);
 }
 const more={open:false,close(){this.open=false;events.push("more:close");},
  showModal(){this.open=true;}};
 ids.set("more-dialog",more);
 ids.set("open-more",{classList:classes(),attrs:{},
  setAttribute(k,v){this.attrs[k]=v;},
  removeAttribute(k){delete this.attrs[k];},addEventListener(k,fn){this[k]=fn;}});
 ids.set("close-more",{addEventListener(k,fn){this[k]=fn;}});
 ids.set("current-space",{textContent:"HOY"});
 const controls=screens.map((space)=>({
  dataset:{view:space},classList:classes(space==="today"?["is-active","mobile-item"]:["mobile-item"]),
  attrs:{},setAttribute(k,v){this.attrs[k]=v;},removeAttribute(k){delete this.attrs[k];},
  addEventListener(k,fn){this[k]=fn;}
 }));
 const dom={querySelectorAll(){return controls;}};
 const studio={dataset:{}};
 const history={replaceState(...args){events.push("url:"+args[2]);}};
 const win={scrollTo(...args){events.push("scroll:"+args.join(","));}};
 const announce=text=>events.push("announce:"+text);
 let active="today",ownReduced=false;
 const initialize=new Function("byId","studio","spaces","active","ownReduced","reduced","document",
  "history","window","names","announce",source+
  "\nreturn {moreDialog,buttons:byId,readActive:()=>active};");
 const app=initialize(k=>ids.get(k),studio,screens,active,ownReduced,{matches:reducedMotion},
  dom,history,win,Object.fromEntries(screens.map(x=>[x,x.toUpperCase()])),announce);
 return {...app,studio,ids,events,controls};
}
const app=harness();
const planButton=app.controls.find(x=>x.dataset.view==="plan");
planButton.click();
assert.equal(app.ids.get("space-plan").hidden,false);
assert.equal(app.ids.get("space-today").hidden,true);
assert.equal(app.studio.dataset.navDirection,"forward");
assert.equal(app.ids.get("open-more").attrs["aria-current"],"page");
assert.ok(app.events.includes("scroll:0,0"));
app.moreDialog.showModal();
const activity=app.controls.find(x=>x.dataset.view==="movement");
activity.click();
assert.ok(app.events.indexOf("more:close")<app.events.lastIndexOf("focus:movement"),
 "More dialog must close before moving focus to new screen");
assert.equal(app.studio.dataset.navDirection,"back");
assert.equal(app.ids.get("open-more").attrs["aria-current"],undefined);
assert.equal(app.ids.get("space-movement").hidden,false);
assert.equal(app.events.filter(x=>x.startsWith("url:")).length,2);
const noMotion=harness(true);
noMotion.controls.find(x=>x.dataset.view==="portfolio").click();
assert.equal(noMotion.studio.dataset.navDirection,"none");
console.log("Native layout, eight screens, modal navigation, reduced motion, and private client policy: OK");
