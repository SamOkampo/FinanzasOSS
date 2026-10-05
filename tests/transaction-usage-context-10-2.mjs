import assert from "node:assert/strict";
import { classifyTransactionUsageContext } from "../dist/packages/finance-core/src/transaction-usage-context.js";

const protectedTransfer = classifyTransactionUsageContext({
  description: "Pago proveedor",
  categoryGroup: "business",
  transactionType: "investment_transfer",
  userOverride: "business",
});
assert.equal(protectedTransfer.context, "not_applicable");
assert.equal(protectedTransfer.source, "protected_type");
assert.equal(protectedTransfer.needsReview, false);

const explicitPersonal = classifyTransactionUsageContext({
  description: "Factura restaurante",
  userOverride: "personal",
});
assert.equal(explicitPersonal.context, "personal");
assert.equal(explicitPersonal.confidence, "high");
assert.equal(explicitPersonal.source, "user_override");
assert.equal(explicitPersonal.needsReview, false);

const businessAccount = classifyTransactionUsageContext({
  description: "Compra cualquiera",
  accountContext: "business",
});
assert.equal(businessAccount.context, "business");
assert.equal(businessAccount.source, "account_context");
assert.equal(businessAccount.needsReview, false);

const mixedAccount = classifyTransactionUsageContext({
  description: "Compra cualquiera",
  accountContext: "mixed",
});
assert.equal(mixedAccount.context, "mixed");
assert.equal(mixedAccount.needsReview, true);

const businessCategory = classifyTransactionUsageContext({
  description: "Compra POS 5542",
  categoryGroup: "business",
});
assert.equal(businessCategory.context, "business");
assert.equal(businessCategory.source, "category");
assert.equal(businessCategory.confidence, "medium");
assert.equal(businessCategory.needsReview, true);

const businessRule = classifyTransactionUsageContext({
  description: "Pago factura proveedor ACME",
});
assert.equal(businessRule.context, "business");
assert.equal(businessRule.source, "rule");
assert.equal(businessRule.needsReview, true);

const ambiguous = classifyTransactionUsageContext({
  description: "UBER TRIP",
  categoryGroup: "transport",
});
assert.equal(ambiguous.context, "unknown");
assert.equal(ambiguous.confidence, "low");
assert.equal(ambiguous.needsReview, true);

console.log("Phase 10.2 personal/business regression passed");
