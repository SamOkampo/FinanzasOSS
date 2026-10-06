import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  auditInteractiveControl,
  evaluateExperiencePerformance,
  experienceAccessibilityPolicy,
  experiencePerformanceBudgets,
  financialStatusAnnouncement,
} from "../dist/apps/web/src/experience-quality.js";

const goodPerformance = evaluateExperiencePerformance({
  initialScriptBytes: experiencePerformanceBudgets.initialScriptBytes,
  criticalCssBytes: experiencePerformanceBudgets.criticalCssBytes,
  interactionLatencyMs: experiencePerformanceBudgets.interactionLatencyMs,
  layoutShift: experiencePerformanceBudgets.layoutShift,
});
assert.equal(goodPerformance.passes, true);
assert.deepEqual(goodPerformance.violations, []);

const badPerformance = evaluateExperiencePerformance({
  initialScriptBytes: experiencePerformanceBudgets.initialScriptBytes + 1,
  criticalCssBytes: experiencePerformanceBudgets.criticalCssBytes + 1,
  interactionLatencyMs: experiencePerformanceBudgets.interactionLatencyMs + 1,
  layoutShift: experiencePerformanceBudgets.layoutShift + 0.01,
});
assert.equal(badPerformance.passes, false);
assert.equal(badPerformance.violations.length, 4);

const accessible = auditInteractiveControl({
  widthPx:44,
  heightPx:44,
  hasAccessibleName:true,
  keyboardReachable:true,
  focusVisible:true,
});
assert.equal(accessible.passes, true);

const inaccessible = auditInteractiveControl({
  widthPx:40,
  heightPx:44,
  hasAccessibleName:false,
  keyboardReachable:false,
  focusVisible:false,
});
assert.equal(inaccessible.passes, false);
assert.deepEqual(inaccessible.violations, [
  "touch_target_below_44px",
  "accessible_name_missing",
  "keyboard_access_missing",
  "visible_focus_missing",
]);

assert.equal(experienceAccessibilityPolicy.announcementsMayIncludeSensitiveAmounts, false);
assert.equal(experienceAccessibilityPolicy.deferredSectionsMayContainPrimaryNetWorthSummary, false);
assert.equal(experienceAccessibilityPolicy.reducedMotionRequired, true);
assert.doesNotMatch(financialStatusAnnouncement("updated"), /\$|COP|USD|\d/);

const css = await readFile(new URL("../apps/web/src/theme.css", import.meta.url), "utf8");
assert.match(css, /data-finanzasos-skip-link/);
assert.match(css, /data-finanzasos-status-region/);
assert.match(css, /data-finanzasos-deferred-section="secondary"/);
assert.match(css, /data-finanzasos-deferred-section="primary-net-worth"/);

console.log("Phase 12.7 performance accessibility regression passed");
