import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const required = [
  "docs/ARCHITECTURE.md",
  "docs/SECURITY.md",
  "docs/security/THREAT_MODEL.md",
  "packages/finance-core/src/index.ts",
  "packages/connector-sdk/src/index.ts",
  "packages/security/src/index.ts",
];
for (const file of required) {
  if (!fs.existsSync(path.join(root, file))) throw new Error(`Missing required file: ${file}`);
}

const forbiddenPatterns = [
  /bankPassword/i,
  /bank_password/i,
  /screen\s*scrap/i,
];
const roots = ["apps", "packages"];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p);
    else if (/\.(ts|js|mjs|json)$/.test(entry.name)) {
      const content = fs.readFileSync(p, "utf8");
      for (const pattern of forbiddenPatterns) {
        if (pattern.test(content)) throw new Error(`Forbidden pattern ${pattern} in ${p}`);
      }
    }
  }
}
for (const rel of roots) walk(path.join(root, rel));
console.log("repo-lint: ok");
