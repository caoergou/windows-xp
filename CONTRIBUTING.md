# Contributing to Windows XP Simulator

Thanks for your interest in improving this project! This simulator aims to faithfully recreate the classic Windows XP desktop experience in React, so contributions should preserve the retro Y2K aesthetic.

## Getting Started

```bash
npm ci
npm run dev
```

## Development Workflow

Before opening a pull request, please run the quality checks locally:

```bash
npm run lint
npm run typecheck
npm run test -- --run
npm run test:e2e
```

### What CI runs

Every pull request (and every push to `main`) is gated by the `CI` workflow
(`.github/workflows/ci.yml`):

- **quality** job — `lint`, `typecheck`, `guard:nocheck`, the **full** unit
  suite (`vitest run`), a library build, and `size:check`.
- **e2e** job — the Playwright end-to-end suite (`test:e2e`) in the official
  Playwright container.
- **consumer-smoke** job (`npm run consumer:smoke`, #206) — packs the tarball
  and consumes it from a clean Vite + React app (render smoke, `style.css` +
  `./components` subpaths, i18n side-effect / `sideEffects` integrity, React
  18 + 19 type-check). Heavier than the unit gate, so it runs only on **`main`
  pushes and release-labelled PRs**. Run it locally before a release with
  `npm run consumer:smoke`.

In addition, `visual.yml` runs the micro-component screenshot diff on every PR,
and `deploy.yml` builds and publishes to GitHub Pages on pushes to `main`. A PR
that breaks any of these goes red before it can merge.

Scenario and content changes also run `npm run scenario:ci`: the reference
prologue must pass `lint` and headless `solve`, and the directory-form reference
content pack must pass `pack --check`. This is the deterministic story/content
gate provided by `@caoergou/xp-scenario-tools`.

### First-paint budget (#210)

For the marketing / 404-egg scenarios (`docs/USE-CASES.md` S3) the first paint
*is* the product, so bundle size is gated, not just watched:

- **`size:check`** (library build) — no JS chunk over 1 MB, dist under 10 MB
  (guards against the base64-inline regression that once made the package 17 MB).
- **`size:check:app`** (site/demo build, run after `npm run build`) — **no JS
  chunk over 500 kB**. This is the line Vite only *warns* about, made a hard fail
  so the `AppProviders` chunk can't drift back toward the 734 kB it was at before
  #210 (it was base64-inlining ~270 kB of icon PNGs into JS).

Current site-build first-paint chunks (minified / gzip):

| chunk | min | gzip |
|---|---|---|
| `AppProviders` (engine + providers) | ~323 kB | ~100 kB |
| `vendor` (react, react-dom, styled-components, i18next) | ~285 kB | ~93 kB |
| `i18n-locales` (en + zh) | ~37 kB | ~16 kB |

**Budget target: engine-core + boot ≤ 200 kB gzip.** We're close (the vendor
chunk caches across visits). Keep bytes out of the first paint:

- Assets load as URLs, not base64 — `build.assetsInlineLimit: 0` in
  `vite.config.ts`. An icon only downloads when its `<img>` renders, so most of
  the icon set never touches first paint.
- Heavy app components stay behind `React.lazy` (see `src/registry/apps.tsx`);
  never import an app component eagerly into a provider.
- Third-party libs and the i18n locale JSON are split into their own chunks via
  `manualChunks`. Keep them a **single** `vendor` chunk — fine-grained
  react/styled-components splitting reorders chunk init and breaks `React`.

## Releases

Tagging a commit with the engine version (for example `v0.4.0`) triggers
`.github/workflows/publish.yml`. Before tagging:

1. Set the engine version in the root `package.json` and the scenario-tools
   version in `tools/scenario-tools/package.json`; keep the tool's engine peer
   range and `package-lock.json` aligned.
2. Move the accumulated changelog entries into a dated version section.
3. Run `npm run release:preflight -- --tag=v<engine-version>`. The workflow
   rejects mismatched tags, lockfile versions, peer ranges, or changelog entries.

The workflow runs the full quality and scenario gates, builds both workspaces,
and packs `@caoergou/windows-xp` and `@caoergou/xp-scenario-tools` exactly once.
Those tarballs are then installed in clean consumer projects:

- The engine smoke test builds and renders a Vite + React app, verifies package
  subpaths, CSS and i18n side effects, and type-checks against React 18 and 19.
- The scenario-tools smoke test installs both packages and runs `lint`, `solve`,
  `graph`, and `pack --check` against a copied content pack.

Only those tested artifacts are published. Each package is checked independently
on npm first, so rerunning a partially successful release skips an existing
version and resumes with the missing package. The tarballs are also retained as
a workflow artifact for 30 days.

Authentication uses **npm OIDC trusted publishing** via the workflow's
`id-token: write` permission — **no `NPM_TOKEN` or other secret is required**,
and provenance is attached automatically. The workflow pins Node 22.22 and npm
11.11 because trusted publishing requires Node 22.14+ and npm 11.5.1+.
Trusted publishing is configured separately for every npm package. Link each
package to the `caoergou/windows-xp` repository and the `publish.yml` workflow,
with no GitHub environment unless the workflow adds one.

npm only permits trusted-publisher configuration after a package exists. When a
new workspace package is introduced, bootstrap its first version in a separately
reviewed, one-time workflow using a short-lived token. Immediately configure the
package's trusted publisher, remove the bootstrap workflow and token, and use
`publish.yml` for every later release. The bootstrap version cannot gain
provenance retroactively; subsequent OIDC-published versions include it
automatically.

## Design Principles

- Stay faithful to the original Windows XP look and feel.
- Avoid modern UI trends (heavy shadows, rounded corners, gradients) unless they existed in XP.
- Keep the Internet Explorer 6 visual style: green navigation buttons, classic menu bar, and XP gray tones.
- Use the existing i18n setup for user-facing strings; do not hard-code Chinese or English text in components.

## Pull Request Process

1. Open an issue first for large features or architectural changes.
2. Make minimal, focused changes.
3. Add or update tests when changing behavior.
   - **Persistence and window-restore changes MUST come with tests.** These
     paths (localStorage/IndexedDB persistence, `WindowFactory` restore
     branches, recycle bin, clipboard, boot state machine) have dedicated
     suites under `test/` — extend them rather than shipping untested changes.
4. When changing UI interactions or styles, check and update the matching
   entry in `FIDELITY.md` (the XP fidelity baseline).
5. **New user-visible interaction → register an event per the spec.** The event
   catalog (`src/events.ts`) is public API for scenario authors. Follow the
   `domain:action` grammar and payload rules in
   [`docs/EVENTS.md`](docs/EVENTS.md), then run `npm run docs:events` to
   regenerate the USAGE reference table — CI fails if it drifts.
6. Ensure all CI checks pass.
7. Update this guide if you change the development workflow.
