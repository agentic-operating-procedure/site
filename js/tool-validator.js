// Tool pages: validator wiring (validator.html)
import { el, renderShell } from './shell.js';
import { validateAOP } from './aop-engine.js';

renderShell('validator.html');
const root = document.getElementById('tool-root');

const pick = el('select');
const box = el('textarea', { spellcheck: 'false' });
const verdict = el('div', { class: 'verdict warn' }, ['Paste an AOP document or pick a fixture.']);
const diags = el('ul', { class: 'diags' });
const schemaInfo = el('p', { style: 'font-size:12.5px; color:var(--ink-faint)' });

const fixtures = {};
let schema = null;

function run() {
  let doc;
  try {
    doc = JSON.parse(box.value);
  } catch (e) {
    verdict.className = 'verdict warn';
    verdict.textContent = 'Not valid JSON yet: ' + e.message;
    diags.replaceChildren();
    return;
  }
  const r = validateAOP(doc, schema);
  verdict.className = `verdict ${r.conformant ? 'pass' : 'fail'}`;
  verdict.textContent = r.conformant
    ? 'CONFORMANT — the document satisfies the schema and every normative semantic check (CC clauses).'
    : `NONCONFORMANT — ${r.diagnostics.length} diagnostic${r.diagnostics.length === 1 ? '' : 's'}.`;
  diags.replaceChildren(...r.diagnostics.map((d) => el('li', {}, [d])));
  if (r.conformant) diags.prepend(el('li', { class: 'info' }, ['Every clause check passed: completeness, specificity, authority coverage, provenance, ratification, reversibility, parameters, accountability.']));
}

pick.addEventListener('change', () => {
  const key = pick.value;
  if (fixtures[key]) { box.value = JSON.stringify(fixtures[key], null, 2); run(); }
});
box.addEventListener('input', run);

root.append(
  el('div', { class: 'tool' }, [
    el('div', { class: 'pane' }, [
      el('h4', {}, ['The AOP document (JSON)']),
      pick,
      el('div', { style: 'height:10px' }),
      box,
    ]),
    el('div', { class: 'pane' }, [
      el('h4', {}, ['Verdict (the real engine, in your browser)']),
      verdict,
      diags,
      schemaInfo,
    ]),
  ]),
);

(async () => {
  schema = await (await fetch('data/aop-document.schema.json')).json();
  const fx = await (await fetch('data/fixtures.json')).json();
  for (const kind of ['valid', 'invalid', 'adversarial']) {
    for (const f of fx[kind] || []) {
      const key = `${kind}/${f.name}`;
      fixtures[key] = f.json;
      pick.append(el('option', {}, [`${kind === 'valid' ? 'VALID' : kind === 'invalid' ? 'MUST-FAIL' : 'ADVERSARIAL'} — ${f.name}`]));
    }
  }
  const first = fx.valid?.[0];
  if (first) { pick.value = `valid/${first.name}`; box.value = JSON.stringify(first.json, null, 2); }
  schemaInfo.textContent = `Schema: aop-document v${schema.$id ? '' : ''}with ${Object.keys(schema.properties || {}).length} top-level properties; the JS engine is parity-verified against the Python reference on all ${Object.values(fx).flat().length} fixtures.`;
  run();
})();
