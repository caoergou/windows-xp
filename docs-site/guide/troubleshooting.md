---
title: Troubleshooting
---

# Troubleshooting

## Common symptoms

### Windows don't persist after refresh

Check localStorage is available (not blocked/incognito). Custom apps must be
registered via the [`apps` prop](/guide/props) at mount so restoration can find
their [`restore`](/guide/content#write-your-first-app) function;
[`componentProps`](/guide/content#write-your-first-app) must be
JSON-serializable or they're dropped.

### Two instances interfere

Give each a distinct `storagePrefix`.

### Styling conflicts

Ensure `style.css` is imported; the component root is `.windows-xp-root`
(portals use `.windows-xp-portal`). The scoped stylesheet cannot leak out; if
your host styles leak *in*, scope them away from those two classes.

### Custom file system not appearing

Top-level keys merge into the desktop root (don't wrap them in a `"Desktop"`
folder); remember content props are [mount-time](/guide/props).

### Still stuck?

If you're still stuck, [open an issue on GitHub](https://github.com/caoergou/windows-xp/issues).

