---
title: Subpath imports & primitives
---

# Subpath imports & standalone primitives

For smaller bundles, import only what you need:

```jsx
// Full desktop (largest bundle)
import { WindowsXP } from '@caoergou/windows-xp';

// Individual applications
import { Minesweeper } from '@caoergou/windows-xp/apps';

// System components — must render inside the desktop's providers
import { Window, Desktop, Taskbar } from '@caoergou/windows-xp/components';

// Standalone UI primitives — no providers needed
import { XPButton, XPDialog, XPIcon } from '@caoergou/windows-xp/components';

// Hooks and providers
import {
  useWindowManager,
  useFileSystem,
  useAppRegistry,
  useCulture,
} from '@caoergou/windows-xp/hooks';

// Theme tokens
import { COLORS, xpButtonStyles, xpScrollbarStyles } from '@caoergou/windows-xp/theme';

// App registry helpers
import { APP_REGISTRY, resolveFileOpen, getAppDisplayName } from '@caoergou/windows-xp/registry';

// Optional .xpspack verification and loading (kept out of the default bundle)
import { loadContentPackFromXpspack } from '@caoergou/windows-xp/content-pack-loader';
```

The content-pack loader verifies the restricted ZIP container, canonical
manifest, SHA-256 payload hashes, independently stored binary assets, and an
optional host-trusted Ed25519 signature before returning a `ContentPack`.
Verified assets are exposed through media-typed `data:` URLs. The loader supports
uncompressed and gzip chunks in the browser. Provide the `decompress` callback
for Brotli on hosts that do not expose it through the Compression Streams API.
Encrypted chapters are returned through `loadChunk(id)` and request a
non-extractable AES-GCM key lazily through the host-owned `keyProvider`; the
loader never persists that key.

> `Window`, `Taskbar`, `Desktop`, and the hooks above are wired to the
> desktop's contexts and must render inside the providers exported from the
> root entry (or `AppProviders`). The `XP*` primitives below need nothing.

## System components inside providers

Most users render `<WindowsXP>` and get the full provider tree automatically.
If you are building a custom shell, import `AppProviders` and render the system
components inside it:

```jsx
import { AppProviders } from '@caoergou/windows-xp';
import { Desktop, Taskbar, Window } from '@caoergou/windows-xp/components';
import '@caoergou/windows-xp/style.css';

function CustomShell() {
  return (
    <AppProviders>
      <Desktop />
      <Window id="my-window" appId="Notepad" title="Notepad" />
      <Taskbar />
    </AppProviders>
  );
}
```

## Standalone UI primitives (no providers)

`@caoergou/windows-xp/components` ships **zero-dependency primitives** you can
drop anywhere — no `<WindowsXP>`, no providers — to build XP-styled UI (like
[xp.css](https://botoxparty.github.io/XP.css/), but as controlled React
components, matching the xp.css spec value-for-value):

- `XPButton`
- `XPTextInput`
- `XPCheckbox`
- `XPRadio`
- `XPSelect`
- `XPProgressBar`
- `XPTooltip`
- `XPGroupBox`
- `XPStatusBar` (+ `XPStatusBarField`)
- `XPTabs`
- `XPMenuBar` (+ `XPMenuBarItem`, `XPMenuDropdown`, `XPMenuDropdownItem`, `XPMenuMark`, `XPMenuSeparator`, `XPMenuSlot`)
- `XPIcon`
- `XPDialog`

```jsx
import { XPDialog, XPButton } from '@caoergou/windows-xp/components';
import '@caoergou/windows-xp/style.css';

// A classic XP message box — no providers required.
function SaveDialog({ onSave, onDiscard, onCancel }) {
  return (
    <XPDialog
      title="Notepad"
      icon="alert_warning"
      modal
      onClose={onCancel}
      footer={
        <>
          <XPButton onClick={onSave}>Yes</XPButton>
          <XPButton onClick={onDiscard}>No</XPButton>
          <XPButton onClick={onCancel}>Cancel</XPButton>
        </>
      }
    >
      The text in the Untitled file has changed. Do you want to save the changes?
    </XPDialog>
  );
}
```

```jsx
import {
  XPGroupBox,
  XPCheckbox,
  XPTabs,
  XPProgressBar,
  XPStatusBar,
  XPStatusBarField,
} from '@caoergou/windows-xp/components';
```

See every primitive rendered in isolation at the standalone
[component gallery](/windows-xp/gallery/).
