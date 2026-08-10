---
name: formalize-claim
description: Turn a signed plain-English guarantee line into a formal, checkable obligation at the highest honest tier — a verifier spec, an enforcement mechanism, a model, or a property test — plus the anchor entry binding it. Use after a human signs a new OPEN guarantee.
---

# formalize-claim

Input: a guarantee id currently OPEN. Output: (a) a formal artifact
under `machine/`, (b) an anchor entry in `.oathfast/anchors.json`, (c)
`oathfast check` passing with the guarantee at its new tier. You do not
edit the guarantee's text. If the English is ambiguous, file a decision
request (see `file-decision-request`) instead of picking a reading.

## Tier selection (try in order; take the highest that is honest)

1. **HOLDS** — property is a pure function of program state, spec
   expressible as requires/ensures/invariants, no probabilistic or
   external dependency. Write the spec in the project's verifier
   (Dafny/Verus/...). Artifact: `machine/proofs/<id>-<slug>.dfy` (or
   equivalent). Anchor: `kind: check`, `cmd` = the verifier invocation,
   `tier: HOLDS`. Zero `assume`, zero `{:axiom}`, zero
   `{:verify false}` — CI greps for these.
2. **ENFORCED** — an engine can reject violations at write/build/run
   time: DB constraint, RLS policy, CI-blocking lint, write-gating
   runtime (e.g. a Detent pipeline), type-level invariant. Artifact:
   the enforcement config + a test that the engine actually rejects a
   violation (test the failure path, not the happy path). Anchor tier:
   ENFORCED.
3. **CHECKED** — finite-state protocol/concurrency property. TLA+/Alloy
   model under `machine/proofs/`, anchor cmd = model checker run with
   pinned bounds. Record the bounds in the model file header.
4. **SAMPLED** — everything statistical, and ALL claims about LLM
   behavior (hard ceiling, `llm_behavior: true` in the anchor —
   FORMAT.md §2). Artifact: property test / eval harness with a fixed
   seed and pinned corpus. Nondeterministic tests are forbidden: a
   flaky anchor makes `oathfast check` nondeterministic, which violates
   Oathfast's own S1.

If no tier fits, the claim is not formalizable: file a DR proposing it
be reworded, split, or moved to Given/Out of scope.

## Rules

- One guarantee, one anchor. If you need two artifacts, wrap them in
  one script that exits non-zero on any failure.
- Anchor commands must be deterministic, offline, and runnable from
  repo root on a fresh clone (declare toolchain requirements in the
  artifact header; if the toolchain is optional for the repo, keep the
  artifact under `examples/` per project convention).
- Never lower another guarantee to make yours pass.
- Record failed formalization attempts in `machine/failures/` — a
  counterexample found while formalizing is valuable; hand it to
  `counterexample-curator`.
- Finish by running `oathfast check`; the status transition line
  (`G# : OPEN -> <TIER>`) is your completion evidence.
