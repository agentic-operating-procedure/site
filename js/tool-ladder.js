// Risk Ladder explorer: the five risk axes, the ladder, and how a decision's
// class is derived. Editable axis assessments; the minimum class updates live.
import { el, renderShell, loadData } from './shell.js';

renderShell('ladder.html');
const root = document.getElementById('tool-root');

const AXES = [
  ['risk', 'What is the worst credible harm of a wrong decision?', ['low', 'moderate', 'high']],
  ['reversibility', 'Can the decision be undone, and at what cost?', ['reversible', 'compensable', 'irreversible']],
  ['operational-impact', 'How many cases, systems and people does the decision touch?', ['single-case', 'family', 'estate-wide']],
  ['authority-threshold', 'Above what value, count or class must a human decide?', ['none', 'declared-threshold', 'always-human']],
  ['assurance-requirement', 'What evidence must exist after execution to establish correctness?', ['record-only', 'replay', 'adjudicated']],
];

const state = {};
const controls = el('div', { class: 'pane' });
const out = el('div', { class: 'pane' });

const MINIMUM = {
  'irreversible': 'approval-required',
  'always-human': 'approval-required',
  'estate-wide': 'approval-required',
  'adjudicated': 'approval-required',
};

function minimumClass() {
  // The ladder rule: an irreversible action, an always-human threshold, an
  // estate-wide impact, or adjudicated assurance each force approval-required
  // at minimum. Everything else may be autonomous under the ratified ladder.
  for (const [axis] of AXES) {
    const v = state[axis];
    if (MINIMUM[v]) return 'approval-required';
  }
  return 'autonomous';
}

function render() {
  const mc = minimumClass();
  out.replaceChildren(
    el('div', { class: `verdict ${mc === 'autonomous' ? 'pass' : 'warn'}` },
      [`MINIMUM AUTHORITY CLASS: ${mc.toUpperCase()}`]),
    el('p', { style: 'color:var(--ink-soft); font-size:14px' },
      ['The decision-rights ladder (NM-AUT-5, NM-AUT-6): the higher the position on any risk axis, the higher the minimum authority class. No rule may be more autonomous than its axes justify, and the guardrail enforces this at run time (NM-AUT-8: an irreversible action is never executed autonomously).']),
    el('h3', {}, ['What this means for the AOP document']),
    el('ul', { class: 'diags' }, [
      el('li', { class: mc === 'autonomous' ? 'info' : '' },
        mc === 'autonomous'
          ? 'This decision family may carry autonomous rules, subject to ratification on observed provenance (NM-AUT-7).'
          : `Rules for this family must carry status ratified AND authority ${mc}. Prohibited rules need no ratification: they grant nothing.`),
      el('li', { class: 'info' }, ['Delegated authority attenuates: any delegation link can only narrow (NM-AUT-9).']),
      el('li', { class: 'info' }, ['Operating modes (adoption) can always run this family more restrictively, never more permissively.']),
    ]),
  );
}

for (const [axis, question, options] of AXES) {
  state[axis] = options[0];
  const sel = el('select', { onchange: () => { state[axis] = sel.value; render(); } },
    options.map((o) => el('option', { value: o }, [o])));
  controls.append(
    el('label', {}, [axis]),
    el('p', { style: 'margin:0 0 6px; font-size:13px; color:var(--ink-soft)' }, [question]),
    sel,
  );
}

root.append(el('div', { class: 'tool' }, [controls, out]));
render();
