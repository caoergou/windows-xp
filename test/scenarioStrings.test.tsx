/**
 * Scenario string tables (#207): the pure resolver, runtime beat-text resolution
 * by locale ("one graph, two skins"), and the validator's key checks.
 */
import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { resolveText, pickText, type ScenarioStrings } from '../src/scenario/strings';
import { validateScenario } from '../src/scenario/validate';
import type { Scenario } from '../src/scenario/types';
import type { XPHandle } from '../src/components/XPBridge';

const strings: ScenarioStrings = {
  zh: { greet: '你好', only_zh: '仅中文' },
  en: { greet: 'Hello' },
};

describe('resolveText / pickText', () => {
  it('resolves the active locale, falls back across tables, then to the key', () => {
    expect(resolveText(strings, 'zh', 'greet')).toBe('你好');
    expect(resolveText(strings, 'en', 'greet')).toBe('Hello');
    // Missing in en → falls back to any table that defines it.
    expect(resolveText(strings, 'en', 'only_zh')).toBe('仅中文');
    // Undefined everywhere → the key itself (visible, not blank).
    expect(resolveText(strings, 'en', 'nope')).toBe('nope');
    expect(resolveText(undefined, 'en', 'x')).toBe('x');
  });

  it('pickText prefers a key over a literal', () => {
    expect(pickText(strings, 'zh', 'literal', 'greet')).toBe('你好');
    expect(pickText(strings, 'zh', 'literal', undefined)).toBe('literal');
  });
});

describe('runtime beat text resolves by locale', () => {
  beforeEach(() => localStorage.clear());

  const scenario: Scenario = {
    id: 'strings-demo',
    strings: { zh: { t: '标题', b: '正文中文' }, en: { t: 'Title', b: 'English body' } },
    triggers: [{ on: 'session:boot-complete', do: [{ note: { id: 'n', titleKey: 't', contentKey: 'b' } }] }],
  };

  const mount = async (language: 'en' | 'zh') => {
    const { WindowsXP } = await import('../src/lib');
    const ref = React.createRef<XPHandle>();
    render(<WindowsXP ref={ref} autoLogin skipBoot language={language} scenario={scenario} />);
    await act(async () => { await Promise.resolve(); });
    return ref;
  };

  it('shows the Chinese body under zh', async () => {
    const ref = await mount('zh');
    act(() => ref.current!.emit({ type: 'session:boot-complete' }));
    await waitFor(() => expect(screen.getByText('正文中文')).toBeInTheDocument());
  });

  it('shows the English body under en', async () => {
    const ref = await mount('en');
    act(() => ref.current!.emit({ type: 'session:boot-complete' }));
    await waitFor(() => expect(screen.getByText('English body')).toBeInTheDocument());
  });
});

describe('validator string-key checks', () => {
  it('warns when a *Key references a missing string', () => {
    const r = validateScenario({
      id: 's',
      strings: { zh: { known: 'x' } },
      triggers: [{ on: 'cmd:exec', do: [{ notify: { titleKey: 'known', bodyKey: 'ghost' } }] }],
    });
    expect(r.errors).toEqual([]);
    expect(r.warnings.join('\n')).toContain('bodyKey');
    expect(r.warnings.join('\n')).toContain('ghost');
  });

  it('nudges once when a table exists but beat text is still inline', () => {
    const r = validateScenario({
      id: 's',
      strings: { zh: { a: 'x' } },
      triggers: [{ on: 'cmd:exec', do: [{ notify: { title: 'inline!', body: 'also inline' } }] }],
    });
    const nudges = r.warnings.filter(w => w.includes('still inline'));
    expect(nudges).toHaveLength(1); // one summary, not one per field
  });
});
