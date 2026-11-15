import assert from "node:assert/strict";
import {runInNewContext} from "node:vm";
import {handleQuickRequest} from "../dist/apps/quick-worker/src/index.js";
import {DOCUMENT_INSPECT_JS} from "../dist/apps/quick-worker/src/dashboard-document-inspect-js.js";
import {parseStatementVision,STATEMENT_VISION_PATH} from "../dist/apps/quick-worker/src/statement-vision.js";

const origin="https://finanzasoss.test";
const user="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
let hits=0,calls=0;
const env={ACCESS_AUD:"vision-test",ALLOW_STATEMENT_VISION:"true",ALLOW_WRITES:"false",
  DB:{prepare(sql){
    assert.match(sql,/^INSERT INTO quick_ai_daily_quotas/);
    return {bind(owner){assert.equal(owner,user);return this;},async first(){return ++hits<=5?{hits}:null;}};
  }},
  AI:{async run(model,input){
    calls++;
    assert.equal(model,"@cf/qwen/qwen3.8-27b");
    assert.match(input.messages[1].content[1].image_url.url,/^data:image\/jpeg;base64,/);
    return {choices:[{message:{content:JSON.stringify({rows:[
      {date:"2026-10-02",description:"Compra ficticia",amount:"1.234,56",currency:"COP",direction:"debit"},
      {date:"2026-02-31",description:"Fila ilegible",amount:"aproximado",currency:"XYZ",direction:"income"},
      {date:"2026-10-03",description:"Cargo en dólares",amount:"14.00",currency:"USD",direction:"debit"},
    ],partial:false})}}]};
  }},
};
const context={access:{aud:env.ACCESS_AUD,async getIdentity(){return {user_uuid:user};}}};
const jpeg=new Uint8Array([255,216,255,224,0,255,217]);
async function post({approval="true",page="1",file=jpeg,site=origin,ctx=context,config=env}={}){
  const form=new FormData();
  form.append("consent",approval);
  form.append("page",page);
  form.append("image",new Blob([file],{type:"image/jpeg"}),"pagina.jpg");
  return handleQuickRequest(new Request(origin+STATEMENT_VISION_PATH,{method:"POST",headers:{Origin:site},body:form}),config,ctx);
}

assert.equal((await post({ctx:{}})).status,401);
assert.equal((await post({site:"https://other.test"})).status,403);
assert.equal((await post({approval:"false"})).status,403);
assert.equal((await post({page:"21"})).status,422);
assert.equal((await post({file:new Uint8Array([1,2,3,4])})).status,422);
assert.equal((await post({config:{...env,ALLOW_STATEMENT_VISION:"false"}})).status,503);
assert.equal(hits,0);
const response=await post();
assert.equal(response.status,200);
assert.equal(response.headers.get("Cache-Control"),"no-store, private");
assert.deepEqual(await response.json(),{page:1,rows:[
  {date:"2026-10-02",description:"Compra ficticia",amount:"1.234,56",currency:"COP",direction:"debit",amountCOP:"1234.56"},
  {date:null,description:"Fila ilegible",amount:null,currency:null,direction:null,amountCOP:null},
  {date:"2026-10-03",description:"Cargo en dólares",amount:"14.00",currency:"USD",direction:"debit",amountCOP:null},
],partial:true});
assert.equal(calls,1);
hits=5;
assert.equal((await post()).status,429);
assert.equal(calls,1);
assert.equal(parseStatementVision({response:"Salida incompleta"}),null);
assert.equal(parseStatementVision({response:{rows:[{
  date:"2026-10-02",description:"Compra",amount:"1.2.34",currency:"COP",direction:"debit",
}],partial:false}}).partial,true);
const missingCurrency=parseStatementVision({response:{rows:[{
  date:"2026-10-02",description:"Compra",amount:"1.234,56",currency:null,direction:"debit",
}],partial:false}});
assert.equal(missingCurrency.rows[0].currency,null);
assert.equal(missingCurrency.rows[0].amountCOP,"1234.56");
assert.equal(missingCurrency.partial,true);
console.log("Qwen vision: owner and consent gates, page payload, quota and uncertain fields PASSED");

const fields=new Map();
function element(){
  const listeners=new Map();
  return {
    dataset:{},label:{},value:"",files:[],checked:false,hidden:false,options:[],
    addEventListener(event,listener){listeners.set(event,listener);},
    fire(event){return listeners.get(event)?.({preventDefault(){}});},
    querySelector(){return element();},closest(){return this.label;},setAttribute(){},
    replaceChildren(){this.options=[];},append(child){this.options.push(child);},
    toggleAttribute(){},focus(){},reportValidity(){return true;},
    get valueAsNumber(){return Number(this.value);},
  };
}
const get=id=>{
  if(!fields.has(id))fields.set(id,element());
  return fields.get(id);
};
const document={
  getElementById:get,dispatchEvent(){},
  createElement(tag){return tag==="canvas"?{toBlob(resolve){resolve(new Blob([jpeg],{type:"image/jpeg"}));}}:element();},
};
const browserFile=get("ai-document-file");
const automatic=get("ai-document-vision-auto");
const options=get("ai-document-vision-options");
options.dataset.visionAvailable="true";
const uploads=[];
let activeWorker;
const renderer={
  GlobalWorkerOptions:{},AnnotationMode:{DISABLE:0},
  getDocument(){return {promise:Promise.resolve({numPages:2,async getPage(){
    return {getViewport(){return {width:100,height:200};},render(){return {promise:Promise.resolve()};},cleanup(){}};
  }}),async destroy(){}};},
};
runInNewContext(DOCUMENT_INSPECT_JS.replace(/import\("\/statement-pdf-renderer\.mjs[^"]*"\)/,"loadRenderer()"),{
  document,File,FormData,Event,AbortController,clearTimeout,setTimeout,
  loadRenderer:async()=>renderer,
  Worker:class {
    constructor(){activeWorker=this;}
    postMessage(data){this.data=data;}
    terminate(){}
    reply(data){this.onmessage({data});}
  },
  async fetch(url,options){
    assert.equal(url,STATEMENT_VISION_PATH);
    assert.equal(options.body.get("consent"),"true");
    const page=Number(options.body.get("page"));
    uploads.push(page);
    return {ok:true,async json(){return {page,rows:[],partial:false};}};
  },
});
function choosePdf(){
  browserFile.files=[new File(["synthetic"],"extracto.pdf",{type:"application/pdf"})];
  browserFile.fire("change");
}
const waitForRender=()=>new Promise(resolve=>setImmediate(resolve));
choosePdf();
activeWorker.reply({status:"plain",issue:"no_text"});
assert.equal(options.open,true);
assert.deepEqual(uploads,[]);
await get("ai-document-vision-start").fire("click");
assert.deepEqual(uploads,[1]);

automatic.checked=true;
choosePdf();
assert.equal(automatic.checked,false,"The authorization is for the selected PDF only");
activeWorker.reply({status:"plain",statement:{title:"Extracto",groups:[{title:"Movimientos",rows:[
  {description:"Compra local",date:"2026-10-02",direction:"debit",amount:"COP 1200",page:1},
]}]}});
await waitForRender();
assert.deepEqual(uploads,[1],"A successful local read does not send an image");

choosePdf();
activeWorker.reply({status:"plain"});
await waitForRender();
assert.equal(options.open,true,"A PDF with text but zero detected rows also opens the fallback");
assert.deepEqual(uploads,[1]);

automatic.checked=true;
choosePdf();
activeWorker.reply({status:"password_required"});
assert.deepEqual(uploads,[1],"No image is sent before the PDF is unlocked");
get("ai-document-password").value="clave ficticia";
get("ai-document-password-form").fire("submit");
activeWorker.reply({status:"unlocked",bytes:new Uint8Array([1,2,3]),issue:"no_text"});
await waitForRender();
assert.deepEqual(uploads,[1,1],"Prior consent starts the fallback on page 1 only");
console.log("Qwen vision UI: local first, single-click consent, automatic fallback and encrypted PDF PASSED");
