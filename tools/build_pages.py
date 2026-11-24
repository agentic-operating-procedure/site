#!/usr/bin/env python3
"""Generate the static HTML pages of the site from a page spec.

Every page shares the same shell (header, nav, footer) and links the same
CSS + engine JS. Content pages are written here as structured HTML so the
site is fully static: no build step beyond this generator, no client-side
framework, no external dependencies.
"""
from pathlib import Path

SITE = Path(__file__).resolve().parent.parent
PAGES = {
"index.html": ("""
<div class="hero">
  <span class="pill">The governance layer for delegated operational execution</span>
  <h1>Agentic Operating Procedure</h1>
  <p class="lead">An engineering and operational blueprint for specifying, governing and assuring operational execution by agents that interpret context and act. The purpose is to make delegated operational execution inspectable: to state, before execution, who may decide what, under which constraints, and with what proof of outcome.</p>
  <p style="margin-top:24px">
    <a class="btn primary" href="concepts.html">Read the concepts</a>
    <a class="btn" href="playground.html">Try the Guardrail Playground</a>
    <a class="btn" href="https://github.com/agentic-operating-procedure" target="_blank" rel="noopener">GitHub organisation</a>
  </p>
  <div id="versions" style="margin-top:28px; display:flex; gap:8px; flex-wrap:wrap"></div>
</div>

<div class="grid cols-3">
  <div class="card"><h3>Specify</h3><p>Eight mandatory dimensions, network-native procedure structure, decision-rights ladder over five risk axes, identifiers and provenance. An AOP that omits a dimension is not an AOP.</p><a href="specification.html">The normative specification &rarr;</a></div>
  <div class="card"><h3>Govern</h3><p>Authority lives outside the model context. The agent proposes; the guardrail disposes. Ratified rules only. Fail closed on unknowns. Short-lived scoped credentials. Append-only, replayable case records.</p><a href="concepts.html#trust">The trust architecture &rarr;</a></div>
  <div class="card"><h3>Assure</h3><p>Conformance profiles for documents and harnesses with deliberately broken must-fail fixtures. Shadow-mode evaluation against the human baseline. Certificates carry the tier and the digest.</p><a href="estate.html">The estate &rarr;</a></div>
</div>

<h2>Try the framework, live</h2>
<p>These tools run the real engines in your browser: the same schema checks, the same normative clauses, the same guardrail decision sequence as the certified reference implementation. Nothing is mocked.</p>
<div class="grid cols-2">
  <div class="card"><h3>Guardrail Playground</h3><p>Edit the case facts and watch the authority decision change. Tamper a fact, propose an out-of-permitted action, flood a budget: the guardrail answers as production would.</p><a href="playground.html">Open the playground &rarr;</a></div>
  <div class="card"><h3>AOP Validator</h3><p>Paste or edit an AOP document and get the clause-level diagnostics: completeness, decision specificity, authority coverage, provenance, ratification, reversibility.</p><a href="validator.html">Open the validator &rarr;</a></div>
  <div class="card"><h3>Pipeline Visualizer</h3><p>Walk the observe, model, compile, execute loop on the 5G exemplar: 45 observed cases becoming variants, decision rules with thresholds, and governed runs.</p><a href="visualizer.html">Open the visualizer &rarr;</a></div>
  <div class="card"><h3>Exemplar Replay</h3><p>Step through a governed run decision by decision: variant matched, rule applied with provenance, approval routed with an evidence bundle, case record appended.</p><a href="replay.html">Open the replay &rarr;</a></div>
</div>

<h2>The estate at a glance</h2>
<p>Fourteen repositories, one authority each, published under MIT. The interactive site is auto-synced from their main branches: schemas, fixtures, the exemplar corpus and the coverage map are pulled, not copied.</p>
<div class="grid cols-3">
  <div class="card"><h3>Certified Enforced</h3><p>The reference harness passes 25 behavioural checks including poisoned-context authority injection and case-record tamper detection.</p></div>
  <div class="card"><h3>Adversarially tested</h3><p>Must-reject fixtures: untrusted-grounded authority, republished unratified rules, append-only retraction, payload smuggling, proposer flooding.</p></div>
  <div class="card"><h3>Openly published</h3><p>Every claim cites its artefact digest, profile version and cohort. Where evidence is missing, the coverage map says so.</p></div>
</div>
""", ['version-badges']),

"concepts.html": ("""
<div class="hero"><h1>Concepts</h1>
<p class="lead">The six-level hierarchy, the eight mandatory dimensions, the governing principle, and the trust architecture.</p></div>

<h2>The six-level hierarchy</h2>
<div id="hierarchy"></div>

<h2>The eight mandatory dimensions</h2>
<p>Every AOP populates all eight. An AOP that omits one is not a degraded AOP; it is not an AOP.</p>
<div id="dimensions" class="grid cols-2"></div>

<h2 id="trust">The trust architecture</h2>
<p>Four assurance mechanisms, and the order matters: prevent is structural, verify is independent, oversee is human, audit is total.</p>
<div id="trust" class="grid cols-2"></div>

<h2>The governing principle</h2>
<div class="card"><h3>The procedure governs the agent</h3>
<p>The agent operates within the authority, the constraints and the assurance requirements the AOP establishes. It cannot self-authorise: the authority check is performed by a component outside the model context, so the agent cannot influence the outcome of the check that governs it.</p>
<p>This is the single technical commitment on which the rest of the estate rests. Every other design decision is downstream of it.</p></div>

<h2>The compile-and-run loop</h2>
<pre>   observe --&gt; model --&gt; compile --&gt; execute
      ^                               |
      |                               v
      +--------- observed cases &lt;--- evidence</pre>
<p>Execution evidence becomes new observation; the AOP stays true to the work because it is continuously re-derived from the work. Loop hygiene rules (origin tagging, the protected human reservoir) keep the baseline from learning the agent's own behaviour.</p>

<h2>Relationship to the Zero-Trust Agent Framework</h2>
<p><a href="https://github.com/Zero-TAF" target="_blank" rel="noopener">Zero-TAF</a> is the recognised trust framework whose runtime realisation AOP profiles: Zero-TAF defines the trust semantics (no implicit trust; the decision as the protected unit; per-task signed mandates); this programme binds them into procedural execution. The mapping direction is one-way and recorded in <a href="https://github.com/agentic-operating-procedure/aop-governance" target="_blank" rel="noopener">aop-governance</a> (CR-038).</p>
""", ['render-concepts']),

"specification.html": ("""
<div class="hero"><h1>The normative specification</h1>
<p class="lead">Clause families with stable identifiers, machine-readable schemas, and a reference validator. Normative text uses RFC 2119 key words; conformance is clause-by-clause.</p>
<div id="versions" style="margin-top:20px; display:flex; gap:8px; flex-wrap:wrap"></div></div>

<h2>Clause families</h2>
<div id="clauseFamilies" class="grid cols-2"></div>

<h2>The schemas</h2>
<p>Three machine-readable schemas, validated by the reference implementation in Python and by this site's JavaScript port (parity-verified against the fixture set).</p>
<div id="schemas"></div>

<h2>Conformance tiers</h2>
<p>Every suite is binary: no partial conformance, no waiveable checks. Tiers are named claims over cumulative suite supersets.</p>
<div id="tiers"></div>

<h2>Interact with the specification</h2>
<p><a class="btn primary" href="validator.html">Validate an AOP document</a> &nbsp; <a class="btn" href="ladder.html">Explore the decision-rights ladder</a></p>
""", ['render-specification']),

"pipeline.html": ("""
<div class="hero"><h1>The compile-and-run pipeline</h1>
<p class="lead">Observe, model, compile, execute: a closed loop, not a relay. Execution evidence becomes new observation; the AOP stays true to the work.</p></div>
<div id="pipeline"></div>
<h2>Shadow mode: the bridge into execution</h2>
<p>The compiled AOP first runs in observation-only mode against live cases: the guardrail decides what it would do, nothing executes, and every decision is compared with the choice the human actually made. Promotion to bounded execution is a decision made against the pre-registered agreement band, not against confidence.</p>
<h2>Interact</h2>
<p><a class="btn primary" href="visualizer.html">Visualise the exemplar through the pipeline</a> &nbsp; <a class="btn" href="replay.html">Replay a governed run</a></p>
""", ['render-pipeline']),

"estate.html": ("""
<div class="hero"><h1>The estate</h1>
<p class="lead">Fourteen repositories, one authority each. Every repo's README states its authority in one sentence; everything is public and MIT licensed.</p>
<div id="versions" style="margin-top:20px; display:flex; gap:8px; flex-wrap:wrap"></div></div>
<h2>Repositories</h2>
<div id="repos"></div>
<h2>Conformance coverage</h2>
<p>The requirement-to-fixture coverage map states what is tested and, just as deliberately, what is not.</p>
<div id="coverage"></div>
""", ['render-estate']),

"adoption.html": ("""
<div class="hero"><h1>Adoption</h1>
<p class="lead">The six-stage playbook, the five operating modes, the maturity model, and the organisational shift from corridor execution to exception ownership.</p></div>
<h2>The six stages</h2>
<div id="stages"></div>
<h2>The operating modes</h2>
<p>Modes attach per action class. Authority classes in the AOP cap the modes: no mode lets an executor act more permissively than the ratified rules allow, and model confidence is never a proxy for authority.</p>
<div id="modes"></div>
<h2>The maturity model</h2>
<div id="maturity"></div>
""", ['render-adoption']),

"exemplar.html": ("""
<div class="hero"><h1>The 5G exemplar</h1>
<p class="lead">A telecom service provider managing a complex 5G mobile network: classic SOP in, governed AOP out, humans and AI agents working anomaly management together.</p></div>
<h2>The transformation</h2>
<div id="transform"></div>
<h2>The held-out cohort run</h2>
<div class="card"><h3>The estate's first non-rule-fidelity result</h3>
<p>The corpus split deterministically: 33 development cases, 12 held-out cases the compile never saw. The AOP recompiled from development alone, then shadow-evaluated on held-out cases: <b>agreement 1.0, zero authority violations</b>, claim class generalisation (held-out).</p>
<p>Read honestly: unseen cases of the same synthetic generator, not live traffic. The protocol machinery is demonstrated; the live prospective cohort remains the adoption pilot's.</p></div>
<h2>Interact</h2>
<p><a class="btn primary" href="replay.html">Replay a governed run</a> &nbsp; <a class="btn" href="visualizer.html">See the pipeline on this data</a></p>
<h2>Canonical bindings</h2>
<p>Every baseline metric binds to a published <code>dea:metric-*</code> record in the OpenDEA metrics catalog, and the process is lodged as a contribution to the OpenDEA business-process catalog. Five canonical references, zero declared gaps remaining on the metrics side; the process entity assignment is pending the catalog's maintainer reclassification.</p>
""", ['render-exemplar']),

"governance.html": ("""
<div class="hero"><h1>Governance</h1>
<p class="lead">Decision, change request, finding: three artefact classes, one decision authority, and a reviewer-independence layer that disciplines claims.</p></div>
<h2>The three artefact classes</h2>
<div class="grid cols-3">
  <div class="card"><h3>ADR</h3><p>What was decided, and why. Immutable once accepted; superseding creates a new ADR.</p></div>
  <div class="card"><h3>Change request</h3><p>A proposed change to the estate, the model, or a published artefact. Repository creation is a CR, not an edit.</p></div>
  <div class="card"><h3>Finding</h3><p>What an investigation found, with the evidence. How the programme distinguishes verified from asserted.</p></div>
</div>
<h2>Reviewer independence and claims discipline</h2>
<div class="card"><p>Normative changes carry review from outside the authoring path. Two-approval quorum with <b>recorded dissent that travels with dependent claims</b>. Appeals through findings. Public claims cite version, profile, cohort, protocol, result and limitations. Invalidated claims are withdrawn in the place they were published.</p></div>
<h2>Decision rights</h2>
<p>Decision authority for structural change rests with the programme owner. Agents surface options with consequences; they do not decide. Every structural change is audited against the cascade checklist and lands through a change request with the cross-check recorded.</p>
<h2>The full record</h2>
<p>The complete CR register (CR-001 to CR-037) with landing states and named remainders is published in <a href="https://github.com/agentic-operating-procedure/aop-governance/blob/main/docs/cr-register.md" target="_blank" rel="noopener">aop-governance</a>, and the raw register file is synced into this site's data.</p>
<pre id="crRegister" style="max-height:420px; overflow:auto"></pre>
""", ['render-governance']),
}

PAGES['playground.html'] = ("""
<div class="hero"><h1>Guardrail Playground</h1>
<p class="lead">Propose actions against the real guardrail engine with the 5G exemplar AOP bound. Edit the case facts, inject a hostile untrusted fact, propose a shell route, flood a budget: the decision you see is the certified decision sequence, unmodified.</p></div>
<div id="tool-root"></div>
<p style="color:var(--ink-soft); font-size:13.5px">Untrusted facts are invisible to the decision point (NM-STR-16). Prohibited routes fail at the permitted-set check (NM-CON-1). Irreversible actions are raised to approval (NM-AUT-8). Budgets escalate beside the authority check (NM-CRD-4).</p>
""", [])
PAGES['validator.html'] = ("""
<div class="hero"><h1>AOP Validator</h1>
<p class="lead">The estate's normative checks in your browser: schema subset, semantic checks (CC clauses), and the same must-fail verdicts as the Python reference — parity-verified fixture by fixture.</p></div>
<div id="tool-root"></div>
""", [])
PAGES['visualizer.html'] = ("""
<div class="hero"><h1>Pipeline Visualizer</h1>
<p class="lead">The 45-case 5G corpus through observe, model, compile and execute: stitched decision points, compiled rules with thresholds and ratified status, and a live decision replay using the real guardrail engine.</p></div>
<div id="tool-root"></div>
""", [])
PAGES['ladder.html'] = ("""
<div class="hero"><h1>Decision-Rights Ladder</h1>
<p class="lead">Set the five risk axes and watch the minimum authority class derive live. This is NM-AUT-5/6 made interactive: the higher the position on any axis, the higher the floor.</p></div>
<div id="tool-root"></div>
""", [])
PAGES['replay.html'] = ("""
<div class="hero"><h1>Exemplar Replay</h1>
<p class="lead">Step through a governed run: snapshot, variant match, per-action authority with observed provenance, the evidence bundle an approver would see, and the append-only case record.</p></div>
<div id="tool-root"></div>
""", [])

def page(title, body, scripts=()):
    scripts_html = ''.join(f'<script type="module" src="{s}"></script>' for s in scripts)
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title} — Agentic Operating Procedure</title>
<meta name="description" content="The governance layer for delegated operational execution by agents: specifications, live tools, and a worked 5G exemplar.">
<link rel="stylesheet" href="css/site.css">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%231d4ed8'/%3E%3Ctext x='16' y='21' font-family='Arial' font-size='13' font-weight='800' fill='white' text-anchor='middle'%3EA%3C/text%3E%3C/svg%3E">
</head>
<body>
{body}
{scripts_html}
</body>
</html>"""

SCRIPTS = {
  'index.html': ['js/shell.js', 'js/render-pages.js'],
  'concepts.html': ['js/shell.js', 'js/render-pages.js'],
  'specification.html': ['js/shell.js', 'js/render-pages.js'],
  'pipeline.html': ['js/shell.js', 'js/render-pages.js'],
  'estate.html': ['js/shell.js', 'js/render-pages.js'],
  'adoption.html': ['js/shell.js', 'js/render-pages.js'],
  'exemplar.html': ['js/shell.js', 'js/render-pages.js', 'js/tool-replay.js'],
  'governance.html': ['js/shell.js', 'js/render-pages.js'],
  'playground.html': ['js/shell.js', 'js/tool-playground.js'],
  'validator.html': ['js/shell.js', 'js/tool-validator.js'],
  'visualizer.html': ['js/shell.js', 'js/tool-visualizer.js'],
  'ladder.html': ['js/shell.js', 'js/tool-ladder.js'],
  'replay.html': ['js/shell.js', 'js/tool-replay.js'],
}

for name, (body, _unused) in PAGES.items():
    scripts = SCRIPTS[name]
    title = name.replace('.html', '').replace('-', ' ').capitalize()
    (SITE / name).write_text(page(title.capitalize(), body, ['js/shell.js'] + [f'js/{s}.js' for s in scripts]))
    print('wrote', name)
