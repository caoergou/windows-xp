# @caoergou/xp-scenario-tools

Node-only authoring tools for `@caoergou/windows-xp` scenarios and content packs. The package is deliberately separate from the browser engine.

Requires Node.js 22.12 or newer.

```bash
npx xp-scenario lint ./scenario.ts
npx xp-scenario solve ./scenario.ts
npx xp-scenario graph ./scenario.ts --format mermaid
npx xp-scenario pack ./content-pack --check
npx xp-scenario migrate ./scenario.ts ./save.json --map-flag old=new --write
npx xp-scenario serve ./scenario.ts
```

`lint` and `pack` return a non-zero exit code for errors. Warnings remain visible but do not fail CI. `migrate` is diagnostic by default; it writes only when `--write` is explicit, and never guesses a rename. Use `--map-flag old=new` or `--map-trigger old=new` to describe intentional renames.

`serve` starts a Vite desktop plus a token-protected WebSocket control channel and
an interactive REPL. It supports deterministic seek/step, event injection,
flag/trigger inspection, live lint/graph snapshots, file hot reload, and provider
persona rehearsal. `chat --offline <buddy>` requires an authored fallback or
script; use `--provider-url <url>` to POST live chat requests to an author-owned
endpoint. Add `--no-open` for headless environments.
The live desktop defaults to the `zh` culture required by QQ; pass
`--language en` (or another registered culture id) when authoring another skin.

The main package exports the pure command implementations and protocol parser.
Import `startScenarioServer()` from `@caoergou/xp-scenario-tools/serve` only when
embedding the Vite/WebSocket authoring server.
