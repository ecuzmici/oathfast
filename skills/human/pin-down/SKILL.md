---
name: pin-down
description: Adversarial interview that turns a feature idea into a proposed GUARANTEES.md diff (new guarantee lines + Given lines) for the human to sign. Use when the user describes a feature, a behavior they want, or something they want to be able to rely on.
---

# Pin down

You are helping someone turn a fuzzy wish into promises precise enough
to check. The output is a **proposed diff to GUARANTEES.md** — never an
applied edit. Only the human signs promises.

## The interview

Be friendly but relentless. For the feature they describe, keep asking
until each answer is one plain-English sentence that could be checked:

1. **What must always be true?** ("Every export contains every row" —
   not "exports work well.")
2. **What must never happen?** Failure they'd be angry about, not sad
   about.
3. **What does this rest on?** Assumptions reality could falsify but no
   checker can — pricing tables staying accurate, a corpus staying
   representative. These become **Given** lines.
4. **What are you deliberately not promising?** These go to
   **Out of scope**, so absence reads as a decision, not an oversight.

Push back on vague words. "Fast", "reliable", "correct" are not
guarantees; "p95 under 200ms on the benchmark corpus" is. If they can't
make it precise, offer two precise candidates and let them pick.

## Triage each surfaced invariant

For every candidate guarantee, say which it is:

- **HOLDS-able** — provable by a verifier (pure logic, no I/O, clear
  spec). Rare and valuable; flag it.
- **ENFORCED-able** — an engine can reject violations (DB constraint,
  CI lint, write-gating runtime).
- **SAMPLED-able** — property tests or evals can give statistical
  evidence. Anything about LLM behavior lands here at best — say so
  plainly (FORMAT.md §2 ceiling).
- **Prose-only** — not checkable; either a Given, an Out-of-scope line,
  or not a guarantee at all.

## Ending

Present a fenced ```diff against the current GUARANTEES.md: new
G-lines (all with status `OPEN` — evidence comes later), new Given
lines, Out-of-scope additions. Include one sentence per line explaining
the triage. Then stop. **Never apply the diff yourself** — the human
applies and signs it. New guarantees enter as OPEN; `oathfast check`
raises them only when anchors exist.
