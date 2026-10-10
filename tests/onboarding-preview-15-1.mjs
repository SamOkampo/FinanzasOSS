import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const base = new URL("../apps/web/public/", import.meta.url);
const [html, css, script] = await Promise.all([
  readFile(new URL("index.html", base), "utf8"),
  readFile(new URL("preview.css", base), "utf8"),
  readFile(new URL("preview.js", base), "utf8"),
]);

assert.match(html, /lang="es"/);
assert.match(html, /connect-src 'none'/);
assert.match(html, /form-action 'none'/);
assert.match(html, /VISTA PREVIA/);
assert.match(html, /no están conectados a esta pantalla/);
assert.match(html, /aria-live="polite"/);
assert.match(html, /href="#contenido"/);
assert.match(css, /@media \(max-width: 720px\)/);
assert.match(css, /prefers-reduced-motion/);
assert.match(css, /\[hidden\] \{ display: none !important; \}/);
assert.doesNotMatch(html, /<input\b|<form\b|\btype="file"/i);
assert.doesNotMatch(script, /\b(fetch|XMLHttpRequest|WebSocket|localStorage|sessionStorage)\b/);

function fakeButton(data) {
  const handlers = {};
  return {
    dataset: data,
    handlers,
    attrs: {},
    classes: new Set(),
    classList: { toggle(name, enabled) {
      if (enabled) this.classes?.add?.(name);
    } },
    addEventListener(event, handler) { handlers[event] = handler; },
    setAttribute(name, value) { this.attrs[name] = value; },
  };
}

function button(data) {
  const handlers = {};
  const classes = new Set();
  return {
    dataset: data, handlers, classes, attrs: {},
    classList: { toggle(name, enabled) { enabled ? classes.add(name) : classes.delete(name); } },
    addEventListener(event, handler) { handlers[event] = handler; },
    setAttribute(name, value) { this.attrs[name] = value; },
  };
}
const views = ["overview", "import", "connections"];
const nav = views.map((view) => button({ view }));
const links = [button({ viewTarget: "import" }), button({ viewTarget: "connections" })];
const panels = views.map((panel) => ({ dataset: { panel }, hidden: panel !== "overview" }));
const announcer = { textContent: "" };
let focusCount = 0;
const document = {
  querySelectorAll(selector) {
    if (selector === "[data-view]") return nav;
    if (selector === "[data-panel]") return panels;
    if (selector === "[data-view-target]") return links;
    throw new Error("Unexpected selector " + selector);
  },
  getElementById(id) {
    if (id === "announcement") return announcer;
    if (id === "contenido") return { focus() { focusCount++; } };
    return null;
  },
};
vm.runInNewContext(script, { document });
nav[1].handlers.click();
assert.equal(panels[1].hidden, false);
assert.equal(panels[0].hidden, true);
assert.equal(nav[1].attrs["aria-pressed"], "true");
assert.equal(nav[0].attrs["aria-pressed"], "false");
links[1].handlers.click();
assert.equal(panels[2].hidden, false);
assert.equal(announcer.textContent, "Sección: Conexiones");
assert.equal(focusCount, 1);

console.log("Phase 15.1 static onboarding preview regression passed");
