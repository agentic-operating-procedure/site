#!/usr/bin/env python3
"""Sync the site's data from the live estate repositories.

Fetches the artefacts the interactive tools and content pages consume, from
the current main of each estate repository, and writes them into data/. The
site workflow runs this on a schedule, on any estate push (repository_dispatch),
and before every deploy, so the site always reflects main.

Artefacts pulled:
  aop-spec          schema/*.json, validation/fixtures/**, docs inventory
  aop-conformance   fixtures/**, coverage-map.json
  aop-examples      compiled/*.json, corpus/*.jsonl, manifests/*.json, reports/
  all repos         README version rows -> data/versions.json
  aop-governance    change-requests/ -> data/CR index (titles + states)
"""
from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path

SITE = Path(__file__).resolve().parent.parent
DATA = SITE / "data"
ORG = "agentic-operating-procedure"
REPOS = [".github", "aop-governance", "aop-foundations", "aop-landscape", "aop-spec",
         "aop-architecture", "aop-context-graph", "aop-toolkit", "aop-reference-harness",
         "aop-registry", "aop-conformance", "aop-evaluation", "aop-adoption", "aop-examples"]
WORK = Path("/tmp/aop-site-sync")

def sh(*cmd):
    return subprocess.run(cmd, capture_output=True, text=True)

def clone_or_update(repo):
    dest = WORK / repo
    if (dest / ".git").exists():
        sh("git", "-C", str(dest), "checkout", "-q", "main")
        r = sh("git", "-C", str(dest), "pull", "-q", "origin", "main")
        if r.returncode != 0:
            sh("git", "-C", str(dest), "reset", "-q", "--hard", "origin/main")
    else:
        dest.mkdir(parents=True, exist_ok=True)
        sh("git", "clone", "-q", "--depth", "1", f"https://github.com/{ORG}/{repo}.git", str(dest))
    return dest

def raw(repo, path):
    dest = WORK / repo / path
    return dest.read_text() if dest.exists() else None

def dump_jsonl(records):
    return "\n".join(json.dumps(r) for r in records)

def main():
    WORK.mkdir(exist_ok=True)
    DATA.mkdir(exist_ok=True)
    versions, failures = {}, []

    for repo in REPOS:
        dest = clone_or_update(repo)
        head = sh("git", "-C", str(dest), "rev-parse", "--short=7", "HEAD").stdout.strip()
        readme = raw(repo, "README.md") or ""
        m = re.search(r'^\|\s*Version\s*\|\s*(\S+)\s*\|', readme, re.M)
        versions[repo] = {"version": m.group(1) if m else "unversioned", "head": head,
                          "pushed": (sh("git", "-C", str(dest), "log", "-1", "--format=%cs", "HEAD").stdout.strip())}

    # specification schemas (consumed by the validator tool and the docs pages)
    for schema in ("aop-document", "agent-skill", "evidence-bundle"):
        text = raw("aop-spec", f"schema/{schema}.schema.json")
        if text:
            (DATA / f"{schema}.schema.json").write_text(text)
        else:
            failures.append(f"aop-spec schema/{schema}.schema.json")

    # validator fixtures: the parity test set and the adversarial suite
    fixtures = {}
    for repo in ("aop-spec", "aop-conformance"):
        root = WORK / repo
        base = root / "validation/fixtures" if repo == "aop-spec" else root / "fixtures"
        for kind in ("valid", "invalid", "adversarial"):
            d = base / kind
            if not d.exists():
                continue
            for f in sorted(d.glob("*.json")):
                fixtures.setdefault(kind, []).append(
                    {"name": f.stem, "from": repo, "json": json.loads(f.read_text())})
    (DATA / "fixtures.json").write_text(json.dumps(fixtures))

    # compiled exemplar AOPs + manifests
    compiled = []
    for f in sorted((WORK / "aop-examples" / "compiled").glob("*.json")):
        compiled.append({"name": f.stem, "json": json.loads(f.read_text())})
    (DATA / "compiled.json").write_text(json.dumps(compiled))
    for name in ("ran-anomaly", "ran-anomaly-dev-cohort"):
        t = raw("aop-examples", f"manifests/{name}.json")
        if t:
            (DATA / f"manifest-{name}.json").write_text(t)

    # the 5G corpus (full, dev, held-out) for the pipeline visualiser and replay
    corpus = {}
    for name in ("ran-anomaly-cases", "ran-dev-cases", "ran-heldout-cases"):
        t = raw("aop-examples", f"corpus/{name}.jsonl")
        if t:
            corpus[name] = [json.loads(l) for l in t.splitlines() if l.strip()]
    (DATA / "corpus.json").write_text(json.dumps(corpus))

    # coverage map
    t = raw("aop-conformance", "fixtures/coverage-map.json")
    if t:
        (DATA / "coverage-map.json").write_text(t)

    # the CR register rows for the governance page
    t = raw("aop-governance", "docs/cr-register.md")
    if t:
        (DATA / "cr-register.md").write_text(t)

    (DATA / "versions.json").write_text(json.dumps(versions, indent=2))

    if failures:
        print("SYNC INCOMPLETE, missing:", "; ".join(failures))
        return 1
    print("SYNC OK: %d repos, %d fixture groups, %d compiled AOPs, %d corpora"
          % (len(versions), len(fixtures), len(compiled), len(corpus)))
    return 0

if __name__ == "__main__":
    sys.exit(main())
