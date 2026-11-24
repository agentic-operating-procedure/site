// render-concepts.js
import { el, renderShell } from './shell.js';
renderShell('concepts.html');

const HIER = [
  ['1', 'Agentic Operating Engineering', 'The discipline'],
  ['2', 'Agentic Operating Procedure', 'The operational specification'],
  ['3', 'Agent Skill', 'The reusable capability'],
  ['4', 'Domain Agent Harness', 'The controlled execution environment'],
  ['5', 'Agent', 'The execution actor'],
  ['6', 'Agentic Operations', 'The broader operating mode'],
];
const hier = document.getElementById('hierarchy');
const tbl = el('table', {}, [
  el('thead', {}, [el('tr', {}, [el('th', {}, ['#']), el('th', {}, ['Concept']), el('th', {}, ['Architectural responsibility'])])]),
  el('tbody', {}, HIER.map(([n, c, r]) => el('tr', {}, [el('td', {}, [n]), el('td', {}, [el('b', {}, [c])]), el('td', {}, [r])]))),
]);
hier.append(tbl, el('p', { style: 'margin-top:10px; color: var(--ink-soft); font-size:14px' },
  ['Read top to bottom it is a discipline; read bottom to top it is a containment: the operating mode contains agents, agents run inside a harness, a harness is governed by an AOP, an AOP invokes skills.']));

const DIMS = [
  ['Intent', 'The operational objective and desired outcome, stated as a verifiable outcome condition with an explicit scope boundary.'],
  ['Context', 'The information and environmental state relevant to execution: sources, access rules, trust classes, snapshot semantics, minimisation.'],
  ['Constraints', 'Policies, boundaries and prohibited actions. The permitted set is explicit; everything unlisted is denied; fail closed on unknowns.'],
  ['Authority', 'Which decisions the agent may take alone, which require approval, and which are prohibited: a decision-rights ladder over five risk axes.'],
  ['Capabilities', 'The skills and tools available, each declaring what it does, needs, must not do, and how it reports. Skills carry no authority.'],
  ['Coordination', 'How agents, humans and external systems hand off, with payloads, acknowledgements, escalation routes and aggregate budgets.'],
  ['Control', 'Monitoring, validation, intervention, exception handling, and the drift obligation that triggers recalibration.'],
  ['Assurance', 'The evidence required: append-only tamper-evident case records, replay from the record alone, the human baseline, and no self-modification.'],
];
const dims = document.getElementById('dimensions');
for (const [name, desc] of DIMS) {
  dims.append(el('div', { class: 'card' }, [el('h3', {}, [name]), el('p', {}, [desc])]));
}

const TRUST = [
  ['Prevent', 'The agent cannot exceed its authority because the check is performed outside the model context. The agent proposes; the guardrail disposes. Structural, not behavioural.', 'primary'],
  ['Verify', 'Completed actions are independently checked against the intent the AOP recorded. Fails closed: known pattern within authority executes; unknown escalates. Uncertainty routes to a person, never a guess.', ''],
  ['Oversee', 'Escalations arrive as evidence bundles: the proposed action, the triggering rule with observed provenance, the baseline comparison, the case context. The approver rules on a case, not on a mystery.', ''],
  ['Audit', 'Every action appends to an append-only, tamper-evident case record. Every decision is replayable from the record alone. Routine sampling reviews provide assurance without a blanket throttle.', ''],
];
const trust = document.getElementById('trust');
for (const [name, desc, cls] of TRUST) {
  trust.append(el('div', { class: 'card' }, [el('h3', {}, [name, ' ', el('span', { class: `pill ${cls}` }, ['mechanism'])]), el('p', {}, [desc])]));
}
