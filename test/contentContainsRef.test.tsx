/**
 * contentContains over a contentRef body (#241, PR-C). The condition evaluator
 * stays synchronous; the runtime eagerly resolves the bodies of files a
 * scenario gates on via `contentContains` so referenced content still matches.
 */
import 'fake-indexeddb/auto';
import React from 'react';
import { render, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { WindowsXP } from '../src/lib';
import type { ContentPack } from '../src/lib';
import { collectContentContainsPaths } from '../src/scenario/engine';
import type { Scenario } from '../src/scenario/types';
import type { XPHandle } from '../src/components/XPBridge';

describe('collectContentContainsPaths (#241)', () => {
  it('collects paths from nested all/any/not condition trees', () => {
    const scenario: Scenario = {
      id: 's',
      triggers: [
        {
          on: 'cmd:exec',
          when: {
            all: [
              { contentContains: { path: ['a.txt'], contains: 'x' } },
              { any: [{ not: { contentContains: { path: ['b', 'c.md'], contains: 'y' } } }] },
            ],
          },
          do: [{ setFlag: 'f' }],
        },
        { on: 'file:open', do: [{ setFlag: 'g' }] }, // no contentContains → nothing collected
      ],
    };
    expect(collectContentContainsPaths(scenario)).toEqual([['a.txt'], ['b', 'c.md']]);
  });
});

describe('contentContains matches a resolved contentRef file (#241)', () => {
  beforeEach(() => localStorage.clear());

  it('fires a gate reading a contentRef-backed clue once resolved', async () => {
    const scenario: Scenario = {
      id: 'cc-ref',
      triggers: [
        {
          on: 'cmd:exec',
          when: { contentContains: { path: ['clue.md'], contains: 'lotus' } },
          do: [{ setFlag: 'matched' }],
        },
      ],
    };
    const pack: ContentPack = {
      id: 'cc-pack',
      assets: { clue: 'the passphrase is lotus' },
      files: {
        'clue.md': { type: 'file', name: 'clue.md', contentRef: { asset: 'clue' } },
      },
    };

    const ref = React.createRef<XPHandle>();
    render(
      <WindowsXP
        ref={ref}
        autoLogin
        skipBoot
        disableScreenSaver
        scenario={scenario}
        contentPacks={[pack]}
      />
    );
    await act(async () => {
      await Promise.resolve();
    });
    expect(ref.current).not.toBeNull();

    // The clue body is a { asset } ref — inline `content` is absent, so this only
    // passes once the runtime has resolved the ref into fs.content.
    await waitFor(
      () => {
        act(() => ref.current!.emit({ type: 'cmd:exec', command: 'go' }));
        expect(ref.current!.getSnapshot().flags).toMatchObject({ matched: true });
      },
      { timeout: 3000 }
    );
  });
});
