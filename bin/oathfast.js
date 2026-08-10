#!/usr/bin/env node
"use strict";
// oathfast — deterministic attestor for GUARANTEES.md. Implements FORMAT.md v0.1.
// No network. No LLM calls. Zero dependencies.

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { spawnSync } = require("child_process");

const STATUSES = ["HOLDS", "ENFORCED", "CHECKED", "SAMPLED", "TRUSTED", "OPEN", "BROKEN"];
const ANCHOR_TIERS = ["HOLDS", "ENFORCED", "CHECKED", "SAMPLED"];
const STATUS_WIDTH = Math.max(...STATUSES.map((s) => s.length));

// ---------- parsing ----------

const G_LINE = /^([A-Z]+\d+)\s{2,}(.+?)\s{2,}([A-Z]+)(\s+given\s+(T\d+(?:\s*,\s*T\d+)*))?\s*$/;
const T_LINE = /^(T\d+)\s{2,}(.+?)\s*$/;

function parseGuarantees(text) {
  const lines = text.split("\n");
  const doc = { title: null, guarantees: [], givens: [], outOfScope: [], errors: [] };
  let section = "top"; // top | given | scope
  lines.forEach((line, i) => {
    const n = i + 1;
    if (/^#\s/.test(line) && section === "top" && doc.title === null) {
      doc.title = line;
      return;
    }
    if (/^##\s+Given\s*$/i.test(line)) { section = "given"; return; }
    if (/^##\s+Out of scope\s*$/i.test(line)) { section = "scope"; return; }
    if (/^##\s/.test(line)) { doc.errors.push(`line ${n}: unknown section "${line.trim()}"`); return; }
    if (line.trim() === "") return;

    if (section === "top") {
      const m = G_LINE.exec(line);
      if (!m) { doc.errors.push(`line ${n}: not a guarantee line: "${line.trim()}"`); return; }
      const [, id, text_, status, , refs] = m;
      if (!STATUSES.includes(status)) doc.errors.push(`line ${n}: unknown status "${status}"`);
      doc.guarantees.push({
        id, text: text_, status, lineIndex: i,
        givenRefs: refs ? refs.split(/\s*,\s*/) : [],
      });
    } else if (section === "given") {
      const m = T_LINE.exec(line);
      if (!m) { doc.errors.push(`line ${n}: not a Given line: "${line.trim()}"`); return; }
      doc.givens.push({ id: m[1], text: m[2] });
    } else {
      doc.outOfScope.push(line);
    }
  });
  if (doc.title === null) doc.errors.push("missing title line (# GUARANTEES — <project>)");
  doc.lines = lines;
  return doc;
}

// ---------- validation ----------

function validate(doc, anchors) {
  const errors = [...doc.errors];
  const gIds = new Set();
  for (const g of doc.guarantees) {
    if (gIds.has(g.id)) errors.push(`duplicate guarantee id ${g.id}`);
    gIds.add(g.id);
  }
  const tIds = new Set(doc.givens.map((t) => t.id));
  const referenced = new Set();
  for (const g of doc.guarantees) {
    for (const r of g.givenRefs) {
      if (!tIds.has(r)) errors.push(`${g.id} references undefined Given ${r}`);
      referenced.add(r);
    }
  }
  for (const t of doc.givens) {
    if (!referenced.has(t.id)) errors.push(`Given ${t.id} is referenced by no guarantee`);
  }
  for (const [id, a] of Object.entries(anchors.anchors || {})) {
    if (!gIds.has(id)) errors.push(`orphan anchor: ${id} has no guarantee line`);
    if (!["check", "files", "trusted"].includes(a.kind)) {
      errors.push(`anchor ${id}: unknown kind "${a.kind}"`);
      continue;
    }
    if (a.kind === "trusted") {
      if (a.tier) errors.push(`anchor ${id}: "trusted" anchors must not declare a tier`);
      const g = doc.guarantees.find((x) => x.id === id);
      if (g && g.givenRefs.length === 0) errors.push(`${id}: trusted guarantee has no "given" refs`);
    } else {
      if (!ANCHOR_TIERS.includes(a.tier)) errors.push(`anchor ${id}: tier must be one of ${ANCHOR_TIERS.join("/")}`);
      if (a.kind === "check" && typeof a.cmd !== "string") errors.push(`anchor ${id}: kind "check" requires "cmd"`);
      if (a.kind === "files" && !a.files) errors.push(`anchor ${id}: kind "files" requires "files"`);
      // Earned tiers (FORMAT.md §2): everything above SAMPLED must carry
      // evidence of the right shape, not just a declaration.
      if ((a.tier === "HOLDS" || a.tier === "CHECKED") && typeof a.verifier !== "string") {
        errors.push(`anchor ${id}: tier ${a.tier} requires a "verifier" command that oathfast re-runs (FORMAT.md §2)`);
      }
      if (a.tier === "ENFORCED" && !a.files) {
        errors.push(`anchor ${id}: tier ENFORCED requires "files" binding the enforcing config (FORMAT.md §2)`);
      }
      if (a.llm_behavior === true && ANCHOR_TIERS.indexOf(a.tier) < ANCHOR_TIERS.indexOf("SAMPLED")) {
        errors.push(`anchor ${id}: LLM-behavior guarantees can never exceed SAMPLED (FORMAT.md §2)`);
      }
    }
  }
  return errors;
}

// ---------- evidence ----------

function sha256(filePath) {
  return "sha256:" + crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function runCmd(id, label, cmd, root, notes) {
  const r = spawnSync(cmd, { shell: true, cwd: root, stdio: ["ignore", "pipe", "pipe"] });
  if (r.status === 0) return true;
  const tail = ((r.stderr || "").toString() + (r.stdout || "").toString()).trim().split("\n").slice(-3).join(" | ");
  notes.push(`${id}: ${label} failed (exit ${r.status})${tail ? " — " + tail : ""}`);
  return false;
}

function runAnchor(id, anchor, root, notes) {
  if (!anchor) return "OPEN";
  if (anchor.kind === "trusted") return "TRUSTED";
  let ok = true;
  if (anchor.files) {
    for (const [rel, want] of Object.entries(anchor.files)) {
      const p = path.join(root, rel);
      if (!fs.existsSync(p)) { ok = false; notes.push(`${id}: lost anchor — missing file ${rel}`); continue; }
      const got = sha256(p);
      if (got !== want) { ok = false; notes.push(`${id}: hash mismatch for ${rel}`); }
    }
  }
  if (ok && anchor.kind === "check") ok = runCmd(id, "check", anchor.cmd, root, notes);
  // The verifier is what earns HOLDS/CHECKED: it re-runs on every check.
  if (ok && typeof anchor.verifier === "string") ok = runCmd(id, "verifier", anchor.verifier, root, notes);
  return ok ? anchor.tier : "BROKEN";
}

// ---------- signatures ----------
// .oathfast/signatures.json is the human ack: a hash of each line's text,
// plus who acked it and when. `oathfast sign` is the one deliberate human
// act; check and verify fail when signed text drifts from its ack.

function textHash(text) {
  return "sha256:" + crypto.createHash("sha256").update(text).digest("hex");
}

function loadSignatures(root) {
  const p = path.join(root, ".oathfast", "signatures.json");
  if (!fs.existsSync(p)) return null;
  try { return JSON.parse(fs.readFileSync(p, "utf8")); }
  catch (e) { fail(`.oathfast/signatures.json is not valid JSON: ${e.message}`); }
}

function signatureErrors(doc, sigs) {
  if (!sigs) return [];
  const errors = [];
  const lines = new Map();
  for (const g of doc.guarantees) lines.set(g.id, g.text);
  for (const t of doc.givens) lines.set(t.id, t.text);
  for (const [id, s] of Object.entries(sigs.signatures || {})) {
    if (!lines.has(id)) errors.push(`signed line ${id} was removed without a re-ack (run "oathfast sign")`);
    else if (textHash(lines.get(id)) !== s.hash) errors.push(`signed text of ${id} changed without a re-ack (run "oathfast sign")`);
  }
  return errors;
}

function signerName() {
  const r = spawnSync("git", ["config", "user.name"], { encoding: "utf8" });
  const name = r.status === 0 ? (r.stdout || "").trim() : "";
  return name || process.env.USER || process.env.USERNAME || "unknown";
}

function cmdSign(root) {
  const { doc, anchors } = load(root);
  const errors = validate(doc, anchors);
  if (errors.length) {
    for (const e of errors) console.error("error: " + e);
    process.exit(2);
  }
  const prev = loadSignatures(root) || { version: 1, signatures: {} };
  const next = { version: 1, signatures: {} };
  const by = signerName();
  const date = new Date().toISOString().slice(0, 10);
  let acked = 0, kept = 0;
  for (const line of [...doc.guarantees, ...doc.givens]) {
    const hash = textHash(line.text);
    const old = prev.signatures[line.id];
    if (old && old.hash === hash) { next.signatures[line.id] = old; kept++; }
    else { next.signatures[line.id] = { hash, by, date }; acked++; }
  }
  const dropped = Object.keys(prev.signatures).filter((id) => !next.signatures[id]).length;
  fs.mkdirSync(path.join(root, ".oathfast"), { recursive: true });
  fs.writeFileSync(path.join(root, ".oathfast", "signatures.json"), JSON.stringify(next, null, 2) + "\n");
  console.log(
    `oathfast sign: ${acked} newly acked, ${kept} unchanged${dropped ? `, ${dropped} removed` : ""} (by ${by}, ${date})`
  );
}

// ---------- rewriting ----------

function rewriteStatusColumn(doc, computed) {
  const lines = [...doc.lines];
  for (const g of doc.guarantees) {
    const status = computed.get(g.id);
    const line = lines[g.lineIndex];
    const m = G_LINE.exec(line);
    const [, id, text, , , refs] = m;
    // Reconstruct, preserving the original gap before the status column
    // and padding the status so any "given" suffix stays aligned.
    const prefix = line.slice(0, line.indexOf(m[3], id.length + text.length));
    const suffix = refs ? "  given " + refs : "";
    lines[g.lineIndex] = prefix + (refs ? status.padEnd(STATUS_WIDTH) : status) + suffix;
  }
  return lines.join("\n");
}

// ---------- output ----------

const useColor = process.stdout.isTTY && !("NO_COLOR" in process.env);
const COLORS = {
  HOLDS: "\x1b[32m", ENFORCED: "\x1b[32m", CHECKED: "\x1b[36m", SAMPLED: "\x1b[36m",
  TRUSTED: "\x1b[33m", OPEN: "\x1b[33m", BROKEN: "\x1b[31m",
};
function paint(status) {
  return useColor ? COLORS[status] + status + "\x1b[0m" : status;
}

function printTable(doc, computed, sigs) {
  if (doc.title) console.log(doc.title.replace(/^#\s*/, "") + "\n");
  const idW = Math.max(...doc.guarantees.map((g) => g.id.length), 2);
  const txtW = Math.max(...doc.guarantees.map((g) => g.text.length), 4);
  for (const g of doc.guarantees) {
    const status = computed.get(g.id);
    const given = g.givenRefs.length ? "  given " + g.givenRefs.join(", ") : "";
    // TRUSTED rests on nothing but the ack, so show how old the ack is.
    const sig = sigs && sigs.signatures ? sigs.signatures[g.id] : null;
    const ack = status === "TRUSTED" ? (sig ? `  acked ${sig.date}` : "  unacked") : "";
    console.log(
      `${g.id.padEnd(idW)}  ${g.text.padEnd(txtW)}  ${paint(status).padEnd(useColor ? STATUS_WIDTH + 9 : STATUS_WIDTH)}${given}${ack}`
    );
  }
  if (doc.givens.length) {
    console.log("\nGiven");
    for (const t of doc.givens) console.log(`  ${t.id}  ${t.text}`);
  }
  if (doc.outOfScope.length) {
    console.log("\nOut of scope\n  " + doc.outOfScope.join("\n  "));
  }
}

// ---------- commands ----------

function load(root) {
  const gPath = path.join(root, "GUARANTEES.md");
  const aPath = path.join(root, ".oathfast", "anchors.json");
  if (!fs.existsSync(gPath)) fail(`no GUARANTEES.md in ${root} (run "oathfast init")`);
  const doc = parseGuarantees(fs.readFileSync(gPath, "utf8"));
  let anchors = { version: 1, anchors: {} };
  if (fs.existsSync(aPath)) {
    try { anchors = JSON.parse(fs.readFileSync(aPath, "utf8")); }
    catch (e) { fail(`.oathfast/anchors.json is not valid JSON: ${e.message}`); }
  }
  return { doc, anchors, gPath };
}

function compute(doc, anchors, root, notes) {
  const computed = new Map();
  for (const g of doc.guarantees) {
    computed.set(g.id, runAnchor(g.id, (anchors.anchors || {})[g.id], root, notes));
  }
  return computed;
}

// OPEN never fails a default run, but the debt is always named.
function openSummary(computed) {
  const open = [...computed.entries()].filter(([, s]) => s === "OPEN").map(([id]) => id);
  return open.length ? `, ${open.length} OPEN: ${open.join(" ")}` : "";
}

function cmdCheck(root) {
  const { doc, anchors, gPath } = load(root);
  const errors = [...validate(doc, anchors), ...signatureErrors(doc, loadSignatures(root))];
  if (errors.length) {
    for (const e of errors) console.error("error: " + e);
    process.exit(2);
  }
  const notes = [];
  const computed = compute(doc, anchors, root, notes);
  const rewritten = rewriteStatusColumn(doc, computed);
  const original = doc.lines.join("\n");
  if (rewritten !== original) {
    fs.writeFileSync(gPath, rewritten);
    for (const g of doc.guarantees) {
      const now = computed.get(g.id);
      if (now !== g.status) console.log(`${g.id}: ${g.status} -> ${now}`);
    }
  }
  for (const n of notes) console.error("note: " + n);
  const broken = [...computed.values()].filter((s) => s === "BROKEN").length;
  console.log(broken === 0 ? `oathfast check: ok${openSummary(computed)}` : `oathfast check: ${broken} BROKEN`);
  process.exit(broken === 0 ? 0 : 1);
}

// verify is check's read-only twin for CI: compute everything, write
// nothing, and fail when the committed file disagrees with the evidence.
function cmdVerify(root, opts) {
  const { doc, anchors } = load(root);
  const errors = [...validate(doc, anchors), ...signatureErrors(doc, loadSignatures(root))];
  if (errors.length) {
    for (const e of errors) console.error("error: " + e);
    process.exit(2);
  }
  const notes = [];
  const computed = compute(doc, anchors, root, notes);
  const drifted = doc.guarantees.filter((g) => computed.get(g.id) !== g.status);
  for (const g of drifted) {
    console.error(`error: ${g.id}: file says ${g.status}, evidence says ${computed.get(g.id)}`);
  }
  for (const n of notes) console.error("note: " + n);
  const broken = [...computed.values()].filter((s) => s === "BROKEN").length;
  const open = [...computed.values()].filter((s) => s === "OPEN").length;
  const openFail = opts.noOpen && open > 0;
  if (openFail) console.error(`error: --no-open: ${open} OPEN guarantee${open === 1 ? "" : "s"}`);
  const bad = [];
  if (drifted.length) bad.push(`${drifted.length} drifted`);
  if (broken) bad.push(`${broken} BROKEN`);
  console.log(bad.length ? `oathfast verify: ${bad.join(", ")}` : `oathfast verify: ok${openSummary(computed)}`);
  process.exit(drifted.length || broken || openFail ? 1 : 0);
}

function cmdStatus(root) {
  const { doc, anchors } = load(root);
  const errors = validate(doc, anchors);
  if (errors.length) {
    for (const e of errors) console.error("error: " + e);
    process.exit(2);
  }
  const notes = [];
  const computed = compute(doc, anchors, root, notes);
  printTable(doc, computed, loadSignatures(root));
  for (const n of notes) console.error("note: " + n);
  for (const e of signatureErrors(doc, loadSignatures(root))) console.error("note: " + e);
  process.exit([...computed.values()].includes("BROKEN") ? 1 : 0);
}

function cmdInit(root, opts) {
  const name = path.basename(path.resolve(root));
  const gPath = path.join(root, "GUARANTEES.md");
  if (fs.existsSync(gPath)) fail(`${gPath} already exists`);
  // Kernel only (DR-005): the machine/ subtrees are created lazily by
  // the agent skills that use them.
  fs.mkdirSync(path.join(root, ".oathfast"), { recursive: true });
  fs.mkdirSync(path.join(root, "decisions"), { recursive: true });
  fs.writeFileSync(path.join(root, "decisions", ".gitkeep"), "");
  fs.writeFileSync(
    gPath,
    `# GUARANTEES — ${name}\n\nG1  <state the first promise in one plain-English line>  OPEN\n\n## Given\n\n## Out of scope\n`
  );
  fs.writeFileSync(
    path.join(root, ".oathfast", "anchors.json"),
    JSON.stringify({ version: 1, anchors: {} }, null, 2) + "\n"
  );
  console.log(`initialized oathfast in ${root}`);
  if (opts.skills !== false) installSkills(root, { ...opts, global: false });
}

// ---------- skill decks ----------
// The decks ship inside the package, so `npm i -g @oathfast/cli` delivers the
// whole system as one artifact. Installing them is pure filesystem work:
// no network, no registry, nothing to resolve.

const SKILLS_ROOT = path.join(__dirname, "..", "skills");
const MARKER = ".oathfast-deck";

function listDecks() {
  if (!fs.existsSync(SKILLS_ROOT)) return [];
  const out = [];
  for (const deck of fs.readdirSync(SKILLS_ROOT).sort()) {
    const deckDir = path.join(SKILLS_ROOT, deck);
    if (!fs.statSync(deckDir).isDirectory()) continue;
    for (const name of fs.readdirSync(deckDir).sort()) {
      const dir = path.join(deckDir, name);
      if (fs.existsSync(path.join(dir, "SKILL.md"))) out.push({ name, deck, dir });
    }
  }
  return out;
}

function homeDir() {
  const h = process.env.HOME || process.env.USERPROFILE;
  if (!h) fail("cannot determine home directory (set HOME)");
  return h;
}

function lstat(p) {
  try { return fs.lstatSync(p); } catch { return null; }
}

// A deck is ours if it is a symlink into this package's skills/ tree, or a
// copy carrying the marker file. Anything else belongs to the user and is
// never overwritten.
function ownedByOathfast(p) {
  const st = lstat(p);
  if (!st) return false;
  if (st.isSymbolicLink()) {
    try { return path.resolve(fs.readlinkSync(p)).startsWith(path.resolve(SKILLS_ROOT)); }
    catch { return false; }
  }
  return st.isDirectory() && fs.existsSync(path.join(p, MARKER));
}

function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1));
  for (const e of entries) {
    const s = path.join(src, e.name);
    const d = path.join(dst, e.name);
    if (e.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

function installDeck(deck, dest, mode, report) {
  const target = path.join(dest, deck.name);
  if (lstat(target)) {
    if (!ownedByOathfast(target)) { report.skipped.push(deck.name); return; }
    fs.rmSync(target, { recursive: true, force: true });
  }
  if (mode === "link") {
    try {
      fs.symlinkSync(path.resolve(deck.dir), target, "junction");
      report.linked.push(deck.name);
      return;
    } catch { /* no symlink privilege — fall through to a copy */ }
  }
  copyDir(deck.dir, target);
  fs.writeFileSync(path.join(target, MARKER), "installed by oathfast; safe to delete\n");
  report.copied.push(deck.name);
}

function skillsDest(root, opts) {
  return opts.global
    ? path.join(homeDir(), ".claude", "skills")
    : path.join(root, ".claude", "skills");
}

// Mode defaults: --global links, so `npm update -g @oathfast/cli` refreshes the
// decks in place. Project-local copies, so the decks commit cleanly and work
// for teammates — a symlink into one machine's node_modules would not.
function installSkills(root, opts) {
  const decks = listDecks();
  if (!decks.length) fail(`no skill decks found at ${SKILLS_ROOT}`);
  const dest = skillsDest(root, opts);
  const mode = opts.mode || (opts.global ? "link" : "copy");
  fs.mkdirSync(dest, { recursive: true });
  const report = { linked: [], copied: [], skipped: [] };
  for (const d of decks) installDeck(d, dest, mode, report);
  const n = report.linked.length + report.copied.length;
  console.log(`oathfast skills: ${n} deck${n === 1 ? "" : "s"} ${mode === "link" ? "linked" : "copied"} into ${dest}`);
  for (const s of report.skipped) {
    console.error(
      `note: kept your existing skill "${s}" at ${path.join(dest, s)} (not installed by oathfast) — remove it and re-run "oathfast skills" to install oathfast's deck`
    );
  }
  return report;
}

function cmdSkills(root, opts) {
  if (opts.list) {
    for (const d of listDecks()) console.log(`${d.deck}/${d.name}`);
    return;
  }
  if (opts.uninstall) {
    const dest = skillsDest(root, opts);
    let n = 0;
    for (const d of listDecks()) {
      const target = path.join(dest, d.name);
      if (ownedByOathfast(target)) { fs.rmSync(target, { recursive: true, force: true }); n++; }
    }
    console.log(`oathfast skills: removed ${n} deck${n === 1 ? "" : "s"} from ${dest}`);
    return;
  }
  installSkills(root, opts);
}

function fail(msg) {
  console.error("oathfast: " + msg);
  process.exit(2);
}

// ---------- main ----------

const [, , cmd, ...rest] = process.argv;
const flags = new Set(rest.filter((a) => a.startsWith("-")));
const root = path.resolve(rest.find((a) => !a.startsWith("-")) || ".");
const opts = {
  global: flags.has("--global") || flags.has("-g"),
  list: flags.has("--list"),
  uninstall: flags.has("--uninstall"),
  skills: flags.has("--no-skills") ? false : true,
  mode: flags.has("--link") ? "link" : flags.has("--copy") ? "copy" : null,
  noOpen: flags.has("--no-open"),
};
switch (cmd) {
  case "check": cmdCheck(root); break;
  case "verify": cmdVerify(root, opts); break;
  case "sign": cmdSign(root); break;
  case "status": cmdStatus(root); break;
  case "init": cmdInit(root, opts); break;
  case "skills": cmdSkills(root, opts); break;
  default:
    console.log("usage: oathfast <check|verify|sign|status|init|skills> [dir] [flags]");
    console.log("  check [dir]                     recompute statuses and rewrite the status column");
    console.log("  verify [dir] [--no-open]        read-only check for CI; fails on drift, writes nothing");
    console.log("  sign [dir]                      ack the current text of every guarantee and Given");
    console.log("  init [dir] [--no-skills]        scaffold an oathfast repo (installs skill decks)");
    console.log("  skills [dir] [--global] [--link|--copy] [--list] [--uninstall]");
    process.exit(cmd ? 2 : 0);
}
