// FinanzasOSS: fail-closed verification of a reviewed staging Worker artifact.
// Read-only. Neither reads Cloudflare credentials nor deploys financial code.
import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
import {spawnSync} from "node:child_process";
import assert from "node:assert/strict";
const [artifactPath,manifestPath]=process.argv.slice(2);
if(!artifactPath||!manifestPath)throw new Error("Usage: node scripts/verify-staging-artifact.mjs <worker.mjs> <manifest.json>");
const manifest=JSON.parse(readFileSync(manifestPath,"utf8"));
assert.equal(manifest.schema_version,1);
assert.equal(manifest.product,"FinanzasOSS");
assert.equal(manifest.environment,"staging");
assert.equal(manifest.source_repository,"SamOkampo/FinanzasOSS");
assert.match(manifest.source_branch,/^feature\/studio-on-device-ios-qa-\d{8}$/);
const expected=manifest.artifact;
assert.match(expected.sha256,/^[0-9a-f]{64}$/);
assert.match(expected.git_blob_sha1,/^[0-9a-f]{40}$/);
assert.ok(Number.isSafeInteger(expected.bytes)&&expected.bytes>100000);
const bytes=readFileSync(artifactPath);
const digest=createHash("sha256").update(bytes).digest("hex");
const blob=createHash("sha1").update(Buffer.concat([
 Buffer.from("blob "+bytes.length+"\0","utf8"),bytes,
])).digest("hex");
assert.equal(bytes.length,expected.bytes,"Worker byte count diverged from reviewed artifact");
assert.equal(digest,expected.sha256,"Worker SHA-256 mismatch: release is blocked");
assert.equal(blob,expected.git_blob_sha1,"Git blob SHA mismatch: release is blocked");
const source=bytes.toString("utf8");
for(const marker of expected.required_markers){
 assert.equal(typeof marker,"string");
 assert.ok(marker.length>=6&&marker.length<100);
 assert.ok(source.includes(marker),"Missing reviewed route or UI: "+marker);
}
const parsed=spawnSync(process.execPath,["--check",artifactPath],{encoding:"utf8",timeout:120000});
assert.equal(parsed.status,0,parsed.stderr||"Compiled Worker contains syntax errors");
console.log("FinanzasOSS STAGING candidate verified (no deployment):");
console.log("  sha256="+digest+" bytes="+bytes.length);
console.log("  git_blob_sha1="+blob);
console.log("  paths_and_ui="+expected.required_markers.length+" / "+expected.required_markers.length);
console.log("  source_pr="+manifest.source_pr+" previous_version="+manifest.cloudflare.previous_version_id);
