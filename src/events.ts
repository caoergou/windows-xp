/**
 * Desktop event bus (#76).
 *
 * Everything noteworthy that happens inside the simulated desktop is emitted
 * as a typed XPEvent. Hosts subscribe via the `onEvent` prop on <WindowsXP/>
 * (or the `useXPEvents` hook inside the tree); the upcoming scenario system
 * (#84) builds on the same stream.
 */

export type XPEvent =
  // Application / window lifecycle
  | { type: 'app:launch'; appId: string; windowId: string; title: string }
  | { type: 'app:close'; appId: string; windowId: string }
  | { type: 'window:focus'; windowId: string; appId: string }
  | { type: 'window:minimize'; windowId: string; appId: string }
  | { type: 'window:maximize'; windowId: string; appId: string }
  | { type: 'window:restore'; windowId: string; appId: string }
  // Virtual filesystem
  | { type: 'file:open'; path: string[]; name: string; nodeType: string; app?: string }
  | { type: 'file:create'; path: string[]; name: string; nodeType: 'file' | 'folder' }
  // `content` is present when the edit changed file text — the puzzle-relevant
  // payload ("did the player type the passphrase into this Notepad file?").
  | { type: 'file:update'; path: string[]; name: string; content?: string }
  | { type: 'file:delete'; path: string[]; name: string }
  | { type: 'file:rename'; path: string[]; oldName: string; newName: string }
  | { type: 'file:move'; from: string[]; to: string[]; name: string }
  | { type: 'file:copy'; from: string[]; to: string[]; name: string }
  | { type: 'file:restore'; name: string }
  | { type: 'file:unlock'; name: string }
  | { type: 'folder:delete'; path: string[]; name: string }
  | { type: 'recyclebin:empty' }
  // Access control
  | { type: 'password:fail'; path: string[]; name: string; attempt: number }
  // Session lifecycle
  | { type: 'session:login' }
  | { type: 'session:login-fail' }
  | { type: 'session:logout' }
  | { type: 'session:boot-complete' }
  | { type: 'session:shutdown'; mode: 'shutdown' | 'restart' | 'logout' }
  // Command prompt
  | { type: 'cmd:exec'; command: string }
  // Internet Explorer
  | { type: 'ie:navigate'; url: string }
  // Appearance
  | { type: 'wallpaper:change'; wallpaper: string }
  | { type: 'screensaver:start' }
  | { type: 'screensaver:stop' }
  // Tray notifications (#118)
  | { type: 'notification:show'; id: string; title: string; body?: string }
  | { type: 'notification:click'; id: string }
  // QQ messenger (#119)
  | { type: 'qq:login' }
  | { type: 'qq:open'; buddyId?: string }
  | { type: 'qq:online'; buddyId: string; nickname: string }
  | {
      type: 'qq:message';
      buddyId: string;
      direction: 'incoming' | 'outgoing';
      text: string;
    }
  | { type: 'qq:reply'; buddyId: string; text: string };

export type XPEventType = XPEvent['type'];
export type XPEventListener = (event: XPEvent) => void;

/**
 * Minimal synchronous pub/sub. Listener errors are isolated so a faulty host
 * callback can never break the desktop.
 */
export class XPEventBus {
  private listeners = new Set<XPEventListener>();

  subscribe(listener: XPEventListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  emit(event: XPEvent): void {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (e) {
        console.error('[windows-xp] onEvent listener threw:', e);
      }
    });
  }
}

/**
 * Create a fresh event bus. Advanced composers using the bare providers can
 * make one bus, pass it to `EventBusProvider`, and observe it via `subscribe`
 * — the same instance the desktop emits on (#122).
 */
export const createXPEventBus = (): XPEventBus => new XPEventBus();
