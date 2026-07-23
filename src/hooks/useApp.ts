import { useMemo, useRef } from 'react';
import { useWindowManagerActions } from '../context/WindowManagerContext';
import { useModal } from '../context/ModalContext';
import { useFileSystem } from '../context/FileSystemContext';
import { useUserSession } from '../context/UserSessionContext';
import { useTray, TrayItem } from '../context/TrayContext';
import { useWindowId } from '../context/WindowIdContext';
import { sounds } from '../utils/soundManager';
import { FileNode, isContainerNode } from '../types';

/**
 * useApp(windowId) - the single entry point for App components to interact with the system.
 *
 * After Window.jsx injects windowId via cloneElement, the App component only needs to call this hook,
 * without directly importing any Context.
 *
 * Usage:
 *   function MyApp({ windowId, ...props }) {
 *     const api = useApp(windowId);
 *     await api.dialog.alert({ title: 'Tip', message: 'Hello' });
 *   }
 */
export function useApp(windowId?: string) {
  const contextWindowId = useWindowId();
  // Legacy built-ins often default `windowId` to an empty string. Treat that as
  // "not supplied" so the owning WindowIdContext still scopes close/minimize.
  const resolvedWindowId = windowId || contextWindowId || '';

  const windowManager = useWindowManagerActions();
  const windowManagerRef = useRef(windowManager);
  windowManagerRef.current = windowManager;

  const modal = useModal();
  const modalRef = useRef(modal);
  modalRef.current = modal;

  const fileSystem = useFileSystem();
  const fileSystemRef = useRef(fileSystem);
  fileSystemRef.current = fileSystem;

  const userSession = useUserSession();
  const userSessionRef = useRef(userSession);
  userSessionRef.current = userSession;

  const tray = useTray();
  const trayRef = useRef(tray);
  trayRef.current = tray;

  const trayId = `app-tray-${resolvedWindowId}`;

  return useMemo(
    () => ({
      // --- Current window controls ------------------------------------------------
      window: {
        id: resolvedWindowId,
        setTitle: (title: string) =>
          windowManagerRef.current.setWindowTitle(resolvedWindowId, title),
        // Swap the OS chrome for an app-drawn skin (or back) at runtime.
        setFrameless: (frameless: boolean) =>
          windowManagerRef.current.setWindowFrameless(resolvedWindowId, frameless),
        close: () => windowManagerRef.current.closeWindow(resolvedWindowId),
        minimize: () => windowManagerRef.current.minimizeWindow(resolvedWindowId),
        maximize: () => windowManagerRef.current.maximizeWindow(resolvedWindowId),
        resize: (width: number, height: number) =>
          windowManagerRef.current.resizeWindow(resolvedWindowId, width, height),
        move: (left: number, top: number) =>
          windowManagerRef.current.moveWindow(resolvedWindowId, left, top),
        // Taskbar indicator
        setBadge: (value: string | number | null) =>
          windowManagerRef.current.setWindowBadge(resolvedWindowId, value),
        setProgress: (pct: number | null) =>
          windowManagerRef.current.setWindowProgress(resolvedWindowId, pct),
        flash: () => windowManagerRef.current.flashWindow(resolvedWindowId),
        // Hide without minimizing to the taskbar (e.g. QQ minimize-to-tray).
        hide: () => windowManagerRef.current.hideWindow(resolvedWindowId),
        // Intercept close/minimize for this window (pass null to clear).
        setCloseGuard: (guard: ((forceClose: () => void) => void) | null) =>
          windowManagerRef.current.setCloseGuard(resolvedWindowId, guard),
        setMinimizeGuard: (guard: ((defaultMinimize: () => void) => void) | null) =>
          windowManagerRef.current.setMinimizeGuard(resolvedWindowId, guard),
      },

      // --- Open a new window (same signature as WindowManagerContext.openWindow) -----------
      openWindow: (...args: Parameters<typeof windowManager.openWindow>) =>
        windowManagerRef.current.openWindow(...args),

      // --- Promise-based dialogs ------------------------------------------------
      dialog: modalRef.current.dialog,

      // --- Sound ------------------------------------------------------------------
      sound: {
        play: (name: string) => (sounds as Record<string, (() => void) | undefined>)[name]?.(),
      },

      // --- File system (read + write) ---------------------------------------------
      // Write access mirrors the imperative XPHandle.fs surface (#115/#122) so a
      // custom app can persist files through the sanctioned `useApp` API without
      // reaching into `useFileSystem` internals.
      fs: {
        readFile: (path: string[]) => fileSystemRef.current.getFile(path),
        readDir: (path: string[]) =>
          (fileSystemRef.current.getFile(path) as { children?: Record<string, FileNode> } | null)
            ?.children ?? null,
        checkAccess: fileSystemRef.current.checkAccess,
        writeFile: (path: string[], content: string) =>
          fileSystemRef.current.updateFile(path, { content }),
        createFile: (path: string[], node: Partial<FileNode> = {}) => {
          const parent = path.slice(0, -1);
          const name = path[path.length - 1];
          if (!name) return;
          const {
            type = 'file',
            name: _n,
            ...rest
          } = node as Partial<FileNode> & { type?: 'file' | 'folder' };
          void _n;
          fileSystemRef.current.createFile(parent, name, type, rest);
        },
        deleteFile: (path: string[]) => {
          const parent = path.slice(0, -1);
          const name = path[path.length - 1];
          if (!name) return;
          const node = fileSystemRef.current.getFile(path);
          if (node && isContainerNode(node)) fileSystemRef.current.deleteFolder(parent, name);
          else fileSystemRef.current.deleteFile(parent, name);
        },
      },

      // --- User session -----------------------------------------------------------
      session: {
        user: userSessionRef.current.user?.name,
        logout: () => userSessionRef.current.logout(),
      },

      // --- System tray ------------------------------------------------------------
      tray: {
        register: (config: Omit<TrayItem, 'id'>) => trayRef.current.register(trayId, config),
        unregister: () => trayRef.current.unregister(trayId),
        update: (updates: Partial<Omit<TrayItem, 'id'>>) => trayRef.current.update(trayId, updates),
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [resolvedWindowId, trayId]
  );
}
