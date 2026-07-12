/**
 * Guided lesson system (#141).
 *
 * Pure-engine matching/scoring tests, plus an integration test that mounts
 * <WindowsXP lessons=…/>, starts the reference lesson through the handle, and
 * drives it to completion on real events — asserting the lesson:* progress
 * stream and Do-mode scoring.
 */
import React from 'react';
import { render, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { expectMatches, isWrongAction, computeScore } from '../src/lesson/engine';
import type { XPEvent } from '../src/events';

describe('lesson engine — expectMatches / isWrongAction', () => {
  it('matches type + flat payload fields', () => {
    const e: XPEvent = { type: 'app:launch', appId: 'Notepad', windowId: 'w1', title: 'Notepad' };
    expect(expectMatches({ on: 'app:launch', appId: 'Notepad' }, e)).toBe(true);
    expect(expectMatches({ on: 'app:launch', appId: 'Calculator' }, e)).toBe(false);
    expect(expectMatches({ on: 'file:open', appId: 'Notepad' }, e)).toBe(false);
    expect(expectMatches({ on: ['app:launch', 'app:close'] }, e)).toBe(true);
  });

  it('flags a wrong action only for the right type with a wrong payload', () => {
    const wrongApp: XPEvent = { type: 'app:launch', appId: 'Calculator', windowId: 'w', title: 'C' };
    const unrelated: XPEvent = { type: 'window:focus', windowId: 'w', appId: 'Calculator' };
    const expect_ = { on: 'app:launch' as const, appId: 'Notepad' };
    expect(isWrongAction(expect_, wrongApp)).toBe(true); // right type, wrong app
    expect(isWrongAction(expect_, unrelated)).toBe(false); // unrelated event = not wrong
  });

  it('scores by penalizing wrong actions and hints', () => {
    expect(computeScore(0, 0, 1000)).toBe(100);
    expect(computeScore(2, 1, 1000)).toBe(75); // 100 - 20 - 5
    expect(computeScore(20, 0, 1000)).toBe(0); // floored
  });
});

describe('lesson runtime — <WindowsXP lessons/> + startLesson', () => {
  beforeEach(() => localStorage.clear());

  const mount = async () => {
    const { WindowsXP, notepadBasicsLesson } = await import('../src/lib');
    const seen: XPEvent[] = [];
    const ref = React.createRef<import('../src/components/XPBridge').XPHandle>();
    render(
      <WindowsXP ref={ref} autoLogin skipBoot lessons={[notepadBasicsLesson]} onEvent={e => seen.push(e)} />
    );
    await act(async () => {
      await Promise.resolve();
    });
    expect(ref.current).not.toBeNull();
    return { ref, seen };
  };

  const types = (seen: XPEvent[]) => seen.map(e => e.type);

  it('runs the reference lesson to completion on verified events (do mode)', async () => {
    const { ref, seen } = await mount();

    act(() => {
      expect(ref.current!.startLesson('lesson.notepad-basics', 'do')).toBe(true);
    });
    expect(types(seen)).toContain('lesson:start');

    // Wrong app: right event type, wrong payload → step-failed, no advance.
    act(() => ref.current!.emit({ type: 'app:launch', appId: 'Calculator', windowId: 'c', title: 'C' }));
    expect(types(seen)).toContain('lesson:step-failed');
    expect(types(seen)).not.toContain('lesson:complete');

    // Step 1: open Notepad.
    act(() => ref.current!.emit({ type: 'app:launch', appId: 'Notepad', windowId: 'n', title: 'Notepad' }));
    const stepDone = seen.filter(e => e.type === 'lesson:step-complete');
    expect(stepDone.length).toBe(1);

    // Step 2: save a new file.
    act(() =>
      ref.current!.emit({ type: 'file:create', path: ['我的文档', 'note.txt'], name: 'note.txt', nodeType: 'file' })
    );
    const complete = seen.find(e => e.type === 'lesson:complete') as
      | Extract<XPEvent, { type: 'lesson:complete' }>
      | undefined;
    expect(complete).toBeTruthy();
    // One wrong action (10pt), no hints in do mode → 90.
    expect(complete!.score).toBe(90);
  });

  it('unknown lesson id returns false', async () => {
    const { ref } = await mount();
    act(() => {
      expect(ref.current!.startLesson('nope')).toBe(false);
    });
  });
});
