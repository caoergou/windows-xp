import React, { useEffect, useImperativeHandle } from 'react';
import { useWindowManager } from '../context/WindowManagerContext';
import { useFileSystem } from '../context/FileSystemContext';
import { useModal } from '../context/ModalContext';
import { useXPEventBus } from '../context/EventBusContext';
import { APP_REGISTRY, resolveFileOpen } from '../registry/apps';
import { useAppRegistry } from '../context/AppRegistryContext';
import { isContainerNode } from '../types';
import type { XPEventListener } from '../events';

/**
 * Imperative handle exposed via `ref` on <WindowsXP/> (#76): lets the host
 * drive the desktop programmatically (demos, tests, scenario scripting).
 */
export interface XPHandle {
  /** Open a registered app by id, optionally passing component props. */
  openApp: (appId: string, props?: Record<string, unknown>) => string | null;
  /** Open a filesystem node by absolute path (resolves the right app). */
  openFile: (path: string[]) => string | null;
  /** Close a window by id. */
  closeWindow: (id: string) => void;
  /** Show an XP dialog. */
  showAlert: (title: string, message: string) => void;
  /** Clear all persisted desktop state and reload. */
  reset: () => void;
}

/** Subscribes the host's onEvent callback to the bus. Renders nothing. */
export const XPEventBridge: React.FC<{ onEvent?: XPEventListener }> = ({ onEvent }) => {
  const bus = useXPEventBus();
  const ref = React.useRef(onEvent);
  ref.current = onEvent;
  useEffect(() => {
    if (!ref.current) return undefined;
    return bus.subscribe(event => ref.current?.(event));
  }, [bus]);
  return null;
};

/** Wires the imperative handle to the live contexts. Renders nothing. */
export const XPImperativeApi = React.forwardRef<XPHandle, { storagePrefix?: string }>(
  function XPImperativeApi(_props, ref) {
    const { openWindow, closeWindow } = useWindowManager();
    const { fs, getFile } = useFileSystem();
    const { dialog } = useModal();
    const { registry } = useAppRegistry();

    useImperativeHandle(
      ref,
      (): XPHandle => ({
        openApp: (appId, props = {}) => {
          const def = registry[appId] ?? APP_REGISTRY[appId];
          if (!def) {
            console.warn(`[windows-xp] openApp: unknown appId "${appId}"`);
            return null;
          }
          return openWindow(
            appId,
            def.name ?? appId,
            def.restore(props),
            def.icon,
            { ...(def.window ?? {}), componentProps: props }
          );
        },
        openFile: path => {
          const node = getFile(path);
          if (!node) {
            console.warn(`[windows-xp] openFile: no node at ${path.join('/')}`);
            return null;
          }
          const key = path[path.length - 1] ?? node.name;
          const resolved = resolveFileOpen(key, node);
          if (!resolved) return null;
          return openWindow(
            resolved.appId,
            node.name,
            resolved.component,
            resolved.icon,
            resolved.windowProps
          );
        },
        closeWindow,
        showAlert: (title, message) => {
          void dialog.alert({ title, message, type: 'info' });
        },
        reset: () => {
          // Best-effort: clear namespaced keys and reload.
          if (typeof window === 'undefined') return;
          const prefix = _props.storagePrefix ?? 'xp_';
          Object.keys(localStorage)
            .filter(k => k.startsWith(prefix))
            .forEach(k => localStorage.removeItem(k));
          window.location.reload();
        },
      }),
      [openWindow, closeWindow, getFile, dialog, registry, _props.storagePrefix]
    );

    // Touch fs/isContainerNode so tree-shaking keeps the type guard import
    // meaningful and lint sees fs consumed for potential future use.
    void fs;
    void isContainerNode;
    return null;
  }
);
