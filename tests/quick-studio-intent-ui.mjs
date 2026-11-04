import assert from "node:assert/strict";
import {STUDIO_JS} from "../dist/apps/quick-worker/src/dashboard-studio-js.js";
import {DASH_HTML} from "../dist/apps/quick-worker/src/dashboard-html.js";
import {INSIGHTS_JS} from "../dist/apps/quick-worker/src/dashboard-insights-js.js";

new Function(STUDIO_JS);
new Function(INSIGHTS_JS);
const start=DASH_HTML.indexOf('id="expense-type"');
assert.ok(start>0,"The capture dialog must contain the economic type selector");
const snippet=DASH_HTML.slice(start,start+550);
assert.match(snippet,/value="auto" selected/,"AI-from-description must be the default");
assert.match(snippet,/value="debt_repayment"/);
assert.match(STUDIO_JS,/movementType\.value/);
assert.match(STUDIO_JS,/classification\.economicGroup/);
assert.match(STUDIO_JS,/classification\.subcategory/);
assert.ok(DASH_HTML.includes("¿Qué hiciste con el dinero?"));
console.log("Studio: parsable embedded scripts and AI-intent-first capture UI passed");
