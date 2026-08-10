# The Oathfast format — v0.2

This file is the specification. The `oathfast` CLI implements it; the skill
decks reference it. Where the CLI and this file disagree, this file wins
and the CLI has a bug.

Oathfast splits a repository into two layers:

- **Human layer** — `GUARANTEES.md`, one small signed file listing what
  the system promises, what those promises rest on, and what was never
  promised. Humans review only this layer.
- **Machine layer** — everything else (`machine/`, implementations,
  proofs, tickets, transcripts, failures). As big and noisy as agents
  need. Never human-reviewed.

The layers are related by **checking**, not maintenance: `oathfast check`
recomputes every guarantee's status from bound evidence. The file
cannot lie about what its anchors reported.

---

## 1. GUARANTEES.md grammar

A GUARANTEES.md file has, in order:

1. A title line: `# GUARANTEES — <project>`
2. One or more **guarantee lines**
3. An optional `## Given` section
4. An optional `## Out of scope` section

Blank lines are ignored everywhere. No other content is permitted
between the title and the Given section — the file is meant to be read
in under a minute.

### 1.1 Guarantee lines

```
G1  Every span lands in the report exactly once.   HOLDS
G2  A run never exceeds the LLM spend cap.         ENFORCED  given T1
G3  Drift verdicts ≥95% recall on the corpus.      SAMPLED   given T2
```

Grammar (fields separated by **two or more spaces**):

```
<id>  <text>  <STATUS>  [given <T-refs>]
```

- `<id>` — one or more uppercase letters followed by digits
  (`G1`, `G12`, `S3`). Ids must be unique within the file. `G` is the
  conventional prefix; a project may pick another letter (Oathfast's own
  file uses `S`).
- `<text>` — one line of plain English. If it does not fit on one line,
  it is more than one guarantee.
- `<STATUS>` — exactly one of the seven statuses in §2. **The status
  column is computed by `oathfast check` and is never hand-edited.**
- `given <T-refs>` — optional, comma-separated references into the
  Given section (`given T1` or `given T1, T3`). Every referenced `T#`
  must exist.

### 1.2 The Given section

```
## Given
T1  The cost table matches provider pricing.
T2  The eval corpus represents real drift.
```

A **Given** is a load-bearing assumption that reality can falsify but
no checker can. Each line is `T<n>  <one line of plain English>`.

Validity rule: every Given must be referenced by at least one guarantee
line. An unreferenced Given is dead weight and fails validation.

### 1.3 The Out of scope section

```
## Out of scope
Report styling, prompt wording.
```

Free prose. This is the list of things that were **never promised**.
It exists so absence of a guarantee is legible as a decision, not an
oversight.

---

## 2. Status semantics

Statuses form a ladder of evidence strength. `oathfast check` computes
each guarantee's status from its anchor (§3); the words below define
what each status is allowed to mean.

| Status | Meaning |
|--------|---------|
| `HOLDS` | Machine-proved. A proof assistant or verifier (Dafny, Verus, …) discharges the obligation with no `assume`s. |
| `ENFORCED` | A runtime or build-time engine rejects violations: database constraints, RLS, CI-blocking lint, write-gating runtimes. Violations cannot land, though the property is not proved in general. |
| `CHECKED` | Model-checked (TLA+, Alloy, …) over a finite state space. |
| `SAMPLED` | Evidence by sampling: property tests, evals, screenshot baselines. The strongest honest tier for statistical claims. |
| `TRUSTED` | Rests entirely on one or more Givens. No checker involved; the `given` refs are the whole story. |
| `OPEN` | Stated, not yet established. The honest starting state. |
| `BROKEN` | Violated right now: an anchored check fails, or bound evidence is missing or has changed. |

**Hard rule — earned tiers.** A tier above `SAMPLED` is never a
declaration; the anchor must carry evidence of the right shape:

- `HOLDS` and `CHECKED` require a `verifier` command. `oathfast check`
  re-runs it every time; a failing verifier makes the guarantee
  `BROKEN`.
- `ENFORCED` requires a `files` map that binds the enforcing config
  (the lint rule, the constraint definition, the gating job). An edit
  to the engine breaks the hash and the guarantee.
- An anchor that carries neither is valid only at `SAMPLED` or below.

**Hard rule — LLM-behavior ceiling.** A guarantee about the behavior of
an LLM (its outputs, judgments, classifications) can never exceed
`SAMPLED`. Anchors declare `"llm_behavior": true` for such guarantees
and `oathfast check` rejects any tier above SAMPLED for them. There is no
override.

**Computation rule.** A status is never asserted; it is derived:

- No anchor bound to the id → `OPEN`.
- Anchor of kind `trusted` → `TRUSTED` (the guarantee line must carry
  `given` refs; a trusted guarantee with no Given fails validation).
- Anchor of kind `check` / `files`: all evidence passes → the anchor's
  declared `tier`; any evidence fails or is missing → `BROKEN`.

**Friction rule.** Removing or weakening a guarantee line is the
high-friction event. `oathfast sign` records a human ack of every
guarantee and Given text in `.oathfast/signatures.json` (§3.1); after
that, `oathfast check` and `oathfast verify` fail when a signed line changes
or vanishes without a re-ack. Adding a new line is cheap; retracting a
promise is not. CODEOWNERS on `GUARANTEES.md` and `FORMAT.md` remains
a team-mode backstop.

---

## 3. Anchor schema — `.oathfast/anchors.json`

Anchors bind guarantee ids to evidence. `oathfast check` reads this file,
re-runs / re-hashes everything, and rewrites only the status column of
GUARANTEES.md.

```json
{
  "version": 1,
  "anchors": {
    "G1": {
      "kind": "check",
      "tier": "SAMPLED",
      "cmd": "node test/report-property.test.js"
    },
    "G2": {
      "kind": "check",
      "tier": "ENFORCED",
      "cmd": "node test/spend-cap-lint.test.js",
      "files": { "lint/spend-cap.rules.js": "sha256:77aa…" },
      "llm_behavior": false
    },
    "G3": {
      "kind": "files",
      "tier": "HOLDS",
      "verifier": "dafny verify machine/proofs/report.dfy",
      "files": {
        "machine/proofs/report.dfy": "sha256:9f2c…"
      }
    },
    "G4": { "kind": "trusted" }
  }
}
```

Fields:

- `kind` — `"check"` | `"files"` | `"trusted"`.
- `tier` — the status this evidence supports when it passes. Required
  for `check` and `files`; forbidden for `trusted`. Must be one of
  `HOLDS`, `ENFORCED`, `CHECKED`, `SAMPLED`. Tiers above `SAMPLED`
  must satisfy the earned-tier rule (§2).
- `cmd` — (`check` only) a shell command run from the repo root.
  Exit 0 = evidence passes. Commands must be deterministic and make no
  network calls; `oathfast check` itself never calls an LLM and never
  touches the network. Oathfast does not enforce this property on the
  command; it is an author obligation.
- `verifier` — a shell command that discharges the obligation itself
  (a proof assistant, a model checker). Required for `HOLDS` and
  `CHECKED`. Re-run on every check; exit 0 = the obligation holds.
- `files` — map of repo-relative path → `sha256:<hex>`. Every file
  must exist and hash-match. Required for `files` anchors and for
  tier `ENFORCED`, where it binds the enforcing config. Any anchor
  may carry it; everything present must pass.
- `llm_behavior` — optional boolean. When `true`, `tier` above
  `SAMPLED` is a validation error (§2 ceiling).

Anchor ids that do not correspond to a guarantee line are a validation
error ("orphan anchor"), as is a `files` entry pointing at a missing
file ("lost anchor"). Lost anchors make the guarantee `BROKEN` and
`oathfast check` exits non-zero.

### 3.1 Signature schema — `.oathfast/signatures.json`

`oathfast sign` records the human ack. It hashes the text of every
guarantee and Given line:

```json
{
  "version": 1,
  "signatures": {
    "G1": { "hash": "sha256:ab12…", "by": "ecuzmici", "date": "2026-08-10" },
    "T1": { "hash": "sha256:cd34…", "by": "ecuzmici", "date": "2026-08-10" }
  }
}
```

Rules:

- The hash covers the line's text only, never its status column.
- A signed line whose text changed, or which no longer exists, is a
  validation error in `check` and `verify` until `oathfast sign` re-acks
  the file.
- Lines with no signature entry are legal. New promises stay cheap.
- `oathfast status` prints the ack date next to each `TRUSTED` line,
  because a `TRUSTED` status rests on nothing but the ack.
- Only `oathfast sign` reads the clock. `check`, `verify`, and `status`
  never do, so attestation stays deterministic.

---

## 4. The CLI contract

- `oathfast check` — parse GUARANTEES.md + anchors.json + signatures.json,
  validate (§1–§3.1), run every anchor, rewrite **only the status
  column**, exit 0 iff no guarantee is `BROKEN` and no validation error
  occurred. The summary line names every `OPEN` id. Deterministic:
  same inputs → byte-identical output. No network. No LLM calls, ever —
  the attestor is deterministic glue.
- `oathfast verify` — `check`'s read-only twin, for CI. Compute every
  status, write nothing, exit non-zero when the committed status column
  disagrees with the evidence, when a guarantee is `BROKEN`, or when a
  signed line drifted from its ack. `--no-open` also fails while any
  guarantee is `OPEN`.
- `oathfast sign` — ack the current text of every guarantee and Given
  into `.oathfast/signatures.json` (§3.1). The one deliberate human act
  in the loop.
- `oathfast status` — print the computed table, colorized (respects
  `NO_COLOR`), without rewriting anything. `TRUSTED` lines show their
  ack date.
- `oathfast init` — scaffold the kernel: `GUARANTEES.md`,
  `.oathfast/anchors.json`, and `decisions/`. Then install the skill
  decks into `<dir>/.claude/skills/`. `--no-skills` scaffolds only.
  The `machine/` subtrees are created by the agent skills that use
  them, on first use.
- `oathfast skills` — install the skill decks that ship with the CLI.
  `--global` installs into `~/.claude/skills/` (as symlinks, so
  updating the package updates the decks); without it, into
  `<dir>/.claude/skills/` (as copies, so they commit cleanly and work
  for teammates). `--link` / `--copy` override the default,
  `--list` prints what ships, `--uninstall` removes them. A skill
  directory oathfast did not install is never overwritten. Like every
  other command, this is offline filesystem work.

An implementation is a valid Oathfast attestor if it provides `check`,
`verify`, `sign`, `status`, and `init`. `skills` is a packaging
convenience: the decks
are swappable and an implementation may ship none, but if it ships
them it must not clobber skills the user already has.

---

## 5. Decision-request schema — `decisions/DR-###.md`

Agents never resolve product decisions themselves. When guarantees
conflict, an obligation is unprovable, or intent is ambiguous, the
agent files a decision request and escalates. A DR is markdown with
these sections, in order:

```markdown
# DR-007 — <one-line title>

## Context
What the agent was doing and why it stopped.

## Conflict / counterexample
The concrete thing that cannot be satisfied — a failing obligation, a
counterexample input, two guarantee lines in tension.

## Options
Two or three options, each stated as a concrete GUARANTEES.md diff
(fenced ```diff blocks). Trade-offs in one or two sentences each.

## Decision
Signed by:
Date:
Chosen option:
```

The `Decision` block is filled in by a human. DRs live in a top-level
`decisions/` directory: humans read and sign them, and they are the
durable trace of human intent, so they belong to the human layer, not
to `machine/`. Never garbage-collect `decisions/`.

---

## 6. Machine-layer convention

```
machine/
  tickets/       agent-facing work decomposition
  lemmas/        reusable proved facts
  failures/      counterexamples and post-mortems, curated
  transcripts/   raw agent sessions
```

Agents own this tree. Humans never review it. Every subtree is
regenerable: delete it and the skill that owns it recreates it on
first use. See `machine/README.md`.
