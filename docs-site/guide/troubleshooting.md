---
title: Troubleshooting
---

# Troubleshooting

**Windows don't persist after refresh** — check localStorage is available
(not blocked/incognito). Custom apps must be registered (via the `apps` prop
at mount) so restoration can find their `restore` function; `componentProps`
must be JSON-serializable or they're dropped.

**Two instances interfere** — give each a distinct `storagePrefix`.

**Styling conflicts** — ensure `style.css` is imported; the component root is
`.windows-xp-root` (portals use `.windows-xp-portal`). The scoped stylesheet
cannot leak out; if your host styles leak *in*, scope them away from those
two classes.

**Custom file system not appearing** — top-level keys merge into the desktop
root (don't wrap them in a `"Desktop"` folder); remember content props are
mount-time.

