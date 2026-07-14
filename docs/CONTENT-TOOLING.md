# Content-pack tooling spec (#241 → #238)

The content-reference model (#241) turns a puzzle's content into a portable
{@link ContentPack} — an asset manifest, authorized IE sites, a filesystem
fragment, a scenario, and string tables. Once content lives across many files
and asset keys, authors need tooling to keep the graph honest. This document is
the **specification** the tooling in #238 implements; #241 ships the data model,
schema, and this spec, not the CLI itself.

All commands operate on one or more `ContentPack` objects (resolved from a
`.ts`/`.json` entry or a pack directory) and share the resolver semantics in
`src/content/resolver.ts`.

## `pack lint` — integrity checks

Static checks over a pack; exit non-zero on any error. Each finding carries a
severity, the offending key/path, and a one-line reason.

| Check                       | Severity | Rule                                                                                                                                                                             |
| --------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Broken reference**        | error    | Every `{ asset: k }` (in `files[*].contentRef`, `sites[*].html`, `sites[*].favicon`, `assets[*]`) has a matching `assets[k]`. A dangling key would resolve to `null` at runtime. |
| **Orphan asset**            | warning  | Every `assets[k]` is referenced by at least one `{ asset: k }`. Unreferenced assets are dead weight (or a typo at the use site).                                                 |
| **Asset chain / cycle**     | error    | An `assets[k]` value must be a concrete source (inline or `{ url }`), never `{ asset }`. Catches the `a → b → a` loop the resolver guards against at runtime.                    |
| **Site URL collision**      | error    | No two `sites` keys normalize (per `normalizeSiteUrl`, #149) to the same URL — the later would silently shadow the earlier. Report both raw keys.                                |
| **Content/ref exclusivity** | error    | A `file` node sets at most one of `content` / `contentRef`.                                                                                                                      |
| **Unknown node app**        | warning  | A `file` node's `app` (or extension fallback) resolves to a registered app.                                                                                                      |

Machine-readable output (`--json`) mirrors the review-tool finding shape:
`{ check, severity, where, summary }`.

## `pack report` — completeness & size

Summarizes a pack for the #208 size budget and a release checklist:

- **Asset inventory** — count and resolved byte size per source kind
  (inline / url / asset), plus a total. `{ url }` sizes are fetched (or read
  from a provided asset root) so a pack that looks small inline isn't hiding
  megabytes behind URLs.
- **Scenario size** — the serialized `scenario` bytes against the #208
  `SCENARIO_MAX_BYTES` ceiling, now that large bodies have moved to refs.
- **Coverage** — sites / files / strings-per-culture counts; flags a culture
  present in one string table but missing from another.

## `pack graph` — content-reference edges

Extends the existing scenario graph (`src/scenario/puzzleGraph.ts`) with content
edges so the author can see how pages, documents, and clues connect:

- a `file`/`site` node → the `asset` it references (`contentRef` / `html`),
- a `contentContains` gate → the file path it reads,
- an IE `sites` entry → the URLs its resolved HTML links to (best-effort anchor
  scan), so a fake web's link graph is visible.

Emits the same DOT/JSON the puzzle graph does; content edges get a distinct
style so they read apart from door/key edges.

## Shared resolution note

`{ url }` checks that need the asset body (broken-link fetch, size report,
anchor scan) accept an `--asset-root` so a pack can be linted offline against
local files instead of hitting the network — mirroring how a host mounts assets
from `public/` at build time.
