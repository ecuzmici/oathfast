---
name: file-decision-request
description: File a decision request (decisions/DR-###.md) when guarantees conflict, an obligation is unprovable, or intent is ambiguous. Agents never resolve product decisions themselves. Use whenever forward progress requires choosing among readings of human intent.
---

# file-decision-request

Triggers — file a DR (and stop the blocked work) when:

1. Two guarantee lines cannot both hold, and you can exhibit why.
2. An obligation is unprovable/unenforceable as stated (you have the
   verifier error or counterexample).
3. The plain-English guarantee admits multiple materially different
   readings and the choice changes system behavior.
4. A required assumption surfaced that no checker can establish
   (candidate Given).

Do NOT file a DR for implementation choices with no product-visible
consequence — make those, and note them in the ticket.

## Procedure

1. Number: next unused `DR-###` in `decisions/` (zero-padded,
   sequential; never reuse numbers, even of rejected DRs).
2. Write `decisions/DR-###.md` per FORMAT.md §5:

```markdown
# DR-### — <one-line title>

## Context
What you were doing (ticket id, guarantee ids) and why you stopped.

## Conflict / counterexample
The concrete blocker. Paste the verifier error, the counterexample
input and observed/expected behavior, or the two G-lines in tension.
Concrete beats eloquent: a 5-line repro outranks a paragraph.

## Options
2–3 options, each as a concrete fenced ```diff against GUARANTEES.md.
One or two sentences of trade-off per option. If you have a
recommendation, mark exactly one option "(recommended)" and say why in
one sentence — but write every option as if it might be chosen.

## Decision
Signed by:
Date:
Chosen option:
```

3. Leave `## Decision` blank — a human fills and signs it. Never
   pre-fill, never apply any option's diff before the block is signed.
4. Mark the blocked ticket `status: escalated` with the DR number, and
   surface the DR to the human through whatever channel the session
   has (PR comment, summary, chat).
5. When a signed decision lands, the applying agent: applies the chosen
   diff verbatim, re-runs `oathfast check`, and links the DR from the
   commit message. `decisions/` is never garbage-collected —
   it is the durable trace of human intent.
