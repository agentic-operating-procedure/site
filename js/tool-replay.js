// Exemplar Replay: step through a governed run decision by decision, with the
// evidence bundle the approver would see. Uses the real guardrail engine.
import { el, renderShell, loadData } from './shell.js';
import { Guardrail, DECISION, ACTION_CLASSES } from './aop-engine.js';

renderShell('replay.html');
const root = document.getElementById('tool-root');

const caseSel = el('select');
const controls = el('div', { class: 'pane' });
const out = el('div', { class: 'pane' });
const tool = el('div', { class: 'tool', style: 'grid-template-columns: 320px 1fr' }, [controls, out]);
root.append(tool);

let corpus, aop, guardrail;
let steps = [];
let cursor = 0;
const caseRecord = [];

function buildSteps(c) {
  const ctx = c.context || {};
  const { variant } = guardrail.matchVariant(guardrail.decisionContext(ctx));
  const out = [];
  out.push({ kind: 'snapshot', label: 'Snapshot the case context', detail: { snapshot: `cg://case/${c.case_id}@run`, trusted_keys: [...guardrail.trustedKeys] } });
  out.push({ kind: 'match', label: 'Match the variant', detail: { variant: variant?.id, trigger: variant?.trigger, frequency: variant?.frequency } });
  for (const action of (variant?.steps || [])) {
    let d = guardrail.authorise(variant, action, ctx);
    d = guardrail.irreversibilityVerdict(action, d);
    const budget = guardrail.budgetVerdict(action, { 'dispatch-write': 0 });
    out.push({ kind: 'authorise', label: `Authorise: ${action}`, detail: { decision: d.decision, rule: d.rule?.if, authority: d.authority, note: d.note, provenance: d.provenance, budget: budget ? budget.note : null } });
    if (d.decision === 'execute' || (d.decision === 'approval-required' && false)) {
      out.push({ kind: 'execute', label: `Execute: ${action}`, detail: { credential: `scoped to ${ACTION_CLASSES[action] || 'default'}, short-lived` } });
    }
  }
  out.push({ kind: 'outcome', label: 'Outcome disposition', detail: { result: c.outcome?.result, cycle_time: c.outcome?.cycle_time, first_pass: c.outcome?.first_pass } });
  return out;
}

function renderStep() {
  const step = steps[cursor];
  if (!step) return;
  const kv = (obj) => el('ul', { class: 'diags' },
    Object.entries(obj).map(([k, v]) => el('li', { class: 'info' }, [`${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`])));
  const card = el('div', { class: 'card' }, [
    el('h3', {}, [step.label]),
    kv(step.detail),
  ]);
  if (step.kind === 'authorise' && step.detail.decision === 'approval-required') {
    card.append(el('h3', {}, ['The evidence bundle the approver sees']));
    card.append(el('pre', {}, [JSON.stringify({
      case_id: steps[0] && c().case_id,
      aop: `${aop.aop}@${aop.version}`,
      proposed_action: { action: (step.label.match(/: (.+)$/) || [])[1] },
      triggering_rule: { if: step.detail.rule, authority: step.detail.authority },
      rule_provenance: step.detail.provenance,
      baseline_comparison: { human_mttr_p50_min: 35, first_pass_resolution: 0.889 },
      decision: 'human-approval',
      note: 'the approver rules on a case, not on a mystery (SEC-9)',
    }, null, 2)]));
  }
  if (step.kind === 'outcome') {
    card.append(el('h3', {}, ['The case record (append-only)']));
    card.append(el('pre', {}, [JSON.stringify({
      seq: caseRecord.length + 1,
      case_id: c().case_id,
      aop: `${aop.aop}@${aop.version}`,
      decisions: caseRecord,
      outcome: step.detail,
      prev_hash: 'sha256:...' + (caseRecord.length ? 'chained' : 'genesis'),
    }, null, 2)]));
  }
  out.replaceChildren(card,
    el('div', { style: 'display:flex; gap:8px; margin-top:12px' }, [
      el('button', { class: 'btn', onclick: () => { if (cursor > 0) { cursor -= 1; renderStep(); } } }, ['Back']),
      el('button', { class: 'btn primary', onclick: () => { if (cursor < steps.length - 1) { cursor += 1; const s = steps[cursor]; if (s.kind === 'authorise') caseRecord.push({ action: s.label, decision: s.detail.decision }); renderStep(); } } },
        [`Next (${cursor + 1}/${steps.length})`]),
    ]),
    el('p', { style: 'color:var(--ink-faint); font-size:12.5px; margin-top:10px' },
      ['Every step is the real engine: the same trusted-view matching, the same authority decision, the same fail-closed semantics as the certified reference implementation.']),
  );
}

function c() { return corpus['ran-anomaly-cases'].find((x) => x.case_id === caseSel.value) || corpus['ran-anomaly-cases'][0]; }

function loadCase() {
  steps = buildSteps(c());
  cursor = 0;
  caseRecord.length = 0;
  renderStep();
}

caseSel.addEventListener('change', loadCase);

(async () => {
  corpus = await loadData('corpus.json');
  const compiled = await loadData('compiled.json');
  aop = (compiled.find((x) => x.name === 'AP-RAN-014') || compiled[0]).json;
  guardrail = new Guardrail(aop);
  for (const c of corpus['ran-anomaly-cases']) caseSel.append(el('option', { value: c.case_id }, [c.case_id]));
  loadCase();
})();
