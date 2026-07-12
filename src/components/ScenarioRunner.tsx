import React, { useCallback, useEffect, useRef } from 'react';
import { useXPEventBus } from '../context/EventBusContext';
import { useStorage } from '../context/StorageContext';
import { useUserSession } from '../context/UserSessionContext';
import { useFileSystem } from '../context/FileSystemContext';
import { useTray } from '../context/TrayContext';
import { useModal } from '../context/ModalContext';
import { useScheduler } from '../context/SchedulerContext';
import { useWindowManager } from '../context/WindowManagerContext';
import { useAppRegistry } from '../context/AppRegistryContext';
import { APP_REGISTRY, resolveFileOpen } from '../registry/apps';
import { isContainerNode, type FileNode } from '../types';
import { playSound } from '../utils/soundManager';
import { qqStore } from '../apps/QQ/qqStore';
import {
  appendJournal,
  evaluateEvent,
  initialState,
} from '../scenario/engine';
import type { Scenario, ScenarioAction, ScenarioEvent, ScenarioState } from '../scenario/types';

/** Depth cap on the `flag:set` → re-evaluate cascade (guards against loops). */
const CASCADE_LIMIT = 8;

/**
 * Runs a declarative {@link Scenario} (#84): subscribes to the event bus,
 * evaluates triggers against persisted flags + an event journal, and executes
 * actions through the existing engine APIs. Renders nothing. Progress persists
 * per instance (namespaced by `storagePrefix`), so a refresh resumes the story.
 */
export const ScenarioRunner: React.FC<{ scenario?: Scenario }> = ({ scenario }) => {
  const bus = useXPEventBus();
  const storage = useStorage();
  const { isLoggedIn } = useUserSession();
  const fs = useFileSystem();
  const { notify } = useTray();
  const { dialog } = useModal();
  const { schedule } = useScheduler();
  const { openWindow } = useWindowManager();
  const { registry } = useAppRegistry();

  const stateRef = useRef<ScenarioState | null>(null);
  const startedRef = useRef(false);
  const stateKey = storage.key('scenario_state');

  const ensureState = useCallback((): ScenarioState => {
    if (stateRef.current) return stateRef.current;
    let loaded: ScenarioState | null = null;
    try {
      const raw = storage.local.getItem(stateKey);
      if (raw) loaded = JSON.parse(raw);
    } catch (e) {
      console.warn('[windows-xp] scenario: failed to parse saved progress', e);
    }
    stateRef.current = loaded ?? initialState(scenario ?? { triggers: [] });
    return stateRef.current;
  }, [storage, stateKey, scenario]);

  const persist = useCallback(() => {
    try {
      storage.local.setItem(stateKey, JSON.stringify(stateRef.current));
    } catch (e) {
      console.warn('[windows-xp] scenario: failed to persist progress', e);
    }
  }, [storage, stateKey]);

  const applyAction = useCallback(
    (a: ScenarioAction): ScenarioEvent[] => {
      const followups: ScenarioEvent[] = [];
      const st = stateRef.current!;

      if (a.setFlag !== undefined) {
        const flag = typeof a.setFlag === 'string' ? a.setFlag : a.setFlag.flag;
        const value = typeof a.setFlag === 'string' ? true : (a.setFlag.value ?? true);
        st.flags[flag] = value;
        followups.push({ type: 'flag:set', flag, value });
      }
      if (a.unlockNode) fs.unlockNode(a.unlockNode);
      if (a.addFile) {
        const { path, type = 'file', name, ...rest } = a.addFile;
        const key = name ?? path[path.length - 1];
        fs.createFile(path.slice(0, -1), key, type, { name: key, ...rest });
      }
      if (a.removeFile) {
        const p = a.removeFile;
        const node = fs.getFile(p);
        const parent = p.slice(0, -1);
        const key = p[p.length - 1];
        if (node && isContainerNode(node)) fs.deleteFolder(parent, key);
        else fs.deleteFile(parent, key);
      }
      if (a.notify) notify(a.notify);
      if (a.alert) void dialog.alert(a.alert);
      if (a.qqMessage) qqStore.receiveMessage(a.qqMessage.buddyId, a.qqMessage.text);
      if (a.playSound) playSound(a.playSound as Parameters<typeof playSound>[0]);
      if (a.openApp) {
        const def = registry[a.openApp] ?? APP_REGISTRY[a.openApp];
        if (def) {
          openWindow(a.openApp, def.name ?? a.openApp, def.restore({}), def.icon, {
            ...(def.window ?? {}),
            componentProps: {},
          });
        }
      }
      if (a.openFile) {
        const node = fs.getFile(a.openFile);
        if (node) {
          const key = a.openFile[a.openFile.length - 1] ?? node.name;
          const resolved = resolveFileOpen(key, node as FileNode);
          if (resolved) {
            openWindow(resolved.appId, node.name, resolved.component, resolved.icon, resolved.windowProps);
          }
        }
      }
      if (a.emit) bus.emit(a.emit);
      if (a.schedule) {
        schedule({ id: a.schedule.id, delayMs: a.schedule.delayMs, at: a.schedule.at });
      }
      return followups;
    },
    [fs, notify, dialog, registry, openWindow, bus, schedule]
  );

  const process = useCallback(
    (event: ScenarioEvent, depth = 0) => {
      if (!scenario) return;
      const st = ensureState();
      st.journal = appendJournal(st.journal, event);
      const { actions, firedTriggerIds } = evaluateEvent(scenario, event, st);
      firedTriggerIds.forEach(id => {
        st.fireCounts[id] = (st.fireCounts[id] ?? 0) + 1;
      });
      const followups: ScenarioEvent[] = [];
      for (const a of actions) followups.push(...applyAction(a));
      persist();
      if (depth < CASCADE_LIMIT) followups.forEach(f => process(f, depth + 1));
    },
    [scenario, ensureState, applyAction, persist]
  );

  // Subscribe to the desktop event bus.
  useEffect(() => {
    if (!scenario) return undefined;
    return bus.subscribe(event => process(event as ScenarioEvent));
  }, [scenario, bus, process]);

  // Fire the synthetic `scenario:start` once the desktop is interactive.
  useEffect(() => {
    if (!scenario || !isLoggedIn || startedRef.current) return;
    startedRef.current = true;
    process({ type: 'scenario:start' });
  }, [scenario, isLoggedIn, process]);

  return null;
};

export default ScenarioRunner;
