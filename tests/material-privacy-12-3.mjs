import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  financialMaterialPolicies,
} from "../dist/packages/ui/src/materials.js";
import {
  assertPrivacyMaterial,
  assertSurfaceForSensitiveMoney,
  surfacePolicies,
} from "../dist/apps/web/src/surfaces.js";

assert.equal(financialMaterialPolicies.financial_solid.allowsSensitiveNumbers, true);
assert.equal(financialMaterialPolicies.navigation_glass.allowsSensitiveNumbers, false);
assert.equal(financialMaterialPolicies.floating_glass.allowsSensitiveNumbers, false);
assert.equal(financialMaterialPolicies.privacy_overlay.requiresPrivacyMask, true);
assert.equal(financialMaterialPolicies.privacy_overlay.decorativeOnly, false);

assert.equal(surfacePolicies.solid.materialRole, "financial_solid");
assert.equal(surfacePolicies.privacy.requiresPrivacyMask, true);

assert.doesNotThrow(() => assertSurfaceForSensitiveMoney("solid"));
assert.throws(() => assertSurfaceForSensitiveMoney("glass"), /require a solid surface/);
assert.throws(() => assertSurfaceForSensitiveMoney("privacy"), /require a solid surface/);
assert.doesNotThrow(() => assertPrivacyMaterial("privacy", true));
assert.throws(() => assertPrivacyMaterial("privacy", false), /requires masked sensitive values/);

const css = await readFile(new URL("../apps/web/src/theme.css", import.meta.url), "utf8");
assert.match(css, /fos-glass-navigation-blur: 24px/);
assert.match(css, /fos-glass-floating-blur: 20px/);
assert.match(css, /fos-glass-overlay-blur: 28px/);
assert.match(css, /data-finanzasos-surface="privacy"/);

console.log("Phase 12.3 material privacy regression passed");
