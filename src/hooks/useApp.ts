import { useWindowManager } from '../context/WindowManagerContext';
import { useModal } from '../context/ModalContext';
import { useFileSystem } from '../context/FileSystemContext';
import { useUserSession } from '../context/UserSessionContext';
import { useTray } from '../context/TrayContext';
import { sounds } from '../utils/soundManager';

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
export function useApp(windowId: string) {
  const {
    openWindow, closeWindow, minimizeWindow, maximizeWindow, setWindowTitle,
    setWindowBadge, setWindowProgress, flashWindow,
  } = useWindowManager();

  const { dialog } = useModal();
  const { getFile, checkAccess } = useFileSystem();
  const { user, logout } = useUserSession();
  const { register, unregister, update } = useTray();

  const trayId = `app-tray-${windowId}`;

  return {
    // ── 当前窗口控制 ────────────────────────────────────────────────────────
    window: {
      id:          windowId,
      setTitle:    (title: string)  => setWindowTitle(windowId, title),
      close:       ()       => closeWindow(windowId),
      minimize:    ()       => minimizeWindow(windowId),
      maximize:    ()       => maximizeWindow(windowId),
      // 任务栏指示器
      setBadge:    (value: string | number | null)  => setWindowBadge(windowId, value),
      setProgress: (pct: number | null)    => setWindowProgress(windowId, pct),
      flash:       ()       => flashWindow(windowId),
    },

    // ── 打开新窗口（与 WindowManagerContext.openWindow 签名相同）────────────
    openWindow,

    // ── Promise-based 对话框 ─────────────────────────────────────────────
    dialog,

    // ── 声音 ────────────────────────────────────────────────────────────────
    sound: {
      play: (name: string) => sounds[name]?.(),
    },

    // ── 文件系统（只读）──────────────────────────────────────────────────
    fs: {
      readFile:    (path: string[]) => getFile(path),
      readDir:     (path: string[]) => getFile(path)?.children ?? null,
      checkAccess,
    },

    // ── 用户会话 ─────────────────────────────────────────────────────────
    session: {
      user:   user?.name,
      logout,
    },

    // ── 系统托盘 ─────────────────────────────────────────────────────────
    tray: {
      register:   (config: any)  => register(trayId, config),
      unregister: ()        => unregister(trayId),
      update:     (updates: any) => update(trayId, updates),
    },
  };
}
