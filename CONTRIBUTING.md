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

In addition, `visual.yml` runs the micro-component screenshot diff on every PR,
and `deploy.yml` builds and publishes to GitHub Pages on pushes to `main`. A PR
that breaks any of these goes red before it can merge.

## Releases

Tagging a commit `v*` triggers `.github/workflows/publish.yml`, which runs the
quality gate and then `npm publish`. Publishing requires an **`NPM_TOKEN`**
repository secret — an npm automation token for `registry.npmjs.org`. The
built-in `GITHUB_TOKEN` does **not** authenticate against npm, so this secret
must be configured under **Settings → Secrets and variables → Actions** for
releases to succeed.

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
5. Ensure all CI checks pass.
6. Update this guide if you change the development workflow.
