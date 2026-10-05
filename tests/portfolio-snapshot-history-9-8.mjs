import assert from "node:assert/strict";
import {
  appendPortfolioSnapshot,
  buildPortfolioSnapshotHistory,
  latestPortfolioSnapshot,
} from "../dist/packages/finance-core/src/portfolio-snapshot-history.js";

const portfolio = {
  id: "portfolio-1",
  tenantId: "tenant-1",
  name: "Synthetic Portfolio",
  baseCurrency: "COP",
  status: "active",
  accountIds: ["investment-account"],
};

const s1 = {
  id: "snapshot-1",
  tenantId: "tenant-1",
  portfolioId: "portfolio-1",
  asOf: "2026-01-31T23:59:59Z",
  marketValue: { amountMinor: 100000000n, currency: "COP" },
  cashValue: { amountMinor: 5000000n, currency: "COP" },
  netContributions: { amountMinor: 90000000n, currency: "COP" },
};
const s2 = {
  id: "snapshot-2",
  tenantId: "tenant-1",
  portfolioId: "portfolio-1",
  asOf: "2026-02-28T23:59:59Z",
  marketValue: { amountMinor: 112000000n, currency: "COP" },
  cashValue: { amountMinor: 6000000n, currency: "COP" },
  netContributions: { amountMinor: 95000000n, currency: "COP" },
};

const history = buildPortfolioSnapshotHistory(portfolio, [s2, s1]);
assert.deepEqual(history.snapshots.map((snapshot) => snapshot.id), ["snapshot-1", "snapshot-2"]);
assert.equal(latestPortfolioSnapshot(history)?.id, "snapshot-2");

const s3 = {
  ...s2,
  id: "snapshot-3",
  asOf: "2026-03-31T23:59:59Z",
  marketValue: { amountMinor: 120000000n, currency: "COP" },
};
const appended = appendPortfolioSnapshot(portfolio, history, s3);
assert.equal(appended.snapshots.length, 3);
assert.equal(latestPortfolioSnapshot(appended)?.id, "snapshot-3");

assert.throws(() => buildPortfolioSnapshotHistory(portfolio, [s1, { ...s1, id: "duplicate-time" }]), /timestamp/);
assert.throws(() => buildPortfolioSnapshotHistory(portfolio, [{ ...s1, marketValue: { amountMinor: 1n, currency: "USD" } }]), /currency mismatch/);
assert.throws(() => buildPortfolioSnapshotHistory(portfolio, [{ ...s1, portfolioId: "other" }]), /mismatch/);

console.log("Phase 9.8 portfolio snapshot history regression passed");
