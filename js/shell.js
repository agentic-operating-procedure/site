// site shell: shared header/footer injection + active nav + data loading
export async function loadData(name) {
  const r = await fetch(`data/${name}`);
  if (!r.ok) throw new Error(`data/${name}: ${r.status}`);
  return r.json();
}

export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v);
  }
  for (const child of children) node.append(child);
  return node;
}

const NAV = [
  ['index.html', 'Home'],
  ['concepts.html', 'Concepts'],
  ['specification.html', 'Specification'],
  ['pipeline.html', 'Pipeline'],
  ['estate.html', 'Estate'],
  ['adoption.html', 'Adoption'],
  ['exemplar.html', '5G Exemplar'],
  ['playground.html', 'Guardrail Playground'],
  ['validator.html', 'AOP Validator'],
  ['visualizer.html', 'Pipeline Visualizer'],
  ['ladder.html', 'Risk Ladder'],
  ['replay.html', 'Exemplar Replay'],
  ['governance.html', 'Governance'],
];

export function renderShell(active) {
  const header = el('header', { class: 'site-header' }, [
    el('div', { class: 'inner' }, [
      el('a', { class: 'brand', href: 'index.html' }, [
        el('span', { class: 'mark' }, ['AOP']),
        'Agentic Operating Procedure',
      ]),
      el('nav', { class: 'top' }, NAV.map(([href, label]) =>
        el('a', { href, class: href === active ? 'active' : '' }, [label]))),
    ]),
  ]);
  const footer = el('footer', { class: 'site-footer' }, [
    el('div', { class: 'inner' }, [
      el('span', {}, ['© 2026 Agentic Operating Procedure. MIT licensed.']),
      el('span', {}, ['Auto-synced from the estate repositories on main.']),
      el('a', { href: 'https://github.com/agentic-operating-procedure', target: '_blank', rel: 'noopener' }, ['GitHub organisation']),
    ]),
  ]);
  document.body.prepend(header);
  document.body.append(footer);
}

// versions badge, used on several pages
export async function versionBadges(target) {
  try {
    const versions = await loadData('versions.json');
    const order = ['aop-spec', 'aop-reference-harness', 'aop-conformance', 'aop-evaluation', 'aop-examples'];
    for (const repo of order) {
      const v = versions[repo];
      target.append(el('span', { class: 'pill mono', title: `commit ${v.head}` }, [`${repo.replace('aop-', '')} v${v.version}`]));
    }
  } catch { /* data not present: render nothing */ }
}
