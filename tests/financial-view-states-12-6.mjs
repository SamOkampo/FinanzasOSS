import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  createFinancialEmptyState,
  createFinancialErrorState,
  createFinancialLoadingState,
  createFinancialReadyState,
  financialViewStatePolicy,
} from "../dist/apps/web/src/financial-view-state.js";

const loading = createFinancialLoadingState(99);
assert.equal(loading.kind, "loading");
assert.equal(loading.skeletonRows, 12);
assert.equal(loading.placeholderFinancialValuesAllowed, false);
assert.equal(loading.ariaBusy, true);

const empty = createFinancialEmptyState();
assert.equal(empty.kind, "empty");
assert.equal(empty.suggestsInventedData, false);

const authError = createFinancialErrorState("authorization_required");
assert.equal(authError.retryAllowed, false);
assert.equal(authError.rawErrorIncluded, false);
assert.equal(authError.exposesSecrets, false);
assert.match(authError.message, /consentimiento|autorizar/i);

const unsupported = createFinancialErrorState("unsupported");
assert.equal(unsupported.retryAllowed, false);
assert.match(unsupported.message, /inventados/i);

const network = createFinancialErrorState("network");
assert.equal(network.retryAllowed, true);

const ready = createFinancialReadyState({ value: 123 });
assert.equal(ready.kind, "ready");
assert.deepEqual(ready.data, { value: 123 });

assert.equal(financialViewStatePolicy.rawProviderErrorsMayBeRendered, false);
assert.equal(financialViewStatePolicy.placeholderMoneyMayBeRendered, false);
assert.equal(financialViewStatePolicy.sensitiveValuesVisibleWhileLoading, false);

const css = await readFile(new URL("../apps/web/src/theme.css", import.meta.url), "utf8");
assert.match(css, /data-finanzasos-state="loading"/);
assert.match(css, /data-finanzasos-sensitive/);
assert.match(css, /data-finanzasos-raw-error/);

console.log("Phase 12.6 financial view-state regression passed");
