# BACKEND-LLM-INTEGRATION.md — Beyond the Static Page

> Design research: how this engine connects **safely** to backends — LLM APIs
> inside the IM apps, an LLM-aware desktop, server-pushed live events — without
> compromising what makes the package good (offline-first, embeddable,
> secrets-free, ~3 MB). Companion to `PUZZLE-DESIGN.md` (the scenario machinery
> these providers feed) and `USE-CASES.md` (the scenarios that demand them).
>
> Reference precedents: A24's *Y2K* promo desktop (AI buddy "CoolBlue99" in the
> IM app); **websim.ai** (an LLM hallucinating an infinite fake internet
> page-by-page as you click — the exact shape of an LLM-backed IE); the
> BFF (backend-for-frontend) key-security pattern; MCP for the agent direction.

## 0. Five principles (the non-negotiables)

1. **The core ships no network code.** The engine defines typed async *ports*;
   hosts supply *adapters*. `npm install` never gets heavier and never phones
   home. Transport helpers live in an opt-in subpath (`/connect`) that
   tree-shakes away.
2. **Secrets never enter the client.** Ports accept *functions*, not API keys.
   The documented adapter pattern is BFF: the host's own backend holds the
   key, the browser calls the host's endpoint. The engine cannot leak what it
   never sees.
3. **Offline-first degradation is a contract, not a fallback.** Every
   LLM-backed surface must define its scripted behavior for
   timeout/error/no-provider — a buddy falls back to authored lines, IE falls
   back to authored pages + "该页无法显示". A scenario must be *completable*
   with all providers dead (LLM content is texture, never the only key).
4. **Anything an LLM can *do* is capability-scoped.** The full `XPHandle` is
   never handed to a model. A scoped facade with a deny-by-default allowlist
   is the only door (see §4).
5. **Context assembly is explicit.** Nothing about the desktop is sent to any
   backend unless the author/host names it. The engine labels provenance
   (author content / player input / LLM output) so hosts can build layered
   prompt-injection defenses.

## 1. The port layer: `providers` prop

```ts
interface XPProviders {
  chat?: ChatProvider;            // IM buddies, Clippy, the hint channel
  webContent?: WebContentProvider; // IE page generation (§3)
  search?: SearchProvider;        // search-oracle misses (PUZZLE-DESIGN C4)
  moderation?: (text: string, meta: ProvenanceMeta) => Promise<ModerationVerdict>;
}

interface ChatProvider {
  reply(ctx: ChatContext, signal: AbortSignal):
    Promise<string> | AsyncIterable<string>;   // streaming welcome
}

interface ChatContext {
  buddy: BuddyPersona;            // from scenario/culture data: name, persona prompt, style
  history: ChatMessage[];         // bounded, provenance-labeled
  playerMessage: string;          // UNTRUSTED — labeled as such
  world: WorldContext;            // ONLY what the scenario declared shareable (§2)
}
```

- `<WindowsXP providers={{ chat }} />`; per-buddy override in scenario data
  (`buddy.reply: { script: … } | { provider: 'chat' }`) — the #119 comment
  formalized.
- **Streaming → typing effect**: `AsyncIterable<string>` chunks drive the
  QQ/MSN typing animation naturally (chunk→keystroke pacing); `AbortSignal`
  wired to window close/conversation switch; hard timeout → fallback lines.
- `moderation` runs on inbound LLM text before render (host's filter, their
  policy); reply providers get provenance-labeled history so the host's BFF
  can apply classifier defenses on its side too.

## 2. Explicit context assembly (the anti-exfiltration design)

The scenario/host declares what the model may know, with selectors — never
"the filesystem" wholesale:

```jsonc
"buddies": [{
  "id": "阿哲",
  "persona": "网吧老板，2007年，只知道游戏和这台机器的事",
  "reply": { "provider": "chat" },
  "context": [
    { "flags": ["act1", "found_diary"] },
    { "recentEvents": { "count": 10, "domains": ["file", "app"] } },
    { "fileSummary": "D:/聊天记录.txt" }        // this file only, summarized
  ]
}]
```

The engine materializes `WorldContext` from these selectors with provenance
labels (`author` / `player` / `llm`). Player-typed text and player-edited file
content are always labeled `player` (= untrusted for injection purposes).
What leaves the browser is exactly the materialized context — auditable,
documented, testable.

## 3. Surfaces (where providers plug in, by value)

| Surface | Provider | Precedent / note |
|---|---|---|
| **IM buddy** (QQ/MSN, #119) | `chat` | A24's CoolBlue99. The hint channel (PUZZLE-DESIGN D2) gets an LLM tier *between* scripted hint tiers — scripted first, model for free-form stuck-ness, scripted spoiler floor last |
| **IE infinite fake internet** | `webContent` | The websim.ai pattern, period-constrained: on navigating an unauthored URL, generate a 2005-era page (system prompt template from the culture package). **Generated pages are cached into the virtual FS/history** — visited pages stay stable (consistency + cost), authored pages always win, offline fallback is the authored 404 |
| **Search oracle** (PUZZLE-DESIGN C4) | `search` | Authored query→results table first; provider only for misses; miss-log stays the tuning tool |
| **CMD `chat` command / Clippy** (#13) | `chat` | A diegetic "AI" — era-ironic (2007 chatbots!), cheap to add once ports exist |

## 4. LLM-aware in the other direction: the desktop as an agent environment

The engine is unusually close to being a **semantic computer-use environment**
— no pixels needed:

- **Observation** (already shipped): `getSnapshot()` (#117) = full structured
  world state; `windows.list()` (#115); the typed event stream; semantic UI
  anchors arriving with #141.
- **Action** (already shipped): the `XPHandle` actuation surface (#115).

What's missing is the **safe bridge**:

```ts
const scoped = createScopedHandle(handle, {
  allow: ['fs.read', 'windows.list', 'windows.focus', 'msg.sendAs:阿哲'],
  // deny-by-default; wildcard per group; every call emits an auditable event
  onDenied: 'event',            // or 'throw'
  approval: (call) => host.confirm(call),   // optional human gate for destructive ops
});
```

Plus an **MCP server adapter** (host-side, in `/connect` or a sibling package):
exposes `xp_observe` / `xp_read_file` / `xp_open_app` / `xp_send_message` /
`xp_reset` as MCP tools over a scoped handle, so any MCP client can drive the
desktop. Uses:

- **Teaching demos** — "watch the AI use the computer": agent actions render
  through #141's Watch-mode ghost cursor. The lesson engine and the agent
  bridge are the same observation/action layer wearing two hats.
- **Reproducible agent evals** — deterministic reset (#115) + seeded snapshots
  (#117) + persistence `none` (#138) = repeatable episodes; the event journal
  is the trace. A tiny, honest computer-use benchmark environment.
- **In-fiction agents** — an ARG character who *visibly uses the machine*
  (windows open, files appear, CMD types itself) while the player watches:
  the single most spectacular story beat this engine could offer, and it's
  just the scoped handle + ghost cursor.

## 5. Server-pushed events & live ops (the non-LLM backend story)

`emit()` (#115) is already the inbound door. A thin adapter maps server pushes
onto the bus / scenario actions:

```ts
// /connect helper, host-side wiring
createEventPushAdapter(handle, {
  source: new EventSource('/api/campaign-events'),   // or WebSocket
  map: (msg) => msg.type === 'qq' ? { action: 'qqMessage', ...msg } : null,
});
```

Enables: ARG live ops (globally timed events, community moments), campaign
content updates without redeploys (fetch-then-mount + snapshots), classroom
orchestration (instructor pushes to all student instances). The engine adds
nothing but the helper + docs — state authority stays with the host.

## 6. Threat model summary

| Threat | Mitigation |
|---|---|
| API key theft | BFF only; ports take functions; engine never accepts secrets (lint the `providers` types so a `apiKey` field can't even be expressed) |
| Prompt injection via player text / player-edited files | Provenance labels on all context; explicit context selectors (no default exfiltration); host classifier hooks at the BFF; `moderation` port on output |
| LLM misusing actions | `createScopedHandle` deny-by-default allowlist; audit events for every call; optional human-approval gate; rate limits in the adapter |
| Cost blowout / DoS | Streaming with token caps in the BFF; debounce in the engine (one in-flight reply per buddy); **cache-generated-pages-to-FS** for webContent; scripted fallbacks make "provider off" a valid mode |
| Privacy / data exfiltration | §2: only declared selectors leave the browser; document exactly what is sent; provenance in every payload |
| Availability | Principle 3: every surface defines scripted degradation; scenarios must be completable offline |

## 7. Packaging & phasing

**Packaging**: core = ports (types) + provider wiring only. New opt-in subpath
`@caoergou/windows-xp/connect`: `createHttpChatProvider(endpoint, { getAuthToken })`
(fetch + SSE streaming), `createEventPushAdapter`, `createScopedHandle`,
`createMcpBridge`. Zero impact on the core bundle (#113 size budget); a
reference BFF (Next.js route handler proxying to an LLM API with streaming)
ships as documentation, not code.

**Phases** (each independently shippable):

1. **Ports + ChatProvider** — types, `providers` prop, context assembly with
   provenance, streaming→typing adapter, fallback contract; #119 consumes it
2. **`/connect` + BFF docs** — HTTP/SSE chat adapter, event-push adapter,
   the reference BFF walkthrough
3. **WebContentProvider** — IE page generation with FS-caching and era
   guardrails (websim pattern)
4. **Agent bridge** — `createScopedHandle` + MCP adapter + the
   watch-the-agent demo (with #141's ghost cursor)

## 8. What this deliberately does NOT do

- No LLM calls from the engine itself, ever — not even "just for the demo"
- No multiplayer/state-sync engine — server authority is a host pattern (§5)
- No bundled vendor SDKs — adapters speak plain HTTP/SSE/WS to *your* backend
- No default context — an LLM that was given nothing can leak nothing
