import assert from "node:assert/strict";
import { detectImportFormat, ImportDetectionError } from "../dist/packages/import-engine/src/detection.js";

assert.deepEqual(detectImportFormat({ fileName: "a.pdf", leadingBytes: [0x25,0x50,0x44,0x46] }), { format:"pdf", confidence:"signature_verified", institutionId:null, institutionDetectionDeferred:true });
assert.equal(detectImportFormat({ fileName: "a.xlsx", leadingBytes: [0x50,0x4b,0x03,0x04] }).confidence, "signature_verified");
assert.equal(detectImportFormat({ fileName: "a.ofx", leadingBytes: [...Buffer.from("OFXHEADER:100\n<OFX>")] }).confidence, "signature_verified");
assert.equal(detectImportFormat({ fileName: "a.csv" }).confidence, "extension_only");
assert.equal(detectImportFormat({ fileName: "fake.pdf", leadingBytes: [1,2,3,4] }).confidence, "extension_only");
assert.throws(() => detectImportFormat({ fileName: "a.exe" }), ImportDetectionError);
console.log("import format detection 8.3: ok");
