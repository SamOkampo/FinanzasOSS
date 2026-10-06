import { readdir, readFile } from "node:fs/promises";
import { extname, join, relative } from "node:path";

const ROOT = process.cwd();
const SKIP_DIRS = new Set([".git", "node_modules", "dist", ".next", "coverage"]);
const TEXT_EXTENSIONS = new Set([
  ".ts", ".tsx", ".js", ".mjs", ".cjs", ".json", ".yml", ".yaml", ".md", ".env", ".txt",
]);
const ROOT_FILES = new Set(["package.json", ".env", ".env.local", ".env.production"]);

const PATTERNS = [
  { name: "private-key-pem", regex: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g },
  { name: "github-token", regex: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{30,}\b/g },
  { name: "github-fine-grained-token", regex: /\bgithub_pat_[A-Za-z0-9_]{40,}\b/g },
  { name: "aws-access-key", regex: /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g },
  { name: "openai-api-key", regex: /\bsk-[A-Za-z0-9_-]{32,}\b/g },
];

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.isDirectory() && SKIP_DIRS.has(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(path);
      continue;
    }
    const rel = relative(ROOT, path).replaceAll("\\", "/");
    if (rel === "scripts/secret-scan.mjs") continue;
    if (!TEXT_EXTENSIONS.has(extname(entry.name)) && !ROOT_FILES.has(rel)) continue;
    yield { path, rel };
  }
}

const findings = [];
for await (const file of walk(ROOT)) {
  const text = await readFile(file.path, "utf8");
  for (const pattern of PATTERNS) {
    pattern.regex.lastIndex = 0;
    if (pattern.regex.test(text)) findings.push(`${file.rel}: ${pattern.name}`);
  }
}

if (findings.length > 0) {
  console.error("High-confidence secret material detected:");
  for (const finding of findings) console.error(`- ${finding}`);
  process.exit(1);
}

console.log("Dedicated high-confidence repository secret scan passed");
