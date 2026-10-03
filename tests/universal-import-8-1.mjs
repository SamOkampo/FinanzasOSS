import assert from "node:assert/strict";
import { assertImportFormat, prepareUniversalImport, UniversalImportValidationError } from "../dist/packages/import-engine/src/index.js";

for (const [format, fileName] of [["csv", "movimientos.CSV"], ["xlsx", "extracto.xlsx"], ["ofx", "account.ofx"]]) {
  const envelope = prepareUniversalImport(format, { fileName, byteLength: 1024 });
  assert.equal(envelope.format, format);
  assert.equal(envelope.trust, "untrusted_user_input");
  assert.equal(envelope.persistenceAllowed, false);
}
assert.equal(assertImportFormat("csv"), "csv");
assert.throws(() => assertImportFormat("pdf"), UniversalImportValidationError);
assert.throws(() => prepareUniversalImport("csv", { fileName: "statement.pdf", byteLength: 10 }), UniversalImportValidationError);
assert.throws(() => prepareUniversalImport("xlsx", { fileName: "statement.xlsx", byteLength: 0 }), UniversalImportValidationError);
assert.throws(() => prepareUniversalImport("ofx", { fileName: "statement.ofx", byteLength: 26 * 1024 * 1024 }), UniversalImportValidationError);

console.log("universal import 8.1 boundaries: ok");
