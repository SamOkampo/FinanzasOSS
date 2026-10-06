import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  financialPwaPolicy,
  mobileGesturePolicy,
  resolvePrimarySwipe,
} from "../dist/apps/web/src/mobile-experience.js";

assert.equal(mobileGesturePolicy.financialActionGesturesAllowed, false);
assert.equal(mobileGesturePolicy.destructiveGesturesAllowed, false);
assert.equal(mobileGesturePolicy.gestureScope, "primary_navigation_only");

const next = resolvePrimarySwipe("today", {
  deltaX:-96,
  deltaY:12,
  pointerCount:1,
  startedOnInteractiveControl:false,
});
assert.equal(next.kind, "navigate");
assert.equal(next.nextSpace, "movement");

const previous = resolvePrimarySwipe("portfolio", {
  deltaX:96,
  deltaY:8,
  pointerCount:1,
  startedOnInteractiveControl:false,
});
assert.equal(previous.nextSpace, "movement");

assert.equal(resolvePrimarySwipe("today", {
  deltaX:96,
  deltaY:8,
  pointerCount:1,
  startedOnInteractiveControl:false,
}).kind, "none");

assert.equal(resolvePrimarySwipe("today", {
  deltaX:-120,
  deltaY:0,
  pointerCount:1,
  startedOnInteractiveControl:true,
}).kind, "none");

assert.equal(financialPwaPolicy.installable, true);
assert.equal(financialPwaPolicy.cacheFinancialApiResponses, false);
assert.equal(financialPwaPolicy.cacheSensitiveFinancialData, false);
assert.equal(financialPwaPolicy.cacheSecretsOrCredentials, false);
assert.equal(financialPwaPolicy.offlineMoneyMovementAllowed, false);
assert.equal(financialPwaPolicy.offlineTradingAllowed, false);

const manifest = JSON.parse(await readFile(new URL("../apps/web/public/manifest.webmanifest", import.meta.url), "utf8"));
assert.equal(manifest.display, "standalone");
assert.equal(manifest.scope, "/");
assert.equal(manifest.lang, "es-CO");

const css = await readFile(new URL("../apps/web/src/theme.css", import.meta.url), "utf8");
assert.match(css, /data-finanzasos-swipe-region="primary-navigation"/);
assert.match(css, /display-mode: standalone/);
assert.match(css, /safe-area-inset-bottom/);

console.log("Phase 12.4 mobile PWA regression passed");
