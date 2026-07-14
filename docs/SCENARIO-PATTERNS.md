# Scenario content patterns (#241)

Recurring recipes for building a puzzle's **content** — the pages, documents and
media the player reads — with the content-reference model instead of stuffing
everything inline in the scenario JSON.

The rule of thumb (complementary to [#207 copy extraction](./SCENARIOS.md)):

- **Small text** (dialogue, tray notifications, note bodies) → the scenario's
  **string tables**, for i18n and copy polish.
- **Large content** (fake webpages, long letters, images, audio) → **file
  references** (`ContentRef`), for the toolchain and the writer/designer split.

The scenario JSON ends up holding only _logic_.

## The building block: `ContentRef`

Three sources, one shape ([`src/content/types.ts`](../src/content/types.ts)):

```ts
type ContentRef =
  | string // inline — the content itself (fast path)
  | { url: string } // a host asset URL (build import / public/ / CDN)
  | { asset: string }; // a logical key, resolved via the pack's `assets` manifest
```

`{ asset }` is the **portable** reference: a content pack ships its own `assets`
map, so `{ asset: 'letter' }` resolves wherever the pack is mounted. References
resolve lazily and cache (see [`resolver.ts`](../src/content/resolver.ts)).

## Pattern 1 — the fictional website (三件套)

A fake 2005-era webpage the player must "visit" in Internet Explorer. Three
pieces:

1. **The page body** — an `.html` asset (author it as a real file, not an
   escaped JSON string).
2. **A site registry entry** — so IE serves your page instead of falling through
   to the search corpus or a Wayback iframe. Authorized pages always win (#149).
3. **A hook into the story** — usually a clue (a URL) the player discovers
   elsewhere.

```jsonc
{
  "id": "prologue",
  "assets": {
    "bbs-home": { "url": "/packs/prologue/sites/bbs.html" },
  },
  "sites": {
    // Keys are normalized (protocol / www. / trailing slash / case stripped),
    // so write them however reads best.
    "https://www.qingchun-bbs.com/": {
      "title": "青春 BBS — 首页",
      "html": { "asset": "bbs-home" },
    },
  },
}
```

The player types (or clicks a clue that opens) `qingchun-bbs.com`; IE renders
`bbs.html`. A short page can inline its HTML directly (`"html": "<h1>…</h1>"`)
during prototyping and grow into an asset later without touching the story.

## Pattern 2 — the long document clue

A letter, a diary page, a printout — too long to sit inline in the JSON, and the
writer wants to edit it as Markdown.

```jsonc
{
  "id": "prologue",
  "assets": {
    "grandma-letter": { "url": "/packs/prologue/docs/letter.md" },
  },
  "files": {
    "My Documents": {
      "type": "folder",
      "name": "My Documents",
      "children": {
        "letter.md": {
          "type": "file",
          "name": "外婆的信.md",
          "app": "MarkdownViewer",
          "contentRef": { "asset": "grandma-letter" },
        },
      },
    },
  },
}
```

`contentRef` is mutually exclusive with inline `content`: inline is the fast
path, `contentRef` moves the body out of the scenario JSON. The file opens
normally; the body loads on first read and caches.

Gate it behind a door if it's a payoff: mark the file `"locked": true` and have a
trigger `unlock` it once the player earns the key — the long document becomes the
reward for solving the step, not something they stumble into early.

## Authoring notes

- **Keep the manifest honest.** Every `{ asset }` must have a matching `assets`
  entry; a dead key resolves to `null` at runtime (and, once shipped, is a lint
  error — #238). Avoid asset → asset chains; point assets at concrete sources.
- **Mirrors need the text.** SEO mirror pages ([#137](./SCENARIOS.md)) are built
  synchronously, so a referenced (`{ url }`/`{ asset }`) blog `source` must be
  pre-resolved (`buildPostMirrorHtml(post, site, bodyHtml)`); an inline `source`
  renders as before.
- **Schema:** [`content-pack.schema.json`](../src/content/content-pack.schema.json)
  describes `ContentPack` / `ContentRef` / `SiteDef` for editor validation.
