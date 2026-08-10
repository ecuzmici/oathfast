"use strict";
// `stead verify` is the read-only CI mode: it computes every status,
// writes nothing, fails on drift between file and evidence, and names
// OPEN debt in its summary.
const fs = require("fs");
const path = require("path");
const { makeFixture, stead, assert } = require("./helpers");

const dir = makeFixture({
  "GUARANTEES.md":
    "# GUARANTEES — fx\n\nG1  Passing thing.  OPEN\nG2  Stated thing.  OPEN\n",
  ".stead/anchors.json": JSON.stringify({
    version: 1,
    anchors: { G1: { kind: "check", tier: "SAMPLED", cmd: "exit 0" } },
  }),
});
const gPath = path.join(dir, "GUARANTEES.md");

// settle the file, then verify agrees and names the OPEN id.
stead(["check"], dir);
let r = stead(["verify"], dir);
assert(r.status === 0, `verify failed on a settled repo: ${r.stderr}`);
assert(r.stdout.includes("1 OPEN: G2"), `OPEN debt not named: ${r.stdout}`);

// check's summary names the debt too.
r = stead(["check"], dir);
assert(r.stdout.includes("1 OPEN: G2"), `check summary lacks OPEN ids: ${r.stdout}`);

// hand-edited status: verify fails and writes nothing.
const settled = fs.readFileSync(gPath, "utf8");
fs.writeFileSync(gPath, settled.replace("SAMPLED", "HOLDS"));
const edited = fs.readFileSync(gPath, "utf8");
r = stead(["verify"], dir);
assert(r.status === 1, "verify exited 0 on drift");
assert(r.stderr.includes("file says HOLDS, evidence says SAMPLED"), `drift not reported: ${r.stderr}`);
assert(fs.readFileSync(gPath, "utf8") === edited, "verify wrote to GUARANTEES.md");

// --no-open turns OPEN debt into a failure.
fs.writeFileSync(gPath, settled);
r = stead(["verify", "--no-open"], dir);
assert(r.status === 1 && r.stderr.includes("--no-open"), "--no-open did not fail on OPEN");

console.log("verify: ok");
