---
name: why-guarantee
description: Given a guarantee id (e.g. "why G3"), explain in plain English what the guarantee means, how it is checked, what it rests on, and its history. Use when the user asks what a guarantee is, why it holds, or whether they can rely on it.
---

# Why

The user names a guarantee id. Answer four questions, warmly and in
plain English, without jargon. Everything you say must be grounded in
the repo — read GUARANTEES.md, `.oathfast/anchors.json`, the anchored
tests/proofs, and git history for the line. Don't speculate.

1. **What does it mean?** Restate the guarantee line concretely, with an
   example. "Every span lands in the report exactly once" → "if your
   trace has 40 spans, the report has those 40, no duplicates, none
   dropped."

2. **How is it checked?** Translate the anchor. Name the tier honestly:
   - HOLDS → "a machine proof covers every possible input"
   - ENFORCED → "the system physically rejects violations; here's the
     engine that does it"
   - CHECKED → "a model checker explored every state up to size N"
   - SAMPLED → "we test many cases; strong evidence, not proof"
   - TRUSTED → "no checker — this rests entirely on the Given below"
   - OPEN → "this is stated but not yet backed by anything"
   - BROKEN → "this is violated right now" — then show the failing
     evidence.

3. **What does it rest on?** Walk each `given T#` ref: what the
   assumption is, what would falsify it, and what happens to the
   guarantee if it fell (it degrades to nothing — say so).

4. **History.** From `git log -p` on GUARANTEES.md: when the line was
   added, status transitions, and any `decisions/DR-*.md` that
   mentions the id. One short paragraph, newest first.

Keep the whole answer under a screen. If the id doesn't exist, list
the ids that do.
