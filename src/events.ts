/**
 * Desktop event bus (#76) — the single event catalog.
 *
 * Everything noteworthy that happens inside the simulated desktop is emitted
 * as a typed XPEvent. Hosts subscribe via the `onEvent` prop on <WindowsXP/>
 * (or the `useXPEvents` hook inside the tree); the scenario system (#84) reads
 * the same stream as its trigger vocabulary.
 *
 * This union is the SINGLE SOURCE OF TRUTH. The naming grammar, the canonical
 * domain list, payload-field conventions, and the additive-evolution policy are
 * documented in `docs/EVENTS.md` (#130). The reference table in `USAGE.md` is
 * GENERATED from the JSDoc on each member below by `scripts/gen-events-doc.mjs`
 * and guarded against drift by `test/eventDocs.test.ts` — so:
 *
 *   • give every new member a one-line `/** … *␟/` JSDoc (it becomes the table
 *     description), following the `domain:action` grammar and the payload rules
 *     in `docs/EVENTS.md`;
 *   • run `npm run docs:events` after adding or changing an event, or CI fails.
 */
export type XPEvent =
  // ── app / window: application & window lifecycle ────────────────────────────
  /** An application window was opened. */
  | { type: 'app:launch'; appId: string; windowId: string; title: string }
  /** An application window was closed. */
  | { type: 'app:close'; appId: string; windowId: string }
  /** A window gained focus (was brought to the front). */
  | { type: 'window:focus'; windowId: string; appId: string }
  /** A window was minimized to the taskbar. */
  | { type: 'window:minimize'; windowId: string; appId: string }
  /** A window was maximized. */
  | { type: 'window:maximize'; windowId: string; appId: string }
  /** A window was restored from a minimized/maximized state. */
  | { type: 'window:restore'; windowId: string; appId: string }
  // ── file / folder / recyclebin: the virtual filesystem ──────────────────────
  /** A file or folder was opened (double-clicked / launched). */
  | { type: 'file:open'; path: string[]; name: string; nodeType: string; app?: string }
  /** A file or folder was created. */
  | { type: 'file:create'; path: string[]; name: string; nodeType: 'file' | 'folder' }
  /** A file's properties were edited; `content` is present when its text changed (the "player typed the passphrase" puzzle beat). */
  | { type: 'file:update'; path: string[]; name: string; content?: string }
  /** A file was deleted (moved to the Recycle Bin). */
  | { type: 'file:delete'; path: string[]; name: string }
  /** A file or folder was renamed. */
  | { type: 'file:rename'; path: string[]; oldName: string; newName: string }
  /** A file was moved (cut+paste or drag) from `from` to `to`. */
  | { type: 'file:move'; from: string[]; to: string[]; name: string }
  /** A file was copied from `from` to `to`. */
  | { type: 'file:copy'; from: string[]; to: string[]; name: string }
  /** A file was restored from the Recycle Bin. */
  | { type: 'file:restore'; name: string }
  /** A locked node was unlocked (correct password, or a host/scenario force-unlock). */
  | { type: 'file:unlock'; name: string }
  /** A folder was deleted (files emit `file:delete`; folders emit this). */
  | { type: 'folder:delete'; path: string[]; name: string }
  /** The Recycle Bin was emptied. */
  | { type: 'recyclebin:empty' }
  // ── password: access control ────────────────────────────────────────────────
  /** A wrong password was entered for a locked node; `attempt` counts consecutive failures. */
  | { type: 'password:fail'; path: string[]; name: string; attempt: number }
  // ── session: login / power lifecycle ────────────────────────────────────────
  /** The user logged in successfully. */
  | { type: 'session:login' }
  /** A login attempt failed (wrong password). */
  | { type: 'session:login-fail' }
  /** The user logged out. */
  | { type: 'session:logout' }
  /** The desktop finished booting and is interactive. */
  | { type: 'session:boot-complete' }
  /** The machine was shut down, restarted, or logged out via the Start menu. */
  | { type: 'session:shutdown'; mode: 'shutdown' | 'restart' | 'logout' }
  // ── cmd: command prompt ─────────────────────────────────────────────────────
  /** A command was executed in the Command Prompt. */
  | { type: 'cmd:exec'; command: string }
  // ── ie: Internet Explorer ───────────────────────────────────────────────────
  /** Internet Explorer navigated to a URL. */
  | { type: 'ie:navigate'; url: string }
  // ── wallpaper / screensaver: appearance ─────────────────────────────────────
  /** The desktop wallpaper was changed (`wallpaper` is the id or URL). */
  | { type: 'wallpaper:change'; wallpaper: string }
  /** The screensaver started. */
  | { type: 'screensaver:start' }
  /** The screensaver was dismissed. */
  | { type: 'screensaver:stop' }
  // ── notification: tray balloons (#118) ──────────────────────────────────────
  /** A tray notification balloon was shown. */
  | { type: 'notification:show'; id: string; title: string; body?: string }
  /** A tray notification balloon was clicked. */
  | { type: 'notification:click'; id: string }
  // ── time: wall-clock & scheduler (#130) ─────────────────────────────────────
  /** Fired on the top of each hour; `hour` is 0–23 (drives the 整点报时 chime). */
  | { type: 'time:hour'; hour: number }
  /** A persisted schedule fired (delay elapsed or its `at` deadline passed, incl. while the page was closed). */
  | { type: 'time:fire'; id: string }
  // ── user: presence / idle detection (#130) ──────────────────────────────────
  /** The user has been inactive for the idle threshold; `idleMs` is that threshold. */
  | { type: 'user:idle'; idleMs: number }
  /** The user resumed activity after being idle. */
  | { type: 'user:active' }
  // ── qq: QQ Messenger (#119) ─────────────────────────────────────────────────
  /** The player logged into QQ (the buddy-list panel opened). */
  | { type: 'qq:login' }
  /** The QQ client opened, or a specific buddy chat was opened (`buddyId`). */
  | { type: 'qq:open'; buddyId?: string }
  /** A buddy came online. */
  | { type: 'qq:online'; buddyId: string; nickname: string }
  /** A QQ message was sent or received; `direction` is 'incoming' (from the buddy) or 'outgoing' (from the player). */
  | { type: 'qq:message'; buddyId: string; direction: 'incoming' | 'outgoing'; text: string }
  /** The player sent a reply to a buddy (the puzzle-relevant "player answered" beat). */
  | { type: 'qq:reply'; buddyId: string; text: string }
  // ── link: outbound navigation (#136) ────────────────────────────────────────
  /** The visitor followed a link out of the fiction to an external URL — the conversion signal campaigns measure. `newTab` is whether it opened in a new tab; `source` is the originating window id or file path, when known. */
  | { type: 'link:external'; url: string; newTab: boolean; source?: string };

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
