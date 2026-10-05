import assert from "node:assert/strict";
import { buildPortfolioDashboardModel } from "../dist/ui/src/portfolio-dashboard.js";

const tenantId = "tenant-1";
const portfolio = { id:"portfolio-1", tenantId, name:"Long term", baseCurrency:"COP", status:"active", accountIds:["broker-1"] };
const account = { id:"broker-1", tenantId, institutionId:"broker", name:"Broker", domain:"investment", currency:"COP" };
const asset = { id:"asset-1", tenantId, name:"ETF", symbol:"ETF" };
const position = { id:"position-1", tenantId, portfolioId:portfolio.id, accountId:account.id, assetId:asset.id, quantity:"2", asOf:"2026-10-05T00:00:00Z" };

const model = buildPortfolioDashboardModel({ portfolio, accounts:[account], assets:[asset], positions:[position], activities:[], asOf:"2026-10-05T00:00:00Z" });
assert.equal(model.readOnly, true);
assert.equal(model.accounts[0].domain, "investment");
assert.equal(model.positions[0].assetName, "ETF");
assert.ok(model.warnings.some((warning) => warning.includes("market value")));
assert.throws(() => buildPortfolioDashboardModel({ portfolio, accounts:[{...account, domain:"banking"}], assets:[asset], positions:[position], activities:[], asOf:"2026-10-05T00:00:00Z" }));

console.log("phase 9.1 portfolio dashboard regression passed");
