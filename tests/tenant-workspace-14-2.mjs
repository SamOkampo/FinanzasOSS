import assert from "node:assert/strict";
import {
  buildTenantWorkspace,
  multiConnectionPortfolioPolicy,
} from "../dist/packages/database/src/index.js";

const ctx = { tenantId: "tenant-1", actorId: "user-1" };
const connections = [
  {
    id: "conn-bank",
    tenantId: "tenant-1",
    institutionId: "bank-a",
    accessMode: "open_finance_oauth",
    status: "connected",
    capabilities: ["accounts", "balances", "transactions"],
    createdAt: "2026-10-06T02:20:00Z",
    updatedAt: "2026-10-06T02:20:00Z",
  },
  {
    id: "conn-broker",
    tenantId: "tenant-1",
    institutionId: "broker-a",
    accessMode: "oauth",
    status: "connected",
    capabilities: ["accounts", "positions", "investment_activities"],
    createdAt: "2026-10-06T02:20:00Z",
    updatedAt: "2026-10-06T02:20:00Z",
  },
  {
    id: "conn-exchange",
    tenantId: "tenant-1",
    institutionId: "exchange-a",
    accessMode: "read_only_api_key",
    status: "connected",
    capabilities: ["accounts", "balances", "investment_activities"],
    createdAt: "2026-10-06T02:20:00Z",
    updatedAt: "2026-10-06T02:20:00Z",
  },
];

const accounts = [
  {
    id: "acct-cash",
    tenantId: "tenant-1",
    connectionId: "conn-bank",
    institutionId: "bank-a",
    externalId: "cash-1",
    name: "Cash",
    type: "savings",
    domain: "cash",
    currency: "COP",
  },
  {
    id: "acct-broker",
    tenantId: "tenant-1",
    connectionId: "conn-broker",
    institutionId: "broker-a",
    externalId: "broker-1",
    name: "Broker",
    type: "brokerage",
    domain: "investment",
    currency: "USD",
  },
  {
    id: "acct-exchange",
    tenantId: "tenant-1",
    connectionId: "conn-exchange",
    institutionId: "exchange-a",
    externalId: "exchange-1",
    name: "Exchange",
    type: "exchange",
    domain: "crypto",
    currency: "USD",
  },
];

const portfolios = [
  {
    id: "portfolio-growth",
    tenantId: "tenant-1",
    name: "Growth",
    baseCurrency: "USD",
    status: "active",
    accountIds: ["acct-broker"],
  },
  {
    id: "portfolio-crypto",
    tenantId: "tenant-1",
    name: "Crypto",
    baseCurrency: "USD",
    status: "active",
    accountIds: ["acct-exchange"],
  },
];

const workspace = buildTenantWorkspace({ ctx, connections, accounts, portfolios });
assert.deepEqual(workspace.connectionIds, ["conn-bank", "conn-broker", "conn-exchange"]);
assert.deepEqual(workspace.portfolioIds, ["portfolio-crypto", "portfolio-growth"]);
assert.deepEqual(workspace.portfolios[0].connectionIds, ["conn-broker"]);
assert.deepEqual(workspace.portfolios[1].connectionIds, ["conn-exchange"]);
assert.deepEqual(workspace.unassignedInvestmentAccountIds, []);

assert.throws(
  () =>
    buildTenantWorkspace({
      ctx,
      connections,
      accounts: [...accounts, { ...accounts[1], id: "acct-other", tenantId: "tenant-2" }],
      portfolios,
    }),
  /Cross-tenant access denied/,
);

assert.throws(
  () =>
    buildTenantWorkspace({
      ctx,
      connections,
      accounts,
      portfolios: [{ ...portfolios[0], id: "bad-portfolio", accountIds: ["missing-account"] }],
    }),
  /unknown account/,
);

assert.equal(multiConnectionPortfolioPolicy.multipleConnectionsAllowedPerTenant, true);
assert.equal(multiConnectionPortfolioPolicy.multiplePortfoliosAllowedPerTenant, true);
assert.equal(multiConnectionPortfolioPolicy.relationshipsMustBeDerivedFromExplicitAccounts, true);
assert.equal(multiConnectionPortfolioPolicy.implicitCrossTenantAggregationAllowed, false);
assert.equal(multiConnectionPortfolioPolicy.implicitFxConversionAllowed, false);
assert.equal(multiConnectionPortfolioPolicy.readOnlyPortfolioSemanticsPreserved, true);

console.log("Phase 14.2 multiple connections/portfolios regression passed");
