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
export type XPEventBody =
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
  // ── startmenu / contextmenu: desktop shell interactions ─────────────────────
  /** The Start menu was opened. */
  | { type: 'startmenu:open' }
  /** The Start menu was closed. */
  | { type: 'startmenu:close' }
  /** A right-click context menu was opened; `target` classifies what was clicked ('desktop' / 'file' / 'app' …) and `path` locates the node when one was the target. */
  | { type: 'contextmenu:open'; target?: string; path?: string[] }
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
  /** A file's Properties dialog was opened — metadata (size, dates) inspected; a clue channel for scenarios (M1). */
  | { type: 'file:properties'; path: string[]; name: string }
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
  // ── flag: scenario flag lifecycle (#207) ────────────────────────────────────
  /** A scenario flag's value changed (set/inc). Lets a trigger fire on progress itself, not only on a UI event. Emitted by the scenario runtime, not the core engine. */
  | { type: 'flag:change'; flag: string; value: string | number | boolean | null }
  // ── cmd: command prompt ─────────────────────────────────────────────────────
  /** A command was executed in the Command Prompt. */
  | { type: 'cmd:exec'; command: string }
  // ── ie: Internet Explorer ───────────────────────────────────────────────────
  /** Internet Explorer navigated to a URL; `generated` is true when the page came from a host content provider rather than a bundled/authored page. */
  | { type: 'ie:navigate'; url: string; generated?: boolean }
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
  /** Fired on the top of each hour; hour is 0-23 (drives the hourly chime). */
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
  /** A buddy went offline. */
  | { type: 'qq:offline'; buddyId: string }
  /** A buddy's status or signature changed — a world reaction (e.g. a mood line the player is meant to notice). */
  | { type: 'qq:status'; buddyId: string; status?: string; signature?: string }
  /** The player picked a scripted reply option (a branching choice, distinct from the free-text `qq:reply`). */
  | { type: 'qq:choice'; buddyId: string; choiceId: string }
  // ── game: bundled games (#134) ──────────────────────────────────────────────
  /** A game started a new round; `appId` names the game and `difficulty` is present when it applies. */
  | { type: 'game:start'; appId: string; difficulty?: string }
  /** A game was won; `timeMs` is the completion time when the game tracks one. */
  | { type: 'game:win'; appId: string; difficulty?: string; timeMs?: number }
  /** A game was lost. */
  | { type: 'game:lose'; appId: string; difficulty?: string }
  // ── media: audio / video playback (#134) ────────────────────────────────────
  /** Media playback started or resumed; `path` is the source when known. */
  | { type: 'media:play'; path?: string; title?: string }
  /** Media playback was paused. */
  | { type: 'media:pause'; path?: string }
  /** Media playback reached the end of the track. */
  | { type: 'media:ended'; path?: string }
  /** The playhead was moved; `position` is the new time in seconds. */
  | { type: 'media:seek'; path?: string; position: number }
  // ── search: in-world search oracle (#134, scenario-layer) ────────────────────
  /** A query was run against an in-world search engine (a fake Baidu/AltaVista); hit is whether authored results matched. Emitted by the scenario runtime/app, not the core engine. */
  | { type: 'search:query'; query: string; hit: boolean; resultIds?: string[] }
  // ── evidence: clue collection & pinboard (#134, scenario-layer) ──────────────
  /** A term/clue entered the player's word bank (clicked a highlighted term, or granted by the scenario). */
  | { type: 'evidence:collect'; termId: string; source?: string }
  /** An item was pinned to the evidence board. */
  | { type: 'evidence:pin'; itemId: string }
  /** Two pinned items were linked on the evidence board. */
  | { type: 'evidence:link'; sourceId: string; targetId: string }
  /** An item was removed from the evidence board. */
  | { type: 'evidence:unpin'; itemId: string }
  // ── deduction: constrained answer submission (#134, scenario-layer) ──────────
  /** The player submitted a deduction form (Mad-Libs slots / Obra-Dinn triples); `slots` maps slot id → chosen value. */
  | { type: 'deduction:submit'; formId: string; slots?: Record<string, string> }
  /** A submitted deduction verified as correct; `groups` names the slot-groups that matched (supports verify-in-batches). */
  | { type: 'deduction:verified'; formId: string; groups?: string[] }
  /** A submitted deduction was rejected; `groups` names the slot-groups that failed. */
  | { type: 'deduction:failed'; formId: string; groups?: string[] }
  // ── lesson: guided-tutorial lifecycle (#141) ─────────────────────────────────
  /** A guided lesson started. */
  | { type: 'lesson:start'; lessonId: string }
  /** A lesson step was completed (the learner performed the expected action). */
  | { type: 'lesson:step-complete'; lessonId: string; stepId: string }
  /** A hint was shown for the current step (hint-ladder escalation). */
  | { type: 'lesson:hint-shown'; lessonId: string; stepId: string; hintId?: string }
  /** The learner took a wrong action on a step. */
  | { type: 'lesson:step-failed'; lessonId: string; stepId: string }
  /** A lesson finished; `score` is the assessed result when the lesson grades. */
  | { type: 'lesson:complete'; lessonId: string; score?: number }
  // ── install: software-install lifecycle (#142) ───────────────────────────────
  /** A software install/setup flow started. */
  | { type: 'install:start'; appId: string }
  /** A software install completed. */
  | { type: 'install:complete'; appId: string }
  /** A software install was cancelled before completing. */
  | { type: 'install:cancelled'; appId: string }
  // ── ui: semantic in-app control changes (#142) ───────────────────────────────
  /** A semantic app control changed (checkbox toggled, option selected); `control` names it and `value` is the new value. Emitted by data-driven apps (defineApp), gated by `settingEquals`. */
  | { type: 'ui:action'; appId: string; control: string; value?: string | number | boolean }
  // ── link: outbound navigation (#136) ────────────────────────────────────────
  /** The visitor followed a link out of the fiction to an external URL — the conversion signal campaigns measure. `newTab` is whether it opened in a new tab; `source` is the originating window id or file path, when known. */
  | { type: 'link:external'; url: string; newTab: boolean; source?: string };

/**
 * The engine's event type. {@link XPEventBody} is the payload union; the optional
 * `rehearsal` marker (#207) is stamped by the seek/rehearsal engine on events it
 * replays into the journal. The `onEvent` host bridge drops rehearsal events, so
 * fast-forwarding to a beat never fires external side effects or pollutes host
 * analytics — while the engine's own `happened`/`count` predicates still see
 * them (gating stays correct). Real gameplay never sets it.
 */
export type XPEvent = XPEventBody & { rehearsal?: boolean };

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
