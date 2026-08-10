# DR-001 — v0.1 bootstrap: choices made where the handoff was ambiguous

## Context
Building the v0.1 scaffold from the founding handoff. Per build
discipline ("where my spec is ambiguous, don't guess silently"), the
choices below were made and are logged here for countersigning. None
change the format's semantics in ways the handoff forbids.

## Conflict / counterexample
Not a conflict — a bundle of underdetermined points:

1. **Language**: "Node or Python, pick one." Chose **Node** (single
   file, `require`-only, zero deps; matches the npm `stead` bin name).
2. **Anchor schema details**: the handoff gives the mapping idea, not
   field names. Chose `kind` (`check`/`files`/`trusted`), `tier`
   (status the evidence supports), `cmd`, `files` (path →
   `sha256:<hex>`), `llm_behavior` (encodes the SAMPLED ceiling).
   TRUSTED and OPEN are derived (trusted-kind anchor / no anchor), so
   statuses stay 100% computed.
3. **Guarantee id grammar**: handoff says G1..Gn but dogfoods S1..S3.
   Grammar generalized to `[A-Z]+\d+` with G conventional.
4. **Column separator**: two-or-more spaces between id / text / status,
   matching the handoff's examples; `stead check` preserves original
   spacing and rewrites only the status token.
5. **"Fail if GUARANTEES.md changed without CODEOWNERS review"**:
   implemented as CODEOWNERS on `GUARANTEES.md` + `FORMAT.md` plus a CI
   job that fails PRs touching those files until an approving review
   from the owner exists. Full enforcement additionally needs branch
   protection with "require review from Code Owners" enabled in repo
   settings (cannot be set from a workflow file).
6. **Dafny example**: the worked token-budget-packer example ships as
   Dafny source + a hand-ported Python module + a seeded property test
   under `examples/` (core CLI has zero Dafny dependency, per handoff).
   The Dafny proof was NOT machine-verified in the bootstrap
   environment (no Dafny toolchain), so the example's E1 ships
   unanchored (OPEN) with the `dafny verify` anchor documented in the
   example README for whoever first runs the verifier; the property
   test (E2, SAMPLED) is anchored and green. Presenting E1 as HOLDS
   without a verifier run would violate the format's own honesty rule.

## Options

### Option A — Countersign the above as v0.1 (recommended)
```diff
 (no GUARANTEES.md change; this DR documents implementation choices)
```
Keeps v0.1 as shipped; revisit any point in a later DR.

### Option B — Reverse specific choices
```diff
 (name the item number; the change is mechanical for 1–4, settings work for 5, toolchain work for 6)
```

## Decision
Signed by:
Date:
Chosen option:
