# DR-006 — Rename the project from Stead to Oathfast

## Context

`stead-cli@0.2.0` shipped on npm on 2026-08-10. The bare name `stead` was
never available (npm's similarity filter, DR-003), and the `@stead` scope
belongs to npm user `mecolela`, who published `@stead/cli@0.1.1` on
2019-12-01 — a real, non-squatting package for an unrelated design system.
`@stead/cli`, the name originally wanted, is therefore permanently
unreachable; npm's dispute policy favours the incumbent in exactly this
case. That left `stead-cli`, whose `-cli` suffix asserts the CLI is the
product, contradicting FORMAT.md's position that the format is the product
and the CLI is one implementation.

## Conflict / counterexample

Renaming had to satisfy three constraints at once: a free npm org scope, a
free domain, and a name a developer can pronounce and spell on first
hearing. Five parallel searches covered ~488 candidates across the
vocabularies of promising, attestation, endurance, coinage, and Old English
compounding.

The binding constraint was not availability but sayability. At one
syllable, every pronounceable English word in every lane was already taken
on npm — 49 of 56 in the promising lane, all 59 in the attestation lane.
The survivors survived *because* they were obscure: `borh`, `beot`, `heit`,
`wedd`. The constraint was selecting for unusable names, so it was relaxed
to two syllables. The coinage lane inverted the same failure, producing
highly available but meaningless output (`vrelm`, `skorth`, `thurk`) —
unacceptable for a product whose thesis is legibility.

## Options

### Option A — keep `stead-cli`
Zero work. Rejected: bakes in the CLI-is-the-product framing and keeps a
name the owner dislikes, at the moment when renaming is cheapest.

### Option B — `@ecuzmici/stead` (user scope)
Always available. Rejected: reads as a personal project, not a product.

### Option C — a near-miss org (`@steadhq`, `@usestead`)
Available. Rejected: near-miss scopes advertise that the real name was
taken.

### Option D — rename to `oathfast` (CHOSEN)
`oathfast` is the same Old English construction as `steadfast`: a noun
welded to *fæst*, "firmly fixed". It is a morphological sibling of the name
being replaced, so the rename moves one word sideways within the same
family rather than abandoning the brand. Both morphemes are live modern
English — *fast* in the held-firm sense survives in *steadfast*, *holdfast*,
*hold fast* — so it reads correctly on sight. Semantically it is exact: a
guarantee is an oath, and the attestor's job is to hold it fast to
evidence. The strongest status on the ladder is `HOLDS`.

Verified free on 2026-08-10: npm bare package, npm org namespace, and
`oathfast.com`, `.dev`, `.ai`, `.tools`. No existing brand collision.

## Scope of the rename

- npm package `stead-cli` → `@oathfast/cli`; installed command `stead` →
  `oathfast`. The longer form was chosen over a bare `oath` command
  because OATH is the Initiative for Open Authentication, the TOTP/HOTP
  standard behind `oathtool`.
- `.stead/` → `.oathfast/`; `bin/stead.js` → `bin/oathfast.js`;
  `.github/workflows/stead.yml` → `oathfast.yml`.
- Tagline: "Software built in your stead. Guarantees that hold." →
  "Software built by agents. Guarantees held fast." The original punned on
  *stead* and could not survive a literal substitution; *held fast* echoes
  the new name the way *in your stead* echoed the old one.
- `stead-cli@0.2.0` is unpublished from npm rather than deprecated: it is
  inside npm's 72-hour window with no dependents, so removal is clean.

**DR-001 through DR-005 are deliberately left unmodified.** They record what
was decided under the name in force at the time. `decisions/` is the one
non-regenerable subtree (FORMAT.md §5); rewriting it to match a later
rename would falsify the trace of intent this format exists to protect.

## Decision
Signed by:
Date:
Chosen option:
