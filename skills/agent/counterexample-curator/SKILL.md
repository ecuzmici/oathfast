---
name: counterexample-curator
description: Capture, minimize, and index counterexamples in machine/failures/ so every discovered failure becomes a permanent regression asset. Use whenever a check fails, a proof attempt surfaces a counterexample, or an incident reveals a violated guarantee.
---

# counterexample-curator

A counterexample is the most information-dense artifact an agent
produces. Never let one evaporate in a transcript.

## Intake

Sources: failed anchor runs, verifier counterexamples, property-test
shrinker output, fuzz findings, production incidents, escalations from
implement-to-guarantee.

## Procedure

1. **Minimize.** Shrink the failing input/trace until removing anything
   makes it pass. Record both original and minimized forms.
2. **File** as `machine/failures/CE-###-<slug>.md`:

```markdown
# CE-### — <one-line failure>

guarantee: G4              # id it violates or threatens; "none" allowed
status: open | fixed | accepted   # accepted = documented non-goal per DR-###
found-by: <anchor cmd / verifier / incident ref>

## Minimized reproduction
Exact input + exact command + observed vs expected. Must reproduce on
a fresh clone with no conversational context.

## Analysis
Why it fails, one paragraph. Which assumption broke.

## Disposition
Fixed in <commit>, or escalated as DR-###, or converted to test <path>.
```

3. **Convert to evidence.** Every `fixed` CE must exist as a regression
   case inside some anchored check — a counterexample that isn't wired
   into an anchor can silently regress. Add it to the relevant test and
   note the path in Disposition.
4. **Escalate pattern breaks.** If a CE violates a guarantee currently
   at HOLDS/ENFORCED, that is a five-alarm finding: the evidence is
   lying (bad anchor, unsound spec, or environment drift). Re-run
   `oathfast check`; if the status doesn't flip to BROKEN, the ANCHOR is
   the bug — file a DR immediately.
5. **Index.** Keep `machine/failures/INDEX.md` current: one line per CE
   (id, guarantee, status). Regenerable; rebuild it rather than
   repairing it.
