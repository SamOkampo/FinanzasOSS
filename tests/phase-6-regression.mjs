import assert from "node:assert/strict";
import {
  economicClassForKind,
  evaluateOwnAccountTransfer,
  isSpendingTransaction,
} from "../dist/packages/finance-core/src/index.js";
import {
  createNequiAccountInformationGate,
  NequiAccountInformationConfigurationError,
} from "../dist/packages/connector-sdk/src/nequi-account-information.js";
import {
  createDaviPlataAccountInformationGate,
  DaviPlataAccountInformationConfigurationError,
} from "../dist/packages/connector-sdk/src/daviplata-account-information.js";

const connectorCases = [
  {
    name: "Nequi",
    create: createNequiAccountInformationGate,
    ErrorType: NequiAccountInformationConfigurationError,
    basePath: "nequi",
  },
  {
    name: "DaviPlata",
    create: createDaviPlataAccountInformationGate,
    ErrorType: DaviPlataAccountInformationConfigurationError,
    basePath: "daviplata",
  },
];

for (const { name, create, ErrorType, basePath } of connectorCases) {
  const valid = {
    officialRouteVerified: true,
    consentVerified: true,
    grantedCapabilities: ["accounts", "balances", "transactions"],
    accountsEndpoint: `https://sandbox.example.invalid/${basePath}/accounts`,
    balancesEndpoint: `https://sandbox.example.invalid/${basePath}/balances`,
    transactionsEndpoint: `https://sandbox.example.invalid/${basePath}/transactions`,
  };

  const invalidCases = [
    ["official route", { ...valid, officialRouteVerified: false }],
    ["consent", { ...valid, consentVerified: false }],
    ["capabilities", { ...valid, grantedCapabilities: [] }],
    ["required endpoint", { ...valid, transactionsEndpoint: "" }],
    ["HTTPS", { ...valid, accountsEndpoint: `http://sandbox.example.invalid/${basePath}/accounts` }],
  ];

  for (const [label, config] of invalidCases) {
    assert.throws(
      () => create(config),
      ErrorType,
      `${name} must fail closed without verified ${label}`,
    );
  }

  const gate = create(valid);
  for (const capability of ["accounts", "balances", "transactions"]) {
    assert.equal(gate.canRead(capability), true, `${name} should allow verified ${capability}`);
  }

  gate.revokeConsent();
  for (const capability of ["accounts", "balances", "transactions"]) {
    assert.equal(gate.canRead(capability), false, `${name} must stop ${capability} after revocation`);
  }
}

const accountA = {
  id: "phase6-account-a",
  tenantId: "tenant-phase6",
  connectionId: "phase6-conn-a",
  institutionId: "bank-a",
  externalId: "external-a",
  name: "Cuenta A",
  type: "savings",
  domain: "cash",
  currency: "COP",
};

const accountB = {
  ...accountA,
  id: "phase6-account-b",
  connectionId: "phase6-conn-b",
  institutionId: "bank-b",
  externalId: "external-b",
  name: "Cuenta B",
};

const txBase = {
  tenantId: "tenant-phase6",
  postedAt: "2026-10-02T00:00:00Z",
  money: { amountMinor: 200000n, currency: "COP" },
  status: "posted",
  rawDescription: "Synthetic transfer",
  provenance: { sourceType: "open_finance_api", observedAt: "2026-10-02T12:00:00Z" },
};

const debit = {
  ...txBase,
  id: "phase6-out",
  connectionId: "phase6-conn-a",
  accountId: "phase6-account-a",
  direction: "debit",
  kind: "unknown",
};

const credit = {
  ...txBase,
  id: "phase6-in",
  connectionId: "phase6-conn-b",
  accountId: "phase6-account-b",
  direction: "credit",
  kind: "unknown",
};

const pseOnly = evaluateOwnAccountTransfer(debit, accountA, credit, accountB, {
  pseReferences: {
    "phase6-out": "PSE-PHASE6-001",
    "phase6-in": "PSE-PHASE6-001",
  },
});
assert.equal(pseOnly.autoLink, false, "PSE evidence alone must never auto-link");

const explicitOwnTransfer = evaluateOwnAccountTransfer(
  { ...debit, kind: "transfer" },
  accountA,
  credit,
  accountB,
  {
    pseReferences: {
      "phase6-out": "PSE-PHASE6-002",
      "phase6-in": "pse phase6 002",
    },
  },
);
assert.equal(explicitOwnTransfer.confidence, "high");
assert.equal(explicitOwnTransfer.autoLink, true);

const conflictingPse = evaluateOwnAccountTransfer(
  { ...debit, kind: "transfer" },
  accountA,
  credit,
  accountB,
  {
    pseReferences: {
      "phase6-out": "PSE-PHASE6-AAA",
      "phase6-in": "PSE-PHASE6-BBB",
    },
  },
);
assert.equal(conflictingPse.confidence, "none");
assert.equal(conflictingPse.autoLink, false);

const delegatedInvestment = evaluateOwnAccountTransfer(
  { ...debit, kind: "investment_transfer" },
  accountA,
  credit,
  accountB,
  {
    pseReferences: {
      "phase6-out": "PSE-PHASE6-INV",
      "phase6-in": "PSE-PHASE6-INV",
    },
  },
);
assert.equal(delegatedInvestment.confidence, "none");
assert.equal(isSpendingTransaction({ kind: "investment_transfer" }), false);
assert.equal(economicClassForKind("investment_transfer"), "investment_flow");
assert.equal(economicClassForKind("transfer"), "internal_transfer");

console.log("phase 6 regression audit: ok");
