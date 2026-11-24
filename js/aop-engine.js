/* aop-engine.js — the browser port of the estate's normative checks.
 *
 * Two engines, ported 1:1 from the Python reference implementations in
 * aop-spec/validation/validate.py and aop-reference-harness/aop_harness/:
 *
 *   AOPValidator  — schema subset + normative semantic checks (CC clauses)
 *   Guardrail     — trusted-view matching, authority decision, budgets,
 *                   irreversibility, parameter schemas, action digests
 *
 * Parity contract: both engines must return the same verdict on every fixture
 * in data/fixtures.json as the Python originals. The parity harness in
 * tools/parity.mjs fails the build on any divergence.
 */

/* ---------------------------------------------------------------- schemas */

export function resolveRef(root, ref) {
  if (!ref.startsWith('#/')) throw new Error('only local $ref supported: ' + ref);
  let node = root;
  for (const part of ref.slice(2).split('/')) node = node[part];
  return node;
}

function typeOk(value, t) {
  switch (t) {
    case 'object': return value !== null && typeof value === 'object' && !Array.isArray(value);
    case 'array': return Array.isArray(value);
    case 'string': return typeof value === 'string';
    case 'integer': return typeof value === 'number' && Number.isInteger(value);
    case 'number': return typeof value === 'number' && !Number.isNaN(value);
    case 'boolean': return typeof value === 'boolean';
    case 'null': return value === null;
    default: return true;
  }
}

/** Validate `instance` against one schema node. Collects diagnostics. */
export function validateNode(instance, schema, root, path, diags) {
  if (schema.$ref) {
    validateNode(instance, resolveRef(root, schema.$ref), root, path, diags);
    return;
  }
  if (schema.type) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    if (!types.some((t) => typeOk(instance, t))) {
      diags.push(`${path || '$'}: expected type ${schema.type}, got ${instance === null ? 'null' : typeof instance}${Array.isArray(instance) ? ' array' : ''}`);
      return;
    }
  }
  if ('enum' in schema && !schema.enum.includes(instance)) {
    diags.push(`${path || '$'}: value ${JSON.stringify(instance)} is not one of ${JSON.stringify(schema.enum)}`);
  }
  if ('const' in schema && instance !== schema.const) {
    diags.push(`${path || '$'}: value ${JSON.stringify(instance)} does not equal the required constant ${JSON.stringify(schema.const)}`);
  }
  if (typeof instance === 'string') {
    if (schema.pattern && !new RegExp(schema.pattern).test(instance)) {
      diags.push(`${path || '$'}: value ${JSON.stringify(instance)} does not match pattern ${JSON.stringify(schema.pattern)}`);
    }
    if ('minLength' in schema && instance.length < schema.minLength) {
      diags.push(`${path || '$'}: string shorter than minLength ${schema.minLength}`);
    }
  }
  if (typeof instance === 'number' && !Array.isArray(instance)) {
    if ('minimum' in schema && instance < schema.minimum) diags.push(`${path || '$'}: value ${instance} below minimum ${schema.minimum}`);
    if ('maximum' in schema && instance > schema.maximum) diags.push(`${path || '$'}: value ${instance} above maximum ${schema.maximum}`);
  }
  if (instance !== null && typeof instance === 'object' && !Array.isArray(instance)) {
    for (const key of schema.required || []) {
      if (!(key in instance)) diags.push(`${path || '$'}: missing required member '${key}'`);
    }
    const props = schema.properties || {};
    if (schema.additionalProperties === false) {
      for (const key of Object.keys(instance)) {
        if (!(key in props)) diags.push(`${path || '$'}: member '${key}' is not an allowed property`);
      }
    }
    for (const [key, sub] of Object.entries(props)) {
      if (key in instance) validateNode(instance[key], sub, root, path ? `${path}/${key}` : key, diags);
    }
  }
  if (Array.isArray(instance)) {
    if ('minItems' in schema && instance.length < schema.minItems) diags.push(`${path || '$'}: array has fewer than ${schema.minItems} items`);
    if ('maxItems' in schema && instance.length > schema.maxItems) diags.push(`${path || '$'}: array has more than ${schema.maxItems} items`);
    if (schema.items) instance.forEach((item, i) => validateNode(item, schema.items, root, `${path}[${i}]`, diags));
  }
}

/* ------------------------------------------------- normative semantic checks */

const CASE_FIELDS = ['inputs', 'context snapshot', 'rule', 'provenance', 'decision', 'approver', 'outcome'];
const THRESHOLD_RE = /([a-z_]+)\s*(>=|<=|>|<|==|!=)\s*([0-9]+(?:\.[0-9]+)?)/;

/** The normative checks the schema subset cannot express (CC clauses). */
export function normativeChecks(doc, diags) {
  const structure = doc.structure || {};
  const variants = structure.variants || [];

  const total = variants.reduce((a, v) => a + (v.frequency || 0), 0);
  if (total > 1.0) diags.push(`$: variant frequencies sum to ${total}, above the 1.0 ceiling (NM-STR-3)`);

  const permitted = (doc.constraints || {}).permitted_actions || [];
  const authority = doc.authority || {};
  const hasDefault = 'default_authority_class' in authority;
  const thens = variants.map((v) => (v.decision_rules || []).map((r) => r.then || '').join(' ')).join(' ');
  const scoped = new Set();
  variants.forEach((v) => (v.decision_rules || []).forEach((r) => (r.applies_to || []).forEach((a) => scoped.add(a))));
  for (const action of permitted) {
    if (!thens.toLowerCase().includes(action.toLowerCase()) && !scoped.has(action) && !hasDefault) {
      diags.push(`$: permitted action '${action}' is covered by neither a decision rule nor a declared default authority class (NM-AUT-3, CC-7)`);
    }
  }

  (structure.exception_edges || []).forEach((edge, i) => {
    if (edge.behaviour === 'escalate' && !edge.target_role) {
      diags.push(`$: exception edge ${i} escalates without a target role (NM-STR-6)`);
    }
  });

  const fields = ((doc.assurance || {}).case_record || {}).fields || [];
  if (fields.length) {
    const missing = CASE_FIELDS.filter((f) => !fields.some((field) => field.toLowerCase().includes(f)));
    if (missing.length) diags.push(`$: case record fields missing mandatory members: ${missing.join(', ')} (NM-ASR-1)`);
  }

  const alignment = doc.process_alignment;
  if (alignment) {
    if (!alignment.process_ref && !alignment.process_gap) {
      diags.push('$: process alignment carries neither a process_ref nor a process_gap (NM-INT-4, CG-PA-5)');
    }
    (alignment.metric_refs || []).forEach((binding, i) => {
      if (!binding.metric_ref && !binding.gap) {
        diags.push(`$: metric binding ${i} carries neither a metric_ref nor a gap (NM-INT-5)`);
      }
    });
  }

  // NM-CTX-5 / NM-STR-16 / CC-24: authority must rest on attested facts only.
  const untrusted = new Set();
  for (const el of ((doc.context || {}).elements || [])) {
    if (el.trust_class === 'model-asserted' || el.trust_class === 'untrusted-content') {
      const name = (el.key || el.name || '').toLowerCase();
      untrusted.add(name);
      untrusted.add(name.replace(/-/g, '_'));
    }
  }
  if (untrusted.size) {
    const lc = (x) => (x || '').toLowerCase();
    for (const v of variants) {
      if ([...untrusted].some((k) => lc(v.trigger).includes(k))) {
        diags.push(`$: variant ${v.id} trigger depends on a non-attested fact (NM-STR-16, CC-24)`);
      }
      for (const rule of v.decision_rules || []) {
        if (['autonomous', 'approval-required'].includes(rule.authority) && [...untrusted].some((k) => lc(rule.if).includes(k))) {
          diags.push(`$: rule ${JSON.stringify(rule.if)} grounds authority in a non-attested fact (NM-STR-16, CC-24)`);
        }
      }
    }
  }

  // NM-AUT-7 / CC-21: only ratified rules grant authority.
  for (const v of variants) {
    for (const rule of v.decision_rules || []) {
      if (['autonomous', 'approval-required'].includes(rule.authority) && rule.status !== 'ratified') {
        diags.push(`$: rule ${JSON.stringify(rule.if)} grants authority without ratified status (NM-AUT-7, CC-21)`);
      }
    }
  }

  // NM-STR-18 / CC-22: support floor.
  const floor = authority.minimum_support;
  if (floor != null) {
    for (const v of variants) {
      const cases = ((v.provenance || {}).observed_cases) || 0;
      if (cases < floor) {
        diags.push(`$: variant ${v.id} observed in ${cases} cases, below the declared support floor ${floor} (NM-STR-18, CC-22)`);
      }
    }
  }

  // NM-GOV-1 / CC-23: accountability.
  const gov = doc.governance || {};
  if (!gov.accountable_owner) diags.push('$: governance block does not name an accountable owner (NM-GOV-1)');
  if (gov.prepared_by && gov.ratified_by && gov.prepared_by === gov.ratified_by) {
    diags.push('$: ratifier and preparer are the same (CC-23)');
  }

  // NM-AUT-8 / CC-25: reversibility classes.
  const rev = {};
  for (const r of authority.reversibility_classes || []) rev[r.action] = r;
  const defaultClass = authority.default_authority_class || 'prohibited';
  for (const [action, rc] of Object.entries(rev)) {
    if (rc.class === 'compensable' && !rc.compensation_path) {
      diags.push(`$: compensable action '${action}' does not declare its compensation path (NM-AUT-8)`);
    }
    if (rc.class === 'irreversible') {
      let covered = false;
      for (const v of variants) {
        for (const rule of v.decision_rules || []) {
          if ((rule.applies_to || []).includes(action)) {
            covered = true;
            if (rule.authority === 'autonomous') {
              diags.push(`$: irreversible action '${action}' carries an autonomous rule (NM-AUT-8, CC-25)`);
            }
          }
        }
      }
      if (!covered && defaultClass === 'autonomous') {
        diags.push(`$: irreversible action '${action}' falls through to the autonomous default class (NM-AUT-8, CC-25)`);
      }
    }
  }

  // RA-20 / CC-29: parameter schemas declare bounds.
  for (const asch of ((doc.constraints || {}).action_schemas || [])) {
    for (const field of asch.required_fields || []) {
      if (!(['minimum', 'maximum', 'allowed_values', 'target_scope'].some((k) => k in field))) {
        diags.push(`$: parameter field '${field.name}' of action '${asch.action}' declares neither bounds nor allowed values (RA-20, CC-29)`);
      }
    }
  }
}

/** Full document validation: schema subset + normative checks. */
export function validateAOP(doc, schema) {
  const diags = [];
  validateNode(doc, schema, schema, '', diags);
  if (diags.length === 0) normativeChecks(doc, diags);
  return { conformant: diags.length === 0, diagnostics: diags };
}

/* ----------------------------------------------------- the safe condition evaluator */

class ConditionError extends Error {}

const BIN = {
  '+': (a, b) => a + b, '-': (a, b) => a - b, '*': (a, b) => a * b, '/': (a, b) => a / b, '%': (a, b) => a % b,
};
const CMP = {
  '==': (a, b) => a === b, '!=': (a, b) => a !== b, '>': (a, b) => a > b,
  '>=': (a, b) => a >= b, '<': (a, b) => a < b, '<=': (a, b) => a <= b,
};

/**
 * Evaluate an AOP condition over a context with the same fail-closed
 * semantics as the Python allowlist interpreter: unknown names throw
 * ConditionError (unknown != false), and only the constructs below are legal.
 */
export function evaluateCondition(condition, context) {
  if (condition == null || !condition.trim() || condition.trim().toLowerCase() === 'true') return true;
  const src = condition.trim();
  let i = 0;
  const peek = () => src[i];
  const skipWs = () => { while (i < src.length && /\s/.test(src[i])) i++; };

  function parseExpr() {
    let left = parseAnd();
    skipWs();
    while (peek() === '|' && src[i + 1] === '|') {
      i += 2; const right = parseAnd(); left = left || right; skipWs();
    }
    return left;
  }
  function parseAnd() {
    let left = parseCmp();
    skipWs();
    while (src.startsWith('&&', i) || /\band\b/.test(src.slice(i, i + 5)) && !/\w/.test(src[i + 5] || '')) {
      i += src.startsWith('&&', i) ? 2 : 5;
      const right = parseCmp(); left = left && right; skipWs();
    }
    return left;
  }
  function parseCmp() {
    let left = parseAdd();
    skipWs();
    const two = src.slice(i, i + 2);
    const one = src[i];
    if (CMP[two]) { i += 2; const right = parseAdd(); return CMP[two](left, right); }
    if (CMP[one]) { i += 1; const right = parseAdd(); return CMP[one](left, right); }
    return left;
  }
  function parseAdd() {
    let left = parseMul();
    skipWs();
    while ('+-'.includes(peek())) {
      const op = src[i++]; const right = parseMul(); left = BIN[op](left, right); skipWs();
    }
    return left;
  }
  function parseMul() {
    let left = parseUnary();
    skipWs();
    while ('*/%'.includes(peek())) {
      const op = src[i++]; const right = parseUnary(); left = BIN[op](left, right); skipWs();
    }
    return left;
  }
  function parseUnary() {
    skipWs();
    if (peek() === '!') { i += 1; return !parseUnary(); }
    if (src.startsWith('not ', i)) { i += 4; return !parseUnary(); }
    if (peek() === '-') { i += 1; return -parseUnary(); }
    return parseAtom();
  }
  function parseAtom() {
    skipWs();
    const c = peek();
    if (c === '(') {
      i += 1; const v = parseExpr(); skipWs();
      if (peek() === ')') i += 1; else throw new ConditionError('unbalanced parenthesis');
      return v;
    }
    const strM = /^'([^']*)'|^"([^"]*)"/.exec(src.slice(i));
    if (strM) { i += strM[0].length; return strM[1] ?? strM[2]; }
    const numM = /^\d+(\.\d+)?/.exec(src.slice(i));
    if (numM) { i += numM[0].length; return parseFloat(numM[0]); }
    const boolM = /^(true|True|false|False|none|None)\b/.exec(src.slice(i));
    if (boolM) {
      i += boolM[0].length;
      const t = boolM[0].toLowerCase();
      return t === 'true' ? true : t === 'false' ? false : null;
    }
    const nameM = /^[A-Za-z_][A-Za-z0-9_.]*/.exec(src.slice(i));
    if (nameM) {
      i += nameM[0].length;
      const name = nameM[0];
      if (name in context) return context[name];
      throw new ConditionError(`unknown name '${name}' in condition`);
    }
    throw new ConditionError(`unexpected character '${c}' in condition`);
  }

  const value = parseExpr();
  skipWs();
  if (i < src.length) throw new ConditionError(`trailing input at position ${i}`);
  return value;
}

export function isEvaluable(condition, context) {
  try { evaluateCondition(condition, context); return true; } catch { return false; }
}

/* ------------------------------------------------------------- the guardrail */

export const DECISION = { EXECUTE: 'execute', APPROVAL_REQUIRED: 'approval-required', ESCALATE: 'escalate', PROHIBIT: 'prohibit' };

export class Guardrail {
  constructor(aop) {
    this.aop = aop;
    const constraints = aop.constraints || {};
    this.permitted = new Set(constraints.permitted_actions || []);
    this.prohibited = new Set(constraints.prohibited_actions || []);
    const authority = aop.authority || {};
    this.defaultClass = authority.default_authority_class || 'prohibited';
    this.actionSchemas = {};
    for (const a of constraints.action_schemas || []) this.actionSchemas[a.action] = a;
    this.reversibility = {};
    for (const r of authority.reversibility_classes || []) this.reversibility[r.action] = r;
    this.aggregateLimits = {};
    for (const l of ((aop.coordination || {}).aggregate_limits || [])) this.aggregateLimits[l.action_class] = l;
    // NM-STR-16: the trusted decision view.
    this.trustedKeys = new Set();
    for (const el of ((aop.context || {}).elements || [])) {
      if (el.trust_class === 'system-attested' || el.trust_class === 'derived') {
        const key = (el.key || el.name || '').toLowerCase();
        this.trustedKeys.add(key);
        this.trustedKeys.add(key.replace(/-/g, '_'));
      }
    }
    this.validateClosure();
  }

  validateClosure() {
    for (const a of this.prohibited) {
      if (this.permitted.has(a)) throw new Error('AOP governance error: an action is both permitted and prohibited');
    }
    if (!['autonomous', 'approval-required', 'prohibited'].includes(this.defaultClass)) {
      throw new Error('AOP governance error: unknown default authority class');
    }
  }

  decisionContext(context) {
    const view = {};
    for (const [k, v] of Object.entries(context || {})) {
      if (this.trustedKeys.has(k)) view[k] = v;
    }
    return view;
  }

  matchVariant(context) {
    const view = this.decisionContext(context);
    let fallback = null;
    for (const variant of ((this.aop.structure || {}).variants || [])) {
      try {
        if (evaluateCondition(variant.trigger || '', view)) return { variant, note: `matched trigger '${variant.trigger}'` };
      } catch (e) {
        if (fallback === null) fallback = variant;
      }
    }
    if (fallback !== null) return { variant: fallback, note: 'fallback to declared residual variant' };
    return { variant: null, note: 'no variant matched' };
  }

  authorise(variant, action, context) {
    const view = this.decisionContext(context);
    if (this.prohibited.has(action)) {
      return { decision: DECISION.PROHIBIT, authority: 'prohibited', rule: { if: 'action in prohibited_actions', then: 'prohibit' }, provenance: null, note: 'prohibited action' };
    }
    if (this.permitted.size && !this.permitted.has(action)) {
      return { decision: DECISION.ESCALATE, authority: 'unknown', rule: { if: 'action not in permitted_actions', then: 'escalate to named human decision' }, provenance: null, note: 'action is outside the permitted set (NM-CON-1)' };
    }
    if (variant) {
      for (const rule of variant.decision_rules || []) {
        if (rule.applies_to && !rule.applies_to.includes(action)) continue;
        try {
          if (evaluateCondition(rule.if || '', view)) return this.fromRule(rule, action);
        } catch { /* unknown condition: keep searching */ }
      }
    }
    if (this.defaultClass === 'prohibited') {
      return { decision: DECISION.ESCALATE, authority: 'unknown', rule: null, provenance: null, note: 'no decision rule matched and the default class is prohibited (NM-AUT-3)' };
    }
    return {
      decision: this.defaultClass === 'approval-required' ? DECISION.APPROVAL_REQUIRED : DECISION.EXECUTE,
      authority: this.defaultClass,
      rule: { if: 'default_authority_class', then: this.defaultClass },
      provenance: null, note: 'default authority class applied (NM-AUT-3)',
    };
  }

  fromRule(rule, action) {
    if (rule.applies_to && !rule.applies_to.includes(action)) {
      throw new ConditionError('rule does not apply to this action');
    }
    const authority = rule.authority || 'prohibited';
    const decision = authority === 'autonomous' ? DECISION.EXECUTE
      : authority === 'approval-required' ? DECISION.APPROVAL_REQUIRED
      : DECISION.PROHIBIT;
    return { decision, authority, rule, provenance: rule.provenance || null, note: `matched rule '${rule.if}'` };
  }

  /** NM-AUT-8: an irreversible action's autonomous verdict is raised to approval. */
  irreversibilityVerdict(action, decision) {
    const rc = this.reversibility[action];
    if (rc && rc.class === 'irreversible' && decision.decision === DECISION.EXECUTE) {
      return { ...decision, decision: DECISION.APPROVAL_REQUIRED, note: 'irreversible action raised to approval-required (NM-AUT-8)' };
    }
    return decision;
  }

  /** NM-CRD-4: budget verdict beside the authority check. */
  budgetVerdict(action, usage) {
    const actionClass = ACTION_CLASSES[action] || 'default';
    const limit = this.aggregateLimits[action_class];
    if (!limit) return null;
    const used = usage[action_class] || 0;
    if (limit.max_per_case != null && used >= limit.max_per_case) {
      return { decision: DECISION.ESCALATE, authority: 'budget', rule: { if: `aggregate limit for ${action_class}`, then: 'escalate: budget exhausted' }, provenance: null, note: `aggregate limit reached for ${action_class}` };
    }
    return null;
  }

  /** RA-21: validate the canonical payload against the declared schema. */
  parameterVerdict(action, params) {
    const schema = this.actionSchemas[action];
    if (!schema) return null;
    const declared = {};
    for (const f of schema.required_fields || []) declared[f.name] = f;
    for (const [name, value] of Object.entries(params || {})) {
      const spec = declared[name];
      if (!spec) return this.paramFail(action, `unknown field '${name}' (RA-22)`);
      if (spec.type === 'integer' && !Number.isInteger(value)) return this.paramFail(action, `field '${name}' must be an integer`);
      if (spec.type === 'number' && typeof value !== 'number') return this.paramFail(action, `field '${name}' must be a number`);
      if (spec.type === 'string' && typeof value !== 'string') return this.paramFail(action, `field '${name}' must be a string`);
      if (spec.type === 'boolean' && typeof value !== 'boolean') return this.paramFail(action, `field '${name}' must be a boolean`);
      if ('minimum' in spec && value < spec.minimum) return this.paramFail(action, `field '${name}' below the declared minimum`);
      if ('maximum' in spec && value > spec.maximum) return this.paramFail(action, `field '${name}' above the declared maximum (RA-22)`);
      if ('allowed_values' in spec && !spec.allowed_values.includes(value)) return this.paramFail(action, `field '${name}' outside the allowed values`);
    }
    for (const name of Object.keys(declared)) {
      if (!(name in (params || {}))) return this.paramFail(action, `required field '${name}' missing from the payload (RA-22)`);
    }
    for (const banned of schema.prohibited_values || []) {
      if (Object.values(params || {}).includes(banned)) return this.paramFail(action, 'prohibited value present in the payload');
    }
    return null;
  }

  paramFail(action, note) {
    return { decision: DECISION.ESCALATE, authority: 'parameter-schema', rule: { if: `parameter schema of ${action}`, then: 'fail closed on payload violation' }, provenance: null, note };
  }

  /** RA-5: the canonical action digest. */
  static actionDigest(action, target, parameters) {
    const canonical = JSON.stringify({ action, target: target ?? null, parameters: parameters || {} }, Object.keys({ action, target: target ?? null, ...(parameters || {}) }).sort().length ? ['action', 'target', ...Object.keys(parameters || {}).sort()] : undefined);
    // Stable canonical form: sort_keys on {action, target, parameters}.
    const stable = JSON.stringify({ action, target: target ?? null, parameters: parameters || {} }, (k, v) => (v && typeof v === 'object' && !Array.isArray(v) ? Object.keys(v).sort().reduce((o, kk) => ((o[kk] = v[kk]), o), {}) : v));
    void canonical;
    return 'sha256:' + sha256Hex(stable);
  }
}

/* ------------------------------------------------------------------ sha256 */

export async function sha256Hex(text) {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/* ------------------------------------------------------------ action classes */

export const ACTION_CLASSES = {
  'correlate-alarms': 'monitoring-read',
  'loopback-test': 'line-test-execute',
  'resolve-fault': 'monitoring-read',
  'dispatch-field-crew': 'dispatch-write',
  'notify-planning': 'planning-write',
  'reconcile-inventory': 'inventory-write',
  'validate-alarm': 'assurance-read',
  'classify-anomaly': 'assurance-read',
  'run-kpi-diagnostic': 'analytics-read',
  'restart-cell': 'element-restart',
  'notify-noc': 'noc-write',
  'escalate-anomaly': 'ticketing-write',
};
