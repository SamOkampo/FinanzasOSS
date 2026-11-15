import assert from "node:assert/strict";
import {handleQuickRequest} from "../dist/apps/quick-worker/src/index.js";
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
console.log("Qwen vision: owner and consent gates, page payload, quota and uncertain fields PASSED");
