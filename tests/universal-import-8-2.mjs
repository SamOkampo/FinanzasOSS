import assert from "node:assert/strict";
import { PdfImportValidationError, prepareIsolatedPdfParse } from "../dist/packages/import-engine/src/pdf-isolation.js";

const job = prepareIsolatedPdfParse({ fileName: "extracto.PDF", byteLength: 2048, encrypted: true });
assert.equal(job.kind, "isolated_pdf_parse");
assert.equal(job.trust, "untrusted_user_input");
assert.equal(job.sandboxRequired, true);
assert.equal(job.networkAccessAllowed, false);
assert.equal(job.persistenceAllowed, false);
assert.equal(job.passwordPersistenceAllowed, false);
assert.equal(job.activeContentAllowed, false);
assert.equal(job.ocrAllowed, false);
assert.equal(job.source.encrypted, true);

assert.throws(() => prepareIsolatedPdfParse({ fileName: "extracto.csv", byteLength: 100 }), PdfImportValidationError);
assert.throws(() => prepareIsolatedPdfParse({ fileName: "extracto.pdf", byteLength: 0 }), PdfImportValidationError);
assert.throws(() => prepareIsolatedPdfParse({ fileName: "extracto.pdf", byteLength: 26 * 1024 * 1024 }), PdfImportValidationError);

console.log("isolated pdf 8.2 boundaries: ok");
