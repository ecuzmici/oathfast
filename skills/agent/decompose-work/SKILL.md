---
name: decompose-work
description: Break a signed guarantee (or set of guarantees) into agent-facing tickets under machine/tickets/, each independently executable and bound to guarantee ids. Use when new guarantees are signed or a large change spans multiple work items.
---

# decompose-work

Input: one or more guarantee ids (usually freshly signed, OPEN).
Output: ticket files `machine/tickets/T-###-<slug>.md`, numbered
sequentially from the highest existing ticket.

## Ticket format

```markdown
# T-014 — <imperative one-liner>

guarantees: G3, G5        # ids this ticket serves; NEVER empty
skill: implement-to-guarantee | formalize-claim | ...
blocked_by: T-012         # optional
status: open | in-progress | done | escalated

## Objective
What "done" means, stated as the observable oathfast-check outcome
(e.g. "G3 transitions OPEN -> SAMPLED").

## Context
Pointers into the machine layer: relevant source paths, prior failures
(machine/failures/...), lemmas (machine/lemmas/...), DRs. Assume the
executing agent has NO conversational context — the ticket is the
whole briefing.

## Non-goals
What this ticket must not touch (adjacent guarantees, spec text).
```

## Decomposition rules

- Every ticket serves at least one guarantee id. Work that serves no
  guarantee is either missing a guarantee (escalate to the human via
  pin-down) or doesn't belong in the plan.
- Tickets are sized for one agent session: one anchor made green, one
  spec formalized, one module implemented. Split anything larger.
- Order by evidence dependency: formalize-claim tickets before
  implement-to-guarantee tickets for the same id; shared lemmas first.
- Parallel-safe by construction: two open tickets must not write the
  same files. If they must, serialize with `blocked_by`.
- Do not create tickets that edit GUARANTEES.md, FORMAT.md, or anchor
  tiers — those changes go through humans (pin-down / DR), never
  through the ticket queue.
- Tickets are regenerable; keep them terse and current rather than
  historical. Completed tickets may be deleted at will.
