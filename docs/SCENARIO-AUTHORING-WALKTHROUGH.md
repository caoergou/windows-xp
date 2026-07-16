# A recorded drafting session: synopsis → adjudicated content pack (#239)

This is one complete pass of the **"AI drafts, deterministic tools adjudicate"**
loop, recorded end-to-end as a workflow reference. Every diagnostic below is the
real output of `xp-scenario` run against the drafts; the finished pack lives at
[`examples/midsummer-pack/`](../examples/midsummer-pack/) and is re-adjudicated
by CI on every push (`npm run scenario:ci`).

The loop being demonstrated:

```
synopsis ──► draft (AI or human) ──► lint ──► fix ──► solve ──► fix ──► pack ──► playtest
                    ▲                  │               │                │
                    └──────────────────┴───────────────┴────────────────┘
                          nothing ships until every gate is green
```

## Step 0 — the synopsis (three lines)

> 2006 年仲夏，你回到中学机房的旧电脑前。
> 传言毕业前夜，班长把全班的毕业合照锁进了这台机器的加密文件夹。
> 线索散落在一个同学录网站和一封没寄出去的信里。

## Step 1 — the draft

Following the five-outlet house rule, the synopsis was split across a content
pack directory:

```
examples/midsummer-pack/
├── content-pack.json          ① logic (triggers) + ③ beat text (zh/en strings)
└── assets/
    ├── tongxuelu.html         ② the fictional class-directory site (Pattern 8)
    └── unsent-letter.md       ② the long-document clue (Pattern 9)
```

The story chains four patterns: fictional website (the pinned post points at
the machine) → long-document clue (the letter names graduation day) →
password-puzzle trio (the locked `毕业照` folder, password `0630`, hint ladder
on failures) → AI-buddy trio (小雨 gets a provider brain — ④ — once the letter
is read).

## Step 2 — first adjudication: `lint` reports four problems

```
$ npx xp-scenario lint ./examples/midsummer-pack
ERROR [orphan-asset] ($.assets.group-photo): asset "group-photo" is declared but never referenced
ERROR [scenario-schema] ($.triggers.2.on): must be equal to one of the allowed values; allowed: …
ERROR [unknown-event] (triggers[2]): unknown event type "file:read"
ERROR [unauthorized-url] ($.triggers[1].when.event.url): URL is not registered in content pack sites: http://tongxuenlu.com/class2
ERROR [provider-fallback] ($.triggers[5].do[0].openApp.props.reply): provider chat branch must declare a non-empty fallback
```

Each finding has a narrative meaning, not just a schema meaning — this is what
a reviewer should read out of them:

| Diagnostic          | What it means for the story                                                                                             |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `orphan-asset`      | A "I'll wire this later" placeholder (`group-photo`) that nothing references — dead weight, or a forgotten scene.        |
| `unknown-event`     | The letter trigger listened on `file:read`, which the engine never emits — **the letter beat would silently never fire**. The allowed-values list names the real event: `file:open`. |
| `unauthorized-url`  | The trigger watched `tongxue**n**lu.com` (typo) while the site registry serves `tongxuelu.com` — the player would visit the real page and **the story wouldn't notice**. |
| `provider-fallback` | 小雨's AI brain had `"fallback": []` — any player without a provider (offline, no key) would meet a mute buddy. The offline contract is non-negotiable. |

Fixes: deleted the orphan asset, `file:read` → `file:open`, fixed the URL typo,
wrote three scripted fallback lines. Re-run: `OK: no diagnostics`.

## Step 3 — second adjudication: `solve` catches what lint can't

Lint is static; `solve` replays the canonical walkthrough headlessly and proves
the story actually completes:

```
$ npx xp-scenario solve ./examples/midsummer-pack --expect album_open
Scenario: midsummer-2006
  1  session:boot-complete [intro]  -> intro
  2  file:open [letter]  -> -
  3  file:unlock [finale]  -> -
Final flags: {}
Provider fallback nodes: 1
ERROR: expected album_open=true (got undefined)
```

Steps 2 and 3 fired **nothing**. The rehearsal walkthrough forgot the
`ie:navigate` visit to the class directory, so `seen_txl` was never set, the
letter trigger's gate never opened, and the finale (gated on `read_letter`)
stayed shut. A perfectly lint-clean scenario that cannot be finished — exactly
the class of bug "CI for stories" exists for.

Fix: insert the missing walkthrough step. Re-run:

```
$ npx xp-scenario solve ./examples/midsummer-pack --expect album_open
Scenario: midsummer-2006
  1  session:boot-complete [intro]  -> intro
  2  ie:navigate [txl]  -> visit-txl
  3  file:open [letter]  -> read-letter
  4  file:unlock [finale]  -> finale
Final flags: {"seen_txl":true,"read_letter":true,"album_open":true}
Provider fallback nodes: 1
```

Every beat fires, the ending is reached, and the report confirms the pack
carries one provider node with a declared fallback — the walkthrough completed
**with no provider wired**, so the offline contract holds.

## Step 4 — third adjudication: `pack` validates the shippable unit

```
$ npx xp-scenario pack ./examples/midsummer-pack --check
OK: no diagnostics
Size: logic 4146 B, scenario 3468 B, assets 1259 B, packed 5413 B
  txl-home: 791 B (./assets/tongxuelu.html)
  unsent-letter: 468 B (./assets/unsent-letter.md)
```

`pack` re-lints, checks every `assets/` file is declared in the manifest (and
vice versa), and reports sizes against the scenario budget. Without `--check`
it also emits the normalized single-file pack (`dist/content-pack.json`) with
assets inlined — the mountable artifact.

## Step 5 — human playtest

The tools prove the story is *completable*; only a human can judge whether it's
*good* — pacing, tone, whether the correlation step (letter date → password)
lands as an "aha" rather than a shrug. Mount the pack in the live desktop and
play the critical path once:

```bash
npx xp-scenario serve ./examples/midsummer-pack
# in the REPL: seek txl / seek letter, flags, chat --offline xiaoyu, emit …
```

`serve`'s deterministic `seek <beat>` jumps straight to any walkthrough beat, so
"replay the finale after a copy tweak" costs seconds, not a full playthrough.

## What generalizes

1. **Never hand-verify what a tool adjudicates.** Four draft bugs, four
   machine findings, zero reliance on the drafter's self-review. The drafter's
   job is story; the adjudicator's job is integrity.
2. **The three gates test different failure classes.** `lint` = referential
   integrity (names, URLs, assets, contracts); `solve` = reachability (the
   story can actually be finished); `pack` = shippability (files, sizes,
   normalization). Passing one says nothing about the others — run all three,
   in that order, after every edit.
3. **A failed gate is information, not friction.** The rehearsal bug (Step 3)
   was invisible to lint and would have shipped as "the game softlocks after
   the letter" — the cheapest place to find that is a headless replay in CI.
4. **Fallbacks are content, not plumbing.** Writing 小雨's three offline lines
   took as much care as any beat text — players without a provider deserve the
   same story.
