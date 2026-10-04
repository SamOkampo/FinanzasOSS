import assert from "node:assert/strict";
import { ImportMappingError, previewMappedImport } from "../dist/packages/import-engine/src/mapping-preview.js";

const mapping = {
  postedAt: "fecha",
  description: "descripcion",
  amount: "valor",
  direction: "direccion",
  currency: "moneda",
  externalId: "id",
};

const preview = previewMappedImport([
  { fecha: "2026-10-04", descripcion: "Café", valor: "12500.00", direccion: "debit", moneda: "cop", id: "tx-1" },
  { fecha: "", descripcion: "=HYPERLINK('https://example.invalid')", valor: "99", direccion: "sideways", moneda: "usd" },
], mapping);

assert.equal(preview.persistenceAllowed, false);
assert.equal(preview.requiresUserConfirmation, true);
assert.equal(preview.readyCount, 1);
assert.equal(preview.attentionCount, 1);
assert.equal(preview.rows[0].status, "ready");
assert.equal(preview.rows[0].candidate.currency, "COP");
assert.equal(preview.rows[0].candidate.direction, "debit");
assert.equal(preview.rows[1].status, "needs_attention");
assert.ok(preview.rows[1].issues.includes("missing:postedAt"));
assert.ok(preview.rows[1].issues.includes("invalid:direction"));
assert.ok(preview.rows[1].issues.includes("active_content_not_allowed:description"));

assert.throws(
  () => previewMappedImport([{ a: "1" }], { postedAt: "", description: "d", amount: "a" }),
  ImportMappingError,
);
assert.throws(
  () => previewMappedImport([], { postedAt: "f", description: "d", amount: "a" }),
  ImportMappingError,
);
assert.throws(
  () => previewMappedImport(
    Array.from({ length: 101 }, (_, index) => ({ f: String(index), d: "x", a: "1" })),
    { postedAt: "f", description: "d", amount: "a" },
  ),
  ImportMappingError,
);

console.log("mapping and preview 8.4: ok");
