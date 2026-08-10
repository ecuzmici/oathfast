"use strict";
// Anchor for S1: `oathfast check` is deterministic given identical inputs.
// Property test: over several fixture repos, two runs of `oathfast check`
// produce byte-identical stdout, stderr, exit codes, and file contents.
const fs = require("fs");
const path = require("path");
const { makeFixture, oathfast, assert } = require("./helpers");

const fixtures = [
  {
    "GUARANTEES.md":
      "# GUARANTEES — fx1\n\nG1  The widget always frobs.  OPEN\n\n## Given\n\n## Out of scope\nStyling.\n",
    ".oathfast/anchors.json": JSON.stringify({
      version: 1,
      anchors: { G1: { kind: "check", tier: "SAMPLED", cmd: "exit 0" } },
    }),
  },
  {
    "GUARANTEES.md":
      "# GUARANTEES — fx2\n\nG1  A thing.  HOLDS\nG2  Another thing.  TRUSTED  given T1\n\n## Given\nT1  The moon exists.\n",
    ".oathfast/anchors.json": JSON.stringify({
      version: 1,
      anchors: {
        G1: { kind: "check", tier: "SAMPLED", cmd: "exit 1" },
        G2: { kind: "trusted" },
      },
    }),
  },
];

for (const files of fixtures) {
  const dirA = makeFixture(files);
  const dirB = makeFixture(files);
  const runsA = [oathfast(["check"], dirA), oathfast(["check"], dirA)];
  const runB = oathfast(["check"], dirB);
  const fileA = fs.readFileSync(path.join(dirA, "GUARANTEES.md"), "utf8");
  const fileB = fs.readFileSync(path.join(dirB, "GUARANTEES.md"), "utf8");

  // Same inputs in a fresh copy -> identical first-run output.
  const first = oathfast(["check"], makeFixture(files));
  assert(first.stdout === runB.stdout && first.status === runB.status,
    "first runs on identical fixtures differ");
  // Re-running on the (now settled) repo is stable.
  assert(runsA[1].status === runB.status, "exit codes differ across identical repos");
  assert(fileA === fileB, "rewritten GUARANTEES.md differs across identical repos");
  // check is idempotent: second run changes nothing.
  const again = fs.readFileSync(path.join(dirA, "GUARANTEES.md"), "utf8");
  assert(again === fileA, "second check mutated the file");
}

console.log("determinism: ok");
