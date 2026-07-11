# USE-CASES.md — Scenario-Driven Requirements Derivation

> Companion to `PROJECT-ANALYSIS-2026-07.md` (state audit) and `PUZZLE-DESIGN.md`
> (game-mechanics derivation). Method here: for each **real usage scenario** of
> this package, look at how people actually build such things today (reference
> implementations), derive the jobs-to-be-done, check them against what the
> engine already has, and turn the misses into concrete requirements.
>
> Status legend: ✅ exists · 🔶 already filed (issue #) · 🆕 gap surfaced by this
> document.

The five scenarios from the roadmap (#86), ordered by how demanding they are:

| # | Scenario | Verdict in one line |
|---|---|---|
| S1 | Puzzle game / ARG | Deepest needs; fully derived in `PUZZLE-DESIGN.md` |
| S2 | Personal blog / portfolio shell | Largest real-world audience; blocked on **routing, content pipeline, SEO** |
| S3 | Marketing / creative campaign | Proven by A24's Y2K site; blocked on **branding, CTA, ephemerality, share-links** |
| S4 | Chinese-internet nostalgia content site | Mostly content work on existing machinery |
| S5 | Teaching / AI demo sandbox | Nearly served already; needs determinism guarantees |

---

## S1. Puzzle game / ARG engine

Fully covered by `docs/PUZZLE-DESIGN.md` (M1–M12 mechanics → events → schema →
four-layer orchestration). Requirements land in #84/#115–#119/#130/#134. Not
repeated here.

## S2. Personal blog / portfolio shell

### How people build these today (reference implementations)

The XP/95-desktop portfolio is an established genre: Next.js + XP.css builds,
React + react-rnd desktops, full engines like daedalOS. Recurring features in
the wild: projects as desktop folders/icons; deployed apps embedded via iframes;
an "About.txt" opened in a Notepad clone; IE-style blog readers; Clippy-style
assistants; strong emphasis (in the better writeups) on **SEO, accessibility,
responsiveness** — the three things a JS-only desktop is worst at. Every one of
these is currently hand-built from scratch; none is on this package. That is
the market gap #86 positions for — *if* the following jobs are served.

### Jobs-to-be-done → engine reality

| Job | Today | Verdict |
|---|---|---|
| Put my content on the desktop (folders, files, shortcuts) | `customFileSystem` + `fileSystemMode="replace"` | ✅ #77 |
| Write posts in Markdown and have them appear as files | Notepad renders plain text only; no markdown viewer; content must be inlined as JSON strings | 🆕 **content pipeline** (below) |
| Link a reader straight to one post/window (`/blog/my-post`, social share) | No URL ↔ state mapping at all; every visit starts at the desktop | 🆕 **deep linking** (below) |
| Be findable on Google | Window content is invisible to crawlers; no prerender/mirror strategy documented | 🆕 part of content pipeline |
| RSS feed | n/a (host-side, but trivially derivable from a content manifest) | 🆕 pattern doc, same issue |
| Show my deployed projects | IE app renders URLs in an iframe | ✅ (document the pattern) |
| My own apps (About / Projects / Contact) | `apps` prop | ✅, DX via 🔶 #128 |
| My own look (wallpaper, avatar, icons) | wallpaper/avatar props ✅; boot/login stay Microsoft-branded | 🆕 **branded boot** (S3, shared) |
| Don't persist visitor A's window mess for visitor B's session | Persistence is always-on localStorage/IDB | 🆕 **persistence modes** (below) |
| Analytics on what visitors open | `onEvent` ✅ | ✅ + recipe doc (GA/Umami adapter snippet) |
| Works on the phone my visitors actually use | Dismissable warning only | 🔶 #125 |
| SSR/Next.js embedding | SSR-safe but undocumented | 🔶 #114 (SSR section) |

### Derived requirements

**🆕 R1 — Deep linking & URL state.** `?open=D:/posts/hello.md` (or a
`route→action` map prop) opens that file's window on load; optional
history-integration so window focus/close maps to back/forward; a
`getShareUrl(windowId)` helper for share buttons. Without this a blog has no
permalinks — the single hardest blocker for S2, and S3 reuses it for campaign
share-links and QR codes.

**🆕 R2 — Content pipeline: markdown viewer + content manifest.** (a) A
`MarkdownViewer` built-in app (render .md with XP-era chrome — Notepad stays
faithful plain-text); (b) a documented **content-source adapter**: a manifest
(JSON or generated from a folder of .md files at build time) → filesystem
nodes, so a Astro/Next/Vite blog can feed posts in without hand-writing
filesystem JSON; (c) the same manifest drives host-side SEO mirrors (static
HTML fallback pages / prerender) and RSS — pattern documentation + a tiny
example repo section in USAGE, not engine magic.

**🆕 R3 — Persistence modes.** `persistence: 'local' | 'session' | 'none'` per
instance: blogs and campaigns usually want `'session'` or `'none'` (every visit
pristine), games want `'local'` (today's behavior, stays default). Cheap to
implement on the existing per-instance `Storage` handle (#95) — back it with
sessionStorage / in-memory.

## S3. Marketing / creative campaign

### The reference implementation exists — A24's *Y2K* movie site

A24 shipped exactly this product category: an interactive Y2K desktop promo with
an instant-messenger **AI chatbot** ("CoolBlue99"), a mixtape-builder toy, and a
README.txt establishing the fiction. Confirms the demand and gives the feature
checklist. Marketing-industry sources add: interactive nostalgia content is
engagement-driven, multi-channel (site + social + email), and time-boxed.

### Jobs-to-be-done → engine reality

| Job | Today | Verdict |
|---|---|---|
| Full brand takeover of the world (files, sites, wallpaper) | `fileSystemMode="replace"`, wallpapers, cultures | ✅ #77 |
| **Branded boot & login** (logo, text, startup sound — the first 5 seconds ARE the campaign) | BootScreen/LoginScreen hardcode XP branding | 🆕 **R4** |
| A chatbot character in the messenger (à la CoolBlue99) | #119 QQ is scripted-only | 🔶 extend #119: **pluggable async reply provider** (host supplies `getReply()`; AI or live agent behind it) |
| CTA: "get tickets", newsletter signup, follow links | No external-link action/event; no form primitive | 🆕 **R5** (small): `openExternal(url)` action + `link:external` event (#116 family); lead-capture = a custom app (#128 makes it cheap) + XPDialog primitives ✅ |
| Funnel analytics | `onEvent` ✅ | ✅ + adapter recipe (same doc as S2) |
| Shareable moments (QR → a specific window; OG image per state) | nothing | 🆕 R1 (deep links) covers it |
| Every visitor starts clean | always-persistent | 🆕 R3 (`persistence: 'none'`) |
| Embeds in an existing brand site without hijacking | `mode="embedded"`, scoped CSS, storagePrefix | ✅ #73/#95 |
| Fast first paint on ad traffic | 3.0MB package, lazy apps, skipBoot ✅ | ✅ mostly; document a "campaign checklist" (skipBoot+autoLogin, preload wallpaper, subpath imports) |
| Time-boxed content ops (edit copy without redeploying) | `customFileSystem` is a prop — host can fetch JSON then mount | ✅ document the fetch-then-mount pattern |
| Legal/accessibility review | minimal a11y | 🔶 #124 |

### Derived requirements

**🆕 R4 — Branded boot & login.** Props for boot logo/text/progress style,
startup sound override, login-screen branding (background, title, user tile) —
the same seam #135's theme work needs anyway; scope as content-level overrides
(images/strings/audio), not a new theme engine. Fidelity note: defaults stay
pixel-XP; branding is strictly opt-in.

**🆕 R5 — External-link action + event.** `openExternal(url, {newTab})` on the
handle/action vocabulary + `link:external` emitted when the visitor leaves —
the conversion event every campaign measures. Tiny; slots into #115/#116.

**→ #119 comment** — reply-provider plug point (scripted script | host callback),
so an AI buddy is a host concern, not an engine feature.

## S4. Chinese-internet nostalgia content site

Reference: the project's own zh culture is already the best-in-class example.
Jobs: rich period content (✅ culture packages + #85 eggs), community-submitted
content (🔶 #129 defineCulture + validation makes third-party packs viable),
period sites in IE (✅, expanded by scenario-injectable pages, PUZZLE-DESIGN C3).
No new engine requirements beyond what S1–S3 derive; this scenario is content
authorship riding on #123/#129/#134.

## S5. Teaching / AI-demo sandbox

Jobs: deterministic resets (🔶 #115 `reset()` fix), seeded states
(🔶 #117 `initialSnapshot`), scripted walkthroughs (✅ L0 handle; 🔶 #134 L2
builder), observation (✅ `onEvent`), isolation (✅ storagePrefix; R3's
`persistence:'none'` is the missing piece for kiosk/classroom machines).
One nice-to-have, not filed: a guided-tour overlay (step highlights) — build as
a custom app when needed; #128 makes that cheap. No dedicated issue warranted.

---

## Consolidated new requirements from this document

| Req | What | Serves | Size |
|---|---|---|---|
| R1 | Deep linking & URL state (`?open=`, share URLs, optional history integration) | S2 permalinks, S3 QR/share, S5 seeded links | M |
| R2 | Content pipeline: MarkdownViewer app + content manifest adapter + SEO/RSS pattern docs | S2 (the blog job itself) | M |
| R3 | `persistence: 'local' \| 'session' \| 'none'` | S2, S3, S5 | S |
| R4 | Branded boot & login (logo/text/sound/tile overrides) | S3, S2 personalization | S–M |
| R5 | `openExternal` action + `link:external` event | S3 conversions, S2 outbound links | XS |
| — | #119 pluggable reply provider (AI buddy) | S3 (A24 pattern), S1 hint channel | comment on #119 |
| — | Analytics adapter recipe + campaign performance checklist + fetch-then-mount content ops | S2, S3 | docs (USAGE), fold into R1/R2 issues |

Everything else the scenarios demand is either already shipped (#73/#77/#95
embedding & replacement) or already filed (#112–#135).
