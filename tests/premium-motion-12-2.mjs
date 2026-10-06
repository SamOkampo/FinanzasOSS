import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  premiumMotionPolicy,
  resolveFinancialMotion,
  resolveMotionDuration,
} from "../dist/packages/ui/src/motion.js";

const fullPrivacy = resolveFinancialMotion("privacy", "full");
assert.equal(fullPrivacy.transform, "morph");
assert.equal(fullPrivacy.opacityTransition, true);
assert.equal(fullPrivacy.loops, false);

const reducedPrivacy = resolveFinancialMotion("privacy", "reduced");
assert.equal(reducedPrivacy.transform, "none");
assert.equal(reducedPrivacy.opacityTransition, true);
assert.equal(reducedPrivacy.spatialContinuity, false);
assert.equal(reducedPrivacy.durationMs, 120);

const contribution = resolveFinancialMotion("investment_contribution", "full");
assert.equal(contribution.transform, "translate");
assert.equal(contribution.spatialContinuity, true);
assert.equal(contribution.loops, false);

assert.equal(resolveMotionDuration("instant", "reduced"), 80);
assert.equal(premiumMotionPolicy.continuousDecorationAllowed, false);
assert.equal(premiumMotionPolicy.balanceCountUpAllowed, false);
assert.equal(premiumMotionPolicy.hoverOnlyAffordancesAllowed, false);
assert.equal(premiumMotionPolicy.reducedMotionUsesTransform, false);

const css = await readFile(new URL("../apps/web/src/theme.css", import.meta.url), "utf8");
assert.match(css, /data-finanzasos-motion="investment-contribution"/);
assert.match(css, /prefers-reduced-motion: reduce/);
assert.match(css, /transition-property: opacity/);
assert.match(css, /data-finanzasos-privacy-state="masked"/);

console.log("Phase 12.2 premium motion regression passed");
