"use strict";
// Anchor for S3: the status column is never hand-editable without
// detection. Sampled: hand-edit statuses to flattering values, run
// `stead check`, and confirm every edit is reverted to the computed
// status and reported.
const fs = require("fs");
const path = require("path");
const { makeFixture, stead, assert } = require("./helpers");

const dir = makeFixture({
  "GUARANTEES.md":
    "# GUARANTEES — fx\n\nG1  Passing thing.  OPEN\nG2  Failing thing.  OPEN\nG3  Unanchored thing.  OPEN\n",
  ".stead/anchors.json": JSON.stringify({
    version: 1,
    anchors: {
      G1: { kind: "check", tier: "SAMPLED", cmd: "exit 0" },
      G2: { kind: "check", tier: "SAMPLED", cmd: "exit 1" },
    },
  }),
});

const gPath = path.join(dir, "GUARANTEES.md");
stead(["check"], dir); // settle to computed statuses

// Hand-edit: promote everything to HOLDS.
fs.writeFileSync(gPath, fs.readFileSync(gPath, "utf8").replace(/SAMPLED|BROKEN|OPEN/g, "HOLDS"));

const r = stead(["check"], dir);
const after = fs.readFileSync(gPath, "utf8");

assert(/G1\s{2,}Passing thing\.\s{2,}SAMPLED/.test(after), "G1 hand-edit survived");
assert(/G2\s{2,}Failing thing\.\s{2,}BROKEN/.test(after), "G2 hand-edit survived");
assert(/G3\s{2,}Unanchored thing\.\s{2,}OPEN/.test(after), "G3 hand-edit survived");
assert(r.stdout.includes("G1: HOLDS -> SAMPLED"), "G1 tamper not reported");
assert(r.status === 1, "check exited 0 despite a BROKEN guarantee");

console.log("tamper: ok");
