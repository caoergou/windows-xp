/**
 * Guided lesson runtime (#141).
 *
 * A lesson is a linear scenario with a pedagogy layer. This provider subscribes
 * to the event bus (#76) — the action-verifier — and advances the current step
 * only when a real event matches `step.expect`. It runs the hint ladder (Try
 * mode), counts wrong actions, scores the run (Do mode), emits the `lesson:*`
 * events, and persists progress per instance so a refresh resumes mid-lesson.
 *
 * Presentation (spotlight + panel) lives in `LessonOverlay` (components layer);
 * this context holds only logic + the state that view reads, keeping the engine
 * dir free of XP-chrome assumptions (#143 purity).
 */
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useXPEventBus } from './EventBusContext';
import { useStorage } from './StorageContext';
import { useWindowManager } from './WindowManagerContext';
import { useAppRegistry } from './AppRegistryContext';
import { expectMatches, isWrongAction, computeScore } from '../lesson/engine';
import { lintLesson } from '../lesson/lint';
import type { Lesson, LessonMode, LessonScore, LessonStep, WatchAction } from '../lesson/types';
import type { XPEvent } from '../events';

/** Watch-mode pacing: cursor travel + settle before a step auto-plays. */
const WATCH_STEP_MS = 1400;

/** What the overlay renders from. */
export interface LessonApi {
  status: 'idle' | 'running' | 'complete';
  /** All registered lessons (the catalog a launcher UI lists). */
  catalog: Lesson[];
  lesson: Lesson | null;
  mode: LessonMode;
  stepIndex: number;
  totalSteps: number;
  step: LessonStep | null;
  /** Hint texts (i18n keys or literals) revealed on the current step, in order. */
  visibleHints: string[];
  /** Increments on each wrong action so the overlay can shake. */
  nudgeSeq: number;
  /** Set when a run completes (Do mode carries a meaningful score). */
  score: LessonScore | null;
  /** Whether the run is auto-demonstrating (Watch mode). */
  isWatch: boolean;
  /** Whether Watch auto-play is paused. */
  watchPaused: boolean;
  /** Increments each time Watch performs a step (drives the cursor click pulse). */
  demoSeq: number;
  /** Pause / resume Watch auto-play. */
  pauseWatch: () => void;
  resumeWatch: () => void;
  /** Start a lesson by id. Returns false if unknown. `try` is the default. */
  start: (lessonId: string, mode?: LessonMode) => boolean;
  /** Abort the current lesson and clear its saved progress. */
  stop: () => void;
}

const LessonContext = createContext<LessonApi | null>(null);

const PROGRESS_KEY = 'lesson_progress';

interface PersistedProgress {
  lessonId: string;
  mode: LessonMode;
  stepIndex: number;
  status: 'running' | 'complete';
  wrongActions: number;
  hintsUsed: number;
  startedAt: number;
}

export const LessonProvider: React.FC<{ lessons?: Lesson[]; children: React.ReactNode }> = ({
  lessons,
  children,
}) => {
  const bus = useXPEventBus();
  const storage = useStorage();
  const { openWindow, closeWindow } = useWindowManager();
  const { registry } = useAppRegistry();

  const byId = useRef(new Map<string, Lesson>());
  byId.current = new Map((lessons ?? []).map(l => [l.id, l]));

  // Dev-mode: lint each registered lesson so authoring gaps surface early.
  useEffect(() => {
    if (!(import.meta.env?.DEV ?? false)) return;
    (lessons ?? []).forEach(l =>
      lintLesson(l).forEach(issue => {
        const where = issue.step >= 0 ? ` step ${issue.step}` : '';
        const log = issue.level === 'error' ? console.error : console.warn;
        log(`[windows-xp] lesson "${l.id}"${where}: ${issue.message}`);
      })
    );
  }, [lessons]);

  const [status, setStatus] = useState<LessonApi['status']>('idle');
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [mode, setMode] = useState<LessonMode>('try');
  const [stepIndex, setStepIndex] = useState(0);
  const [visibleHints, setVisibleHints] = useState<string[]>([]);
  const [nudgeSeq, setNudgeSeq] = useState(0);
  const [score, setScore] = useState<LessonScore | null>(null);
  const [watchPaused, setWatchPaused] = useState(false);
  const [demoSeq, setDemoSeq] = useState(0);

  // Non-render state.
  const wrongRef = useRef(0);
  const hintsRef = useRef(0);
  const startedAtRef = useRef(0);
  const hintTimers = useRef<number[]>([]);

  const clearHintTimers = useCallback(() => {
    hintTimers.current.forEach(t => window.clearTimeout(t));
    hintTimers.current = [];
  }, []);

  const persist = useCallback(
    (p: PersistedProgress | null) => {
      try {
        if (p) storage.local.setItem(storage.key(PROGRESS_KEY), JSON.stringify(p));
        else storage.local.removeItem(storage.key(PROGRESS_KEY));
      } catch {
        /* non-fatal */
      }
    },
    [storage]
  );

  const snapshot = useCallback(
    (l: Lesson, m: LessonMode, idx: number, st: 'running' | 'complete'): PersistedProgress => ({
      lessonId: l.id,
      mode: m,
      stepIndex: idx,
      status: st,
      wrongActions: wrongRef.current,
      hintsUsed: hintsRef.current,
      startedAt: startedAtRef.current,
    }),
    []
  );

  // Arm the hint ladder for a step (Try mode only). Ghost-cursor Watch mode is
  // planned; `watch` currently behaves like `try`.
  const armHints = useCallback(
    (l: Lesson, m: LessonMode, idx: number) => {
      clearHintTimers();
      setVisibleHints([]);
      if (m === 'do') return;
      const step = l.steps[idx];
      (step?.hints ?? []).forEach((hint, hintIdx) => {
        const timer = window.setTimeout(() => {
          hintsRef.current += 1;
          setVisibleHints(prev => (prev.includes(hint.text) ? prev : [...prev, hint.text]));
          bus.emit({
            type: 'lesson:hint-shown',
            lessonId: l.id,
            stepId: String(idx),
            hintId: String(hintIdx),
          });
          persist(snapshot(l, m, idx, 'running'));
        }, hint.afterMs);
        hintTimers.current.push(timer);
      });
    },
    [bus, clearHintTimers, persist, snapshot]
  );

  const finish = useCallback(
    (l: Lesson, m: LessonMode) => {
      clearHintTimers();
      const result: LessonScore = {
        score: computeScore(wrongRef.current, hintsRef.current, Date.now() - startedAtRef.current),
        wrongActions: wrongRef.current,
        hintsUsed: hintsRef.current,
        timeMs: Date.now() - startedAtRef.current,
      };
      setScore(result);
      setStatus('complete');
      bus.emit({ type: 'lesson:complete', lessonId: l.id, score: result.score });
      persist(snapshot(l, m, l.steps.length - 1, 'complete'));
    },
    [bus, clearHintTimers, persist, snapshot]
  );

  const start = useCallback(
    (lessonId: string, m: LessonMode = 'try'): boolean => {
      const l = byId.current.get(lessonId);
      if (!l) {
        console.warn(`[windows-xp] startLesson: unknown lesson "${lessonId}"`);
        return false;
      }
      wrongRef.current = 0;
      hintsRef.current = 0;
      startedAtRef.current = Date.now();
      setScore(null);
      setWatchPaused(false);
      setLesson(l);
      setMode(m);
      setStepIndex(0);
      setStatus('running');
      bus.emit({ type: 'lesson:start', lessonId: l.id });
      persist(snapshot(l, m, 0, 'running'));
      armHints(l, m, 0);
      return true;
    },
    [armHints, bus, persist, snapshot]
  );

  const stop = useCallback(() => {
    clearHintTimers();
    setStatus('idle');
    setLesson(null);
    setVisibleHints([]);
    setScore(null);
    persist(null);
  }, [clearHintTimers, persist]);

  // Ref-backed bus handler so we subscribe once but always see current state.
  const handlerRef = useRef<(e: XPEvent) => void>(() => {});
  handlerRef.current = (event: XPEvent) => {
    if (status !== 'running' || !lesson) return;
    if (event.type.startsWith('lesson:')) return; // ignore our own emissions
    const step = lesson.steps[stepIndex];
    if (!step) return;

    if (expectMatches(step.expect, event)) {
      bus.emit({ type: 'lesson:step-complete', lessonId: lesson.id, stepId: String(stepIndex) });
      const next = stepIndex + 1;
      if (next >= lesson.steps.length) {
        finish(lesson, mode);
      } else {
        setStepIndex(next);
        persist(snapshot(lesson, mode, next, 'running'));
        armHints(lesson, mode, next);
      }
    } else if (isWrongAction(step.expect, event)) {
      wrongRef.current += 1;
      setNudgeSeq(n => n + 1);
      bus.emit({ type: 'lesson:step-failed', lessonId: lesson.id, stepId: String(stepIndex) });
      // `undo`: best-effort revert of the mistake. Today it closes a window the
      // wrong action opened (the "oops, wrong app" case); other reverts fall back
      // to the nudge. `shield` is handled in the overlay (off-target clicks are
      // absorbed before they become events).
      if (step.onWrongAction === 'undo' && event.type === 'app:launch' && 'windowId' in event) {
        closeWindow(event.windowId);
      }
      persist(snapshot(lesson, mode, stepIndex, 'running'));
    }
  };

  useEffect(() => bus.subscribe(e => handlerRef.current(e)), [bus]);

  // Resume an in-progress lesson after a refresh.
  useEffect(() => {
    let saved: PersistedProgress | null = null;
    try {
      const raw = storage.local.getItem(storage.key(PROGRESS_KEY));
      if (raw) saved = JSON.parse(raw) as PersistedProgress;
    } catch {
      saved = null;
    }
    if (!saved || saved.status !== 'running') return;
    const l = byId.current.get(saved.lessonId);
    if (!l) return;
    wrongRef.current = saved.wrongActions;
    hintsRef.current = saved.hintsUsed;
    startedAtRef.current = saved.startedAt || Date.now();
    setLesson(l);
    setMode(saved.mode);
    setStepIndex(saved.stepIndex);
    setStatus('running');
    armHints(l, saved.mode, saved.stepIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => clearHintTimers(), [clearHintTimers]);

  // Watch mode: auto-perform the current step through the imperative primitives.
  // The resulting event advances the step through the same gate as Try/Do, so
  // Watch is a driver over one runtime, not a second engine.
  const performWatchAction = useCallback(
    (action: WatchAction) => {
      if ('openApp' in action) {
        const def = registry[action.openApp];
        if (!def) return;
        const props = action.props ?? {};
        openWindow(action.openApp, def.name ?? action.openApp, def.restore(props), def.icon, {
          ...(def.window ?? {}),
          componentProps: props,
        });
      } else if ('emit' in action) {
        bus.emit(action.emit);
      }
    },
    [registry, openWindow, bus]
  );

  useEffect(() => {
    if (status !== 'running' || mode !== 'watch' || watchPaused || !lesson) return undefined;
    const demo = lesson.steps[stepIndex]?.demonstrate;
    if (!demo) return undefined; // can't auto-play this step; wait
    const timer = window.setTimeout(() => {
      setDemoSeq(n => n + 1);
      performWatchAction(demo);
    }, WATCH_STEP_MS);
    return () => window.clearTimeout(timer);
  }, [status, mode, watchPaused, lesson, stepIndex, performWatchAction]);

  const value: LessonApi = {
    status,
    catalog: lessons ?? [],
    lesson,
    mode,
    stepIndex,
    totalSteps: lesson?.steps.length ?? 0,
    step: lesson?.steps[stepIndex] ?? null,
    visibleHints,
    nudgeSeq,
    score,
    isWatch: mode === 'watch',
    watchPaused,
    demoSeq,
    pauseWatch: () => setWatchPaused(true),
    resumeWatch: () => setWatchPaused(false),
    start,
    stop,
  };

  return <LessonContext.Provider value={value}>{children}</LessonContext.Provider>;
};

/** Access the lesson runtime. Returns a safe no-op controller outside a provider. */
export const useLesson = (): LessonApi => {
  const ctx = useContext(LessonContext);
  if (ctx) return ctx;
  return {
    status: 'idle',
    catalog: [],
    lesson: null,
    mode: 'try',
    stepIndex: 0,
    totalSteps: 0,
    step: null,
    visibleHints: [],
    nudgeSeq: 0,
    score: null,
    isWatch: false,
    watchPaused: false,
    demoSeq: 0,
    pauseWatch: () => {},
    resumeWatch: () => {},
    start: () => false,
    stop: () => {},
  };
};
