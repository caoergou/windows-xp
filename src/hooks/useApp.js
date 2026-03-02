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
export function useApp(windowId) {
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
      setTitle:    (title)  => setWindowTitle(windowId, title),
      close:       ()       => closeWindow(windowId),
      minimize:    ()       => minimizeWindow(windowId),
      maximize:    ()       => maximizeWindow(windowId),
      // 任务栏指示器
      setBadge:    (value)  => setWindowBadge(windowId, value),
      setProgress: (pct)    => setWindowProgress(windowId, pct),
      flash:       ()       => flashWindow(windowId),
    },

    // ── 打开新窗口（与 WindowManagerContext.openWindow 签名相同）────────────
    // 搭配 resolveFileOpen 或 APP_REGISTRY.X.restore() 使用：
    //   const resolved = resolveFileOpen(key, item);
    //   api.openWindow(resolved.appId, item.name, resolved.component, resolved.icon, resolved.windowProps);
    openWindow,

    // ── Promise-based 对话框 ─────────────────────────────────────────────
    // dialog.alert({ title, message, type? })            → Promise<void>
    // dialog.confirm({ title, message, type?, confirmLabel?, cancelLabel? }) → Promise<boolean>
    // dialog.prompt({ title, message, defaultValue? })   → Promise<string|null>
    // dialog.password({ title, message, hint?, correctPassword? }) → Promise<boolean>
    dialog,

    // ── 声音 ────────────────────────────────────────────────────────────────
    sound: {
      play: (name) => sounds[name]?.(),
    },

    // ── 文件系统（只读）──────────────────────────────────────────────────
    fs: {
      readFile:    (path) => getFile(path),
      readDir:     (path) => getFile(path)?.children ?? null,
      checkAccess,
    },

    // ── 用户会话 ─────────────────────────────────────────────────────────
    session: {
      user:   user?.name,
      logout,
    },

    // ── 系统托盘 ─────────────────────────────────────────────────────────
    // api.tray.register({ icon, tooltip, order?, onClick? }) — 注册托盘图标
    // api.tray.unregister()                                  — 注销托盘图标
    // api.tray.update({ tooltip?, icon? })                   — 更新托盘图标
    tray: {
      register:   (config)  => register(trayId, config),
      unregister: ()        => unregister(trayId),
      update:     (updates) => update(trayId, updates),
    },
  };
}
