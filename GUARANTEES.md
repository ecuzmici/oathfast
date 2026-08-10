# GUARANTEES — oathfast

S1  `oathfast check` is deterministic given identical inputs.    SAMPLED
S2  `oathfast check` makes no network calls.                     ENFORCED
S3  The status column is never hand-editable without detection.  SAMPLED
S4  `oathfast check` accepts exactly the grammar in FORMAT.md.   SAMPLED   given T1
S5  Installing the CLI installs the skill decks with it.         SAMPLED
S6  A signed line cannot change or vanish without detection.     SAMPLED

## Given
T1  FORMAT.md v0.2 is the intended grammar; the parser tests cover its rules.

## Out of scope
Performance of anchored check commands; behavior of anchors that are
themselves nondeterministic or networked; prose quality of guarantee text.
