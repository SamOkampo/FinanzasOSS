import assert from "node:assert/strict";
import { buildSourceOnboarding } from "../dist/apps/web/src/source-onboarding.js";

const stages = [
  "not_verified",
  "portal_registered",
  "sandbox_api_approved",
  "production_access_review",
];

for (const providerAccessStage of stages) {
  const model = buildSourceOnboarding({
    providerName: "Bancolombia",
    providerAccessStage,
    manualImportPreviewAvailable: true,
  });

  assert.equal(model.title, "Empieza con tus datos");
  assert.equal(model.importCard.action.id, "review_local_import");
  assert.equal(model.importCard.action.enabled, true);
  assert.equal(model.importCard.action.requiresUserConfirmation, true);
  assert.equal(model.importCard.storesDataWithoutPreview, false);
  assert.deepEqual(model.importCard.acceptedFormats, ["CSV", "XLSX", "OFX", "PDF"]);
  assert.equal(model.providerCard.title, "Bancolombia");
  assert.equal(model.providerCard.status, providerAccessStage);
  assert.equal(model.providerCard.bankConnected, false);
  assert.equal(model.providerCard.automaticSyncAvailable, false);
  assert.equal(model.providerCard.productionAccessImplied, false);
  assert.equal(model.providerCard.action.id, "view_provider_requirements");
  assert.equal(model.providerCard.action.enabled, true);
  assert.ok(model.providerCard.description.length > 30);
}

const portalOnly = buildSourceOnboarding({
  providerName: " Bancolombia ",
  providerAccessStage: "portal_registered",
  manualImportPreviewAvailable: false,
});
assert.equal(portalOnly.providerCard.title, "Bancolombia");
assert.equal(portalOnly.importCard.action.enabled, false);
assert.equal(portalOnly.providerCard.automaticSyncAvailable, false);
assert.match(portalOnly.providerCard.description, /portal/i);

const unnamedProvider = buildSourceOnboarding({
  providerName: "   ",
  providerAccessStage: "not_verified",
  manualImportPreviewAvailable: true,
});
assert.equal(unnamedProvider.providerCard.title, "Entidad financiera");

console.log("Phase 15.1 import-first onboarding regression passed");
