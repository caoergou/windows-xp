/**
 * Scenario validation (#208): malformed scenarios produce path-named errors;
 * likely mistakes (unknown event domain, dangling flag) produce warnings.
 */
import { describe, it, expect } from 'vitest';
import { validateScenario, assertValidScenario, ScenarioValidationError, SCENARIO_MAX_BYTES } from '../src/scenario/validate';

describe('validateScenario', () => {
  it('accepts a well-formed scenario', () => {
    const r = validateScenario({
      id: 's',
      initialFlags: { started: true },
      triggers: [{ on: 'cmd:exec', when: { flag: 'started' }, do: [{ setFlag: 'done' }] }],
    });
    expect(r.ok).toBe(true);
    expect(r.errors).toEqual([]);
  });

  it('flags a missing id and non-array triggers', () => {
    const r = validateScenario({ triggers: 'nope' });
    expect(r.ok).toBe(false);
    expect(r.errors.join('\n')).toContain('scenario.id');
    expect(r.errors.join('\n')).toContain('scenario.triggers');
  });

  it('names the path of a missing `on`', () => {
    const r = validateScenario({ id: 's', triggers: [{ do: [{ setFlag: 'x' }] }] });
    expect(r.errors.join('\n')).toContain('triggers[0].on');
  });

  it('rejects an unknown action key with its path', () => {
    const r = validateScenario({ id: 's', triggers: [{ on: 'cmd:exec', do: [{ setFlags: 'oops' }] }] });
    expect(r.ok).toBe(false);
    expect(r.errors.join('\n')).toContain('triggers[0].do[0]');
    expect(r.errors.join('\n')).toContain('unknown action');
  });

  it('checks action param shapes (setFlag needs a string)', () => {
    const r = validateScenario({ id: 's', triggers: [{ on: 'cmd:exec', do: [{ setFlag: 123 }] }] });
    expect(r.errors.join('\n')).toContain('triggers[0].do[0].setFlag');
  });

  it('recurses into after.do', () => {
    const r = validateScenario({
      id: 's',
      triggers: [{ on: 'cmd:exec', do: [{ after: { ms: 100, do: [{ nope: 1 }] } }] }],
    });
    expect(r.errors.join('\n')).toContain('triggers[0].do[0].after.do[0]');
  });

  it('rejects an unknown condition key', () => {
    const r = validateScenario({ id: 's', triggers: [{ on: 'cmd:exec', when: { flagg: 'x' }, do: [{ setFlag: 'y' }] }] });
    expect(r.errors.join('\n')).toContain('triggers[0].when');
  });

  it('warns on an unknown event domain (still parses)', () => {
    const r = validateScenario({ id: 's', triggers: [{ on: 'bogus:thing', do: [{ setFlag: 'y' }] }] });
    expect(r.errors).toEqual([]);
    expect(r.warnings.join('\n')).toContain('unknown event domain');
  });

  it('warns on a flag read but never set', () => {
    const r = validateScenario({ id: 's', triggers: [{ on: 'cmd:exec', when: { flag: 'ghost' }, do: [{ setFlag: 'y' }] }] });
    expect(r.warnings.join('\n')).toContain('"ghost"');
    expect(r.warnings.join('\n')).toContain('never set');
  });

  it('does not warn when the read flag is seeded in initialFlags', () => {
    const r = validateScenario({
      id: 's',
      initialFlags: { seeded: false },
      triggers: [{ on: 'cmd:exec', when: { flag: 'seeded' }, do: [{ setFlag: 'y' }] }],
    });
    expect(r.warnings).toEqual([]);
  });

  it('rejects an oversized scenario', () => {
    const big = { id: 's', triggers: [{ on: 'cmd:exec', do: [{ setFlag: 'x'.repeat(SCENARIO_MAX_BYTES + 1) }] }] };
    const r = validateScenario(big);
    expect(r.ok).toBe(false);
    expect(r.errors.join('\n')).toContain('too large');
  });

  it('assertValidScenario throws with all errors', () => {
    expect(() => assertValidScenario({ triggers: [] })).toThrow(ScenarioValidationError);
    expect(() => assertValidScenario({ id: 's', triggers: [] })).not.toThrow();
  });
});
