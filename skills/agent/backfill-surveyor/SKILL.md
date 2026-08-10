---
name: backfill-surveyor
description: Brownfield adoption — mine an existing codebase (code, tests, CI, incidents, docs) into a draft all-OPEN GUARANTEES.md of AS-BUILT behavior for humans to triage. Use when introducing Oathfast to a repo that predates it.
---

# backfill-surveyor

Input: an existing repository with no GUARANTEES.md (or an
acknowledged-incomplete one). Output: a DRAFT guarantee file the human
prunes and signs — you propose, you never sign.

## Cardinal rule: AS-BUILT is not intent

Everything you infer from artifacts is what the system **does**, not
what anyone **promised**. Mark every mined line `(as-built)` at the end
of its text, set every status to `OPEN`, and title the draft
`# GUARANTEES — <project> (DRAFT — as-built survey, unsigned)`.
Presenting inferred behavior as intent is the one unforgivable failure
mode of this skill: it would launder guesses into promises.

## Mining passes (run all that apply)

1. **Enforcement mechanisms** → strongest candidates. DB constraints,
   RLS policies, unique indexes, CI-blocking lints, type invariants,
   auth middleware. Each is a candidate ENFORCED-tier guarantee whose
   anchor already exists.
2. **Tests** → what the suite actually pins down. Property tests and
   invariant-shaped assertions outrank example tests. Note the test
   path — it is the future anchor.
3. **Incidents / fixes** → `git log` for revert/hotfix/CVE/postmortem
   language; each incident implies an invariant someone learned the
   hard way. These make the best guarantees because reality already
   voted.
4. **Docs & comments** → README promises, SLA language, "must always" /
   "never" comments. Weakest evidence (docs drift); cross-check against
   passes 1–3 and flag contradictions explicitly — a doc/code
   contradiction is a finding, not a coin-flip.

## Output shape

- 5–20 lines. A 60-line draft is a survey dump, not a guarantee file;
  keep the long tail in `machine/tickets/` as candidates.
- For each line, attach (in an accompanying survey note, not in
  GUARANTEES.md): evidence pointer, proposed eventual tier, and
  confidence.
- Candidate Given lines for load-bearing assumptions you found
  (pricing tables, external API stability).
- Candidate Out-of-scope entries for things the code conspicuously
  does not attempt.
- Hand the draft to a human via pin-down for triage. Do not create
  anchors until lines survive triage and are signed.
