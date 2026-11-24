// Pipeline Visualizer: the 5G corpus through observe -> model -> compile -> execute.
import { el, renderShell, loadData } from './shell.js';
import { Guardrail, DECISION, ACTION_CLASSES } from './aop-engine.js';

renderShell('visualizer.html');
const root = document.getElementById('tool-root');

const stageSel = el('select');
const left = el('div', { class: 'pane' });
const right = el('div', { class: 'pane' });
const tool = el('div', { class: 'tool', style: 'grid-template-columns: 320px 1fr' }, [left, right]);
root.append(tool);

let corpus, aop, guardrail;

const STAGES = ['observe', 'model', 'compile', 'execute'];
for (const s of STAGES) stageSel.append(el('option', {}, [s]));
stageSel.value = 'observe';

function countProfiles(cases) {
  const prof = { transient: 0, restart: 0, 'mass-event': 0, hardware: 0, persistent: 0 };
  for (const c of cases) {
    const ctx = c.context || {};
    if (ctx.anomaly_persistence_min >= 45) prof.persistent += 1;
    else if (ctx.hardware_suspected) prof.hardware += 1;
    else if (ctx.cell_outage) prof['mass-event'] += 1;
    else if ((c.tasks?.[0]?.steps?.length || 0) >= 6) prof.restart += 1;
    else prof.transient += 1;
  }
  return prof;
}

function card(title, body) {
  return el('div', { class: 'card', style: 'margin-bottom:12px' }, [el('h3', {}, [title]), el('p', { html: body }, [])]);
}

function renderStage() {
  const stage = stageSel.value;
  left.replaceChildren();
  right.replaceChildren();

  if (stage === 'observe') {
    left.append(card('What observation sees', 'Task-level work context across the network assurance platform, KPI analytics, the element manager and the field-service system: including the UI-driven steps that never appear in API logs. The capture surface is declared; personal content is excluded at source; the work is modelled, not the person.'));
    const tbl = el('table', {}, [
      el('thead', {}, [el('tr', {}, [el('th', {}, ['Case']), el('th', {}, ['Steps']), el('th', {}, ['Actor roles']), el('th', {}, ['Cycle (min)'])])]),
      el('tbody', {}, corpus['ran-anomaly-cases'].slice(0, 12).map((c) => el('tr', {}, [
        el('td', {}, [c.case_id]),
        el('td', {}, [String(c.tasks?.[0]?.steps?.length || 0)]),
        el('td', {}, [String(c.actor_roles?.length || 0)]),
        el('td', {}, [String(c.outcome?.cycle_time ?? '')]),
      ]))),
    ]);
    right.append(el('h4', {}, ['45 observed cases (12 shown)']), tbl,
      el('p', { style: 'color:var(--ink-soft); font-size:13.5px' }, ['The documented corridor holds for 23 of 45. The other 22 are the happy-path fallacy, stated as a number.']));
    return;
  }

  if (stage === 'model') {
    const prof = countProfiles(corpus['ran-anomaly-cases']);
    left.append(card('Case stitching', 'Events are stitched into end-to-end cases on the domain correlation key (anomaly-ticket:*). Origin is stitched from actor classes: this corpus models the human-operated era, so every case is human-origin, which is exactly what makes it a valid baseline.'));
    for (const [k, v] of Object.entries(prof)) {
      left.append(el('div', { class: 'kv' }, [el('b', {}, [k]), ` ${v} cases`]));
    }
    const dec = corpus['ran-anomaly-cases'].flatMap((c) => (c.tasks || []).flatMap((t) => (t.steps || []).flatMap((s) => s.decisions || [])));
    const byCond = {};
    for (const d of dec) byCond[d.branch_condition] = (byCond[d.branch_condition] || 0) + 1;
    right.append(el('h4', {}, ['Observed decision points'], ));
    for (const [cond, n] of Object.entries(byCond).sort((a, b) => b[1] - a[1])) {
      right.append(el('div', { class: 'kv' }, [el('b', {}, [cond]), ` observed in ${n} decision${n === 1 ? '' : 's'}`]));
    }
    right.append(el('p', { style: 'color:var(--ink-soft); font-size:13px' }, ['Where the SOP says a word like "severe", the observation supplies the number: severity 85, degradation 30 percent, persistence 45 minutes.']));
    return;
  }

  if (stage === 'compile') {
    left.append(card('What the compiler produced', `AP-RAN-014: ${aop.structure.variants.length} variants with observed frequencies, decision rules with thresholds and ratified status, the exception edge for the 45-minute persistence clock, and the rework loop with its observed bound. Every rule carries observed provenance.`));
    for (const v of aop.structure.variants) {
      left.append(el('div', { class: 'kv' }, [el('b', {}, [v.id]), ` frequency ${(v.frequency * 100).toFixed(0)}% — ${v.trigger}`]));
    }
    const rules = aop.structure.variants[0].decision_rules;
    const tbl = el('table', {}, [
      el('thead', {}, [el('tr', {}, [el('th', {}, ['Condition']), el('th', {}, ['Authority']), el('th', {}, ['Status'])])]),
      el('tbody', {}, rules.map((r) => el('tr', {}, [
        el('td', { style: 'font-family:var(--mono); font-size:12.5px' }, [r.if]),
        el('td', {}, [el('span', { class: `pill ${r.authority === 'autonomous' ? 'ok' : r.authority === 'approval-required' ? 'warn' : 'bad'}` }, [r.authority])]),
        el('td', {}, [el('span', { class: 'pill mono' }, [r.status || 'observed'])]),
      ]))),
    ]);
    right.append(el('h4', {}, ['The compiled decision rules']), tbl,
      el('p', { style: 'color:var(--ink-soft); font-size:13px' }, ['Prohibited rules need no ratification: they grant nothing. Authority-bearing rules must be ratified in the governance manifest.']));
    return;
  }

  // execute
  left.append(card('Governed execution', 'Each case is run against the compiled AOP inside the guardrail: variant matched on trusted facts only, authority decided per action, approvals routed with evidence bundles, prohibitions enforced, every disposition appended to the hash-chained case record.'));
  let executed = 0, approvals = 0, prohibited = 0, held = 0;
  for (const line of (window.__replayStats || [])) executed += 1;
  const perCase = [];
  for (const c of corpus['ran-anomaly-cases'].slice(0, 10)) {
    const ctx = c.context || {};
    const { variant } = guardrail.matchVariant(guardrail.decisionContext(ctx));
    let decisions = [];
    for (const action of (variant?.steps || [])) {
      let d = guardrail.authorise(variant, action, ctx);
      d = guardrail.irreversibilityVerdict(action, d);
      decisions.push(`${action}: ${d.decision}`);
      if (d.decision === DECISION.EXECUTE) executed += 1;
      else if (d.decision === DECISION.APPROVAL_REQUIRED) approvals += 1;
      else if (d.decision === DECISION.PROHIBIT) prohibited += 1;
    }
    perCase.push({ id: c.case_id, decisions });
  }
  right.append(el('h4', {}, ['Live decision replay (10 cases, the real engine)']));
  for (const pc of perCase) {
    const box = el('div', { class: 'card', style: 'margin-bottom:10px' }, [el('h3', {}, [pc.id])]);
    box.append(el('ul', { class: 'diags' }, pc.decisions.map((d) => el('li', { class: 'info' }, [d]))));
    right.append(box);
  }
  right.append(el('p', { style: 'color:var(--ink-soft); font-size:13px' },
    [`Executed ${executed}, approval-gated ${approvals}, prohibited ${prohibited} across the sample. In the full exemplar: 245 actions, 10 approvals, 20 prohibitions, complete hash-chained records.`]));
  void held;
}

stageSel.addEventListener('change', renderStage);

(async () => {
  corpus = await loadData('corpus.json');
  const compiled = await loadData('compiled.json');
  aop = (compiled.find((c) => c.name === 'AP-RAN-014') || compiled[0]).json;
  guardrail = new Guardrail(aop);
  renderStage();
})();
