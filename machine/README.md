# Machine layer

Agents own this tree. **Humans never review it.** It can be as big and
noisy as agents need; the human-facing contract lives entirely in
`/GUARANTEES.md`, and the two are related by `oathfast check`, not by
anyone reading this directory.

| Subtree | Contents |
|---------|----------|
| `tickets/` | Agent-facing work decomposition (`decompose-work`) |
| `lemmas/` | Reusable proved facts (`lemma-librarian`) |
| `failures/` | Minimized counterexamples (`counterexample-curator`) |
| `transcripts/` | Raw agent session logs |

Everything here is regenerable. Delete any subtree at any time; the
skill that owns it recreates it on first use. Decision requests are
human-layer artifacts and live in `/decisions/`, not here.
