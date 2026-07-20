# @caoergou/xp-scenario-tools

Node-only authoring tools for `@caoergou/windows-xp` scenarios and content packs. The package is deliberately separate from the browser engine.

Requires Node.js 22.12 or newer.

```bash
npx xp-scenario lint ./scenario.ts
npx xp-scenario solve ./scenario.ts
npx xp-scenario graph ./scenario.ts --format mermaid
npx xp-scenario pack ./content-pack --check
npx xp-scenario pack ./content-pack --format xpspack --compress brotli --out dist/story.xpspack
npx xp-scenario pack ./content-pack --format xpspack --compress brotli \
  --sign-key-env XP_SCENARIO_SIGNING_KEY --sign-key-id publisher-2026 \
  --out dist/story-signed.xpspack
npx xp-scenario migrate ./scenario.ts ./save.json --map-flag old=new --write
npx xp-scenario serve ./scenario.ts
```

`lint` and `pack` return a non-zero exit code for errors. Warnings remain visible but do not fail CI. `migrate` is diagnostic by default; it writes only when `--write` is explicit, and never guesses a rename. Use `--map-flag old=new` or `--map-trigger old=new` to describe intentional renames.

The versioned `.xpspack` distribution contract is specified in
[`docs/XPSPACK-FORMAT.md`](../../docs/XPSPACK-FORMAT.md). `pack` keeps JSON as
its default and can also emit deterministic ZIP-compatible archives with
`--format xpspack` and `--compress none|gzip|brotli`. `--check` validates and
measures either format without writing. The programmatic `readXpspack()` loader
verifies the restricted ZIP profile, CRCs, manifest invariants, chunk and asset
hashes, size limits, decompression, and the reconstructed ContentPack before
returning it. Local files declared in `ContentPack.assets` are stored as separate
binary-safe entries and restored as media-typed `data:` URLs. Ed25519 signing
reads a PEM private key only from the named environment
variable; the key is never added to the manifest or result. `readXpspack()`
accepts host-controlled `trustedSigningKeys` by key ID and can enforce
`requireSignature`. Signature failures throw `XpspackError` with stable codes
for localization. The programmatic builder accepts additional chunk definitions;
AES-256-GCM chunks always receive fresh random nonces and `readXpspack()` asks
the host-owned asynchronous `keyProvider` only when `loadChunk(id)` is called.
Raw chapter keys are never returned or serialized. CLI-authored chunk boundaries
and hosted per-file fetching remain follow-up work.

`serve` starts the browser-based **Scenario Studio** plus a token-protected, loopback-only
WebSocket control channel and preserves the interactive REPL for terminal-first
authors. Scenario Studio shows independent lint/solve/pack gates, the existing
dependency graph, rehearsal controls, runtime state, typed event injection,
persona modes, and shipping sizes around the live desktop preview. It supports
deterministic seek/step, event injection, flag/trigger inspection, file hot reload,
and provider persona rehearsal. A failed reload leaves the last valid desktop
usable and marks the preview stale. `chat --offline <buddy>` requires an authored fallback or
script; use `--provider-url <url>` to POST live chat requests to an author-owned
endpoint. Use `--no-ui` for the legacy desktop-only browser surface, or `--no-open`
to prevent browser launch in headless environments. The default is `--ui`.
The live desktop defaults to the `zh` culture required by QQ; pass
`--language en` (or another registered culture id) when authoring another skin.

## Writer loop: `midsummer-pack`

1. Run `xp-scenario serve examples/midsummer-pack` and keep the source directory
   open in your editor.
2. Use **Problems** to keep lint, solve, and pack gates independently green.
3. Select a node in **Map**, inspect its dependencies, and use **Seek here** when
   the node maps to a named rehearsal beat.
4. Step through **Timeline**, inject a schema-listed event in **Events**, and
   inspect exact trigger conditions and recent events in **Inspector**.
5. Open **Personas**, choose `xiaoyu`, and run **Offline** to verify the authored
   fallback without sending provider credentials to the browser.
6. Edit and save the pack. A valid draft reloads automatically; an invalid draft
   appears in **Problems** while the preview remains on the visibly stale last
   valid version.
7. Check declared assets and byte budgets in **Shipping** before running
   `npm run scenario:ci`.

The main package exports the pure command implementations and protocol parser.
Import `startScenarioServer()` from `@caoergou/xp-scenario-tools/serve` only when
embedding the Vite/WebSocket authoring server.
