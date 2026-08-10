"use strict";
const fs = require("fs");
const path = require("path");
const os = require("os");
const { spawnSync } = require("child_process");

const CLI = path.join(__dirname, "..", "bin", "oathfast.js");

function makeFixture(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "oathfast-fixture-"));
  for (const [rel, content] of Object.entries(files)) {
    const p = path.join(dir, rel);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, content);
  }
  return dir;
}

function oathfast(args, cwd) {
  const r = spawnSync(process.execPath, [CLI, ...args], {
    cwd, encoding: "utf8", env: { ...process.env, NO_COLOR: "1" },
  });
  return { status: r.status, stdout: r.stdout, stderr: r.stderr };
}

function assert(cond, msg) {
  if (!cond) { console.error("FAIL: " + msg); process.exit(1); }
}

module.exports = { makeFixture, oathfast, assert, CLI };
