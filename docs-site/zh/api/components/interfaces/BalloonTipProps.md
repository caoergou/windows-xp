[@caoergou/windows-xp](/windows-xp/docs/zh/api/index.md) / [components](/windows-xp/docs/zh/api/components/index.md) / BalloonTipProps

# Interface: BalloonTipProps

Defined in: src/components/BalloonTip.tsx:17

BalloonTip — the classic Windows XP tray notification bubble (#118).

A presentational primitive (no providers required): light-yellow rounded
bubble with a diamond tail, a bold title, body text, and a close box. It is
`position: relative` by default so it flows in normal layout (gallery, docs);
the tray notification host (`TrayProvider`) wraps it in a fixed-position
container anchored above the taskbar. Exported from `/components`.

For the driven, queued experience (auto-fade, notify sound, events) use
`useTray().notify(...)` instead of rendering this directly.

## Properties

### body?

&gt; `optional` **body?**: `ReactNode`

Defined in: src/components/BalloonTip.tsx:21

Body text; `children` is used when `body` is omitted.

---

### children?

&gt; `optional` **children?**: `ReactNode`

Defined in: src/components/BalloonTip.tsx:22

---

### className?

&gt; `optional` **className?**: `string`

Defined in: src/components/BalloonTip.tsx:35

---

### closeLabel?

&gt; `optional` **closeLabel?**: `string`

Defined in: src/components/BalloonTip.tsx:34

Accessible label for the close box. Default "Close".

---

### icon?

&gt; `optional` **icon?**: `string`

Defined in: src/components/BalloonTip.tsx:24

XPIcon key shown at 32px on the left; omit for a text-only balloon.

---

### onClick?

&gt; `optional` **onClick?**: () =&gt; `void`

Defined in: src/components/BalloonTip.tsx:28

Click handler for the bubble body (excludes the close box).

#### Returns

`void`

---

### onClose?

&gt; `optional` **onClose?**: () =&gt; `void`

Defined in: src/components/BalloonTip.tsx:26

Close-box handler. When omitted, the close box is hidden.

#### Returns

`void`

---

### showTail?

&gt; `optional` **showTail?**: `boolean`

Defined in: src/components/BalloonTip.tsx:32

Whether to draw the downward diamond tail. Default true.

---

### style?

&gt; `optional` **style?**: `CSSProperties`

Defined in: src/components/BalloonTip.tsx:36

---

### tailOffset?

&gt; `optional` **tailOffset?**: `number`

Defined in: src/components/BalloonTip.tsx:30

Distance in px from the right edge to the tail (anchors it to a tray icon).

---

### title

&gt; **title**: `ReactNode`

Defined in: src/components/BalloonTip.tsx:19

Bold heading line (XP blue).
