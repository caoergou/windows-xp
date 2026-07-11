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
  | { type: 'file:delete'; path: string[]; name: string }
  | { type: 'file:rename'; path: string[]; oldName: string; newName: string }
  | { type: 'file:restore'; name: string }
  | { type: 'file:unlock'; name: string }
  // Session lifecycle
  | { type: 'session:login' }
  | { type: 'session:logout' }
  | { type: 'session:boot-complete' }
  | { type: 'session:shutdown'; mode: 'shutdown' | 'restart' | 'logout' }
  // Command prompt
  | { type: 'cmd:exec'; command: string }
  // Tray notifications (#118)
  | { type: 'notification:show'; id: string; title: string; body?: string }
  | { type: 'notification:click'; id: string };

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
