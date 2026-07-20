/**
 * QQ Messenger content data model (#119).
 *
 * Buddies, groups, and scripted messages all come from data (culture package / scenario JSON);
 * components hard-code no story text - consistent with the principle "content authors don't write React".
 * Reply sources align with the #148 ChatProvider shape: 'reply: { kind: 'script' } | { kind: 'provider' }',
 * with the script path as the default and offline-safe option.
 */

/** Online status. Grayscale offline is the strongest status language of classic QQ. */
export type QQStatus = 'online' | 'offline' | 'away' | 'invisible' | 'busy';

/** One scripted message step: wait for delayMs, then "typing" for typingMs, then the text appears. */
export interface QQScriptStep {
  /** Wait before this step starts, in milliseconds. */
  delayMs?: number;
  /** Duration of the "typing..." state in milliseconds, creating a typing effect. Defaults to an estimate based on text length. */
  typingMs?: number;
  /** Message body, supports "[微笑]" / "/wx" emoticon codes (see emojiRenderer). */
  text: string;
}

/**
 * Buddy reply source.
 * - 'script': scripted replies, played in a loop one by one (default, offline-safe).
 * - 'provider': handed to an async Provider wired by the host (#148 ChatProvider); not implemented by the engine.
 */
export type QQReply =
  | { kind: 'script'; steps: QQScriptStep[] }
  | ({
      kind: 'provider';
      provider: 'chat';
    } & import('../../providers/types').ProviderReplyConfig);

export interface QQBuddy {
  /** Unique identifier. */
  id: string;
  /** QQ number. */
  number: string;
  /** Nickname. */
  nickname: string;
  /** Personal signature (gray small text, single-line truncation). */
  signature?: string;
  /** Avatar asset number ('assets/img/avatar/<n>.png'). */
  avatar: number | string;
  /** Group id the buddy belongs to. */
  group: string;
  /** Initial online status. */
  status: QQStatus;
  /** Member (red name). */
  vip?: boolean;
  /** Service badges: color ring / mobile QQ / music, etc. */
  badges?: Array<'music' | 'ring' | 'mobile'>;
  /**
   * How many milliseconds after login to "come online". When set, the buddy starts offline
   * and knocks online at the scheduled time (sound + tray blink + online balloon). Omitting it keeps status unchanged.
   */
  onlineDelayMs?: number;
  /** Scripted message sequence sent proactively after coming online (with typing pauses). */
  script?: QQScriptStep[];
  /** Reply source after the player sends a message; omitting it means the buddy does not auto-reply. */
  reply?: QQReply;
}

export interface QQGroup {
  /** Unique identifier. */
  id: string;
  /** Group name. System groups "陌生人" and "黑名单" do not show counts. */
  name: string;
  /** Whether this is a system group (no count, not renamable). */
  system?: boolean;
  /** Whether initially expanded (accordion). */
  open?: boolean;
}

/** "My" profile (personal banner). */
export interface QQMe {
  number: string;
  nickname: string;
  signature?: string;
  avatar: number | string;
  status: QQStatus;
}

/**
 * A QQ profile: buddy list + groups + my profile. Provided as the culture package field 'qq',
 * or injected at runtime by the host via 'XPHandle.qq'.
 */
export interface QQProfile {
  me: QQMe;
  groups: QQGroup[];
  buddies: QQBuddy[];
}

export interface QQArchiveAttachment {
  id: string;
  name: string;
  content: import('../../content/types').ContentRef;
}

export interface QQArchiveMessage {
  id: string;
  senderId: string;
  senderName: string;
  sentAt: string;
  text: string;
  attachments?: QQArchiveAttachment[];
}

export interface QQArchiveConversation {
  id: string;
  title: string;
  kind: 'direct' | 'group';
  memberIds: string[];
  messages: QQArchiveMessage[];
}

/** Authored, read-only QQ message history used by forensic scenarios (#280). */
export interface QQArchive {
  id: string;
  title?: string;
  conversations: QQArchiveConversation[];
}
