import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  experiencePreferencePolicy,
  resolveExperiencePreferences,
} from "../dist/packages/ui/src/theme-preferences.js";

const systemDark = resolveExperiencePreferences({
  colorSchemePreference:"system",
  systemColorScheme:"dark",
  motionPreference:"system",
  systemPrefersReducedMotion:false,
});
assert.equal(systemDark.colorScheme, "dark");
assert.equal(systemDark.colorSchemeSource, "system");
assert.equal(systemDark.motion, "full");

const explicitLight = resolveExperiencePreferences({
  colorSchemePreference:"light",
  systemColorScheme:"dark",
  motionPreference:"system",
  systemPrefersReducedMotion:false,
});
assert.equal(explicitLight.colorScheme, "light");
assert.equal(explicitLight.colorSchemeSource, "user");

const systemReduced = resolveExperiencePreferences({
  colorSchemePreference:"dark",
  systemColorScheme:"light",
  motionPreference:"system",
  systemPrefersReducedMotion:true,
});
assert.equal(systemReduced.motion, "reduced");
assert.equal(systemReduced.motionSource, "system_reduced");

const userReduced = resolveExperiencePreferences({
  colorSchemePreference:"dark",
  systemColorScheme:"light",
  motionPreference:"reduced",
  systemPrefersReducedMotion:false,
});
assert.equal(userReduced.motion, "reduced");
assert.equal(userReduced.motionSource, "user_reduced");

assert.equal(experiencePreferencePolicy.systemReducedMotionCanBeOverriddenToFull, false);
assert.equal(experiencePreferencePolicy.storesFinancialData, false);

const css = await readFile(new URL("../apps/web/src/theme.css", import.meta.url), "utf8");
assert.match(css, /data-finanzasos-theme="light"/);
assert.match(css, /data-finanzasos-theme="dark"/);
assert.match(css, /data-finanzasos-theme="system"/);
assert.match(css, /data-finanzasos-motion-preference="reduced"/);

console.log("Phase 12.5 theme preference regression passed");
