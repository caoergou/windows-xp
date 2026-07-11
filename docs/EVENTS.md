# Event system — design spec (#130)

The desktop emits a single, typed event stream. Hosts observe it (the `onEvent`
prop / `useXPEvents` hook) and the scenario system (#84) reads it as its trigger
vocabulary. Because scenario authors are often **not** developers, the catalog
must be learnable from one reference table — not from reading source.

- **Source of truth:** the `XPEvent` union in [`src/events.ts`](../src/events.ts).
- **Reference table:** generated into [`USAGE.md`](../USAGE.md) by
  `npm run docs:events`, guarded against drift by `test/eventDocs.test.ts`.

## Naming grammar: `domain:action`

Every event type is `domain:action`, lower-case, `:`-separated. The action may
be hyphenated (`login-fail`, `boot-complete`). One domain groups everything
about one subsystem.

### Canonical domains

| Domain | Covers |
| --- | --- |
| `app` | application lifecycle (launch/close) |
| `window` | window state (focus/minimize/maximize/restore) |
| `file` | files in the virtual filesystem |
| `folder` | folders (distinct from files where the payload differs) |
| `recyclebin` | the Recycle Bin |
| `password` | access-control / lock challenges |
| `session` | login and power lifecycle |
| `cmd` | Command Prompt |
| `ie` | Internet Explorer |
| `wallpaper` | wallpaper changes |
| `screensaver` | screensaver start/stop |
| `notification` | tray notification balloons |
| `time` | wall-clock / scheduler events (#130 timer half) |
| `user` | user-presence / idle detection (#130 timer half) |
| `qq`, `game`, … | reserved for app- and scenario-specific domains |

Introducing a new domain is a deliberate act: add it to this list and to
`DOMAIN_TITLES` in `scripts/gen-events-doc.mjs`. Prefer an existing domain over
a near-duplicate.

## Payload conventions

Keep payloads small, serializable, and predictable:

- **Filesystem paths are arrays**, never joined strings: `path: string[]`. A
  path is the sequence of node keys from the desktop root
  (`['我的电脑', '本地磁盘 (C:)', 'Windows']`). Relocations carry `from` / `to`.
- **`name`** is the node's display name; include it alongside `path` so a
  listener doesn't have to re-split.
- **Ids** are named by what they identify: `windowId`, `appId`, `id` (for
  notifications). Never a bare `id` where a window or app is meant.
- **Counters / measurements** are named for their meaning: `attempt`, not `n`.
- **Optional fields** (`?`) are for data that is only sometimes present — e.g.
  `file:update.content` (present only when text changed). A listener must treat
  them as possibly `undefined`.
- Do **not** put functions, DOM nodes, or class instances in a payload — the
  same stream feeds scenario JSON and the imperative `emit()` (#115).

## When does an interaction deserve an event?

Emit when a listener could plausibly want to **react** to or **gate** on it: a
state change the user caused (a file edited, a password tried, a page visited),
or a lifecycle transition (boot, login, screensaver). Do **not** emit for pure
view state (scroll position, hover) or for internal bookkeeping the host can't
meaningfully act on.

One user action = one event. Wrap the mutation at a single layer (see the
`FileSystemContext` wrappers) so an action fires exactly once, and internal
call-sites that reuse the primitive stay silent by design.

## Evolution policy (don't break consumers)

The catalog is public API. Change it **additively**:

- **Adding an event type** or an **optional** payload field is safe — ship it.
- **Renaming or removing** an event, or making an optional field required, is a
  breaking change: keep the old event emitting through at least one minor
  release, mark it deprecated in its JSDoc (`@deprecated use x:y`), and note it
  in `CHANGELOG.md`.
- Every member carries a one-line `/** … */` JSDoc — that text becomes the
  table description, so write it for a scenario author, not a compiler.

## Adding an event — checklist

1. Add the `| { type: 'domain:action'; … }` member to `XPEvent`, with a
   one-line JSDoc, following the grammar and payload rules above.
2. Emit it at exactly one layer.
3. Run `npm run docs:events` to regenerate the USAGE table (CI fails otherwise).
4. Add a test asserting the emission (`test/eventBus.test.tsx`).
