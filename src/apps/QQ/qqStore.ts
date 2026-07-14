/**
 * QQ 运行时状态（#119）。
 *
 * 一个模块级单例 store，被「主面板窗口」与各「聊天窗口」共享 —— 它们是引擎里
 * 相互独立的 React 窗口，无法用普通 Context 跨窗口共享状态，故用外部 store +
 * `useSyncExternalStore` 订阅。
 *
 * store 只存**数据**并调度剧情定时器；所有需要 React 上下文的副作用（消息音、
 * 托盘闪动、任务栏闪烁、上线气泡、事件派发）通过 {@link QQDriver} 交给主面板
 * 窗口执行 —— 这样宿主经 `XPHandle.qq` 触发的消息与脚本定时器共用同一条副作用
 * 通道。
 */
import { QQProfile, QQBuddy, QQGroup, QQMe, QQStatus, QQScriptStep } from '../../data/qq/types';

export interface QQMessage {
  id: string;
  buddyId: string;
  from: 'me' | 'buddy';
  text: string;
  /** HH:MM:SS */
  time: string;
}

export interface RuntimeBuddy extends QQBuddy {
  /** 当前生效状态（可被上线定时器 / 宿主改写）。 */
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
  /** 当前处于焦点的聊天对象（决定新消息是否需要提示）。 */
  focusedChat: string | null;
}

/** 副作用通道，由主面板窗口注入（依赖 useTray / useApp / 事件总线）。 */
export interface QQDriver {
  /** 好友上线：敲门声 + 托盘闪动 + 「上线了」气泡。 */
  onBuddyOnline?: (buddy: RuntimeBuddy) => void;
  /** 收到未读消息：消息音 + 任务栏/托盘闪动。 */
  onIncoming?: (buddy: RuntimeBuddy, message: QQMessage) => void;
  /** 派发事件到引擎事件总线。 */
  emit?: (event: import('../../events').XPEvent) => void;
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
/** 每个好友回复脚本的循环游标。 */
const replyCursor = new Map<string, number>();
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

// ── 订阅接口 ────────────────────────────────────────────────────────────────
export const qqStore = {
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getState(): QQState {
    return state;
  },

  /** 由主面板窗口注入副作用通道；返回清理函数。 */
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
   * 用一份档案启动会话（登录成功后调用）。幂等：已启动则忽略。
   * 会按 `onlineDelayMs` 排程好友上线与其上线后的主动脚本。
   */
  start(profile: QQProfile): void {
    if (state.started) return;
    const buddies: RuntimeBuddy[] = profile.buddies.map(b => ({
      ...b,
      currentStatus: b.status,
    }));
    const openGroups: Record<string, boolean> = {};
    profile.groups.forEach(g => (openGroups[g.id] = g.open ?? false));
    // 至少让第一个非系统分组默认展开，好友可见。
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

    // 排程延迟上线的好友。
    buddies.forEach(b => {
      if (b.onlineDelayMs && b.onlineDelayMs > 0 && !isOnline(b.status)) {
        schedule(() => this.bringOnline(b.id, { announce: true, runScript: true }), b.onlineDelayMs);
      }
    });
  },

  /** 让某好友上线；可选敲门提示与其主动脚本。 */
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

  /** 顺序播放一段脚本（等待 → 正在输入 → 落字）。 */
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
   * 好友发来一条消息（incoming）。宿主脚本 / 定时器 / 玩家回复触发的自动回复
   * 都走这里。未聚焦该聊天时计未读并触发提示副作用。
   */
  receiveMessage(buddyId: string, text: string): QQMessage | null {
    const buddy = state.buddies.find(b => b.id === buddyId);
    if (!buddy) return null;
    // 收到消息时若对方仍显示离线，则顺带置为在线（不再重复敲门）。
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

  /** 玩家发出一条消息（outgoing），并触发好友的脚本回复（若配置）。 */
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

    // 脚本回复：逐条循环。
    if (buddy.reply?.kind === 'script' && buddy.reply.steps.length) {
      const steps = buddy.reply.steps;
      const idx = replyCursor.get(buddyId) ?? 0;
      const step = steps[idx % steps.length];
      replyCursor.set(buddyId, idx + 1);
      this.playScript(buddyId, [step]);
    }
  },

  /** 标记某聊天为焦点（清零未读）。 */
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

  /** 更改「我」的在线状态（在线 / 隐身 / 离开 / 忙碌），驱动横幅与托盘菜单勾选。 */
  setMeStatus(status: QQStatus): void {
    if (!state.me || state.me.status === status) return;
    setState({ me: { ...state.me, status } });
  },

  /** 未读总数（托盘闪动判据）。 */
  totalUnread(): number {
    return Object.values(state.unread).reduce((a, b) => a + b, 0);
  },

  /** 完全重置（登出 / 宿主 reset）。 */
  reset(): void {
    timers.forEach(clearTimeout);
    timers.clear();
    replyCursor.clear();
    state = EMPTY;
    emit();
  },
};
