# AOP Site

The interactive home of the Agentic Operating Procedure: documentation, five live tools, and the 5G exemplar replay. Published at **https://agentic-operating-procedure.github.io** and auto-synced from the estate.

## What is here

- **Documentation**: concepts, the normative specification, the pipeline, the estate, adoption, the 5G exemplar, governance.
- **Five live tools**: the Guardrail Playground, the AOP Validator, the Pipeline Visualizer, the Decision-Rights Ladder, and the Exemplar Replay. All run real engines ported from the certified reference implementation; the validator and the guardrail are **parity-verified against the estate's must-fail fixture set** (`tools/parity.mjs`, run in CI).
- **Auto-sync**: `tools/sync.py` pulls schemas, fixtures, the exemplar corpus, compiled AOPs, manifests, the coverage map and version rows from the estate repositories' main branches. The workflow runs every 6 hours, on `repository_dispatch` from any estate repo, and before every deploy.

## Layout

- `tools/sync.py` — the estate pull; `tools/build_pages.py` — the page generator; `tools/parity.mjs` — the JS-vs-Python parity gate; `tools/changelog.py` — the changelog verifier consumed by every estate repo's CI.
- `js/aop-engine.js` — the browser port of the validator and the guardrail.
- `data/` — the synced estate artefacts (never hand-edited).

## Governance

The site is a rendering surface: it invents no normative content. Everything it displays is pulled from, and traces to, the estate repositories. Changes to the engines require the parity gate to pass.
