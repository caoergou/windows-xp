/**
 * Provider ports (#148/#149) — typed contracts for host-supplied backends.
 *
 * The engine never ships network code or API keys. A host wires a backend via
 * the `providers` prop on <WindowsXP/>; the engine calls its typed methods and
 * falls back gracefully when no provider is mounted.
 *
 * The three ports:
 * - `ChatProvider`       — gives QQ buddies an LLM brain (#148)
 * - `ModerationProvider` — screens inbound LLM text before render (#148)
 * - `WebContentProvider` — generates fake 2000s-era web pages for IE (#149)
 *
 * Key constraint: these types intentionally CANNOT express an `apiKey` field.
 * The provider is a pure function boundary — the host owns the credential on
 * the other side (a BFF, a serverless function, etc.).
 */

// ── Chat provider (#148) ─────────────────────────────────────────────────────

/**
 * One turn in a buddy conversation, tagged by role. The engine assembles this
 * from the QQ thread history — at most `maxHistory` turns (default 20).
 */
export interface ChatTurn {
  role: 'user' | 'buddy';
  text: string;
}

/**
 * A provenance-labeled item in the world context snapshot. Only items matching
 * the buddy's declared `contextSelectors` are included, so what leaves the
 * browser is an explicit, auditable subset.
 */
export interface WorldContextItem {
  /** What kind of data this is. */
  kind: 'flag' | 'event' | 'file';
  /** Display key (flag name / event type / file path). */
  key: string;
  /** The value or summary. */
  value: string | number | boolean | null;
  /** Who produced this data point. */
  author: 'system' | 'player' | 'llm';
}

/**
 * The context passed to {@link ChatProvider.reply}. The engine assembles it;
 * the host's BFF forwards it to its LLM.
 */
export interface ChatContext {
  /** The buddy being talked to. */
  buddyId: string;
  /** The buddy's display name. */
  nickname: string;
  /** Persona prompt from the buddy's data (freeform string). */
  persona?: string;
  /** Bounded conversation history (most recent last). */
  history: ChatTurn[];
  /** Declared world-context items, when the buddy opts in via selectors. */
  worldContext?: WorldContextItem[];
}

/**
 * The host-supplied chat backend. Returns either a complete string or an
 * async iterable of chunks (mapped to the QQ typing effect).
 */
export interface ChatProvider {
  reply(ctx: ChatContext, signal: AbortSignal): Promise<string> | AsyncIterable<string>;
}

// ── Moderation provider (#148) ───────────────────────────────────────────────

/** The result of a moderation check. */
export interface ModerationResult {
  /** Whether the text is allowed to be rendered. */
  allowed: boolean;
  /** Human-readable reason when blocked (not shown to the player). */
  reason?: string;
}

/**
 * Screens inbound LLM text before it reaches the player. Applied to both
 * chat replies and generated web content (#149).
 */
export interface ModerationProvider {
  check(text: string, signal: AbortSignal): Promise<ModerationResult>;
}

// ── Web content provider (#149) ──────────────────────────────────────────────

/** Context passed to the web content generator. */
export interface WebContentContext {
  /** The URL the player navigated to. */
  url: string;
  /** Culture id (e.g. 'en', 'zh') for era-appropriate styling. */
  culture: string;
  /** Optional era-prompt template from the culture package. */
  eraPrompt?: string;
}

/** The result of generating a fake web page. */
export interface GeneratedPage {
  /** The HTML body to render (will be sanitized by the strict tier). */
  html: string;
  /** Browser title; falls back to the URL when omitted. */
  title?: string;
}

/**
 * Generates period-appropriate web pages for URLs that aren't in the
 * authorized-site registry. Like websim.ai but constrained to the XP era.
 */
export interface WebContentProvider {
  generatePage(url: string, ctx: WebContentContext, signal: AbortSignal): Promise<GeneratedPage>;
}

// ── Aggregate providers prop ─────────────────────────────────────────────────

/**
 * The `providers` prop on <WindowsXP/>. Every field is optional — the engine
 * works identically without any provider (scripted fallback for chat, error
 * page for unknown URLs).
 */
export interface XPProviders {
  chat?: ChatProvider;
  moderation?: ModerationProvider;
  webContent?: WebContentProvider;
}

// ── Context selectors (#148 explicit context assembly) ───────────────────────

/**
 * Declares which world-state items a buddy's provider may see. Only matching
 * items are assembled into {@link ChatContext.worldContext} — nothing else
 * leaves the browser.
 */
export interface ContextSelector {
  /** Include scenario flag values matching these names. */
  flags?: string[];
  /** Include recent events matching these type prefixes. */
  recentEvents?: string[];
  /** Include file summaries (name + exists + locked) for these paths. */
  fileSummary?: string[][];
}

// ── Provider-branch QQ buddy fields (#148 Phase 0) ───────────────────────────

/**
 * Extended fields for a `QQReply` of `kind: 'provider'`. These live on the
 * buddy data (culture package / scenario JSON), not on the provider itself.
 */
export interface ProviderReplyConfig {
  /** Freeform persona prompt forwarded as {@link ChatContext.persona}. */
  persona?: string;
  /** Which world-state items the provider may see. */
  contextSelectors?: ContextSelector;
  /** Fallback scripted lines played when the provider is missing or fails. */
  fallbackLines?: string[];
  /** Max conversation turns to include in context (default 20). */
  maxHistory?: number;
}
