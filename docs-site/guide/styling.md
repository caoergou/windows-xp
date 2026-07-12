---
title: Styling
---

# Styling

The stylesheet is fully scoped (see Embedding). To customize beyond the
supported props, standard CSS targeting the scoped classes works:

```css
.windows-xp-root .taskbar {
  /* … */
}
```

Prefer the supported surfaces first (wallpapers, culture packages, theme
tokens from `/theme`) — class names are not a stable API. A proper theme
layer is tracked in #135.

