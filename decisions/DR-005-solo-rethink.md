# DR-005 — Rethink: solo-first audience, earned tiers, attestor-native signing

## Context

A design interview on 2026-08-10 examined Stead as a toolchain. The
interview started from eight verified findings (F1–F8, session handoff).
Core finding: the pipeline has one mechanical joint, `runAnchor()`. Every
other handoff is a convention. The findings and the interview answers
produced the decision bundle below. This DR records the bundle for
countersigning, in the style of DR-001.

## Conflict / counterexample

Three claims outran the implementation:

1. The CODEOWNERS gate failed its first real test. PR #1 changed
   `GUARANTEES.md` and `FORMAT.md`, the gate failed, and the merge
   happened anyway (F1).
2. An anchor with `"tier": "HOLDS", "cmd": "true"` reports `HOLDS` (F2).
3. `stead check` corrects a hand-edited status silently and exits 0, so
   the committed file can show a false status to readers (F4).

## Options

The interview selected one option per point. Each point lists the choice
made. Sign the Decision block to confirm the bundle.

1. **Audience.** Stead serves solo developers who build with agents. The
   untrusted party is the agent, not a coworker. Team support stays a
   future hardening layer.
2. **Earned tiers.** `validate()` caps every anchor at `SAMPLED` by
   default. `HOLDS` and `CHECKED` require a `verifier` command that
   `stead check` re-runs. `ENFORCED` requires a `files` map that points
   at the enforcing config. This replaces the opt-in `llm_behavior`
   ceiling as the only earned-tier rule.
3. **Attestor-native signing.** A new `stead sign` command writes an ack
   (guarantee-text hash, name, date) to `.stead/signatures.json`. Givens
   are included. `stead check` fails when a guarantee or Given text
   changes without a re-ack. New lines stay cheap to add. The CI gate
   becomes a backstop, not the mechanism.
4. **Read-only CI mode.** A new `stead verify` computes statuses, writes
   nothing, and exits nonzero when the file disagrees with the
   computation. CI runs `verify`; humans and agents run `check`.
5. **Anchor honesty.** Determinism and no-network for anchor commands
   stay an author obligation, not an enforced property. The README claim
   narrows to: the file cannot lie about what its anchors reported.
6. **Decisions move.** DRs move from `machine/decisions/` to a top-level
   `decisions/` directory. `machine/` becomes fully regenerable and
   never human-reviewed, as FORMAT.md defines it.
7. **Kernel-only init.** `stead init` scaffolds `GUARANTEES.md`,
   `.stead/`, and `decisions/` only. Each agent skill creates its own
   `machine/` subdirectory on first use.
8. **No hard expiry.** Computation never reads the clock, which
   preserves determinism (S1). `stead status` prints the ack date next
   to each `TRUSTED` line so stale assumptions stay visible.
9. **Skill names.** `why` renames to `why-guarantee`. The other nine
   deck names stay. The installer lists each skipped deck and the
   command to resolve the collision.
10. **OPEN pressure.** The `check` and `verify` summary lines always
    enumerate open ids. `verify --no-open` is an opt-in CI failure for
    projects past bootstrap. `OPEN` alone never fails a default run.
11. **README reposition.** The pitch leads with agent accountability:
    agents build in your stead, Stead keeps them honest with you. Team
    use gets one future-hardening section. The rewrite lands after the
    mechanics above land.

## Decision

Signed by: ecuzmici
Date: 2026-08-10
Chosen option: the 11-point bundle above
