/**
 * QQ Messenger 内容数据模型（#119）。
 *
 * 好友、分组、脚本消息全部来自数据（文化包 / 场景 JSON），组件不硬编码任何
 * 剧情文本 —— 与「内容作者不写 React」的原则一致。回复来源采用与 #148
 * `ChatProvider` 对齐的形状：`reply: { kind: 'script' } | { kind: 'provider' }`，
 * 脚本路径为默认且离线可用。
 */

/** 在线状态。灰度离线是经典 QQ 最强的状态语言。 */
export type QQStatus = 'online' | 'offline' | 'away' | 'invisible' | 'busy';

/** 一条脚本消息步骤：先等待 `delayMs`，再「正在输入」`typingMs`，然后落字。 */
export interface QQScriptStep {
  /** 本步开始前的等待（毫秒）。 */
  delayMs?: number;
  /** 「正在输入…」持续时长（毫秒），营造打字效果。默认按文本长度估算。 */
  typingMs?: number;
  /** 消息正文，支持 `[微笑]` / `/wx` 表情码（见 emojiRenderer）。 */
  text: string;
}

/**
 * 好友的回复来源。
 * - `script`：脚本回复，逐条循环播放（默认、离线安全）。
 * - `provider`：交由宿主接入的异步 Provider（#148 ChatProvider），引擎不实现。
 */
export type QQReply =
  | { kind: 'script'; steps: QQScriptStep[] }
  | { kind: 'provider'; provider: 'chat' };

export interface QQBuddy {
  /** 唯一标识。 */
  id: string;
  /** QQ 号码。 */
  number: string;
  /** 昵称。 */
  nickname: string;
  /** 个性签名（灰色小字，单行截断）。 */
  signature?: string;
  /** 头像素材编号（`assets/img/avatar/<n>.png`）。 */
  avatar: number | string;
  /** 所属分组 id。 */
  group: string;
  /** 初始在线状态。 */
  status: QQStatus;
  /** 会员（红名）。 */
  vip?: boolean;
  /** 业务角标：彩铃 / 手机 QQ / 音乐等。 */
  badges?: Array<'music' | 'ring' | 'mobile'>;
  /**
   * 登录后延迟多少毫秒「上线」。设置后好友初始离线，到点敲门上线（声音 +
   * 托盘闪动 + 上线气泡）。省略表示保持 `status` 不变。
   */
  onlineDelayMs?: number;
  /** 上线后主动发来的脚本消息序列（带打字停顿）。 */
  script?: QQScriptStep[];
  /** 玩家发消息后的回复来源；省略则该好友不自动回复。 */
  reply?: QQReply;
}

export interface QQGroup {
  /** 唯一标识。 */
  id: string;
  /** 分组名。系统分组「陌生人」「黑名单」不显示计数。 */
  name: string;
  /** 是否为系统分组（无计数、不可改名）。 */
  system?: boolean;
  /** 初始是否展开（手风琴）。 */
  open?: boolean;
}

/** 「我」的资料（个人横幅）。 */
export interface QQMe {
  number: string;
  nickname: string;
  signature?: string;
  avatar: number | string;
  status: QQStatus;
}

/**
 * 一份 QQ 档案：好友列表 + 分组 + 我的资料。作为文化包字段 `qq` 提供，
 * 也可由宿主经 `XPHandle.qq` 在运行时注入。
 */
export interface QQProfile {
  me: QQMe;
  groups: QQGroup[];
  buddies: QQBuddy[];
}
