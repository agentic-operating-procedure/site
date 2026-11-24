#!/usr/bin/env python3
"""Rebuild the link references of a CHANGELOG from the release sections it actually has.
Normalises 'v'-prefixed headings and refs to the bare form. Use once per broken repo."""
import re, sys
from pathlib import Path

def relink(repo):
    p = Path(repo, 'CHANGELOG.md'); s = p.read_text()
    s = re.sub(r'^## \[v(\d+\.\d+\.\d+)\]', r'## [\1]', s, flags=re.M)
    heads = re.findall(r'^## \[(Unreleased|\d+\.\d+\.\d+)\]', s, re.M)
    rel = [h for h in heads if h != 'Unreleased']
    key = lambda v: tuple(int(x) for x in v.split('.'))
    order = sorted(rel, key=key)                           # ascending, for chaining
    body = re.sub(r'^\[(Unreleased|v?[0-9]+\.\d+\.\d+)\]:.*\n', '', s, flags=re.M).rstrip('\n') + '\n\n'
    slug = Path(repo).name
    refs = []
    for i, v in enumerate(order):
        if i == 0:
            refs.append('[%s]: https://github.com/agentic-operating-procedure/%s/releases/tag/v%s' % (v, slug, v))
        else:
            refs.append('[%s]: https://github.com/agentic-operating-procedure/%s/compare/v%s...v%s' % (v, slug, order[i-1], v))
    if rel:
        refs.append('[Unreleased]: https://github.com/agentic-operating-procedure/%s/compare/v%s...HEAD' % (slug, order[-1]))
    p.write_text(body + '\n'.join(refs) + '\n')

for r in sys.argv[1:]:
    relink(r)
