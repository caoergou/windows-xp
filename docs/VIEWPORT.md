# Small-screen / portrait viewport strategy (#215)

**Status:** decided — phase 1 shipped. **Decision:** uniform scale-to-fit, gated
to small viewports, host-overridable via `viewportPolicy`.

## The problem

#125 made touch a first-class *input* (tap / double-tap / long-press / drag),
but the desktop is authored against a **1024×768 baseline** — icon columns,
default window sizes (400–1024 px), the taskbar. On a phone that baseline is
larger than the screen, so before this change a mobile visitor got a scrollable
slice of a too-big desktop and, at best, the one-time `MobileWarning` hint. The
S2 portfolio/blog scenario (`docs/USE-CASES.md`) draws ~half its traffic from
phones — that was half the audience bounced at the door.

This was an **exploratory** decision: "faithful scaling" and "responsive
reflow" are a real product trade-off, because **XP never had a portrait form** —
reflowing the shell would damage the simulation, which is the product's spine.

## Options considered

### A. Uniform scale-to-fit — **chosen**

Render the shell at its 1024×768 baseline and CSS-`transform: scale()` the whole
stage to fit the container, letterboxed. Nothing reflows; the desktop is simply
smaller. This is how daedalOS-style and XP-themed portfolio sites handle small
screens.

- **Pros:** 100 % fidelity — not one pixel of the XP layout moves; the whole
  desktop is always visible and drivable by the #125 touch gestures; tiny,
  contained implementation; trivially reversible; desktop rendering path
  untouched, so **zero desktop visual regression**.
- **Cons:** on a phone in portrait everything is small (≈0.37× on a 375 px
  width). Mitigated by (a) a portrait→landscape nudge and (b) letting the host
  opt a specific instance out via `viewportPolicy`.
- **Portal note:** context menus, tooltips, dialogs and tray balloons portal to
  `document.body` and position by screen-space `clientX/clientY` /
  `getBoundingClientRect()`, so they land at the correct screen point and render
  at native (readable) size over the scaled desktop — which on a phone is a
  feature, not a bug.

### B. Compact mode (single maximized window + taskbar drawer) — rejected

Reflow to one-window-at-a-time with a drawer taskbar.

- **Why rejected:** it discards the multi-window metaphor that *is* the
  simulation, forks the shell into a second layout to maintain, and still
  wouldn't match a real XP (which has no such mode). High cost, high fidelity
  damage, for a P3 audience. Revisit only if a genuinely mobile-first product
  scenario appears.

### C. Warning-only / portrait-blocks-landscape — rejected as the endpoint

Keep `MobileWarning`, upgrade it to "rotate to landscape", and call landscape
"minimum viable".

- **Why rejected as the whole answer:** the acceptance is *a designed path*, not
  a nicer warning. Portrait visitors would still hit a wall. We **keep** the
  rotate nudge (it pairs well with A — landscape scales larger) but it is not
  the path itself.

## Decision & the `viewportPolicy` prop

`viewportPolicy` on `<WindowsXP>` — default **`'auto'`**, fully backward
compatible:

| value | behaviour |
|---|---|
| `'auto'` *(default)* | Native at ≥ baseline; scale-to-fit when the container is smaller than 1024×768. Desktop unchanged; phones get the whole desktop. |
| `'scale'` | Always scale-to-fit the baseline into the container (even on desktop). |
| `'native'` | Never scale — the pre-#215 fixed layout (host handles overflow). |
| `'warn'` | Never scale; show the mobile hint. The pre-#125-era posture for hosts that want it. |

`react-draggable` is given the active `scale` so window dragging tracks the
finger 1:1 under the transform.

## Minimum-viable viewport support matrix

| Viewport | Path |
|---|---|
| ≥ 1024×768 (desktop, tablet landscape) | Native, unchanged. |
| Landscape phone (e.g. 812×375, 667×375) | Scale-to-fit — the full desktop, comfortably driven by touch. |
| Portrait phone (e.g. 375×667, iPhone SE) | Scale-to-fit (whole desktop, ≈0.37×) **plus** a dismissible "rotate for a larger view" nudge. A designed path, not a warning. |
| Embedded (`mode="embedded"`) | Scales to the host container, not the window, so an embedded desktop fits its box. |

Phase 1 ships A behind `'auto'`. Compact mode (B) stays explicitly out of scope
unless a mobile-first scenario justifies its cost.
