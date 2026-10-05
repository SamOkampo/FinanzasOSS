import assert from "node:assert/strict";
import { normalizeMerchant } from "../dist/packages/finance-core/src/merchant-normalization.js";

const protectedInvestment = normalizeMerchant({
  description: "Transferencia a broker",
  merchantName: "Rappi",
  providerCategory: "shopping",
  transactionType: "investment_transfer",
});
assert.deepEqual(protectedInvestment, {
  merchant: null,
  category: "investment",
  confidence: "high",
  source: "protected_type",
  needsReview: false,
});

const protectedTransfer = normalizeMerchant({
  description: "Transferencia entre cuentas propias",
  transactionType: "internal_transfer",
});
assert.equal(protectedTransfer.category, "transfer");
assert.equal(protectedTransfer.source, "protected_type");
assert.equal(protectedTransfer.needsReview, false);

const explicitMerchant = normalizeMerchant({
  description: "COMPRA POS 18442",
  merchantName: "UBER *TRIP",
});
assert.equal(explicitMerchant.merchant, "UBER TRIP");
assert.equal(explicitMerchant.category, "transport");
assert.equal(explicitMerchant.confidence, "high");
assert.equal(explicitMerchant.source, "merchant_name");
assert.equal(explicitMerchant.needsReview, false);

const accentNormalized = normalizeMerchant({
  description: "Compra Éxito Calle 80",
});
assert.equal(accentNormalized.merchant, "Compra Exito Calle 80");
assert.equal(accentNormalized.category, "groceries");
assert.equal(accentNormalized.confidence, "medium");
assert.equal(accentNormalized.needsReview, true);

const providerSignal = normalizeMerchant({
  description: "Pago comercio 5521",
  providerCategory: "farmacia",
});
assert.equal(providerSignal.category, "health");
assert.equal(providerSignal.source, "provider_category");
assert.equal(providerSignal.needsReview, true);

const unknown = normalizeMerchant({
  description: "PAGO REF 884291",
});
assert.equal(unknown.category, null);
assert.equal(unknown.confidence, "low");
assert.equal(unknown.needsReview, true);

console.log("Phase 10.1 merchant normalization regression passed");
