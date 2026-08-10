# DR-003 — Bare npm name "stead" is unpublishable; ship as @stead/cli

## Context
Executing DR-002 Option B (CI publish with a repo-secret token). Tests
and `stead check` passed in CI; the upload was rejected.

## Conflict / counterexample
The handoff asserted the bare name `stead` was "verified FREE on npm".
Free, yes — but npm's typo-squat similarity filter forbids it:

```
403 Forbidden - PUT https://registry.npmjs.org/stead - Package name too
similar to existing packages read,stream,send,tea1,xtend
```

The filter applies to all publishers, so the bare name is neither
claimable by us nor squattable by anyone — the registration urgency in
the handoff dissolves for npm's bare name specifically. The `@stead`
org scope, however, WAS claimable and therefore worth reserving.

## Options

### Option A — @ecuzmici/stead (user scope)
Zero extra steps, personal-scoped branding.

### Option B — reserve npm org "stead", publish @stead/cli (CHOSEN)
Reserves the brand as a scope; package name states what it is (the CLI
is one implementation of the format, which is the actual product).

### Option C — petition npm support for the bare name
Days of latency, uncertain outcome; can still be done later on top of B.

## Decision
Signed by: ecuzmici (options selected interactively in the bootstrap session)
Date: 2026-08-05
Chosen option: B, which then failed — the `stead` org/scope name was
already taken on npm (scopes share the user/org namespace). Final
choice, also signed interactively: bare name **`stead-cli`** (unscoped,
passes the similarity filter; the installed command remains `stead`).
