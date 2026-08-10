---
name: implement-to-guarantee
description: Implement or modify code so that a specific guarantee's anchored check/proof passes, via a red-green-verify loop. The spec (requires/ensures, guarantee lines) is read-only; escalate instead of weakening. Use when a ticket names a guarantee id to satisfy or restore.
---

# implement-to-guarantee

Input: a guarantee id plus its anchor (spec, test, or proof
obligation). Output: implementation code under the project source tree
such that `oathfast check` shows the guarantee at its declared tier.

## Hard constraints (violating any of these is task failure)

- **MUST NOT edit** requires/ensures clauses, invariants, proof
  obligations, guarantee lines, Given lines, or anchor tiers. Those are
  the contract; you are the implementor. If the contract seems wrong,
  impossible, or self-contradictory: STOP and escalate via
  `file-decision-request`. Do not "fix" the spec to match your code.
- MUST NOT add `assume`, `{:axiom}`, `{:verify false}`, skipped tests,
  or any other evidence-weakening escape hatch. CI greps for these.
- MUST NOT touch the status column of GUARANTEES.md (it is computed).
- MUST NOT weaken sibling guarantees to make the target pass. Run the
  full `oathfast check`, not just your anchor.

## The loop

1. **Red.** Run the anchor's check. Confirm it fails, and read WHY it
   fails — the specific unproved obligation, failing assertion, or
   counterexample. If it already passes, stop and report (the ticket is
   stale).
2. **Green.** Write the minimum implementation that plausibly
   discharges the failure. Prefer the dumb-but-provable version first;
   optimize only after green.
3. **Verify.** Re-run the anchor, then full `oathfast check`. Record each
   iteration's failure signature in your working notes.
4. Repeat. Change strategy, not just tactics, when a failure signature
   repeats twice.

## Escalation

After **5 failed verify iterations**, stop and escalate with the
**specific unproved obligation** — the exact verifier error / failing
property, the input or trace that triggers it, and the strategies
already tried (so the next attempt doesn't repeat them). File it as a
DR if the blocker is a spec conflict, or as a `machine/failures/` entry
plus ticket update if it's an implementation dead-end. An honest
escalation with a sharp counterexample is a successful outcome; a
weakened spec is not.

## Completion

`oathfast check` exits 0, target guarantee at its declared tier, no other
guarantee degraded, transcript dropped in `machine/transcripts/`.
