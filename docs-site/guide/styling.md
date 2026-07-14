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

## Supported customization points

Prefer these supported extension points before reaching for CSS classes:

- **Wallpapers** — pass a custom wallpaper component or image URL.
- **Culture packages** — ship locale-specific icons, sounds, and copy without
  touching CSS. See [Content](./content).
- **Theme tokens** — import `COLORS`, `xpButtonStyles`, `xpScrollbarStyles`,
  `xpTitleBarStyles`, `WINDOW_DEFAULTS`, `DESKTOP_DEFAULTS`, etc. from
  `@caoergou/windows-xp/theme`.

These points are safe to rely on within a major version; check the migration
notes when upgrading across major versions.

## Class-name warning

Scoped class names (`taskbar`, `window`, `xp-button`, …) are implementation
details. They can change in any minor release. If you must use them, pin the
package version and treat updates as a breaking change. A proper public theme
layer is planned.

## Portals and pop-outs

Some UI (menus, tooltips, dialogs, drag previews) may render through a portal
into `.windows-xp-portal` outside `.windows-xp-root`. If you need to style
these, target that portal container rather than global selectors:

```css
.my-page-wrapper .windows-xp-portal .xp-menu {
  /* only affects pop-up menus for this instance */
}
```

Portal markup shares the same prefixed class namespace and is scoped to the
embedding instance.
