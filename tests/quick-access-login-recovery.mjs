import assert from "node:assert/strict";
import {handleQuickRequest} from "../dist/apps/quick-worker/src/index.js";
const base="https://finanzasoss-quick-staging.socampoecheverry.workers.dev";
const env={ACCESS_AUD:"access-ui-test",DB:{}};
const without={};
const loggedIn={access:{aud:env.ACCESS_AUD,async getIdentity(){return {user_uuid:"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",email:"socampoecheverry@gmail.com"};}}};
const otherUser={access:{aud:env.ACCESS_AUD,async getIdentity(){return {user_uuid:"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",email:"neriedecheverry@gmail.com"};}}};
const browser=await handleQuickRequest(new Request(base+"/dashboard",{
 headers:{Accept:"text/html,application/xhtml+xml;q=0.9"}
}),env,without);
assert.equal(browser.status,200);
const html=await browser.text();
assert.match(html,/Iniciar sesión de forma segura/);
assert.match(html,/\/cdn-cgi\/access\/login\?redirect_url=%2Fdashboard/);
assert.doesNotMatch(html,/token|contraseña|Bearer/i);
const csp=browser.headers.get("Content-Security-Policy");
assert.match(csp,/default-src 'none'/);
assert.match(csp,/script-src|default-src 'none'/);
assert.match(csp,/frame-ancestors 'none'/);
const authorized=await handleQuickRequest(new Request(base+"/dashboard",{
 headers:{Accept:"text/html"}
}),env,loggedIn);
assert.equal(authorized.status,200);
const page=await authorized.text();
assert.match(page,/id="studio"/);
assert.doesNotMatch(page,/Iniciar sesión de forma segura/);
const api=await handleQuickRequest(new Request(base+"/api/quick/budgets"),env,without);
assert.equal(api.status,401);
assert.deepEqual(await api.json(),{error:"Cloudflare Access required"});
const asset=await handleQuickRequest(new Request(base+"/studio.js",{
 headers:{Accept:"application/javascript"}
}),env,without);
assert.equal(asset.status,401);
const misc=await handleQuickRequest(new Request(base+"/dashboard",{
 headers:{Accept:"application/json"}
}),env,without);
assert.equal(misc.status,401);
// Profile identity must be derived from Access, not a user-controlled header.
const profileA=await handleQuickRequest(new Request(base+"/api/quick/profile",
 {headers:{"X-Owner-Email":"neriedecheverry@gmail.com"}}),env,loggedIn);
assert.equal(profileA.status,200);
assert.deepEqual(await profileA.json(),{email:"socampoecheverry@gmail.com",profile:"personal"});
const profileB=await handleQuickRequest(new Request(base+"/api/quick/profile"),env,otherUser);
assert.equal(profileB.status,200);
assert.deepEqual(await profileB.json(),{email:"neriedecheverry@gmail.com",profile:"personal"});
assert.equal(profileB.headers.get("Cache-Control"),"no-store, private");
assert.equal((await handleQuickRequest(new Request(base+"/api/quick/profile"),env,without)).status,401);
const htmlProfile=await (await handleQuickRequest(new Request(base+"/dashboard",{headers:{Accept:"text/html"}}),env,loggedIn)).text();
assert.match(htmlProfile,/id="profile-email"/);
assert.match(htmlProfile,/href="\\/cdn-cgi\\/access\\/logout"/);
assert.doesNotMatch(htmlProfile,/neriedecheverry@gmail.com/);
const client=await handleQuickRequest(new Request(base+"/studio.js"),env,loggedIn);
assert.equal(client.status,200);
assert.match(await client.text(),/api\\/quick\\/profile/);
console.log("Access recovery: browser login only; private API/assets remain denied; valid session preserved");
