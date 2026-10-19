import assert from "node:assert/strict";
import {DASH_CSS} from "../dist/apps/quick-worker/src/dashboard-css.js";
import {STUDIO_JS} from "../dist/apps/quick-worker/src/dashboard-studio-js.js";

// Verify focused style changes without substituting a screenshot for real iOS QA.
const marker="/* v22 / calm charcoal-green dark mode.";
const i=DASH_CSS.indexOf(marker);
assert.ok(i>=0,"Dark-theme refinements must exist");
const css=DASH_CSS.slice(i);
for(const selector of [
 "body.theme-night,.studio.theme-night",
 ".theme-night .history-amount",
 ".theme-night .history-bank-detail",
 ".theme-night .budget-chip",
 ".theme-night .budget-card[data-budget-status=\"near\"] .budget-chip",
 ".theme-night .budget-card[data-budget-status=\"over\"] .budget-chip",
 ".theme-night .budget-amount input",
 ".theme-night .expense-dialog",
 ".theme-night .movement-editor input",
 ".theme-night .mobile-nav",
 ".theme-night .history-action-remove:hover",
])assert.ok(css.includes(selector),"Missing dark override: "+selector);
assert.equal(DASH_CSS.slice(0,i).includes(marker),false);
assert.ok(!css.includes("!important"),"No broad priority override that affects other modes");

// Check main text, secondary text and subdued copy against dark surfaces.
const theme=css.match(/body\.theme-night,\.studio\.theme-night\{([^}]+)\}/)?.[1];
assert.ok(theme,"Dark color tokens missing");
const val=n=>theme.match(new RegExp("--"+n+":(#[0-9a-fA-F]{6})"))?.[1];
function lum(hex){
 const channels=[1,3,5].map(n=>parseInt(hex.slice(n,n+2),16)/255)
 .map(x=>x<=0.04045?x/12.92:Math.pow((x+0.055)/1.055,2.4));
 return .2126*channels[0]+.7152*channels[1]+.0722*channels[2];
}
function contrast(a,b){const [x,y]=[lum(a),lum(b)].sort((x,y)=>y-x);return (x+.05)/(y+.05);}
for(const key of ["ink","ink-2","ink-muted","copper"]){
 assert.ok(val(key),"Missing "+key);
 assert.ok(contrast(val(key),val("surface"))>=4.5,
  "Insufficient contrast for "+key+" against card surface");
}

// Exercise theme selection with a stubbed DOM; no browser storage allowed.
assert.doesNotMatch(STUDIO_JS,/localStorage|sessionStorage|innerHTML/);
const start=STUDIO_JS.indexOf("  // No browser storage by policy:");
const end=STUDIO_JS.indexOf("  // Gesture policy mirrored",start);
assert.ok(start>0&&end>start);
const source=STUDIO_JS.slice(start,end);
assert.doesNotThrow(()=>new Function("window","studio","document","byId",source));
function themeHarness(systemDark){
 let click=()=>{};
 const studio={classes:new Set(),classList:{
  toggle(c,v){if(v)studio.classes.add(c);else studio.classes.delete(c);},
  contains(c){return studio.classes.has(c);}
 }};
 const body={classes:new Set(),classList:{
  toggle(c,v){if(v)body.classes.add(c);else body.classes.delete(c);}
 }};
 const meta={value:"",setAttribute(_,v){this.value=v;}};
 const button={textContent:"",aria:"",setAttribute(_,v){this.aria=v;},
  addEventListener(_,handler){click=handler;}};
 const browser={matchMedia(query){
  assert.equal(query,"(prefers-color-scheme: dark)");return {matches:systemDark};
 }};
 const initialize=new Function("window","studio","document","byId",source);
 initialize(browser,studio,{body,querySelector(){return meta;}},()=>button);
 return {studio,body,button,meta,click:()=>click()};
}
const a=themeHarness(true);
assert.ok(a.studio.classes.has("theme-night"),"System dark should activate dark");
assert.ok(a.body.classes.has("theme-night"));
assert.equal(a.button.textContent,"Modo claro");
assert.equal(a.meta.value,"#111b1d");
a.click();
assert.ok(!a.studio.classes.has("theme-night"));
assert.equal(a.button.textContent,"Modo oscuro");
const b=themeHarness(false);
assert.ok(!b.studio.classes.has("theme-night"),"System light should stay light");
b.click();
assert.ok(b.studio.classes.has("theme-night"));
console.log("Dark theme palette contrast, six critical surfaces, system mode and reversible user override: OK");
