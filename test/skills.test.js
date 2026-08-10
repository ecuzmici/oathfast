"use strict";
// Anchor for S5: installing the CLI installs the skill decks with it.
// Two halves: the decks are inside the published tarball (packaging), and
// `stead skills` lands every one of them without touching the network
// (installation). Both must hold for `npm i -g stead-cli` to be sufficient.
const fs = require("fs");
const path = require("path");
const { makeFixture, stead, assert } = require("./helpers");

const repo = path.join(__dirname, "..");
const pkg = JSON.parse(fs.readFileSync(path.join(repo, "package.json"), "utf8"));

// --- every deck on disk ---
const decks = [];
for (const group of fs.readdirSync(path.join(repo, "skills")).sort()) {
  for (const name of fs.readdirSync(path.join(repo, "skills", group)).sort()) {
    if (fs.existsSync(path.join(repo, "skills", group, name, "SKILL.md"))) decks.push(name);
  }
}
assert(decks.length >= 10, `expected the two decks to ship at least 10 skills, saw ${decks.length}`);

// --- packaging: the tarball carries skills/ ---
assert(
  pkg.files.some((f) => f.replace(/\/$/, "") === "skills"),
  'package.json "files" must include "skills/" or the published CLI ships without its decks'
);

// --- installation: a clean project gets all of them, offline ---
const proj = makeFixture({ "README.md": "scratch\n" });
let r = stead(["skills", proj]);
assert(r.status === 0, `stead skills failed: ${r.stderr}`);
for (const d of decks) {
  const s = path.join(proj, ".claude", "skills", d, "SKILL.md");
  assert(fs.existsSync(s), `deck not installed: ${d}`);
  const head = fs.readFileSync(s, "utf8").split("\n").slice(0, 5).join("\n");
  assert(new RegExp(`^name:\\s*${d}\\s*$`, "m").test(head), `frontmatter name mismatch in ${d}`);
}

// --- idempotent: a second run is a no-op, not a duplicate or an error ---
r = stead(["skills", proj]);
assert(r.status === 0, `second run failed: ${r.stderr}`);

// --- a skill stead did not install is never clobbered ---
const mine = path.join(proj, ".claude", "skills", decks[0]);
fs.rmSync(mine, { recursive: true, force: true });
fs.mkdirSync(mine, { recursive: true });
fs.writeFileSync(path.join(mine, "SKILL.md"), "MINE\n");
r = stead(["skills", proj]);
assert(r.status === 0, `run over a user skill failed: ${r.stderr}`);
assert(fs.readFileSync(path.join(mine, "SKILL.md"), "utf8") === "MINE\n", "clobbered a user-owned skill");
assert(/kept your existing skill/.test(r.stderr), "no warning when skipping a user-owned skill");

// --- uninstall removes only stead's own decks ---
r = stead(["skills", proj, "--uninstall"]);
assert(r.status === 0, `uninstall failed: ${r.stderr}`);
assert(fs.readFileSync(path.join(mine, "SKILL.md"), "utf8") === "MINE\n", "uninstall removed a user-owned skill");
for (const d of decks.slice(1)) {
  assert(!fs.existsSync(path.join(proj, ".claude", "skills", d)), `uninstall left ${d} behind`);
}

// --- init wires the decks in by default, and --no-skills opts out ---
const a = makeFixture({});
assert(stead(["init", a]).status === 0, "init failed");
assert(fs.existsSync(path.join(a, ".claude", "skills", decks[0], "SKILL.md")), "init did not install decks");
const b = makeFixture({});
stead(["init", b, "--no-skills"]);
assert(fs.existsSync(path.join(b, "GUARANTEES.md")), "init --no-skills did not scaffold");
assert(!fs.existsSync(path.join(b, ".claude")), "init --no-skills installed decks anyway");

console.log("skills: ok");
