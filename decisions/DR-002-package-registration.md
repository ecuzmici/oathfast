# DR-002 — npm/PyPI name registration could not run in the bootstrap session

## Context
The handoff ordered: "Register npm + PyPI in this same session, before
anything else" (bare name `stead` verified free as of Aug 2026). The
bootstrap session had no npm login (`npm whoami` → ENEEDAUTH) and no
PyPI credentials (`~/.pypirc` absent), so publishing was impossible
from the agent side. This is a deviation from the handoff's ordering,
logged rather than silently skipped.

## Conflict / counterexample
`npm publish` / `twine upload` require account credentials that only
the human holds. Name-squat risk grows with time while `stead` stays
unregistered.

## Options

### Option A — Human registers both names now (recommended)
```diff
 (no GUARANTEES.md change)
```
From the repo root: `npm login && npm publish` (package.json is
publish-ready at 0.1.0). For PyPI, reserve the name with a minimal
sdist placeholder pointing at the repo. Fastest close of the squat
window.

### Option B — Provide credentials to a follow-up agent session
```diff
 (no GUARANTEES.md change)
```
Set `NPM_TOKEN` / `TWINE_API_KEY` in the session environment and ask
the agent to publish. Keeps the "agent does it" flow, costs one round
trip and a credential handoff.

## Decision
Signed by:
Date:
Chosen option:
