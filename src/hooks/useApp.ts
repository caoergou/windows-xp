import { useMemo, useRef } from 'react';
import { useWindowManager } from '../context/WindowManagerContext';
import { useModal } from '../context/ModalContext';
import { useFileSystem } from '../context/FileSystemContext';
import { useUserSession } from '../context/UserSessionContext';
import { useTray, TrayItem } from '../context/TrayContext';
import { useWindowId } from '../context/WindowIdContext';
import { sounds } from '../utils/soundManager';
import { FileNode } from '../types';

/**
 * useApp(windowId) — App 组件与系统交互的唯一入口。
 *
 * 通过 Window.jsx 的 cloneElement 注入 windowId 后，App 组件只需调用此 hook，
 * 无需直接 import 任何 Context。
 *
 * 用法：
 *   function MyApp({ windowId, ...props }) {
 *     const api = useApp(windowId);
 *     await api.dialog.alert({ title: '提示', message: '你好' });
 *   }
 */
export function useApp(windowId?: string) {
  const contextWindowId = useWindowId();
  const resolvedWindowId = windowId ?? contextWindowId ?? '';

  const windowManager = useWindowManager();
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

  return useMemo(() => ({
    // ── 当前窗口控制 ────────────────────────────────────────────────────────
    window: {
      id:          resolvedWindowId,
      setTitle:    (title: string)  => windowManagerRef.current.setWindowTitle(resolvedWindowId, title),
      close:       ()       => windowManagerRef.current.closeWindow(resolvedWindowId),
      minimize:    ()       => windowManagerRef.current.minimizeWindow(resolvedWindowId),
      maximize:    ()       => windowManagerRef.current.maximizeWindow(resolvedWindowId),
      // 任务栏指示器
      setBadge:    (value: string | number | null)  => windowManagerRef.current.setWindowBadge(resolvedWindowId, value),
      setProgress: (pct: number | null)    => windowManagerRef.current.setWindowProgress(resolvedWindowId, pct),
      flash:       ()       => windowManagerRef.current.flashWindow(resolvedWindowId),
    },

    // ── 打开新窗口（与 WindowManagerContext.openWindow 签名相同）────────────
    openWindow: (...args: Parameters<typeof windowManager.openWindow>) =>
      windowManagerRef.current.openWindow(...args),

    // ── Promise-based 对话框 ─────────────────────────────────────────────
    dialog: modalRef.current.dialog,

    // ── 声音 ────────────────────────────────────────────────────────────────
    sound: {
      play: (name: string) => (sounds as Record<string, (() => void) | undefined>)[name]?.(),
    },

    // ── 文件系统（只读）──────────────────────────────────────────────────
    fs: {
      readFile:    (path: string[]) => fileSystemRef.current.getFile(path),
      readDir:     (path: string[]) => (fileSystemRef.current.getFile(path) as { children?: Record<string, FileNode> } | null)?.children ?? null,
      checkAccess: fileSystemRef.current.checkAccess,
    },

    // ── 用户会话 ─────────────────────────────────────────────────────────
    session: {
      user:   userSessionRef.current.user?.name,
      logout: () => userSessionRef.current.logout(),
    },

    // ── 系统托盘 ─────────────────────────────────────────────────────────
    tray: {
      register:   (config: Omit<TrayItem, 'id'>)  => trayRef.current.register(trayId, config),
      unregister: ()        => trayRef.current.unregister(trayId),
      update:     (updates: Partial<Omit<TrayItem, 'id'>>) => trayRef.current.update(trayId, updates),
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [resolvedWindowId, trayId]);
}
