import assert from "node:assert/strict";
import { runInNewContext } from "node:vm";
import { QUICK_JS } from "../dist/apps/quick-worker/src/quick-ui.js";

const exampleAccount = {
  id: "fabbabbb-aaaa-4444-bbbb-ccccdddd9999",
  currency: "COP",
  label: "Efectivo de prueba",
};

async function visit(fragment, accountList = [exampleAccount], options = {}) {
  const controls = new Map();
  const requests = [];
  const postBodies = [];
  const confirmations = [];
  const location = { pathname: "/", search: "", hash: fragment };
  let cleared = false;
  function element(id) {
    if (controls.has(id)) return controls.get(id);
    const e = {
      id, value: id === "amount" ? "25000" : id === "method" ? "debit_card" : "", textContent: "", className: "",
      disabled: false, options: [], children: [], listeners: {},
      addEventListener(type, callback) { this.listeners[type] = callback; },
      replaceChildren(...items) { this.children = [...items]; this.options = []; },
      add(option) {
        this.options.push(option);
        if (this.options.length === 1) this.value = option.value;
      },
      append(...items) { this.children.push(...items); },
      get selectedIndex() { return this.options.findIndex((x) => x.value === this.value); },
      set selectedIndex(n) { this.value = n < 0 ? "" : this.options[n]?.value ?? ""; },
    };
    controls.set(id, e);
    return e;
  }
  const mockFetch = async (path, requestOptions) => {
    requests.push({ path, method: requestOptions?.method || "GET" });
    assert.equal(path.includes("#"), false, "URL fragment must never be sent to server");
    let payload;
    if (requestOptions?.method === "POST") {
      const data = JSON.parse(requestOptions.body);
      postBodies.push(data);
      assert.equal(path, "/api/quick/entries");
      payload = { entryId: "fake-entry", replayed: false };
    } else if (path === "/healthz") payload = { writesConfigured: true };
    else if (path === "/api/quick/accounts") payload = { accounts: accountList };
    else if (path === "/api/quick/entries") payload = { entries: [] };
    else throw new Error("Unexpected request " + path);
    return { ok: true, status: 200, json: async () => payload };
  };
  const history = {
    replaceState(_state, _title, path) {
      assert.equal(path, "/");
      cleared = true;
      location.hash = "";
    },
  };
  runInNewContext(QUICK_JS, {
    document: { getElementById: element, createElement: () => element("created-" + controls.size) },
    window: { location, history, confirm(text) {
      confirmations.push(text);
      return options.confirm === true;
    } },
    URLSearchParams, Intl, Option: class Option { constructor(label, value) { this.label = label; this.value = value; } },
    fetch: mockFetch,
    crypto: { randomUUID() { return "11111111-2222-4333-8444-555555555555"; } },
  }, { timeout: 500 });
  await new Promise((resolve) => setImmediate(resolve));
  return { element, requests, postBodies, confirmations, location, cleared };
}
const valid = "#quick=1&amount=25000&concept=Almuerzo%20de%20prueba&account=Efectivo%20de%20prueba";
const ok = await visit(valid);
assert.equal(ok.cleared, true);
assert.equal(ok.location.hash, "");
assert.equal(ok.element("amount").value, "25000");
assert.equal(ok.element("merchant").value, "Almuerzo de prueba");
assert.equal(ok.element("account").value, exampleAccount.id);
assert.match(ok.element("entry-message").textContent, /Nada se ha guardado/);
assert.deepEqual(ok.requests.map((x) => x.path), ["/healthz", "/api/quick/accounts", "/api/quick/entries"]);
assert.equal(ok.requests.every((x) => x.method === "GET"), true);

const invalidAmount = await visit("#quick=1&amount=-1&concept=Almuerzo&account=Efectivo%20de%20prueba");
assert.equal(invalidAmount.location.hash, "");
assert.match(invalidAmount.element("entry-message").textContent, /Monto inválido/);
assert.equal(invalidAmount.element("merchant").value, "");

const missingAccount = await visit("#quick=1&amount=25000&concept=Prueba&account=Cuenta%20inexistente");
assert.equal(missingAccount.element("account").value, "");
assert.equal(missingAccount.element("save-entry").disabled, true);
missingAccount.element("account").value = exampleAccount.id;
missingAccount.element("account").listeners.change();
assert.equal(missingAccount.element("save-entry").disabled, false);

const duplicatedAccount = await visit(valid, [exampleAccount, { ...exampleAccount, id: "different-id" }]);
assert.equal(duplicatedAccount.element("account").value, "");
assert.equal(duplicatedAccount.element("save-entry").disabled, true);

const duplicateField = await visit(valid + "&amount=900000");
assert.equal(duplicateField.element("merchant").value, "");
assert.match(duplicateField.element("entry-message").textContent, /formato esperado/);

const injectedField = await visit(valid + "&confirmed=true");
assert.match(injectedField.element("entry-message").textContent, /formato esperado/);

const ordinary = await visit("");
assert.equal(ordinary.cleared, false);
assert.equal(ordinary.element("merchant").value, "");
assert.equal(ordinary.requests.every((x) => x.method === "GET"), true);

console.log("iPhone Shortcut fragment prefill: private, validated, account matched and never auto-submitted");


// New Siri Shortcuts variant always sends 6 keys, keeping older 4-key
// shortcuts backward compatible. Bank is required for debit/credit/transfer.
const base = valid;
const debit = await visit(base + "&method=debit_card&bank=Banco%20de%20prueba");
assert.equal(debit.element("method").value, "debit_card");
assert.equal(debit.element("bank").value, "Banco de prueba");
assert.equal(debit.element("bank-field").hidden, false);
assert.equal(debit.element("bank").required, true);
assert.equal(debit.postBodies.length, 0);
await debit.element("entry-form").listeners.submit({ preventDefault() {} });
assert.equal(debit.postBodies.length, 0, "requires human confirmation");
const confirmedDebit = await visit(base + "&method=debit_card&bank=Banco%20de%20prueba", [exampleAccount], { confirm: true });
await confirmedDebit.element("entry-form").listeners.submit({ preventDefault() {} });
assert.equal(confirmedDebit.postBodies.length, 1);
assert.equal(confirmedDebit.postBodies[0].paymentMethod, "debit_card");
assert.equal(confirmedDebit.postBodies[0].bankLabel, "Banco de prueba");
assert.equal(confirmedDebit.postBodies[0].confirmed, true);
assert.match(confirmedDebit.confirmations[0], /Banco: Banco de prueba/);

for (const method of ["credit_card", "bank_transfer"]) {
  const result = await visit(base + "&method=" + method + "&bank=Banco%20de%20prueba");
  assert.equal(result.element("method").value, method);
  assert.equal(result.element("bank").required, true);
  assert.equal(result.element("bank").value, "Banco de prueba");
  assert.equal(result.requests.every((req) => req.method === "GET"), true);
}
for (const method of ["cash", "digital_wallet", "other"]) {
  const result = await visit(base + "&method=" + method + "&bank=", [exampleAccount], { confirm: true });
  assert.equal(result.element("method").value, method);
  assert.equal(result.element("bank-field").hidden, true);
  assert.equal(result.element("bank").required, false);
  assert.equal(result.element("bank").disabled, true);
  await result.element("entry-form").listeners.submit({ preventDefault() {} });
  assert.equal(result.postBodies.length, 1);
  assert.equal(result.postBodies[0].bankLabel, null);
  assert.equal(result.postBodies[0].paymentMethod, method);
}
const noBank = await visit(base + "&method=credit_card&bank=");
assert.match(noBank.element("entry-message").textContent, /banco solo debe indicarse/);
assert.equal(noBank.postBodies.length, 0);
const forbiddenBank = await visit(base + "&method=cash&bank=Banco%20de%20prueba");
assert.match(forbiddenBank.element("entry-message").textContent, /banco solo debe indicarse/);
const unknownMethod = await visit(base + "&method=crypto&bank=");
assert.match(unknownMethod.element("entry-message").textContent, /Método de pago inválido/);
const duplicateBank = await visit(base + "&method=debit_card&bank=Banco%20de%20prueba&bank=otro");
assert.match(duplicateBank.element("entry-message").textContent, /formato esperado/);
const missingBankParam = await visit(base + "&method=debit_card");
assert.match(missingBankParam.element("entry-message").textContent, /formato esperado/);

// Changing the payment method to cash must erase and hide the bank.
const switching = await visit(base + "&method=bank_transfer&bank=Banco%20de%20prueba");
switching.element("method").value = "cash";
switching.element("method").listeners.change();
assert.equal(switching.element("bank").value, "");
assert.equal(switching.element("bank-field").hidden, true);
assert.equal(switching.element("bank").required, false);
switching.element("method").value = "debit_card";
switching.element("method").listeners.change();
assert.equal(switching.element("bank").value, "");
assert.equal(switching.element("bank").required, true);
await switching.element("entry-form").listeners.submit({ preventDefault() {} });
assert.equal(switching.postBodies.length, 0, "bank required for any new card operation");
assert.match(switching.element("entry-message").textContent, /Escribe el nombre del banco/);

console.log("Conditional bank name: selected for cards/transfers only, validated, persisted after manual confirmation");