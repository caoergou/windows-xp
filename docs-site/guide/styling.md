---
title: Styling
---

# Styling

## Scoped CSS

The stylesheet is fully scoped under `.windows-xp-root` (see
[Embedding](./embedding)). To customize beyond the supported props, target
the scoped classes from your embedding context:

```css
.my-page-wrapper .windows-xp-root .taskbar {
  /* overrides here only affect this instance */
}
```

Always namespace overrides to the embedding context; do not rely on global
selectors.

## Stable surfaces

Prefer these supported extension points before reaching for CSS classes:

- **Wallpapers** — pass a custom wallpaper component or image URL.
- **Culture packages** — ship locale-specific icons, sounds, and copy without
  touching CSS. See [docs/SCENARIOS.md](https://github.com/caoergou/windows-xp/blob/main/docs/SCENARIOS.md)
  and [docs/LESSONS.md](https://github.com/caoergou/windows-xp/blob/main/docs/LESSONS.md).
- **Theme tokens** — import `COLORS`, `xpButtonStyles`, `xpScrollbarStyles`,
  etc. from `@caoergou/windows-xp/theme`.

These surfaces are versioned and safe to rely on.

## Class-name warning

Scoped class names (`taskbar`, `window`, `xp-button`, …) are implementation
details. They can change in any minor release. If you must use them, pin the
package version and treat updates as a breaking change. A proper public theme
layer is planned.

## Portals and pop-outs

Some UI (menus, tooltips, dialogs, drag previews) may render through a portal
outside `.windows-xp-root`. If you need to style these, target the portal
container that the engine creates rather than global selectors. Portal markup
shares the same prefixed class namespace and is scoped to the embedding
instance.

