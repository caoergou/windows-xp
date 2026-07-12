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

// UI building blocks
import { Window, Desktop, Taskbar, XPIcon } from '@caoergou/windows-xp/components';

// Hooks and providers
import { useWindowManager, useFileSystem, useAppRegistry, useCulture } from '@caoergou/windows-xp/hooks';

// Theme tokens
import { COLORS, xpButtonStyles, xpScrollbarStyles } from '@caoergou/windows-xp/theme';

// App registry helpers
import { APP_REGISTRY, resolveFileOpen, getAppDisplayName } from '@caoergou/windows-xp/registry';
```

> System components (`Window`, `Taskbar`, `Desktop`, …) are wired to the
> desktop's contexts and must render inside the providers exported from the
> root entry (or `AppProviders`). The primitives below need nothing.

### Standalone UI primitives (no providers)

`@caoergou/windows-xp/components` ships **zero-dependency primitives** you can
drop anywhere — no `<WindowsXP>`, no providers — to build XP-styled UI (like
[xp.css](https://botoxparty.github.io/XP.css/), but as controlled React
components, matching the xp.css spec value-for-value):

`XPButton`, `XPTextInput`, `XPCheckbox`, `XPRadio`, `XPSelect`,
`XPProgressBar`, `XPTooltip`, `XPGroupBox`, `XPStatusBar` (+
`XPStatusBarField`), `XPTabs`, `XPMenuBar` (family), `XPIcon`, `XPDialog`.

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

See every primitive rendered in isolation at the component gallery route:
append `?gallery` to the demo URL.

