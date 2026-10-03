import assert from "node:assert/strict";
import { detectImportFormat, ImportDetectionError } from "../dist/packages/import-engine/src/detection.js";
import { detectInstitution } from "../dist/packages/import-engine/src/institution-detection.js";

assert.equal(detectImportFormat({ fileName: "a.pdf", leadingBytes: [0x25,0x50,0x44,0x46] }).confidence, "signature_verified");
assert.equal(detectImportFormat({ fileName: "a.xlsx", leadingBytes: [0x50,0x4b,0x03,0x04] }).confidence, "signature_verified");
assert.equal(detectImportFormat({ fileName: "a.ofx", leadingBytes: [...Buffer.from("OFXHEADER:100\n<OFX>")] }).confidence, "signature_verified");
assert.equal(detectImportFormat({ fileName: "a.csv" }).confidence, "extension_only");
assert.equal(detectImportFormat({ fileName: "fake.pdf", leadingBytes: [1,2,3,4] }).confidence, "extension_only");
assert.throws(() => detectImportFormat({ fileName: "a.exe" }), ImportDetectionError);

assert.deepEqual(detectInstitution("Extracto Lulo Bank"), { institutionId: "lulo-bank", institutionConfidence: "unique_marker" });
assert.deepEqual(detectInstitution("BANCO DE BOGOTÁ - extracto"), { institutionId: "banco-de-bogota", institutionConfidence: "unique_marker" });
assert.deepEqual(detectInstitution("Documento sin emisor"), { institutionId: null, institutionConfidence: "not_detected" });
assert.deepEqual(detectInstitution("Davivienda transferencia a Nequi"), { institutionId: null, institutionConfidence: "not_detected" });
console.log("import format/institution detection 8.3: ok");
