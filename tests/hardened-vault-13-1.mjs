import assert from "node:assert/strict";
import {
  HardenedTokenVault,
  asSecretReference,
  assertVaultCiphertextEnvelope,
  hardenedVaultPolicy,
  vaultAdditionalAuthenticatedData,
} from "../dist/packages/security/src/index.js";

const keyFor = (scope, reference) => `${scope.tenantId}|${scope.connectionId}|${reference}`;

function memoryStore() {
  const records = new Map();
  return {
    records,
    async insert(record) {
      records.set(keyFor(record.scope, record.reference), structuredClone(record));
    },
    async get(scope, reference) {
      const value = records.get(keyFor(scope, reference));
      return value ? structuredClone(value) : null;
    },
    async replace(scope, reference, expectedVersion, record) {
      const key = keyFor(scope, reference);
      const current = records.get(key);
      if (!current || current.version !== expectedVersion) return false;
      records.set(key, structuredClone(record));
      return true;
    },
  };
}

function testCrypto() {
  let keyId = "key-v1";
  let counter = 0;
  const cleartext = new Map();
  return {
    setKeyId(value) {
      keyId = value;
    },
    async currentKeyId() {
      return keyId;
    },
    async encrypt({ plaintext, additionalAuthenticatedData, keyId: requestedKeyId }) {
      counter += 1;
      const ciphertext = `cipher-${counter}`;
      cleartext.set(ciphertext, { plaintext, additionalAuthenticatedData });
      return {
        algorithm: "AEAD",
        keyId: requestedKeyId,
        nonce: `nonce-${counter}`,
        ciphertext,
        authTag: `tag-${counter}`,
      };
    },
    async decrypt({ envelope, additionalAuthenticatedData }) {
      const value = cleartext.get(envelope.ciphertext);
      if (!value) throw new Error("ciphertext unavailable");
      if (value.additionalAuthenticatedData !== additionalAuthenticatedData) {
        throw new Error("AAD mismatch");
      }
      return value.plaintext;
    },
  };
}

const scope = { tenantId: "tenant-1", connectionId: "conn-1" };
const otherScope = { tenantId: "tenant-2", connectionId: "conn-1" };
const store = memoryStore();
const crypto = testCrypto();
let refCounter = 0;

const vault = new HardenedTokenVault(
  crypto,
  store,
  {
    create(currentScope) {
      refCounter += 1;
      return asSecretReference(
        `vault://${currentScope.tenantId}/${currentScope.connectionId}/ref-${refCounter}`,
      );
    },
  },
  { now: () => "2026-10-06T00:40:00Z" },
);

const reference = await vault.put(scope, {
  kind: "oauth",
  accessToken: "fixture-a",
  refreshToken: "fixture-b",
  expiresAt: "2026-11-01T00:00:00Z",
  scopes: ["accounts"],
});

const first = store.records.get(keyFor(scope, reference));
assert.ok(first);
assert.equal(first.version, 1);
assert.equal(first.envelope.keyId, "key-v1");
assert.doesNotMatch(JSON.stringify(first), /fixture-a|fixture-b/);
assert.equal((await vault.get(scope, reference)).accessToken, "fixture-a");
await assert.rejects(() => vault.get(otherScope, reference), /not found/);

const aad = vaultAdditionalAuthenticatedData(scope, reference);
assert.match(aad, /tenant=tenant-1/);
assert.match(aad, /connection=conn-1/);

crypto.setKeyId("key-v2");
await vault.rotate(scope, reference, {
  kind: "oauth",
  accessToken: "fixture-c",
  refreshToken: "fixture-d",
  expiresAt: "2026-12-01T00:00:00Z",
  scopes: ["accounts"],
});

const second = store.records.get(keyFor(scope, reference));
assert.equal(second.version, 2);
assert.equal(second.envelope.keyId, "key-v2");
assert.notEqual(second.envelope.ciphertext, first.envelope.ciphertext);
assert.equal((await vault.get(scope, reference)).accessToken, "fixture-c");

await vault.revoke(scope, reference);
const revoked = store.records.get(keyFor(scope, reference));
assert.equal(revoked.version, 3);
assert.equal(revoked.revokedAt, "2026-10-06T00:40:00Z");
await assert.rejects(() => vault.get(scope, reference), /revoked/);
await assert.rejects(
  () => vault.rotate(scope, reference, { kind: "api_key", apiKey: "fixture-e" }),
  /revoked/,
);

assert.throws(
  () =>
    assertVaultCiphertextEnvelope({
      algorithm: "AEAD",
      keyId: "key",
      nonce: "nonce",
      ciphertext: "cipher",
      authTag: "tag",
      plaintext: "unexpected",
    }),
  /Unexpected vault envelope field/,
);

const conflictBase = memoryStore();
const conflictVault = new HardenedTokenVault(
  testCrypto(),
  {
    ...conflictBase,
    async replace() {
      return false;
    },
  },
  { create: () => asSecretReference("vault://tenant-1/conn-1/conflict") },
  { now: () => "2026-10-06T00:40:00Z" },
);
const conflictRef = await conflictVault.put(scope, { kind: "api_key", apiKey: "fixture-f" });
await assert.rejects(
  () => conflictVault.rotate(scope, conflictRef, { kind: "api_key", apiKey: "fixture-g" }),
  /rotation conflict/,
);

assert.equal(hardenedVaultPolicy.plaintextPersistenceAllowed, false);
assert.equal(hardenedVaultPolicy.authenticatedEncryptionRequired, true);
assert.equal(hardenedVaultPolicy.tenantAndConnectionBoundAsAad, true);
assert.equal(hardenedVaultPolicy.optimisticConcurrencyRequiredForRotation, true);
assert.equal(hardenedVaultPolicy.productionKmsProviderRequiredBeforeRealSecrets, true);

console.log("Phase 13.1 hardened vault regression passed");
