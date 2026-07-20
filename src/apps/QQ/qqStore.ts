/**
 * QQ runtime state (#119).
 *
 * A module-level singleton store shared by the main-panel window and each chat window -
 * they are independent React windows inside the engine, so ordinary Context cannot share
 * state across them; we use an external store + useSyncExternalStore subscriptions.
 *
 * The store only holds **data** and schedules story timers; all side effects that need
 * React context (message sound, tray blink, taskbar flash, online balloon, event dispatch)
 * are handed to the main-panel window via {@link QQDriver} - so host-triggered messages
 * through XPHandle.qq and script timers share the same side-effect channel.
 */
import { QQProfile, QQBuddy, QQGroup, QQMe, QQStatus, QQScriptStep } from '../../data/qq/types';
import type {
  ChatProvider,
  ModerationProvider,
  ChatContext,
  ChatTurn,
  WorldContextItem,
  ContextSelector,
} from '../../providers/types';
// Side-effect import: registers the QQ2006 notification sounds into the
// soundManager as soon as the QQ module graph loads (#213).
import './sounds';

export interface QQMessage {
  id: string;
  buddyId: string;
  from: 'me' | 'buddy';
  text: string;
  /** HH:MM:SS */
  time: string;
}

export interface RuntimeBuddy extends QQBuddy {
  /** Currently active status (can be rewritten by online timers / host). */
  currentStatus: QQStatus;
}

export interface QQState {
  started: boolean;
  me: QQMe | null;
  groups: QQGroup[];
  buddies: RuntimeBuddy[];
  threads: Record<string, QQMessage[]>;
  unread: Record<string, number>;
  typing: Record<string, boolean>;
  openGroups: Record<string, boolean>;
  /** Buddy currently in focus (determines whether new messages need notification). */
  focusedChat: string | null;
}

/** Side-effect channel, injected by the main-panel window (depends on useTray / useApp / event bus). */
export interface QQDriver {
  /** Buddy comes online: knock sound + tray blink + "上线了" balloon. */
  onBuddyOnline?: (buddy: RuntimeBuddy) => void;
  /** Incoming unread message: message sound + taskbar/tray blink. */
  onIncoming?: (buddy: RuntimeBuddy, message: QQMessage) => void;
  /** Dispatch events to the engine event bus. */
  emit?: (event: import('../../events').XPEvent) => void;
  /** Host-supplied chat provider (#148). */
  chatProvider?: ChatProvider;
  /** Host-supplied moderation provider (#148). */
  moderationProvider?: ModerationProvider;
  /** Read current scenario flags for context assembly (#148). */
  getFlags?: () => Record<string, string | number | boolean | null>;
  /** Check a filesystem node's existence/locked state for context assembly (#148). */
  getFileSummary?: (path: string[]) => { exists: boolean; locked?: boolean; name: string } | null;
  /** Read recent events from the ring buffer for context assembly (#148). */
  getRecentEvents?: () => Array<{ type: string; [k: string]: unknown }>;
}

const EMPTY: QQState = {
  started: false,
  me: null,
  groups: [],
  buddies: [],
  threads: {},
  unread: {},
  typing: {},
  openGroups: {},
  focusedChat: null,
};

let state: QQState = EMPTY;
const listeners = new Set<() => void>();
let driver: QQDriver = {};
const timers = new Set<ReturnType<typeof setTimeout>>();
/** Per-buddy loop cursor for reply scripts. */
const replyCursor = new Map<string, number>();
/** Active provider AbortControllers so in-flight requests can be cancelled. */
const activeAborts = new Map<string, AbortController>();
let msgSeq = 0;

const emit = () => listeners.forEach(l => l());
const setState = (patch: Partial<QQState>) => {
  state = { ...state, ...patch };
  emit();
};

const nowTime = (): string => {
  const d = new Date();
  const p = (n: number) => n.toString().padStart(2, '0');
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
};

const schedule = (fn: () => void, ms: number) => {
  const t = setTimeout(() => {
    timers.delete(t);
    fn();
  }, ms);
  timers.add(t);
  return t;
};

const isOnline = (s: QQStatus) => s !== 'offline';

function assembleWorldContext(
  selectors: ContextSelector | undefined,
  drv: QQDriver
): WorldContextItem[] {
  if (!selectors) return [];
  const items: WorldContextItem[] = [];

  if (selectors.flags && drv.getFlags) {
    const flags = drv.getFlags();
    for (const name of selectors.flags) {
      if (name in flags) {
        items.push({ kind: 'flag', key: name, value: flags[name], author: 'system' });
      }
    }
  }

  if (selectors.recentEvents && drv.getRecentEvents) {
    const events = drv.getRecentEvents();
    for (const prefix of selectors.recentEvents) {
      for (const evt of events) {
        if (evt.type.startsWith(prefix)) {
          items.push({ kind: 'event', key: evt.type, value: null, author: 'system' });
        }
      }
    }
  }

  if (selectors.fileSummary && drv.getFileSummary) {
    for (const path of selectors.fileSummary) {
      const info = drv.getFileSummary(path);
      if (info) {
        items.push({
          kind: 'file',
          key: path.join('/'),
          value: info.locked ? 'locked' : 'accessible',
          author: 'system',
        });
      } else {
        items.push({ kind: 'file', key: path.join('/'), value: null, author: 'system' });
      }
    }
  }

  return items;
}

// --- Subscription interface --------------------------------------------------
export const qqStore = {
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getState(): QQState {
    return state;
  },

  /** Inject the side-effect channel from the main-panel window; returns a cleanup function. */
  setDriver(next: QQDriver): () => void {
    driver = next;
    return () => {
      if (driver === next) driver = {};
    };
  },

  buddy(buddyId: string): RuntimeBuddy | undefined {
    return state.buddies.find(b => b.id === buddyId);
  },

  /**
   * Start a session with a profile (called after login success). Idempotent: ignored if already started.
   * Schedules buddy online events and their post-online proactive scripts according to onlineDelayMs.
   */
  start(profile: QQProfile): void {
    if (state.started) return;
    const buddies: RuntimeBuddy[] = profile.buddies.map(b => ({
      ...b,
      currentStatus: b.status,
    }));
    const openGroups: Record<string, boolean> = {};
    profile.groups.forEach(g => (openGroups[g.id] = g.open ?? false));
    // Expand at least the first non-system group by default so buddies are visible.
    const firstReal = profile.groups.find(g => !g.system);
    if (firstReal) openGroups[firstReal.id] = true;

    setState({
      started: true,
      me: profile.me,
      groups: profile.groups,
      buddies,
      threads: {},
      unread: {},
      typing: {},
      openGroups,
      focusedChat: null,
    });

    // Schedule buddies with delayed online events.
    buddies.forEach(b => {
      if (b.onlineDelayMs && b.onlineDelayMs > 0 && !isOnline(b.status)) {
        schedule(
          () => this.bringOnline(b.id, { announce: true, runScript: true }),
          b.onlineDelayMs
        );
      }
    });
  },

  /** Bring a buddy online; optional knock hint and proactive script. */
  bringOnline(buddyId: string, opts: { announce?: boolean; runScript?: boolean } = {}): void {
    const buddy = state.buddies.find(b => b.id === buddyId);
    if (!buddy) return;
    const updated: RuntimeBuddy = { ...buddy, currentStatus: 'online' };
    setState({ buddies: state.buddies.map(b => (b.id === buddyId ? updated : b)) });
    if (opts.announce !== false) {
      driver.onBuddyOnline?.(updated);
      driver.emit?.({ type: 'qq:online', buddyId, nickname: updated.nickname });
    }
    if (opts.runScript && buddy.script?.length) {
      this.playScript(buddyId, buddy.script);
    }
  },

  /** Play a script sequence in order (wait -> typing -> message appears). */
  playScript(buddyId: string, steps: QQScriptStep[]): void {
    let acc = 0;
    steps.forEach(step => {
      const delay = step.delayMs ?? 500;
      const typing = step.typingMs ?? Math.min(2200, 400 + step.text.length * 90);
      acc += delay;
      schedule(() => this.setTyping(buddyId, true), acc);
      acc += typing;
      schedule(() => {
        this.setTyping(buddyId, false);
        this.receiveMessage(buddyId, step.text);
      }, acc);
    });
  },

  setTyping(buddyId: string, value: boolean): void {
    if (!!state.typing[buddyId] === value) return;
    setState({ typing: { ...state.typing, [buddyId]: value } });
  },

  /**
   * A buddy sends a message (incoming). Host scripts / timers / auto-replies triggered
   * by player replies all go through here. Counts as unread and triggers notification
   * side effects when the chat is not focused.
   */
  receiveMessage(buddyId: string, text: string): QQMessage | null {
    const buddy = state.buddies.find(b => b.id === buddyId);
    if (!buddy) return null;
    // If the sender still appears offline when a message arrives, set them online as well (no repeated knock).
    let buddies = state.buddies;
    if (!isOnline(buddy.currentStatus)) {
      buddies = state.buddies.map(b =>
        b.id === buddyId ? { ...b, currentStatus: 'online' as QQStatus } : b
      );
    }
    const message: QQMessage = {
      id: `qm-${++msgSeq}`,
      buddyId,
      from: 'buddy',
      text,
      time: nowTime(),
    };
    const thread = [...(state.threads[buddyId] ?? []), message];
    const focused = state.focusedChat === buddyId;
    const unread = focused
      ? state.unread
      : { ...state.unread, [buddyId]: (state.unread[buddyId] ?? 0) + 1 };
    const current = buddies.find(b => b.id === buddyId) ?? buddy;
    setState({ buddies, threads: { ...state.threads, [buddyId]: thread }, unread });

    driver.emit?.({ type: 'qq:message', buddyId, direction: 'incoming', text });
    if (!focused) driver.onIncoming?.(current, message);
    return message;
  },

  /** Player sends a message (outgoing), and triggers the buddy's scripted reply (if configured). */
  sendFromMe(buddyId: string, text: string): void {
    const buddy = state.buddies.find(b => b.id === buddyId);
    if (!buddy) return;
    const message: QQMessage = {
      id: `qm-${++msgSeq}`,
      buddyId,
      from: 'me',
      text,
      time: nowTime(),
    };
    setState({
      threads: { ...state.threads, [buddyId]: [...(state.threads[buddyId] ?? []), message] },
    });
    driver.emit?.({ type: 'qq:message', buddyId, direction: 'outgoing', text });
    driver.emit?.({ type: 'qq:reply', buddyId, text });

    if (buddy.reply?.kind === 'provider' && buddy.reply.provider === 'chat') {
      this.handleProviderReply(buddyId, buddy);
    } else if (buddy.reply?.kind === 'script' && buddy.reply.steps.length) {
      const steps = buddy.reply.steps;
      const idx = replyCursor.get(buddyId) ?? 0;
      const step = steps[idx % steps.length];
      replyCursor.set(buddyId, idx + 1);
      this.playScript(buddyId, [step]);
    }
  },

  /** Request a reply from the ChatProvider; fall back to scripted lines on failure. */
  handleProviderReply(buddyId: string, buddy: RuntimeBuddy): void {
    const chatProvider = driver.chatProvider;
    const reply = buddy.reply;
    if (!reply || reply.kind !== 'provider') return;

    if (!chatProvider) {
      this.playProviderFallback(buddyId, reply.fallbackLines);
      return;
    }

    const maxHistory = reply.maxHistory ?? 20;
    const thread = state.threads[buddyId] ?? [];
    const history: ChatTurn[] = thread.slice(-maxHistory).map(m => ({
      role: m.from === 'me' ? ('user' as const) : ('buddy' as const),
      text: m.text,
    }));

    const worldContext = assembleWorldContext(reply.contextSelectors, driver);

    const ctx: ChatContext = {
      buddyId,
      nickname: buddy.nickname,
      persona: reply.persona,
      history,
      ...(worldContext.length > 0 ? { worldContext } : {}),
    };

    driver.emit?.({ type: 'chat:request', buddyId });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    const abortKey = `chat-${buddyId}`;
    activeAborts.set(abortKey, controller);

    this.setTyping(buddyId, true);

    const handleResult = async () => {
      try {
        const result = chatProvider.reply(ctx, controller.signal);
        const isStream =
          typeof (result as AsyncIterable<string>)[Symbol.asyncIterator] === 'function';

        let replyText: string;
        let streamMsgId: string | null = null;

        if (isStream) {
          // Streaming: show progressive text as chunks arrive.
          this.setTyping(buddyId, false);
          streamMsgId = `qm-${++msgSeq}`;
          let accumulated = '';
          const streamMsg: QQMessage = {
            id: streamMsgId,
            buddyId,
            from: 'buddy',
            text: '',
            time: nowTime(),
          };
          setState({
            threads: {
              ...state.threads,
              [buddyId]: [...(state.threads[buddyId] ?? []), streamMsg],
            },
          });

          for await (const chunk of result as AsyncIterable<string>) {
            accumulated += chunk;
            const thread = state.threads[buddyId] ?? [];
            const updated = thread.map(m =>
              m.id === streamMsgId ? { ...m, text: accumulated } : m
            );
            setState({ threads: { ...state.threads, [buddyId]: updated } });
          }

          replyText = accumulated;
        } else {
          replyText = await (result as Promise<string>);
        }

        clearTimeout(timeoutId);
        activeAborts.delete(abortKey);

        if (!replyText) {
          this.setTyping(buddyId, false);
          if (streamMsgId) {
            const thread = (state.threads[buddyId] ?? []).filter(m => m.id !== streamMsgId);
            setState({ threads: { ...state.threads, [buddyId]: thread } });
          }
          this.playProviderFallback(buddyId, reply.fallbackLines);
          return;
        }

        if (driver.moderationProvider) {
          const modResult = await driver.moderationProvider.check(replyText, controller.signal);
          if (!modResult.allowed) {
            this.setTyping(buddyId, false);
            driver.emit?.({ type: 'chat:moderated', buddyId, reason: modResult.reason });
            if (streamMsgId) {
              const thread = (state.threads[buddyId] ?? []).filter(m => m.id !== streamMsgId);
              setState({ threads: { ...state.threads, [buddyId]: thread } });
            }
            this.playProviderFallback(buddyId, reply.fallbackLines);
            return;
          }
        }

        if (isStream) {
          // Streaming: message already in the thread; emit events.
          driver.emit?.({ type: 'qq:message', buddyId, direction: 'incoming', text: replyText });
        } else {
          // Promise: deliver the complete message.
          this.setTyping(buddyId, false);
          this.receiveMessage(buddyId, replyText);
        }
        driver.emit?.({ type: 'chat:reply', buddyId, text: replyText });
      } catch {
        clearTimeout(timeoutId);
        activeAborts.delete(abortKey);
        this.setTyping(buddyId, false);
        this.playProviderFallback(buddyId, reply.fallbackLines);
      }
    };

    void handleResult();
  },

  /** Play a fallback line when the provider is absent or fails. */
  playProviderFallback(buddyId: string, fallbackLines?: string[]): void {
    if (!fallbackLines || fallbackLines.length === 0) return;
    const idx = replyCursor.get(buddyId) ?? 0;
    const text = fallbackLines[idx % fallbackLines.length];
    replyCursor.set(buddyId, idx + 1);
    const typingMs = Math.min(2200, 400 + text.length * 90);
    this.setTyping(buddyId, true);
    schedule(() => {
      this.setTyping(buddyId, false);
      this.receiveMessage(buddyId, text);
      driver.emit?.({ type: 'chat:fallback', buddyId, text });
    }, typingMs);
  },

  /** Mark a chat as focused (clear unread count). */
  setFocusedChat(buddyId: string | null): void {
    const patch: Partial<QQState> = { focusedChat: buddyId };
    if (buddyId && state.unread[buddyId]) {
      patch.unread = { ...state.unread, [buddyId]: 0 };
    }
    setState(patch);
  },

  markRead(buddyId: string): void {
    if (!state.unread[buddyId]) return;
    setState({ unread: { ...state.unread, [buddyId]: 0 } });
  },

  toggleGroup(groupId: string): void {
    setState({ openGroups: { ...state.openGroups, [groupId]: !state.openGroups[groupId] } });
  },

  /** Change "my" online status (online / invisible / away / busy), driving the banner and tray menu checkmark. */
  setMeStatus(status: QQStatus): void {
    if (!state.me || state.me.status === status) return;
    setState({ me: { ...state.me, status } });
  },

  /** Total unread count (criterion for tray blinking). */
  totalUnread(): number {
    return Object.values(state.unread).reduce((a, b) => a + b, 0);
  },

  /** Full reset (logout / host reset). */
  reset(): void {
    timers.forEach(clearTimeout);
    timers.clear();
    replyCursor.clear();
    state = EMPTY;
    emit();
  },
};
