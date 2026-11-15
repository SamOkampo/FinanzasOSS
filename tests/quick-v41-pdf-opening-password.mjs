import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createRequire} from "node:module";
import {handleQuickRequest} from "../dist/apps/quick-worker/src/index.js";
import {openStatementPdf} from "../dist/apps/quick-worker/src/statement-pdf-worker.js";

const owner = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const env = {ACCESS_AUD:"pdf-opening-qa", DB:{}};
const access = {access:{aud:env.ACCESS_AUD, async getIdentity(){return {user_uuid:owner};}}};
const asset = (path) => new Request("https://qa.example.invalid" + path);
const worker = asset("/statement-pdf-worker.js");
assert.equal((await handleQuickRequest(worker,env,{})).status,401);
const response = await handleQuickRequest(worker,env,access);
assert.equal(response.status,200);
assert.equal(response.headers.get("content-security-policy"),
  "default-src 'none'; script-src 'wasm-unsafe-eval'; connect-src https://qa.example.invalid/statement-pdf-engine.wasm");
assert.equal(response.headers.get("cache-control"),"no-store, private");
new Function(await response.text());

const wasmAsset = asset("/statement-pdf-engine.wasm");
assert.equal((await handleQuickRequest(wasmAsset,env,{})).status,401);
const wasmResponse = await handleQuickRequest(wasmAsset,env,access);
assert.equal(wasmResponse.headers.get("content-type"),"application/wasm");
const wasm = createRequire(import.meta.url).resolve("@neslinesli93/qpdf-wasm/dist/qpdf.wasm");
assert.deepEqual(Buffer.from(await wasmResponse.arrayBuffer()),readFileSync(wasm));

const password = " prueba QA 41 ";
const fixture = (kind) => readFileSync(new URL("./fixtures/v41-fictitious-" + kind + ".pdf",import.meta.url));
const file = (bytes) => new File([bytes],"extracto-ficticio.pdf",{type:"application/pdf"});
const open = (bytes,password="") => openStatementPdf(file(bytes),password,wasm);
const plain = fixture("plain");
assert.deepEqual(await open(plain),{status:"plain"});
assert.deepEqual(await open("No es PDF"),{status:"unreadable"});
assert.deepEqual(await open("%PDF-1.7\ndocumento incompleto"),{status:"unreadable"});
assert.deepEqual(await open(new Uint8Array(4_000_001)),{status:"too_large"});

const protectedBytes = fixture("encrypted");
const protectedFile = file(protectedBytes);
assert.deepEqual(await open(protectedBytes),{status:"password_required"});
assert.deepEqual(await open(protectedBytes,password.trim()),{status:"incorrect_password"});
const unlocked = await openStatementPdf(protectedFile,password,wasm);
assert.equal(unlocked.status,"unlocked");
assert.deepEqual(await open(unlocked.bytes),{status:"plain"});
assert.deepEqual(Buffer.from(await protectedFile.arrayBuffer()),protectedBytes);
assert.deepEqual(await open(protectedBytes),{status:"password_required"});
console.log("v41 statement PDF: private decoder, required/correct/incorrect passwords, plaintext, size limits and original intact PASSED");
