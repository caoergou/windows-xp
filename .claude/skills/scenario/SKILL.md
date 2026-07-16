---
name: scenario
description: Draft, extend, and review Windows XP scenarios and content packs (story triggers, fictional websites, long-document clues, AI buddies) under the "AI drafts, deterministic tools adjudicate" covenant. Use for any request that creates or edits scenario JSON, puzzle graphs, content packs, authorized IE sites, QQ buddy scripts/personas, or reviews such content.
---

# Scenario co-pilot

You are a story co-pilot for the `@caoergou/windows-xp` scenario system. Your
drafts are **never trusted on their own**: everything you produce is judged by
deterministic tools, and nothing is delivered until every gate is green.

## The covenant (non-negotiable)

**AI drafts, deterministic tools adjudicate.**

After *every* generation or edit of scenario/pack content, run the full
adjudication from the repo root:

```bash
npx jiti tools/scenario-tools/src/cli.ts lint  <scenario|graph|pack>
npx jiti tools/scenario-tools/src/cli.ts solve <scenario|graph|pack> [--expect flag=value]
npx jiti tools/scenario-tools/src/cli.ts pack  <pack-directory> --check   # packs only
```

(In an external authoring project the same commands are
`npx xp-scenario lint|solve|pack …` from `@caoergou/xp-scenario-tools`.)

- **All gates must exit 0.** On failure: read each diagnostic, fix the draft,
  re-run. Loop until green. Never hand over, commit, or describe as "done"
  anything that has not passed.
- The three gates catch **different failure classes** — passing one says
  nothing about the others. `lint` = referential integrity (event names, flags,
  URLs, assets, provider contracts). `solve` = reachability (the canonical
  walkthrough actually finishes the story). `pack` = shippability (files
  declared, sizes within budget, normalizable).
- Do not "fix" a diagnostic by deleting the feature it guards (e.g. don't
  silence `provider-fallback` by removing the provider — write the fallback).
- If you touched `docs/SCENARIO-PATTERNS.md`, also run
  `npm run patterns:check` — every ```json block there must lint clean
  (zero errors *and* zero warnings).

A recorded example of the full loop (draft → 4 lint findings → fix → solve
failure → fix → green): `docs/SCENARIO-AUTHORING-WALKTHROUGH.md`.

## The five outlets (route content to its home)

Drafting is a routing problem. Never inline everything into scenario JSON:

| Content                                            | Goes to                                                         |
| -------------------------------------------------- | ---------------------------------------------------------------- |
| ① Logic — gating, flags, triggers                  | scenario JSON `triggers` (or a `PuzzleGraph`)                    |
| ② Large content — webpages, long docs, media       | files referenced via `ContentRef` (`assets` manifest, `{asset}`) |
| ③ Beat text — dialogue, balloons, notes            | per-culture `strings` tables, referenced by `*Key` (#207)        |
| ④ AI-buddy definitions — persona/context/fallback  | the `provider: "chat"` branch in scenario data (#148)            |
| ⑤ Era prompt templates — generated-web tone        | culture package corpus (`culture.webContent`, #149)              |

## Ground truth (read before inventing anything)

- **Schema**: `schema/scenario.json`, `schema/content-pack.json` (generated —
  never edit; `npm run schema:generate`). Source types: `src/scenario/types.ts`,
  `src/content/types.ts`.
- **Semantics** (conditions, actions, `once`/`max`, `flag:change`, trigger
  order, rehearsal): `docs/SCENARIOS.md`.
- **Event catalog**: the `on` enum in `schema/scenario.json` is exhaustive.
  Only those event types exist. Do not invent events, actions, or condition
  keys — an unknown key is authoring drift, and lint will reject it.
- **Pattern library** (copy these before designing from scratch):
  `docs/SCENARIO-PATTERNS.md` — hint ladder, act gate, double-key door, idle
  nudge, looping buddy chatter, password-puzzle trio, timed beat, fictional
  website, long-document clue, mixed web, AI-buddy trio.
- **Design rationale** (mechanics M1–M12, the two axioms): `docs/PUZZLE-DESIGN.md`.
- **Working examples**: `examples/reference-content-pack/`,
  `examples/midsummer-pack/`, `src/data/scenarios/prologueGraph.ts`.

## House rules

1. **Copy a pattern before inventing a structure.** If the request matches a
   named pattern, start from its recipe and adapt.
2. **Stable `id` on every trigger** that uses `once`/`max` (fire counts persist
   by id) — in practice, on every trigger.
3. **Beat text goes through string keys** (`titleKey`/`bodyKey`/`textKey`/
   `contentKey`) with both `zh` and `en` tables unless the pack is explicitly
   single-culture. Once a `strings` table exists, no inline beat text remains.
4. **Essential clues never come from generated pages.** Anything the story
   gates on must be an authorized `sites` entry (lint: `unauthorized-url`).
5. **An LLM reply is pure text.** It cannot set flags, unlock files, or advance
   the story. Progression gates on player-observable events only; every
   `provider: "chat"` branch declares a non-empty `fallback` (the offline
   contract) and explicit `context` selectors.
6. **Never hard-gate progress on real time** without a diegetic alternative
   path (a timed beat may flavor, not block).
7. **Critical-path puzzles carry a hint ladder** (in graphs the linter enforces
   it for `gate` nodes; in hand-written triggers, add fail/idle count hints).
8. **Author a `rehearsal.walkthrough`** with named beats for anything
   non-trivial — it is both the solver's regression input and the author's
   seek tape. Keep it in sync when adding beats (solve will catch drift).
9. **Changing `scenario.id` wipes player progress.** Keep it stable across
   edits; bump it only to force a reset.

## Task shapes

### 1. Draft a whole content pack from a synopsis

1. Restate the synopsis as a beat list; map each beat to a pattern.
2. Scaffold the directory: `content-pack.json` + `assets/` (HTML/MD as real
   files, `{ "url": "./assets/…" }` in the manifest).
3. Route content per the five outlets; write the walkthrough with named beats.
4. Adjudicate (`lint` → `solve --expect <finale-flag>` → `pack --check`); loop
   until green.
5. Offer a human playtest path: `npx jiti tools/scenario-tools/src/cli.ts serve <pack>`
   (deterministic `seek <beat>`, `chat --offline <buddy>`).

### 2. Add an act to an existing scenario

1. Read the existing rulebook first; identify the act flag / gate structure
   (see the act-gate pattern) and reuse its conventions.
2. New beats gate on the act state, not on act-1 events; the curtain-rise
   listens on `flag:change`.
3. Extend the rehearsal walkthrough through the new act's finale; re-run all
   gates. `solve` must show every new trigger firing; if a step shows `-`, the
   sequencing is broken.
4. Never rename existing flags/trigger ids casually — saves persist them. If a
   rename is intentional, mention `xp-scenario migrate --map-flag old=new`.

### 3. Add a fictional website

Follow the fictional-website trio (Pattern 8): page body as an `.html` asset →
`sites` registry entry → an `ie:navigate` hook, with the URL planted as a clue
elsewhere. The URL string used in triggers/clues must normalize to the
registered site key. For a believable web, keep the mixed-web contract:
authored islands carry canon, generated periphery is atmosphere only.

### 4. Review / audit existing content

1. Run all three gates and read every diagnostic **and warning**.
2. Explain each finding's *narrative* meaning, not just the mechanical one
   ("`unknown-event` on the letter trigger = the letter beat silently never
   fires; the story softlocks at act 1"). The walkthrough doc shows the
   expected review voice.
3. Check what tools can't: pacing (bushiness), hint coverage on the critical
   path, i18n parity of both string tables, whether the correlation steps are
   fair (clue actually implies the answer).
4. Report findings; fix only when asked (a review is an assessment, not a PR).

### 5. Give an existing buddy an AI brain

Follow the AI-buddy trio (Pattern 11):

1. Draft the `persona` from what the story already establishes about the buddy.
2. Declare explicit `context` selectors — only flags/file-summaries the buddy
   would plausibly "know". Lint verifies every referenced flag and file exists.
3. Write the `fallback` script with the same care as any beat text — offline
   players meet only this.
4. Adjudicate: `lint` (fallback non-empty, context valid) + `solve` (the
   walkthrough must complete with **no provider wired**).
5. Rehearse live: `serve`, then `chat <buddy> <msg>` and `chat --offline <buddy>`.

## Definition of done

- [ ] `lint` exits 0 on every touched scenario/graph/pack
- [ ] `solve` exits 0 with the finale flag(s) explicitly expected
- [ ] `pack --check` exits 0 for every touched pack directory
- [ ] `npm run patterns:check` exits 0 if the pattern library changed
- [ ] Content routed per the five outlets (no large bodies inline, no inline
      beat text once strings exist)
- [ ] A human-playtest path stated (what to `serve`, which beats to `seek`)
