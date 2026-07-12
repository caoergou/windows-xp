# Windows XP Desktop Engine — Usage

📚 **The full, searchable guide now lives on the docs site:
<https://eric.run.place/windows-xp/docs/>** (source under
[`docs-site/`](docs-site/)). This file is a thin jump index so old links keep
working; each entry below maps to a page on the docs site.

## Getting started

- [Installation & quick start](https://eric.run.place/windows-xp/docs/guide/getting-started) — install, peer deps, the 3-line embed.
- [Props reference](https://eric.run.place/windows-xp/docs/guide/props) — every `<WindowsXP>` prop.
- [Keyboard shortcuts](https://eric.run.place/windows-xp/docs/guide/keyboard) — the central keymap, remapping, per-OS feasibility.

## Content & scripting

- [Make the desktop yours](https://eric.run.place/windows-xp/docs/guide/content) — custom file system, wallpapers, culture packages, custom apps, blog-on-the-desktop.
- [Events & imperative control](https://eric.run.place/windows-xp/docs/guide/events) — the typed `onEvent` catalog and the `XPHandle` ref API.
- [Scenario system](https://eric.run.place/windows-xp/docs/guide/scenarios) — flags, triggers, dynamic sticky notes.
- [Guided lessons](https://eric.run.place/windows-xp/docs/guide/lessons) — lessons-as-data with Watch/Try/Do.

## Embedding

- [Embedding in a host app](https://eric.run.place/windows-xp/docs/guide/embedding) — `mode="embedded"`, storage isolation, persistence, campaign skinning.
- [SSR / Next.js](https://eric.run.place/windows-xp/docs/guide/ssr) — the `ssr: false` dynamic import; verified consumption.
- [Subpath imports & standalone primitives](https://eric.run.place/windows-xp/docs/guide/subpaths) — `@caoergou/windows-xp/components|apps|hooks|theme|registry`.
- [Styling](https://eric.run.place/windows-xp/docs/guide/styling) · [Performance](https://eric.run.place/windows-xp/docs/guide/performance) · [Troubleshooting](https://eric.run.place/windows-xp/docs/guide/troubleshooting)

## Reference

- [Component gallery](https://eric.run.place/windows-xp/docs/components) — every shared XP primitive, live.
- [API reference (TypeDoc)](https://eric.run.place/windows-xp/docs/api/) — generated from the published types.

---

Contributors: architecture lives in `CLAUDE.md`, code rules in
`docs/DEVELOPMENT.md`, the fidelity baseline in `FIDELITY.md`. To edit the guide,
change the Markdown under `docs-site/` and run `npm run docs:dev` (see
[`docs-site/README.md`](docs-site/README.md)).
