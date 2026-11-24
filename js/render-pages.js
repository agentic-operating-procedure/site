// render-specification.js + render-estate.js + render-adoption.js + render-exemplar.js + render-pipeline.js + render-governance.js
import { el, renderShell, loadData, versionBadges } from './shell.js';

const active = document.body.dataset ? null : null;
const page = location.pathname.split('/').pop() || 'index.html';

if (page === 'specification.html') {
  renderShell('specification.html');
  versionBadges(document.getElementById('versions'));

  const FAMILIES = [
    ['NM-*', 'Normative model', 'The eight dimensions, decision-rights ladder, network-native structure, identifiers, versioning, provenance, accountability, operating modes, aggregate budgets, reversibility, run state machine, replay levels.'],
    ['SEC-*', 'Security clauses', 'Authority outside the model context, fail-closed, credentials, evidence integrity, hold and emergency stop, workload identity, egress, erasure.'],
    ['SK-*', 'Agent Skill contract', 'Atomicity, tool-agnosticism, independent testability, no implicit authority, supply-chain lineage.'],
    ['CC-*', 'Conformance clauses', 'Completeness, decision specificity, authority coverage, provenance, ratification, reversibility, oversight, parameters, lifecycle, supply chain, erasure.'],
    ['RA-*', 'Run and action semantics', 'State machine, action digests, idempotency, duplicate delivery, concurrency, partial success, compensation, cancellation, degraded modes, approval binding, parameter constraints, migration.'],
    ['RP-*', 'Evidence and replay', 'R1 record verification, R2 decision-trace reconstruction, R3 controlled re-execution with its own authorisation.'],
    ['EV-*', 'Evaluation protocol', 'Cohort separation, pre-registration, promotion records, independence, negative results.'],
    ['CG-*', 'Substrate rules', 'Entity model, stitching, origin, corpus quality, observation posture, contestability, drift, process alignment.'],
    ['HM-*', 'Metamodel alignment', 'The classification rule mapping artefacts to levels with no contradictions.'],
  ];
  const fam = document.getElementById('clauseFamilies');
  for (const [id, name, desc] of FAMILIES) {
    fam.append(el('div', { class: 'card' }, [el('h3', {}, [el('span', { class: 'pill mono' }, [id]), ' ', name]), el('p', {}, [desc])]));
  }

  const schemas = document.getElementById('schemas');
  try {
    const docs = [
      ['aop-document.schema.json', 'The AOP document', 'Eight dimensions, variants, decision rules with ratification status, provenance, governance, parameters, oversight.'],
      ['agent-skill.schema.json', 'The Agent Skill declaration', 'Inputs, outputs, requirements, prohibitions, reporting, the independent test, maintainer and dependency lineage.'],
      ['evidence-bundle.schema.json', 'The approver evidence bundle', 'The proposed action with its digest, the triggering rule with provenance, the snapshot, the baseline comparison, expiry, the four-outcome ruling.'],
    ];
    for (const [file, name, desc] of docs) {
      const schema = await loadData(file);
      const req = (schema.required || []).length;
      schemas.append(el('div', { class: 'card', style: 'margin-bottom:14px' }, [
        el('h3', {}, [name, ' ', el('span', { class: 'pill mono' }, [`${Object.keys(schema.properties || {}).length} properties`])]),
        el('p', {}, [desc, ` ${req} required top-level members.`]),
        el('details', {}, [
          el('summary', {}, ['View the required members']),
          el('pre', {}, [JSON.stringify(schema.required, null, 2)]),
        ]),
      ]));
    }
  } catch { /* data unavailable offline */ }

  const tiers = document.getElementById('tiers');
  for (const [tier, suites, meaning] of [
    ['Validated', 'document profile', 'The artefact satisfies the schema and the normative semantic checks.'],
    ['Enforced', '+ harness behavioural profile', 'A harness enforces the model: fail-closed, out-of-context authority, scoped credentials, tamper detection. The reference harness holds this tier.'],
    ['Adversarially Tested', '+ the adversarial suite', 'The enforcement survives hostile input: poisoned facts, authority widening, payload smuggling, proposer flooding.'],
    ['Assured', '+ lifecycle and oversight checks', 'Oversight and lifecycle obligations hold: SLAs, metrics, the protected human reservoir.'],
  ]) {
    tiers.append(el('div', { class: 'card', style: 'margin-bottom:12px' }, [
      el('h3', {}, [tier, ' ', el('span', { class: 'pill' }, ['cumulative superset'])]),
      el('p', {}, [suites + '. ' + meaning]),
    ]));
  }
}

if (page === 'estate.html') {
  renderShell('estate.html');
  versionBadges(document.getElementById('versions'));
  const repos = [
    ['aop-governance', 'Governance', 'Decision, change request, finding; the register; the independence layer.'],
    ['aop-foundations', 'Concept', 'The hierarchy, the governing principle, the glossary, the non-goals, the metamodel map.'],
    ['aop-landscape', 'Concept', 'Positioning, prior art, standards crosswalks, the name-collision disambiguation.'],
    ['aop-spec', 'Specification', 'The normative model, schemas, validator, entity register, reconciliation closures.'],
    ['aop-architecture', 'Architecture', 'Layers, trust architecture, pipeline, topologies, threat model T1 to T8.'],
    ['aop-context-graph', 'Substrate', 'The Context Graph of Work, stitching, twin, drift, the observation posture.'],
    ['aop-toolkit', 'Tooling', 'SOP parser, variant miner, rule extractor, compiler, linter, CLI.'],
    ['aop-reference-harness', 'Runtime', 'The runtime loop, guardrail, broker, escalation, case record, the replay module.'],
    ['aop-registry', 'Registry', 'Publication, resolution, revocation state, provenance chain verification.'],
    ['aop-conformance', 'Assurance', 'Profiles AOP-DOC-1 and HAR-1, must-fail fixtures, the adversarial suite, certificates.'],
    ['aop-evaluation', 'Evaluation', 'Metrics, baselines, shadow mode, the cohort protocol, the reproducibility contract.'],
    ['aop-adoption', 'Adoption', 'The playbook, the maturity model, the operating modes, the scenarios, the checklists.'],
    ['aop-examples', 'Demonstration', 'The 5G exemplar end to end, the reproduction gate, the Pi adapter.'],
    ['.github', 'Front door', 'The organisation profile, the reference architecture, community files.'],
  ];
  const tbl = document.getElementById('repos');
  const table = el('table', {}, [
    el('thead', {}, [el('tr', {}, [el('th', {}, ['Repository']), el('th', {}, ['Authority']), el('th', {}, ['What it owns'])])]),
    el('tbody', {}, repos.map(([slug, tier, desc]) => el('tr', {}, [
      el('td', {}, [el('a', { href: `https://github.com/agentic-operating-procedure/${slug}`, target: '_blank', rel: 'noopener' }, [slug])]),
      el('td', {}, [el('span', { class: 'pill' }, [tier])]),
      el('td', {}, [desc]),
    ]))),
  ]);
  tbl.append(table);

  const cov = document.getElementById('coverage');
  try {
    const map = await loadData('coverage-map.json');
    for (const r of map.coverage_map.requirements) {
      cov.append(el('div', { class: 'card', style: 'margin-bottom:10px; display:flex; gap:14px; align-items:baseline' }, [
        el('span', { class: `pill ${r.covered ? 'ok' : 'warn'}` }, [r.covered ? 'covered' : 'uncovered']),
        el('span', { style: 'font-family:var(--mono); font-size:13px' }, [r.clause]),
        el('span', { style: 'color:var(--ink-soft); font-size:13.5px' }, [r.note || (r.fixtures || []).join(', ')]),
      ]));
    }
  } catch { /* data unavailable offline */ }
}

if (page === 'adoption.html') {
  renderShell('adoption.html');
  const STAGES = [
    ['1', 'Procedural decomposition', 'Know what you are migrating: the family, the pinned SOP versions, the intent and scope, the process-catalog reference or lodged gap.'],
    ['2', 'Operational grounding', 'Replace claims with observation: declared capture surface, stitched cases, the documented path coverage computed and published, workarounds inventoried.'],
    ['3', 'Autonomy disposition', 'Decide per decision family what the agent may do: five risk axes, the governance manifest, the human baseline bound to canonical metrics or a lodged gap.'],
    ['4', 'AOP specification', 'Compile and validate: schema-valid, profile-passing, every rule provenance-backed, the provenance chain verified against the corpus.'],
    ['5', 'Harness engineering', 'Run inside a governed boundary: the harness itself a conformant AOP, evidence bundles routed to named approvers, credentials scoped.'],
    ['6', 'Verification and assurance', 'Earn the promotion: shadow mode against live cases, promotion recorded in governance, drift obligations live, value claims published reproducibly.'],
  ];
  const stages = document.getElementById('stages');
  for (const [n, name, desc] of STAGES) {
    stages.append(el('div', { class: 'card', style: 'margin-bottom:12px' }, [
      el('h3', {}, [`Stage ${n}: ${name}`]), el('p', {}, [desc]),
    ]));
  }
  const MODES = [
    ['1', 'Observe-only', 'Nothing executes. Compiled and linted; the shadow corpus accrues.'],
    ['2', 'Recommend', 'Propose dispositions for humans to execute; no side effects.'],
    ['3', 'Approval-gated', 'Execute only after per-action human approval with the full approval object.'],
    ['4', 'Bounded', 'Autonomous-class actions inside budgets and scope caps; approval classes still gated.'],
    ['5', 'Expanded', 'Bounded plus enlarged budgets and envelope, with drift obligations live.'],
  ];
  const modes = document.getElementById('modes');
  const mrow = el('tr', {});
  const modes_tbl = el('table', {}, [
    el('thead', {}, [el('tr', {}, [el('th', {}, ['#']), el('th', {}, ['Mode']), el('th', {}, ['What the executor may do'])])]),
    el('tbody', {}, MODES.map(([n, name, desc]) => el('tr', {}, [el('td', {}, [n]), el('td', {}, [el('b', {}, [name])]), el('td', {}, [desc])]))),
  ]);
  modes.append(modes_tbl, el('p', { style: 'color:var(--ink-soft); font-size:14px' },
    ['Promotion requires pre-registered independent evaluation gates on held-out and prospective cohorts. Demotion and emergency-stop criteria are declared with the promotion criteria and are measurable.']));

  const MAT = [
    ['Human-operated', 'People execute from documents; a human notices what the document missed.'],
    ['Assisted', 'Agents propose; humans decide and execute. Proposals carry their evidence.'],
    ['Agentic', 'Agents execute bounded actions under AOP authority; humans own exceptions. The intended operating point for most organisations.'],
    ['Autonomous', 'An earned stage with additional evidence obligations, not a marketing claim. Accountability stays human.'],
  ];
  const maturity = document.getElementById('maturity');
  const mtbl = el('table', {}, [
    el('thead', {}, [el('tr', {}, [el('th', {}, ['Stage']), el('th', {}, ['What holds'])])]),
    el('tbody', {}, MAT.map(([s, d]) => el('tr', {}, [el('td', {}, [el('b', {}, [s])]), el('td', {}, [d])]))),
  ]);
  maturity.append(mtbl);
}

if (page === 'exemplar.html') {
  renderShell('exemplar.html');
  const T = [
    ['Classic SOP', 'RB-RAN-014 v7: a linear corridor with prose escalation ("severe faults are escalated"), reviewed before the current anomaly mix.'],
    ['Observed corpus', '45 cases across five anomaly profiles. The documented corridor holds for 23 of 45: the happy-path fallacy stated as a number.'],
    ['Compiled AOP', 'AP-RAN-014: 5 variants with frequencies, thresholds at severity 85, degradation 30 percent, persistence 45 minutes. Every rule provenance-backed and ratified.'],
    ['Governed execution', '45 cases in the harness: 245 actions, 10 evidence-bundle approvals, 20 prohibitions, complete hash-chained case records.'],
    ['Shadow evaluation', 'Agreement 1.0, zero authority violations, 25 conservative deviations surfaced for rule refinement.'],
    ['Held-out cohort', '33 development / 12 held-out cases; recompiled from development alone; held-out agreement 1.0. Unseen cases of the same synthetic generator, honestly labelled.'],
    ['Human baseline', 'MTTR-p50 35 minutes, first-pass resolution 0.889, escalation precision 1.0. Bound to published dea:metric-* records.'],
  ];
  const transform = document.getElementById('transform');
  for (const [stage, desc] of T) {
    transform.append(el('div', { class: 'card', style: 'margin-bottom:12px' }, [
      el('h3', {}, [stage]), el('p', {}, [desc]),
    ]));
  }
}

if (page === 'pipeline.html') {
  renderShell('pipeline.html');
  const P = [
    ['Observe', 'Task-level work context across systems, including the cross-application and legacy interactions that never appear in API logs. Declared capture surface; at-source exclusion of personal content; the work is modelled, not the person.', 'AOP-CRD: trust classes, minimisation'],
    ['Model', 'Normalise events and stitch them into end-to-end cases: the Context Graph of Work with steps, actors, systems, decisions, exceptions and outcomes. Frequencies and evidence on every edge.', 'CASE, TASK, STEP, ACTOR, APPLICATION, DECISION, RULE, EXCEPTION, ESCALATION, OUTCOME'],
    ['Compile', 'Mine variants with observed frequencies, extract decision rules with thresholds, identify exception and escalation patterns, attach governance bounds, version with provenance.', 'Variants, rules, thresholds, ratified status'],
    ['Execute', 'Agents run against the AOP under a bounded-execution guardrail. Snapshot, match, authorise, execute, record, emit. Authority checked outside the model context.', 'Guardrail, budgets, scoped credentials, case record'],
  ];
  const pipe = document.getElementById('pipeline');
  for (const [name, desc, note] of P) {
    pipe.append(el('div', { class: 'card', style: 'margin-bottom:12px' }, [
      el('h3', {}, [name]),
      el('p', {}, [desc]),
      el('p', {}, [el('span', { class: 'pill mono' }, [note])]),
    ]));
  }
}

if (page === 'governance.html') {
  renderShell('governance.html');
  try {
    const register = await loadData('cr-register.md');
    document.getElementById('crRegister').textContent = register;
  } catch { /* data unavailable offline */ }
}
