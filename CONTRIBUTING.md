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

CI will run `lint`, `typecheck`, and unit tests on every push.

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
