/**
 * defineApp() factory tests (#128).
 *
 * Covers defaults, restore derivation, dev-mode validation warnings, and — via
 * a compile-time @ts-expect-error — that a non-serializable restore prop is a
 * type error (the whole point of the JsonValue constraint).
 */
import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { defineApp, restoreApp } from '../src/registry/defineApp';

describe('defineApp (#128)', () => {
  it('applies defaults (icon, window size) and keeps overrides', () => {
    const entry = defineApp({ id: 'Hello', name: 'Hello', component: () => <div>hi</div> });
    expect(entry.icon).toBe('app_window');
    expect(entry.window).toMatchObject({ width: 400, height: 300 });

    const custom = defineApp({
      id: 'Big',
      name: 'Big',
      icon: 'calculator',
      window: { width: 800, singleton: true },
      component: () => <div />,
    });
    expect(custom.icon).toBe('calculator');
    // Provided fields win; unspecified fall back to the defaults.
    expect(custom.window).toMatchObject({ width: 800, height: 300, singleton: true });
  });

  it('derives a restore() that renders the component with its props', () => {
    const entry = defineApp<{ label: string }>({
      id: 'Labeled',
      name: 'Labeled',
      component: ({ label }) => <div data-testid="out">{label}</div>,
    });
    const { getByTestId } = render(<>{entry.restore({ label: 'world' })}</>);
    expect(getByTestId('out').textContent).toBe('world');
  });

  it('warns on a missing id/name and on duplicate association appFields', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    defineApp({
      id: 'Dup',
      name: 'Dup',
      component: () => <div />,
      associations: [
        { appField: 'X', getProps: () => ({}) },
        { appField: 'X', getProps: () => ({}) },
      ],
    });
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/duplicate association appField "X"/));

    warn.mockClear();
    // @ts-expect-error id is required
    defineApp({ name: 'NoId', component: () => <div /> });
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/`id` is required/));
    warn.mockRestore();
  });

  it('rejects a non-serializable restore prop at compile time', () => {
    // @ts-expect-error a function prop is not JSON-serializable, so it must not typecheck
    defineApp<{ onClick: () => void }>({
      id: 'Bad',
      name: 'Bad',
      component: () => <div />,
    });
    // (Runtime does not assert this; the value is that the line above fails tsc.)
    expect(true).toBe(true);
  });

  it('restoreApp is exported and casts unknown props', () => {
    const Wrapped = restoreApp<{ n: number }>(({ n }) => <span data-testid="n">{n}</span>);
    const { getByTestId } = render(<>{Wrapped({ n: 42 } as unknown)}</>);
    expect(getByTestId('n').textContent).toBe('42');
  });
});
