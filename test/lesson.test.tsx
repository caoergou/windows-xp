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
import { lintLesson, isLessonValid } from '../src/lesson/lint';
import type { Lesson } from '../src/lesson/types';
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

describe('lesson linter', () => {
  it('passes a complete lesson and flags a broken one', () => {
    const good: Lesson = {
      id: 'g',
      title: 'g',
      steps: [
        { instruction: 'i', anchor: 'a', expect: { on: 'app:launch' }, hints: [{ afterMs: 1000, text: 'h' }], demonstrate: { openApp: 'X' } },
      ],
    };
    expect(lintLesson(good)).toHaveLength(0);
    expect(isLessonValid(good)).toBe(true);

    const bad = { id: '', title: '', steps: [{ instruction: '', expect: {} }] } as unknown as Lesson;
    const issues = lintLesson(bad);
    expect(issues.some(i => i.level === 'error')).toBe(true);
    expect(isLessonValid(bad)).toBe(false);
  });

  it('warns on missing hints / anchor / demonstrate but does not error', () => {
    const l: Lesson = { id: 'x', title: 'x', steps: [{ instruction: 'i', expect: { on: 'app:launch' } }] };
    const issues = lintLesson(l);
    expect(issues.every(i => i.level === 'warn')).toBe(true);
    expect(issues.map(i => i.message).join(' ')).toMatch(/hint|anchor|demonstrate/);
  });

  it('checks i18n key resolution when a resolver is supplied', () => {
    const l: Lesson = { id: 'x', title: 'lesson.missing.title', steps: [{ instruction: 'i', anchor: 'a', expect: { on: 'app:launch' }, hints: [{ afterMs: 1, text: 'h' }], demonstrate: { emit: { type: 'session:login' } } }] };
    const issues = lintLesson(l, () => false);
    expect(issues.some(i => i.message.includes('no translation'))).toBe(true);
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

  it('watch mode auto-plays each step to completion', async () => {
    const { WindowsXP } = await import('../src/lib');
    const seen: XPEvent[] = [];
    const ref = React.createRef<import('../src/components/XPBridge').XPHandle>();
    const watchLesson: Lesson = {
      id: 'w-auto',
      title: 'w',
      steps: [
        { instruction: 'a', anchor: 'start-button', expect: { on: 'cmd:exec', command: 'one' }, demonstrate: { emit: { type: 'cmd:exec', command: 'one' } } },
        { instruction: 'b', anchor: 'taskbar.clock', expect: { on: 'cmd:exec', command: 'two' }, demonstrate: { emit: { type: 'cmd:exec', command: 'two' } } },
      ],
    };
    render(<WindowsXP ref={ref} autoLogin skipBoot lessons={[watchLesson]} onEvent={e => seen.push(e)} />);
    await act(async () => {
      await Promise.resolve();
    });
    act(() => {
      ref.current!.startLesson('w-auto', 'watch');
    });
    // Each step auto-plays after the watch pacing delay (~1.4s).
    await act(async () => {
      await new Promise(r => setTimeout(r, 1700));
    });
    await act(async () => {
      await new Promise(r => setTimeout(r, 1700));
    });
    const types = seen.map(e => e.type);
    expect(types.filter(t => t === 'lesson:step-complete').length).toBe(2);
    expect(types).toContain('lesson:complete');
  }, 15000);

  it('undo policy closes a wrongly-opened window', async () => {
    const { WindowsXP } = await import('../src/lib');
    const ref = React.createRef<import('../src/components/XPBridge').XPHandle>();
    const undoLesson: Lesson = {
      id: 'undo-x',
      title: 'u',
      steps: [{ instruction: 'x', anchor: 'start-button', expect: { on: 'app:launch', appId: 'Notepad' }, onWrongAction: 'undo', demonstrate: { openApp: 'Notepad' } }],
    };
    render(<WindowsXP ref={ref} autoLogin skipBoot lessons={[undoLesson]} />);
    await act(async () => {
      await Promise.resolve();
    });
    act(() => {
      ref.current!.startLesson('undo-x', 'try');
    });
    let wrongId: string | null = null;
    act(() => {
      wrongId = ref.current!.openApp('Calculator'); // wrong app → undo should close it
    });
    expect(wrongId).toBeTruthy();
    expect(ref.current!.windows.list().some(w => w.id === wrongId)).toBe(false);
  });

  it('shield policy makes the dim shades capture clicks', async () => {
    const { WindowsXP } = await import('../src/lib');
    const ref = React.createRef<import('../src/components/XPBridge').XPHandle>();
    const shieldLesson: Lesson = {
      id: 'shield-x',
      title: 's',
      steps: [{ instruction: 'x', anchor: 'start-button', expect: { on: 'file:create' }, onWrongAction: 'shield', demonstrate: { emit: { type: 'file:create', path: ['a'], name: 'a', nodeType: 'file' } } }],
    };
    render(<WindowsXP ref={ref} autoLogin skipBoot lessons={[shieldLesson]} />);
    await act(async () => {
      await Promise.resolve();
    });
    act(() => {
      ref.current!.startLesson('shield-x', 'try');
    });
    await act(async () => {
      await new Promise(r => setTimeout(r, 60));
    });
    const shades = document.querySelectorAll('[data-testid="lesson-shade"]');
    expect(shades.length).toBeGreaterThan(0);
    expect((shades[0] as HTMLElement).style.pointerEvents).toBe('auto');
  });
});
