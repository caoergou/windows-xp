# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

An **embeddable, scriptable Windows XP desktop engine** for React + TypeScript, published as `@caoergou/windows-xp`. It faithfully recreates the XP experience (file system, apps, boot/login flow, window management, Luna visuals) while exposing it as a product: content is injectable (`customFileSystem`, culture packages, custom apps), every user action emits a typed event (`onEvent`), and the desktop is drivable via an imperative `ref` handle.

Principles, red lines, and the doc map live in `AGENTS.md`; code-level rules in `docs/DEVELOPMENT.md`; the XP-authenticity baseline in `FIDELITY.md`; roadmap in issue #86; design/analysis docs in `docs/` (`USE-CASES.md`, `PUZZLE-DESIGN.md`, `OS-PLATFORM-VISION.md`).

## Development Commands

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run preview  # Preview production build
npm test         # Run tests
```

## Visual Verification (REQUIRED for every UI change)

Visual fidelity is a first-class deliverable of this project, not a nice-to-have.
**Any change that touches rendered UI must be verified by looking at a real
screenshot** — never "assume it looks right" from the code alone. Reading the diff
tells you what you changed; only a screenshot tells you what the user sees. When a
change is subtle (spacing, borders, gradients, flush edges, sort arrows, icon
alignment), the screenshot is the *only* reliable signal.

The behavioural e2e assertions (`toBeVisible`, `getByText`) confirm the DOM exists;
they do **not** confirm it looks like Windows XP. Do both: assert behaviour in a
spec, and eyeball a screenshot.

### How to capture a component screenshot

The e2e stack (Playwright + a pre-installed Chromium at `PW_CHROMIUM_PATH`, e.g.
`/opt/pw-browsers/chromium`) is already wired for this. For a one-off screenshot,
write a standalone script and read the PNG back with the file-reading tool.

1. Start the dev server: `npm run dev` (serves `http://localhost:5173/windows-xp/`;
   Vite may fall back to `5174` if `5173` is taken — check the startup log).
2. Write a script **inside the repo tree** (so Node resolves `playwright` from
   `node_modules`; a scratchpad path will fail with `ERR_MODULE_NOT_FOUND`). Delete
   it afterwards so it never gets committed.
3. Save the PNG to the scratchpad dir, then open it with the Read tool and inspect
   it against the checklist below — in **both** `en` and `zh`.

```js
// _shot.mjs  — run from repo root: `node _shot.mjs`, then `rm _shot.mjs`
import { chromium } from 'playwright';

const BASE = 'http://localhost:5173/windows-xp/';
const OUT = '<your scratchpad dir>';
const PW = 'forthe2000s'; // e2e/helpers/login.ts LOGIN_PASSWORD

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

async function shot(lang, file) {
  const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
  // Skip the boot animation so we land on the login screen quickly.
  await page.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem('xp_first_boot_done', 'true');
    localStorage.setItem('xp_power_state', 'running');
  });
  await page.goto(`${BASE}?lang=${lang}`, { waitUntil: 'networkidle' });

  // Log in (default password), then wait for the desktop.
  const pw = page.locator('input[type="password"]').first();
  await pw.waitFor({ state: 'visible', timeout: 10000 });
  await pw.fill(PW);
  await page.keyboard.press('Enter');
  await page.waitForSelector('[data-testid="taskbar"]', { timeout: 20000 });

  // Drive the UI to the exact state you want to inspect. Stable selectors:
  //   desktop icons  → [data-english-testid="desktop-icon-<english-name>"]
  //   file items     → [data-testid="file-item-<key>"]
  //   toolbar btns   → button[title="<translated title>"]
  await page.locator('[data-english-testid="desktop-icon-my-documents"]').dblclick();
  await page.waitForSelector('[data-testid="file-item-readme.txt"]');

  await page.screenshot({ path: `${OUT}/${file}` });        // full frame
  // For a single component, screenshot the locator instead:
  //   await page.locator('.xp-window').screenshot({ path: ... });
  await page.close();
}

await shot('en', 'view-en.png');
await shot('zh', 'view-zh.png');
await browser.close();
```

Tips: use `page.locator(sel).screenshot()` to crop to one window/component; bump
`viewport` for tall content; `page.waitForTimeout(400)` after opening a menu so
animations settle; language is set with the `?lang=en|zh` query param.

### XP-style detail checklist

Inspect every screenshot against these — a change is not "done" until it passes.
The authoritative behaviour/visual baseline is `FIDELITY.md` (✅/🟡/❌ per feature);
this list is the recurring per-change eyeball pass.

- **Luna chrome** — title bars use the blue Luna gradient with the correct
  glossy highlight; the min/max/close buttons are the real XP glyphs, red close
  button on the right; window borders are the ~3px Luna blue, not flat 1px.
- **Flush & spacing** — panels/toolbars/list headers sit *flush* against their
  container edges (no stray padding gaps, e.g. a Details header must touch the
  address bar). Match XP's tight paddings; don't invent whitespace.
- **Typography** — Tahoma-style UI font; no oversized/undersized text; menu
  mnemonics render as `File(F)` etc. where the locale uses them.
- **Gradients & fills** — column headers, buttons and selected rows use the pale
  blue XP gradients (not flat grey); selection highlight is XP blue `#316AC5`-ish.
- **Icons** — correct 16px/32px/48px XP icons, crisp (not stretched), aligned to
  the text baseline; folder vs file vs app icons are right.
- **Affordances** — sort arrows (▲/▼) on the active Details column; hover states
  on toolbar buttons; disabled menu items greyed, not clickable no-ops.
- **i18n parity** — capture `en` AND `zh`. No untranslated raw filesystem keys
  leaking into the UI (e.g. a Chinese folder key showing in the English desktop),
  no clipped/overflowing labels, dates/sizes formatted per locale. China-only
  culture apps (QQ, 360, 迅雷, …) stay Chinese-only — do not add English for them.
- **Pixel realism** — compare against real XP references when unsure; prefer
  value-for-value matching of xp.css over eyeballed approximations.

If a screenshot reveals a defect, fix it and re-capture before committing. Record
what you verified (and attach/inspect the PNG) so the check is auditable.

### Pitfalls learned the hard way

These are real misses from past changes — check them explicitly, because a
casual glance will pass over all of them:

- **Full-frame screenshots hide small defects.** A 4px clipped tooltip tail, a
  1px border, a slightly-off gradient, a header that isn't quite flush — none of
  these are visible in a 1024×768 capture. For any fine detail, take a **tight,
  zoomed crop** of the exact region (`clip: { x, y, width, height }`, or
  `locator.screenshot()`), and inspect *that*. "Looks fine in the full frame" is
  not verification.
- **Don't trust CSS geometry math for transformed elements.** A `rotate(45deg)`
  diamond tail extends further than its box; `transform`, `box-shadow`, and
  borders all push real pixels past the layout box. Compute a first guess, then
  **measure the rendered rect** (`locator.boundingBox()`) and log the numbers to
  confirm — twice I "did the math" and was wrong by a few px.
- **Check overlap and z-index against fixed chrome.** The taskbar uses the max
  z-index (`2147483647`); anything that overlaps it is hidden behind it. A
  floating element near the taskbar (balloon, popup, menu) must sit **entirely
  clear** of it — verify no part is clipped or occluded, at zoom.
- **Anchored elements must actually point at their anchor.** A tray balloon must
  emanate from its specific tray icon (tail centred on the icon), a tooltip from
  its trigger, a menu from its button. Don't settle for "roughly in the corner"
  — measure the anchor's centre and confirm the pointer/tail lines up (log the
  two x-coordinates; they should match).
- **When the user reports a visual bug, reproduce it at the same zoom they saw
  it, fix, then re-capture the *same crop* to prove it's gone.** Do not re-assert
  "it's correct" from the code — the reason it shipped broken is that the code
  looked right.

## Tech Stack

- **Framework**: React 18 + Vite 5
- **Language**: TypeScript 5
- **Styling**: styled-components + xp.css (Windows XP theme)
- **Window interaction**: react-draggable + react-resizable
- **Internationalization**: i18next

## Architecture

### Context Providers (in `src/components/AppProviders.tsx`)

```
I18nextProvider
└─ AppRegistryProvider
   └─ CultureProvider
      └─ CultureAwareProviders
         └─ StorageProvider
            └─ EventBusProvider
               └─ UserSessionProvider
                  └─ FileSystemProvider
                     └─ WindowManagerProvider
                        └─ TrayProvider
                           └─ ModalProvider
                              └─ App
```

- `AppRegistryProvider` — injectable app registry (`apps` prop) and `useAppRegistry()`.
- `CultureProvider` — injectable culture packages (`cultures` prop) and `useCulture()`.
- `StorageProvider` — per-instance isolated storage handle (`storagePrefix`); all localStorage/IndexedDB access goes through `useStorage()`.
- `EventBusProvider` — one typed event bus per instance (`src/events.ts`); bridged to the `onEvent` prop and `useXPEvents()`.
- `UserSessionProvider` — login state, wallpaper, screensaver.
- `FileSystemProvider` — virtual file system with persistence.
- `WindowManagerProvider` — window lifecycle, z-index, focus.
- `TrayProvider` — system tray icon registry.
- `ModalProvider` — alert/confirm/prompt/password dialogs.

### Events & Imperative API (`src/events.ts`, `src/components/XPBridge.tsx`)

- `src/events.ts` is the single event catalog (typed `XPEvent` union, `domain:action` naming). Contexts emit; consumers subscribe via the `onEvent` prop or `useXPEvents()`.
- `XPBridge.tsx` wires the `ref` handle (`XPHandle`) via `useImperativeHandle`: top-level `openApp`/`openFile`/`closeWindow`/`showAlert`/`reset` plus the grouped actuation APIs from #115 — `fs.*` (read/write/create/delete/unlock), `session.*`, `appearance.*`, `windows.*`, `sound.play`, `emit`, and `getSnapshot`/`loadSnapshot` (versioned XPSnapshot save/load, `src/snapshot.ts`, #117). New host-facing capabilities belong on this handle.
- Rule: new user-visible interactions should emit an event; names follow the #130 grammar.

### Window Management (`src/context/WindowManagerContext.tsx`)

Each window object:
```typescript
{
  id, appId, title, component, componentProps,
  icon, props, isMinimized, isMaximized,
  zIndex, width, height, left, top
}
```

Windows persist across refreshes via localStorage('xp_open_windows'). Components are restored by WindowFactory.tsx using appId + componentProps.

### App Registry (`src/registry/apps.tsx`)

All applications are registered in `APP_REGISTRY`, the single source of truth for:
- Application metadata (id, `nameKey`/`name`, icon)
- Default window configuration (width, height, singleton, resizable)
- Locale gating: `locales` — optional list of culture ids (e.g. `['zh']` for the China-only apps); omit for apps available everywhere
- File associations and restoration logic

Prefer `nameKey` (an i18n key resolved via `getAppDisplayName`) over a hardcoded
`name`; `name` remains as the fallback when no `nameKey` is set.

```typescript
export const APP_REGISTRY: Record<string, AppRegistryEntry> = {
  Calculator: {
    id: 'Calculator',
    name: 'Calculator',            // fallback only —
    nameKey: 'apps.calculator',    // display name resolves through i18n first
    icon: 'calculator',
    window: { width: 208, height: 196, resizable: false, singleton: true },
    associations: [{ appField: 'Calculator', getProps: () => ({}) }],
    restore: (props) => <Calculator {...props} />,
  },
  // ... more apps
};
```

Use `resolveFileOpen(key, item)` to resolve a filesystem node to window props, and `getAppDisplayName(entry)` for names (nameKey translation → `name` fallback).

### File System (`src/context/FileSystemContext.tsx`)

- Structure defined in `src/data/filesystem.json`
- Recycle Bin items loaded dynamically from `src/data/recycle_bin/*.json`
- File node properties: `type`, `name`, `icon`, `locked`, `password`, `broken`, `children`

### User Session (`src/context/UserSessionContext.tsx`)

- User config in `src/data/user_config.json`
- `login(password)` / `logout()` methods
- Session state in localStorage

## Applications (`src/apps/`)

| App | File | Description |
|-----|------|-------------|
| Explorer | Explorer.tsx | File browser with path navigation |
| InternetExplorer | InternetExplorer/ | Web browser with history, favorites, era portals |
| Notepad | Notepad.tsx | Text editor (undo, find/replace, word wrap, save to FS) |
| PhotoViewer | PhotoViewer.tsx | Image viewer |
| Calculator | Calculator.tsx | Calculator with full functionality |
| MicrosoftPaint | MicrosoftPaint.tsx | Drawing app; saves PNG into the virtual FS |
| Minesweeper | Minesweeper.tsx | Classic minesweeper (XP sprites, best times) |
| Solitaire | Solitaire.tsx | Solitaire with full move rules & win detection |
| WindowsMediaPlayer | WindowsMediaPlayer.tsx | Media player UI (plays bundled sample) |
| CommandPrompt | CommandPrompt.tsx | CMD emulator (real command set + easter eggs) |
| ControlPanel | ControlPanel/ + ControlPanel.tsx | System settings (display/sound/mouse applets) |
| TaskManager | TaskManager.tsx | Task manager over live window state |
| QQLogin | QQLogin.tsx | QQ login dialog (zh culture) |
| SafeGuard360 | SafeGuard360.tsx | 360 antivirus with scripted threat-scan story (zh) |
| Thunder | Thunder.tsx | Thunder download manager shell (zh) |
| KugouMusic | KugouMusic.tsx | Kugou music player shell (zh) |
| BaofengPlayer | BaofengPlayer.tsx | Baofeng video player shell (zh) |
| WPSOffice | WPSOffice.tsx | WPS Office shell (zh) |
| HelpAndSupport | HelpAndSupport.tsx | Help center |
| RunDialog | RunDialog.tsx | Run dialog (winver/sol/winmine/bsod eggs) |
| VolumeControl | VolumeControl.tsx | Volume settings |
| NetworkConnections | NetworkConnections.tsx | Network status |
| BrowserPlugins | BrowserPlugins.tsx | Browser plugins page (IE nostalgia content) |
| FileProperties | components/FileProperties.tsx | File properties dialog (registry entry) |
| DummyApp | (in registry) | "Coming soon" placeholder — no content references it anymore |

## Adding Content

**New files in the filesystem**: Edit `src/data/filesystem.json`

```json
{
  "MyFile.txt": {
    "type": "file",
    "name": "MyFile.txt",
    "app": "Notepad",
    "content": "File content here"
  }
}
```

**Recycle Bin items**: Add JSON files to `src/data/recycle_bin/`

**Desktop shortcuts**: Add entries to the root.children section of filesystem.json

## Adding a New Application

1. Create component in `src/apps/YourApp.tsx`
2. Add entry in `src/registry/apps.tsx` (APP_REGISTRY)
3. Add a desktop shortcut or file association in `filesystem.json`

**Example registry entry**:
```typescript
YourApp: {
  id: 'YourApp',
  name: 'Your App',              // fallback; user-facing name comes from i18n
  nameKey: 'apps.yourApp',       // add the key to both en.json and zh.json
  icon: 'app_window',
  window: { width: 400, height: 300, singleton: true },
  associations: [{ appField: 'YourApp', getProps: () => ({}) }],
  restore: (props) => <YourApp {...props} />,
},
```

Note: `restore` props are persisted for refresh-restoration and must be JSON-serializable (no functions/elements) — see `docs/DEVELOPMENT.md` §1. A `defineApp()` factory that simplifies all of this is planned in #128.

## Platform-Readiness Rules (#143 — enforced by `npm run guard:purity`)

The long-term direction (#143 RFC, `docs/OS-PLATFORM-VISION.md`) decouples the
engine from "XP": the OS becomes a definable package. We are NOT building that
yet — but every PR must avoid growing the surgery cost. Non-negotiables
(details: `docs/DEVELOPMENT.md` §7; quick list: `AGENTS.md` red lines 11/12):

- **Mechanism vs. XP-skin layering**: engine dirs (`src/context`, `src/hooks`,
  `src/utils`, `src/events.ts`, `src/snapshot.ts`) must contain zero color
  literals, zero xp.css imports, zero XP-specific chrome assumptions. CI-enforced.
- **Inline hex ratchet**: the count of inline hex colors in `src/` may only go
  down (baseline lives in `scripts/guard-purity.mjs`). New code uses `COLORS`
  (`src/constants.ts`) / FIDELITY §K.1 tokens — never literals.
- **Menus are data**: new apps pass structured items to `XPMenuBar`, never
  hand-rolled menu DOM (migrates to `defineApp`'s `menus:` field, #128).
- **No behavior-semantics leakage**: don't hard-code XP behaviors (e.g.
  "minimize targets a taskbar button", Ctrl as the modifier) outside window
  mechanics — these become `BehaviorProfile`/`primaryModifier` inputs later.
- Content references apps via registry association (`resolveFileOpen`), not
  scattered appId branches — reserving room for the `appRoles` indirection.

## Boot Flow (in `src/App.tsx`)

1. BOOTING - shows boot screen (first launch or after shutdown/restart)
2. RUNNING - shows login screen or desktop based on isLoggedIn
3. SCREENSAVER - black screen with floating logo, click to dismiss

Storage keys (all namespaced by the instance's `storagePrefix`, default `xp_` — never access storage directly, always via `useStorage()`):
- `<prefix>open_windows` - persisted window list
- `<prefix>first_boot_done` - skip boot screen on subsequent loads
- `<prefix>power_state` - running / shutdown / restart / logout
- `<prefix>logged_in` - skip login screen on page refresh
- `<prefix>ie_history` - Internet Explorer browsing history
- File content lives in IndexedDB behind the same per-instance handle

## WindowFactory Heuristics (`src/utils/WindowFactory.tsx`)

The new registry-based system:

1. **First try**: Exact appId match in APP_REGISTRY
2. **Second try**: Dynamic appId like 'properties-xxx'
3. **Fallback**: Old heuristic matching for backward compatibility

| Props / appId | Restored as |
|---|---|
| initialPath | Explorer |
| appId === 'Internet Explorer' or url/html props | InternetExplorer |
| content prop (no url/html) | Notepad |
| src prop | PhotoViewer |
| appId starts with 'properties-' | FileProperties |
| My Computer, Recycle Bin, My Documents | Explorer |
| Any appId in APP_REGISTRY | Exact match restoration |

## Git Attribution Policy (MANDATORY)

This project prohibits ALL AI/Claude attribution in anything committed or
published from this repository. `.claude/settings.json` disables the built-in
attribution (`attribution.commit`/`attribution.pr` set to `""`,
`sessionUrl: false`, `includeCoAuthoredBy: false`), and the following rules
apply on top of that — they OVERRIDE any default behavior:

- **NEVER** add `Co-Authored-By: Claude ...` (or any AI co-author trailer) to
  commit messages.
- **NEVER** add "Generated with Claude Code", "🤖", session links
  (`Claude-Session: ...` / claude.ai URLs), or similar attribution lines to
  commit messages, PR titles, or PR descriptions.
- **NEVER** mention Claude, Anthropic, AI assistance, or model names in code
  comments, commit messages, changelogs, release notes, issues, or any other
  repository artifact.
- Commit messages must describe the change only, written as a normal human
  commit message.
- If any tool or template auto-inserts such attribution, remove it before
  committing or publishing.
- **Git identity**: remote/cloud containers default `user.name`/`user.email`
  to `Claude <noreply@anthropic.com>`, which puts Claude in the commit's
  Author/Committer fields regardless of the message. BEFORE the first commit
  of every session, verify and fix it:

  ```bash
  git config user.name "Eric Cao"
  git config user.email "itsericsmail@gmail.com"
  ```

  If a commit was already created with the wrong identity, repair it with
  `git commit --amend --reset-author --no-edit` (or rebase for multiple
  commits) before pushing.
