import assert from "node:assert/strict";
import { runInNewContext } from "node:vm";
import { QUICK_JS } from "../dist/apps/quick-worker/src/quick-ui.js";

const exampleAccount = {
  id: "fabbabbb-aaaa-4444-bbbb-ccccdddd9999",
  currency: "COP",
  label: "Efectivo de prueba",
};

async function visit(fragment, accountList = [exampleAccount]) {
  const controls = new Map();
  const requests = [];
  const location = { pathname: "/", search: "", hash: fragment };
  let cleared = false;
  function element(id) {
    if (controls.has(id)) return controls.get(id);
    const e = {
      id, value: id === "amount" ? "25000" : "", textContent: "", className: "",
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
  const mockFetch = async (path, options) => {
    requests.push({ path, method: options?.method || "GET" });
    assert.equal(path.includes("#"), false, "URL fragment must never be sent to server");
    let payload;
    if (path === "/healthz") payload = { writesConfigured: true };
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
    window: { location, history, confirm() { throw new Error("No automatic confirmation"); } },
    URLSearchParams, Intl, Option: class Option { constructor(label, value) { this.label = label; this.value = value; } },
    fetch: mockFetch,
    crypto: { randomUUID() { throw new Error("No automatic writes"); } },
  }, { timeout: 500 });
  await new Promise((resolve) => setImmediate(resolve));
  return { element, requests, location, cleared };
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
