# Oathfast

**Software built by agents. Guarantees held fast.**

Agents build your software now. Oathfast is the ledger that keeps them
honest with you: one small file of promises, and a deterministic
checker that recomputes every promise's status from evidence. The
untrusted party is not a coworker. It is your own agent.

## Two layers

A Oathfast repo splits in two:

1. **Human layer** — `GUARANTEES.md` (the promises), `decisions/`
   (the signed record of every fork in the road). You read this layer.
   You ack it with `oathfast sign`.
2. **Machine layer** — everything else: implementations, proofs,
   tickets, transcripts. As big and noisy as agents need. Fully
   regenerable. You never review it.

The layers are related by **checking**, not maintenance. `oathfast check`
recomputes every status from bound evidence and rewrites only the
status column. The file cannot lie about what its anchors reported.

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

## Statuses are earned, not declared

The ladder: `HOLDS` (machine-proved), `ENFORCED` (an engine rejects
violations), `CHECKED` (model-checked), `SAMPLED` (property tests,
evals), `TRUSTED` (rests on a Given), `OPEN` (stated, not yet
established), `BROKEN` (violated right now).

An agent cannot talk its way up the ladder. Every tier above `SAMPLED`
requires evidence of the right shape: `HOLDS` and `CHECKED` need a
verifier command that `oathfast check` re-runs every time; `ENFORCED`
needs a hash binding to the enforcing config. Claims about LLM
behavior can never exceed `SAMPLED`. The full grammar and semantics
live in [FORMAT.md](FORMAT.md) — **the format is the product** (think
LSP: a protocol, not an editor).

## The loop

- `oathfast check` — recompute every status and rewrite the status
  column. Run it locally; agents run it too.
- `oathfast sign` — ack the current text of every guarantee. The one
  deliberate human act. After it, an unacked edit or removal of a
  promise fails the next check.
- `oathfast verify` — read-only, for CI. It writes nothing and fails
  when the committed file disagrees with the evidence. Green CI means
  the file you read on GitHub matches what the anchors report.

`OPEN` never fails a default run, but every summary names the open
ids, so unproven promises stay visible. Projects past bootstrap can
turn on `verify --no-open`.

## 60-second quickstart

```bash
npm install -g @oathfast/cli     # the `oathfast` command AND the skill decks
oathfast skills --global        # make the decks available in every project

# adopt it in a repo:
cd my-project && oathfast init .
# → GUARANTEES.md, .oathfast/anchors.json, decisions/, .claude/skills/
# write your first guarantee line, bind evidence in .oathfast/anchors.json,
# run `oathfast sign`, and keep `oathfast verify` green in CI.

# or from source:
git clone https://github.com/ecuzmici/oathfast && cd oathfast
npm test                     # the CLI's own test suite
node bin/oathfast.js status     # pretty-print Oathfast's own guarantees
```

One install is the whole system: the CLI and the skills ship in the
same package, so there is no second thing to fetch and no version skew
between the attestor and the decks that drive it.

Each guarantee binds to evidence through an **anchor** in
`.oathfast/anchors.json`: a check command that must exit 0, a verifier
that must discharge the obligation, and/or file hashes that must
match. `oathfast check` re-runs and re-hashes everything. The attestor
itself is deterministic, offline, and never calls an LLM.

**The honesty boundary:** anchors are your commands. Oathfast does not
sandbox them, so a nondeterministic or networked anchor can fool the
tier it backs. The requirement that anchors stay deterministic and
offline is an author obligation (FORMAT.md §3), not an enforced
property.

## The tier ladder, worked

[`examples/token-packer/`](examples/token-packer/) carries one small
module at two tiers at once: a token-budget packer proved in Dafny
(`HOLDS` — never exceeds the budget, for every input) and
property-tested in Python (`SAMPLED` — 2000 seeded cases of the same
contract). The Dafny toolchain stays behind that optional directory;
the core CLI has zero Dafny dependency.

## Skills

Two decks ship inside the npm package, in Claude Code SKILL.md format.
`oathfast init` installs them into the project's `.claude/skills/`;
`oathfast skills --global` installs them user-wide. Skills you already
have are never overwritten; a collision is reported with the path and
the fix.

- **`skills/human/`** — `pin-down` (adversarial interview → proposed
  guarantee diff for you to sign), `why-guarantee` (explain a
  guarantee: meaning, evidence, trust, history), `trust-review` (how
  your Given section — your trust surface — moved over time).
- **`skills/agent/`** — `formalize-claim`, `implement-to-guarantee`
  (red-green-verify; may never weaken a spec — escalates instead),
  `decompose-work`, `file-decision-request`, `backfill-surveyor`
  (brownfield survey → all-OPEN as-built draft),
  `counterexample-curator`, `lemma-librarian`.

When agents hit a product decision — conflicting guarantees, an
unprovable obligation, ambiguous intent — they file a **decision
request** (`decisions/DR-###.md`) with concrete options as
GUARANTEES.md diffs, and you sign the outcome. Agents never resolve
product decisions themselves.

## What this is not

- **Not a test framework.** Your tests, proofs, and lints are the
  evidence; Oathfast only binds them to promises and recomputes honesty.
- **Not a proof assistant.** Bring Dafny, TLA+, Hypothesis, or
  nothing; Oathfast ranks the evidence, it doesn't produce it.
- **Not a write-gating runtime.** Oathfast attests *durable project
  promises* after the fact; it does not intercept individual agent
  writes — see Related work.

## Hardening for teams

Oathfast is built solo-first. For a team, three additions are planned,
all additive to the format: CODEOWNERS plus branch protection on
`GUARANTEES.md` and `decisions/` as a review backstop, cryptographic
signatures (`git commit -S`, sigstore) behind `oathfast sign`, and
optional evidence expiry for audit regimes.

## Related work

[**Detent**](https://pypi.org/project/detent) is a complementary
write-time verification runtime: Detent gates individual agent writes;
Oathfast attests durable project promises. The two compose — a Detent
pipeline is a valid backend for `ENFORCED`-tier guarantees.

## Dogfood

This repo ships its own [GUARANTEES.md](GUARANTEES.md), signed and
checked read-only in CI: determinism of `oathfast check` (SAMPLED), no
network calls (ENFORCED, hash-bound to the source gate), tamper
detection on the status column (SAMPLED), grammar conformance
(SAMPLED), single-artifact install (SAMPLED), and signature drift
detection (SAMPLED) — anchored for real in
[.oathfast/anchors.json](.oathfast/anchors.json).

## License

MIT — see [LICENSE](LICENSE).
