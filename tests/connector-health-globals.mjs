// Test bootstrap for Phase 3.5 smoke assertions.
// Keep production modules untouched; smoke.mjs references connectorCanSync as a global.
import { connectorCanSync } from "../dist/packages/connector-sdk/src/index.js";

globalThis.connectorCanSync = connectorCanSync;
