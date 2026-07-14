import React, { useCallback, useEffect, useRef } from 'react';
import { useWindowManager } from '../context/WindowManagerContext';
import { useFileSystem } from '../context/FileSystemContext';
import { useUserSession } from '../context/UserSessionContext';
import { useAppRegistry } from '../context/AppRegistryContext';
import { useXPEventBus } from '../context/EventBusContext';
import { APP_REGISTRY, resolveFileOpen } from '../registry/apps';
import { isContainerNode, isExternalLinkNode } from '../types';
import { canUseDOM } from '../utils/storage';
import { openExternalUrl } from '../utils/externalLink';
import { parseOpenPath, resolveRoutes, toOpenList, type DeepLinkRoutes } from '../utils/deepLink';

export interface DeepLinkLoaderProps {
  /** Key path(s) (`?open=` values) to open once the desktop is interactive (#136). */
  open?: string | string[];
  /** Pretty URL patterns (`/blog/:slug`) → files, matched against `location`. */
  routes?: DeepLinkRoutes;
  /** The host's current location (path[+search]) for `routes` matching. */
  location?: string;
  /**
   * Push/pop browser history as top-level windows open/close so Back behaves as
   * content-site visitors expect. Off by default — games and embeds don't want it.
   */
  historyIntegration?: boolean;
}

/**
 * Maps URL state to open windows (#136). Renders nothing. Deep links are applied
 * once, after `skipBoot`/`autoLogin` resolves (gated on `isLoggedIn`); invalid
 * paths fail silently to the plain desktop. Optional history integration lets
 * browser Back close the last-opened window.
 */
export const DeepLinkLoader: React.FC<DeepLinkLoaderProps> = ({
  open,
  routes,
  location,
  historyIntegration,
}) => {
  const { openWindow, closeWindow, focusWindow, windows } = useWindowManager();
  const { getFile } = useFileSystem();
  const { isLoggedIn } = useUserSession();
  const { registry } = useAppRegistry();
  const bus = useXPEventBus();

  const openPath = useCallback(
    (path: string[]): string | null => {
      if (path.length === 0) return null;
      const node = getFile(path);
      if (!node) return null; // invalid path → fail silently to the plain desktop

      if (isExternalLinkNode(node)) {
        const newTab = node.newTab ?? true;
        openExternalUrl(node.href, newTab);
        bus.emit({ type: 'link:external', url: node.href, newTab, source: path.join('/') });
        return null;
      }

      // Folders/drives: open Explorer at the FULL path (resolveFileOpen only
      // knows the leaf key, which breaks nested paths).
      if (isContainerNode(node) && node.type !== 'root') {
        const def = registry.Explorer ?? APP_REGISTRY.Explorer;
        const componentProps = { initialPath: path };
        return openWindow('Explorer', node.name, def.restore(componentProps), def.icon, {
          ...(def.window ?? {}),
          componentProps,
          sourcePath: path,
        });
      }

      const key = path[path.length - 1];
      const resolved = resolveFileOpen(key, node);
      if (!resolved) return null;
      return openWindow(resolved.appId, node.name, resolved.component, resolved.icon, {
        ...resolved.windowProps,
        sourcePath: path,
      });
    },
    [getFile, registry, openWindow, bus]
  );

  // Apply deep links once, after login resolves.
  const appliedRef = useRef(false);
  useEffect(() => {
    if (appliedRef.current || !isLoggedIn) return;
    appliedRef.current = true;
    const routeTargets = routes && location ? resolveRoutes(routes, location.split('?')[0]) : [];
    const targets = [...toOpenList(open), ...routeTargets];
    let lastId: string | null = null;
    for (const target of targets) {
      const id = openPath(parseOpenPath(target));
      if (id) lastId = id;
    }
    if (lastId) focusWindow(lastId);
  }, [isLoggedIn, open, routes, location, openPath, focusWindow]);

  // ── History integration (opt-in) ─────────────────────────────────────────
  // Restored windows present at mount must NOT push history; only subsequent
  // opens do. Back pops the most-recently-opened still-open window.
  const knownIdsRef = useRef<Set<string> | null>(null);
  const historyStackRef = useRef<string[]>([]);

  useEffect(() => {
    if (!historyIntegration || !canUseDOM) return;
    if (knownIdsRef.current === null) {
      knownIdsRef.current = new Set(windows.map(w => w.id));
      return;
    }
    const known = knownIdsRef.current;
    const currentIds = windows.map(w => w.id);
    const currentSet = new Set(currentIds);
    for (const id of currentIds) {
      if (!known.has(id)) {
        known.add(id);
        historyStackRef.current.push(id);
        window.history.pushState({ xpWindow: id }, '');
      }
    }
    for (const id of Array.from(known)) {
      if (!currentSet.has(id)) {
        known.delete(id);
        const idx = historyStackRef.current.lastIndexOf(id);
        if (idx >= 0) historyStackRef.current.splice(idx, 1);
      }
    }
  }, [windows, historyIntegration]);

  useEffect(() => {
    if (!historyIntegration || !canUseDOM) return undefined;
    const onPop = () => {
      const id = historyStackRef.current.pop();
      if (id) {
        knownIdsRef.current?.delete(id);
        closeWindow(id);
      }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [historyIntegration, closeWindow]);

  return null;
};

export default DeepLinkLoader;
