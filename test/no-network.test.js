"use strict";
// Anchor for S2: `oathfast check` makes no network calls.
// Enforcement: this CI-blocking test rejects any network-capable API in
// the attestor's source. The CLI is a single file with zero deps, so a
// source-level ban is a complete gate.
const fs = require("fs");
const { CLI, assert } = require("./helpers");

const src = fs.readFileSync(CLI, "utf8");

const banned = [
  /require\(\s*["'](node:)?(http|https|net|dns|tls|dgram|http2)["']\s*\)/,
  /\bfetch\s*\(/,
  /\bXMLHttpRequest\b/,
  /\bWebSocket\b/,
  /import\s*\(\s*["'](node:)?(http|https|net|dns|tls|dgram|http2)["']\s*\)/,
];

for (const re of banned) {
  assert(!re.test(src), `network-capable API in bin/oathfast.js: ${re}`);
}

// The only modules the attestor may load.
const allowed = new Set(["fs", "path", "crypto", "child_process"]);
for (const m of src.matchAll(/require\(\s*["']([^"']+)["']\s*\)/g)) {
  assert(allowed.has(m[1].replace(/^node:/, "")), `unexpected module: ${m[1]}`);
}

console.log("no-network: ok");
