import assert from "node:assert/strict";
import { DASH_CSS } from "../dist/apps/quick-worker/src/dashboard-css.js";
import { DASH_HTML } from "../dist/apps/quick-worker/src/dashboard-html.js";

// Regression: the balance panel previously used undefined --panel/--line,
// causing cream background + white inherited text in dark iPhone mode.
const css=DASH_CSS.slice(DASH_CSS.indexOf("/* v39 - Verified balances"));
assert.ok(css.length>1500);
assert.match(css,/\.verified-balances\s*\{[^}]*background:var\(--balance-bg\)/s);
assert.match(css,/--balance-bg:var\(--surface\)/);
assert.match(css,/--balance-text:var\(--ink\)/);
assert.match(css,/--balance-secondary:var\(--ink-muted\)/);
assert.match(css,/\.verified-balances \.panel-heading h2\s*\{[^}]*color:var\(--balance-text\)/s);
assert.match(css,/\.verified-balances :is\([^)]*\.balance-help/s);
assert.match(css,/\.verify-balance-form :is\(input,select\)\s*\{[^}]*background:var\(--paper\);[^}]*color:var\(--ink\)/s);
assert.match(css,/\.verify-balance-form input::placeholder\{color:var\(--ink-muted\);opacity:1\}/);
assert.match(css,/@media\(max-width:600px\)[\s\S]*\.verified-balances\{padding:20px 17px/);
assert.match(DASH_HTML,/id="verify-balance-bank"/);
assert.match(DASH_HTML,/id="verify-balance-amount"/);
assert.match(DASH_HTML,/id="verify-balance-submit"/);
assert.ok(DASH_CSS.includes("body.theme-night") && DASH_CSS.includes("--surface:#1d2c2a"));
assert.ok(!/\.verified-balances\{[^}]*background:var\(--panel\b/.test(css));
console.log("Balances dark/light text and mobile input CSS contrast regression PASSED");
