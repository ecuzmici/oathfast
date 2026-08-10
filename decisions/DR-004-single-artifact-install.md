# DR-004 — The CLI and the skill decks ship as one artifact

## Context
Preparing the first real install after publishing `stead-cli`. The
package `files` list was `["bin/", "FORMAT.md", "README.md", "LICENSE"]`,
so `npm i -g stead-cli` delivered the attestor and nothing else. The ten
SKILL.md decks existed only in the git repo.

## Conflict / counterexample
The README's 60-second quickstart is `npm install -g stead-cli`, and the
Skills section describes ten decks as though that install provided them.
It did not. A user following the quickstart got `stead check` and no way
to reach `pin-down`, `formalize-claim`, or `implement-to-guarantee` —
the skills are how a human actually drives the format, so the advertised
workflow was unreachable from the advertised install.

Worse, the natural workaround (hand-symlinking `~/.claude/skills/*` at a
git clone) decouples deck version from CLI version. A deck written
against a future FORMAT.md revision would sit next to an older attestor
with no signal that they disagree.

## Options

### Option A — ship `skills/` in the tarball and install it from the CLI (CHOSEN)
Add `skills/` to `files`; add `stead skills` (and make `stead init`
install project-local decks by default). One install, one version, no
second fetch. Costs ~30kB of tarball and one command outside the §4
contract as originally written.

```diff
+S5  Installing the CLI installs the skill decks with it.                 OPEN
```

### Option B — a separate `stead-skills` package
Keeps the attestor minimal and the decks independently versionable.
Rejected: it reintroduces exactly the version-skew problem, and "one
thing" was the stated requirement.

### Option C — leave it; document `git clone` as the way to get skills
Zero code. Rejected: it makes the documented quickstart a lie, which is
a poor look for a project whose thesis is that the docs cannot lie.

## Notes on the chosen design
- **Global installs symlink; project installs copy.** A symlink into one
  machine's global `node_modules` is meaningless once committed, so
  project-local decks are copies. Global decks are symlinks so
  `npm update -g stead-cli` refreshes them in place.
- **Never clobber.** A skill directory stead did not install (no
  `.stead-deck` marker, not a symlink into the package) is skipped with
  a warning. Uninstall is symmetric: it removes only marked decks.
- **S2 is untouched.** `homeDir()` reads `HOME`/`USERPROFILE` rather
  than importing `os`, so the no-network gate's module allowlist did not
  have to be widened to accommodate this feature.

## Decision
Signed by: ecuzmici
Date: 2026-08-10
Chosen option: A — "All that's necessary for Stead to work should come
packaged as one thing."
