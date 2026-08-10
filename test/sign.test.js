"use strict";
// Anchor for S6: a signed line cannot change or vanish without detection.
// `oathfast sign` acks the current text of every guarantee and Given; after
// that, an unacked edit or removal makes check and verify exit 2.
const fs = require("fs");
const path = require("path");
const { makeFixture, oathfast, assert } = require("./helpers");

const dir = makeFixture({
  "GUARANTEES.md":
    "# GUARANTEES — fx\n\nG1  The gadget frobs.  OPEN\nG2  Rests on faith.  TRUSTED  given T1\n\n## Given\nT1  Faith is warranted.\n",
  ".oathfast/anchors.json": JSON.stringify({
    version: 1,
    anchors: { G2: { kind: "trusted" } },
  }),
});
const gPath = path.join(dir, "GUARANTEES.md");

// sign writes an ack for every line.
let r = oathfast(["sign"], dir);
assert(r.status === 0, `sign failed: ${r.stderr}`);
const sigs = JSON.parse(fs.readFileSync(path.join(dir, ".oathfast", "signatures.json"), "utf8"));
assert(sigs.signatures.G1 && sigs.signatures.G2 && sigs.signatures.T1, "sign missed a line");

// a signed repo passes check.
assert(oathfast(["check"], dir).status === 0, "signed repo fails check");

// an unacked text edit fails check and verify.
fs.writeFileSync(gPath, fs.readFileSync(gPath, "utf8").replace("The gadget frobs.", "The gadget mostly frobs."));
r = oathfast(["check"], dir);
assert(r.status === 2 && r.stderr.includes("changed without a re-ack"), "unacked edit passed check");
r = oathfast(["verify"], dir);
assert(r.status === 2 && r.stderr.includes("changed without a re-ack"), "unacked edit passed verify");

// re-signing acks the edit.
assert(oathfast(["sign"], dir).status === 0, "re-sign failed");
assert(oathfast(["check"], dir).status === 0, "re-signed repo fails check");

// an unacked removal fails check; re-signing acks it.
fs.writeFileSync(gPath, fs.readFileSync(gPath, "utf8").replace(/G1.*\n/, ""));
r = oathfast(["check"], dir);
assert(r.status === 2 && r.stderr.includes("removed without a re-ack"), "unacked removal passed check");
assert(oathfast(["sign"], dir).status === 0, "sign after removal failed");
assert(oathfast(["check"], dir).status === 0, "re-signed removal fails check");

// adding a new line stays cheap: no ack required.
fs.appendFileSync(gPath, "");
const cur = fs.readFileSync(gPath, "utf8");
fs.writeFileSync(gPath, cur.replace("## Given", "G3  A brand-new promise.  OPEN\n\n## Given"));
r = oathfast(["check"], dir);
assert(r.status === 0, `new unsigned line rejected: ${r.stderr}`);

console.log("sign: ok");
