# Stead

**Software built in your stead. Guarantees that hold.**

Agents now build software in your stead. Stead is the signed list of
what that software promises — and the checker that keeps the list
honest.

## Two layers

A Stead repo splits in two:

1. **Human layer** — one small file, `GUARANTEES.md`: what the system
   promises, what those promises rest on (**Given**), and what was
   never promised (**Out of scope**). Humans review only this layer,
   and sign every change to it.
2. **Machine layer** — everything else: implementations, proofs, agent
   tickets, transcripts, failures. As big and noisy as agents need.
   Never human-reviewed.

The layers are related by **checking**, not maintenance. A
deterministic CLI, `stead check`, recomputes every guarantee's status
from bound evidence and rewrites only the status column. The file
physically cannot lie: hand-edit a status to something flattering and
the next check reverts it.

```markdown
# GUARANTEES — <project>

G1  Every span lands in the report exactly once.   HOLDS
G2  A run never exceeds the LLM spend cap.         ENFORCED  given T1
G3  Drift verdicts ≥95% recall on the corpus.      SAMPLED   given T2

## Given
T1  The cost table matches provider pricing.
T2  The eval corpus represents real drift.

## Out of scope
Report styling, prompt wording.
```

Statuses are a ladder of evidence strength — `HOLDS` (machine-proved),
`ENFORCED` (an engine rejects violations), `CHECKED` (model-checked),
`SAMPLED` (property tests / evals), `TRUSTED` (rests on a Given),
`OPEN` (stated, not yet established), `BROKEN` (violated right now).
Claims about LLM behavior can never exceed `SAMPLED`. The full grammar
and semantics live in [FORMAT.md](FORMAT.md) — **the format is the
product** (think LSP: a protocol, not an editor). The skill decks are
swappable; the format is the stable interface.

## 60-second quickstart

```bash
npm install -g stead-cli     # the `stead` command AND both skill decks
stead skills --global        # make the decks available in every project

# adopt it in a repo:
cd my-project && stead init .
# → GUARANTEES.md, .stead/anchors.json, machine/, and .claude/skills/
# write your first guarantee line, bind evidence in .stead/anchors.json,
# then keep `stead check` green in CI.

# or from source:
git clone https://github.com/ecuzmici/stead && cd stead
npm test                     # the CLI's own test suite
node bin/stead.js check      # recompute Stead's own guarantees
node bin/stead.js status     # pretty-print the table
```

One install is the whole system: the CLI and the skills ship in the same
package, so there is no second thing to fetch and no version skew between
the attestor and the decks that drive it.

Each guarantee binds to evidence through an **anchor** in
`.stead/anchors.json` — a check command that must exit 0, and/or file
hashes that must match. `stead check` re-runs and re-hashes everything;
it is deterministic, offline, and never calls an LLM. The attestor is
deterministic glue.

## The tier ladder, worked

[`examples/token-packer/`](examples/token-packer/) carries one small
module at two tiers at once: a token-budget packer proved in Dafny
(`HOLDS` — never exceeds the budget, for every input) and
property-tested in Python (`SAMPLED` — 2000 seeded cases of the same
contract). The Dafny toolchain stays behind that optional directory;
the core CLI has zero Dafny dependency.

## Skills

Two decks ship **inside the npm package**, in Claude Code SKILL.md
format. `stead init` installs them into the project's `.claude/skills/`;
`stead skills --global` installs them user-wide. Skills you already have
are never overwritten — a name collision is reported and skipped.

- **`skills/human/`** — `pin-down` (adversarial interview → proposed
  guarantee diff for you to sign), `why` (explain a guarantee: meaning,
  evidence, trust, history), `trust-review` (how your Given section —
  your trust surface — moved over time).
- **`skills/agent/`** — `formalize-claim`, `implement-to-guarantee`
  (red-green-verify; may never weaken a spec — escalates instead),
  `decompose-work`, `file-decision-request`, `backfill-surveyor`
  (brownfield survey → all-OPEN as-built draft), `counterexample-curator`,
  `lemma-librarian`.

When agents hit a product decision — conflicting guarantees, an
unprovable obligation, ambiguous intent — they file a **decision
request** (`machine/decisions/DR-###.md`) with concrete options as
GUARANTEES.md diffs, and a human signs the outcome. Agents never
resolve product decisions themselves.

## What this is not

- **Not a test framework.** Your tests, proofs, and lints are the
  evidence; Stead only binds them to promises and recomputes honesty.
- **Not a proof assistant.** Bring Dafny, TLA+, Hypothesis, or nothing;
  Stead ranks the evidence, it doesn't produce it.
- **Not a write-gating runtime.** Stead attests *durable project
  promises* after the fact; it does not intercept individual agent
  writes — see Related work.

## Related work

[**Detent**](https://pypi.org/project/detent) is a complementary
write-time verification runtime: Detent gates individual agent writes;
Stead attests durable project promises. The two compose — a Detent
pipeline is a valid backend for `ENFORCED`-tier guarantees.

## Dogfood

This repo ships its own [GUARANTEES.md](GUARANTEES.md), checked in CI:
determinism of `stead check` (SAMPLED), no network calls (ENFORCED via
a source-level gate), tamper-detection on the status column (SAMPLED),
and that installing the CLI installs the skill decks with it (SAMPLED)
— anchored for real in [.stead/anchors.json](.stead/anchors.json).

## License

MIT — see [LICENSE](LICENSE).
