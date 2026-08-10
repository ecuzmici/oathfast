# Token-budget packer — the tier ladder in one directory

A tiny module carried at two evidence tiers at once:

- **E1 → HOLDS** via a Dafny proof (`packer.dfy`): `total <= budget`
  proved for *every* input, plus order-preservation, no-duplicates, and
  exact totals.
- **E2 → SAMPLED** via a seeded property test (`test_packer.py`):
  2000 sampled inputs against the same contract on the Python port.

Same promises, different strengths — that's the whole point of the
status column.

## Try it

```bash
cd examples/token-packer
python3 test_packer.py        # E2's evidence
node ../../bin/oathfast.js check # recompute this example's statuses
```

`oathfast check` here raises **E2** to SAMPLED. **E1** ships unanchored
(OPEN) because raising it to HOLDS honestly requires actually running
the verifier — Oathfast never marks HOLDS on the promise that a proof
*would* pass. With [Dafny 4.x](https://github.com/dafny-lang/dafny)
installed:

```bash
dafny verify packer.dfy
```

and once that passes, bind the proof by adding to
`.oathfast/anchors.json`:

```json
"E1": { "kind": "check", "tier": "HOLDS", "cmd": "dafny verify packer.dfy" }
```

Then `oathfast check` shows `E1 … HOLDS` — and will show `BROKEN` the day
the proof stops passing.

The core `oathfast` CLI has zero Dafny dependency; everything
Dafny-flavored lives in this optional directory.
