# PUZZLE-DESIGN.md — From Puzzle Mechanics to Engine Events

> Design research for the scenario system (#84), the event system (#116/#130), and
> the imperative API (#115). **Method: mechanics first, culture second.** Each
> mechanic below is culture-neutral; the 2005–2007 Chinese desktop and a Western
> 2000s desktop (en culture, #123) are two *content skins* over the same engine
> requirements. For every mechanic we derive: the **events** the engine must emit,
> the **conditions/state** the scenario layer must evaluate, and the **actions**
> it must execute. Section 3 consolidates those into the definitive event
> catalog; section 4 designs the orchestration layers.
>
> Status legend: ✅ exists today · 🔶 planned (#84 / #115–#119 / #130) · 🆕 new
> requirement surfaced by this document.

## 0. The two axioms

1. **The desktop is the inventory.** There is no separate "puzzle UI" — files,
   apps, and OS chrome are the verbs and items. Every mechanic must survive being
   expressed as data (#84's principle: story authors don't write React).
2. **The engine observes; the scenario judges.** The engine's job is to emit
   truthful, fine-grained events about what the player did and to expose
   predicates about world state. All game meaning (correct/incorrect, progress,
   endings) lives in the scenario layer. This separation is what makes the same
   engine host a portfolio, an ARG, and a classroom demo.

---

## 1. Mechanic classes and their engine derivations

Each entry: what it is → who does it best (en-context genre reference) → one en
beat + one zh beat on *this* engine → **derived engine requirements**.

### M1. Correlation & contradiction (the reader's mechanic)

The answer exists only in the intersection of two or more documents; or two
sources disagree and the truth is *actionable* rather than declared. The engine
validates nothing — the player correlates in their head and proves it by acting
(usually entering a password or finding a file).

- Genre: *Her Story* (query-driven correlation), *Return of the Obra Dinn*
  (cross-referencing scenes), every found-phone game.
- en beat: an AIM-style away message says "same password since summer camp '98";
  a scanned camp photo in My Pictures is captioned with the camp name — which is
  the locked folder's password.
- zh beat: 日记写"她生日就是网吧开业那天"；IE 收藏夹里网吧主页写着"隆重开业
  2004年3月18日"→ 密码 0318。
- **Derived**: no new events — this mechanic is pure content. It *demands*
  fine-grained observation events already planned (`file:open` ✅,
  `ie:navigate` 🔶#116) so guidance systems (M12) can tell whether the player has
  seen both halves. This is the cheapest, highest-value mechanic class; the
  engine's only job is to not get in the way.

### M2. Knowledge gates (the Outer Wilds principle)

Progression gated by *knowing*, not by *unlocking*: the password field was there
from minute one; nothing in the world changes when you learn the answer. The
purest form of desktop-native progression, and the strongest argument for
sequence-breaking tolerance (a player who already knows may skip ahead — that's
a feature, speedruns included).

- Genre: *Outer Wilds* ("the only lock is knowledge"), metroidbrainias generally.
- en beat: the BIOS-style login of an old backup drive accepts a date the player
  can learn in chapter 1 or guess in chapter 3 — both are wins.
- zh beat: C:\WINDOWS 的密码从第一分钟就可输入；知道"admin"的老玩家直接进 —
  引擎不阻止，剧情包自己决定是否用 flag 加二道门。
- **Derived**:
  - 🆕 **Event-history predicates** — the single biggest schema insight of this
    document. Most round-1 "flags" were really "has event X ever happened?"
    (`opened the diary`, `visited the qzone`). Authors should not hand-maintain
    those. The scenario runtime should keep a bounded, persisted **event
    journal** (per storagePrefix) and expose `happened(pattern)` /
    `count(pattern)` in conditions: `when: happened('file:open', {path: 'D:/日记.txt'})`.
    Explicit flags remain for *author abstractions* (acts, decisions), not for
    bookkeeping. This single feature removes ~half the trigger boilerplate.
  - Optional 🆕 **journal app** (diegetic "ship log"): an in-world notebook that
    auto-collects discovered clues (see M4 — can be the same surface).

### M3. Deduction submission (the Golden Idol verifier)

The player proves understanding by *filling a constrained answer form* — Mad
Libs slots from a collected word bank (Golden Idol), or triples verified in
batches to defeat brute force (Obra Dinn). This is the missing "prove it"
mechanic for cases where a password is too thin — whole-story comprehension.

- Genre: *The Case of the Golden Idol*, *Return of the Obra Dinn*.
- en beat: the finale is a "police report" form: WHO did WHAT on DATE at PLACE,
  slots filled from keywords collected across the desktop; submits only when all
  slots filled; verified as a set.
- zh beat: 结局的"给班主任的信"填空：事发那晚，__ 在 __ 看见了 __ ——
  词库来自聊天记录/日记/论坛帖中高亮收集的词。
- **Derived**:
  - 🆕 events: `evidence:collect` (a term/keyword enters the player's word bank —
    emitted when the player clicks a highlighted term or the scenario grants it),
    `deduction:submit`, `deduction:verified` / `deduction:failed` (with which
    slot-groups matched — Obra Dinn's verify-in-threes anti-brute-force policy is
    an authoring choice, so payload must support partial-group feedback).
  - 🆕 action/app: a **Deduction Sheet** surface (a generic form dialog defined in
    scenario data: slots, accepted values, verification grouping). Candidate
    follow-up app after #84 MVP; a Notepad-based poor-man's version (type the
    answer into a file, `contentContains` predicate 🔶#116) works day one.
  - state: the word bank is scenario state (like flags), persisted, snapshot-able (#117).

### M4. Evidence board & pinning (the Roottrees surface)

A pinboard where discovered items are pinned and *linked*; the board is both the
player's external memory and, optionally, a verifier (Roottrees' family-tree
slots are a deduction form shaped like a graph).

- Genre: *The Roottrees are Dead*, *Shadows of Doubt* (string-and-corkboard with
  auto-linking), *Paradise Killer* (evidence list feeding a trial).
- en beat: a "family tree" poster file opens a board with empty slots; dragging
  collected photos/names into slots verifies in groups.
- zh beat: 一张"班级合影.jpg"当作插槽板：把收集到的网名逐个拖到对应的脸上。
- **Derived**:
  - 🆕 events: `evidence:pin`, `evidence:link`, `evidence:unpin` (payload: item
    ids, link pairs).
  - 🆕 predicates: `pinned(id)`, `linked(a, b)`, `boardComplete(boardId)`.
  - Verdict: this is a *v2 app* (real UI work). The engine prerequisite worth
    doing early is only the event/predicate shape. The M2 journal and M4 board
    can be one app ("剪贴簿/Scrapbook") that starts as an auto-collecting list
    and grows linking later.

### M5. The search oracle (Her Story / Roottrees engine)

An in-world search engine where *queries are the puzzle*: known terms return
authored results; the parser is a keyword matcher, not NLP; searching a name you
could only have learned late is the knowledge gate (M2) in search-box form.

- Genre: *Her Story* (database queries as the sole verb), *The Roottrees are
  Dead* (period search engine + newspaper archive as text parser).
- en beat: "AltaVista-alike" in IE: searching the victim's *nickname* (learnable
  only from the guestbook) returns the forum thread the real name never finds.
- zh beat: 假百度：搜事件日期出 3 条作者化结果；搜到晚期才知道的真名，出那篇
  改变定性的帖子。
- **Derived**:
  - 🆕 event: `search:query` (payload: normalized query string, hit/miss, result ids).
  - 🆕 data: query→results table in scenario packs + authored no-results page
    (misses are content too). Builds on scenario-injectable IE pages (round-1 C3).
  - Design note (from Roottrees): treat the matcher as an adventure-game text
    parser — generous normalization (case, whitespace, full/half width, pinyin
    tolerance for zh), and log missed queries during playtesting (the miss log
    IS the difficulty tuning tool).

### M6. Accusation with evidence support (the Paradise Killer verdict)

The terminal choice accepts *any* answer; the quality of the supporting evidence
set determines the outcome. Multiple internally-consistent readings can exist —
the game grades the case, not the hunch.

- Genre: *Paradise Killer* (accuse anyone; the jury convicts only what evidence
  supports), *Shadows of Doubt* (incrimination flow).
- en beat: the final email "send to the sheriff" lets you name anyone; the
  epilogue depends on which of 6 evidence flags you actually hold.
- zh beat: 结局向论坛发帖指认，任何名字都能发；尾声取决于你手里攥着哪些证据 flag。
- **Derived**: no new events — this is a *pattern over existing machinery*:
  a final `deduction:submit` (M3) whose verification predicate is a **weighted
  expression over flags/evidence** rather than exact match. Schema requirement:
  conditions must support arithmetic over counters (`count(evidence.*) >= 4`) and
  the ending action must accept a computed id (`setEnding(expr)`). Feeds #84.

### M7. Tool verbs & transformation (apps as moves)

CMD commands, rename-as-transformation, Paint-as-ritual, media playback — the
apps are the verb set. (Round-1 §C, unchanged but restated as derivations.)

- Genre: *Hypnospace Outlaw* (installing new software IS solving), classic
  adventure-game verb design.
- en beat: `attrib -h` reveals the hidden folder the readme swears doesn't exist.
- zh beat: `ren 照片.jpg 照片.txt` → 日记在记事本里打开。
- **Derived**:
  - events: `cmd:exec` ✅ (payload matching 🔶#84), `file:rename` ✅,
    `file:update` 🔶#116 (Notepad/Paint save), 🆕 `game:win`/`game:lose`
    (Minesweeper/Solitaire, tiny), `media:ended` (defer — gate on `file:open`).
  - 🆕 FS attributes: `hidden` (+ `dir /a`, `attrib`), `protected` (undeletable
    critical-path items with authored denial text), `mtime`/`size` metadata
    (clue channel + Explorer details view #120 needs it anyway).
  - 🆕 rebinding: extension change re-resolves the opening app (or a
    `setNodeApp` action).

### M8. Push & social simulation (the messenger heart)

Scripted contacts message the player: branching choices, delays, offline
delivery, status/signature changes as world reactions. The single richest
narrative channel; en skin is MSN/AIM, zh skin is QQ — same machinery (#119).

- Genre: *Emily is Away* (mash-keys typing, predetermined replies — the input
  grammar to copy), *Digital: A Love Story* (player's messages implied, never
  shown — dodges free text entirely).
- **Derived** (consolidating round-1 §D):
  - events: `msg:received`, `msg:choice` (player picked reply option),
    `msg:opened`, `buddy:online`/`buddy:offline` — namespaced `msg:*`/`buddy:*`
    so QQ and a future MSN app share the domain (#119 implements).
  - actions: `msg.send(buddy, script)`, `buddy.setStatus/Signature`, delays with
    **reload-surviving persistence** (🔶#130 scheduler).
  - conditions: keyword matching on free-text inputs only (`contains('自行车')`),
    never NLP.

### M9. Time & state (the machine remembers)

Wall-clock triggers (整点), virtual system date as a puzzle dial, idle/screensaver
reveals, boot-count metaprogression, elapsed-real-days decay. (Round-1 §E.)

- **Derived**: `time:hour` 🔶#130, `user:idle`/`user:active` 🔶#130,
  `session:boot` ✅ + counters, 🆕 **virtual clock** (one source of truth that
  Control Panel/`date` set and conditions read — `sysdate` predicates), stored
  last-seen timestamp (`days_since_last_login` predicate). Rule: never hard-gate
  on real time without a diegetic override.

### M10. Meta & fourth wall (spending fidelity)

Fake malware, fake updates as act cuts, files that react to being read, save
awareness. TINAG (ARG's "this is not a game") is the governing aesthetic: the
engine's XP credibility is the asset; betray it only after two acts of earning it.

- Genre: *Hypnospace Outlaw* (fake OS updates between acts), ARG practice.
- **Derived**: `file:open` ✅ + `editFileContent` action 🔶#115; 🆕
  `setNodeIcon` action; 🆕 generic **scripted takeover/wizard** component (fake
  update screens, driven by data); meta-persistence tier that new-game does NOT
  clear (#117).

### M11. Entry & framing (the ARG trailhead)

How players fall in: a rabbit hole, not a menu. ARGs teach that the *first
artifact* should be discoverable in-fiction (a strange link on a real blog, a
desktop already open at a suspicious file) and that multiple trailheads
multiply the catch rate.

- en beat: a real personal blog embeds the desktop (`mode="embedded"` ✅) with
  one odd file on it; the "game" is never announced.
- zh beat: 一篇怀旧向公众号文章内嵌桌面，桌面上只有一个便签："别动我的东西"。
- **Derived**: nothing new — this is `mode="embedded"` + `fileSystemMode="replace"`
  (✅ #73/#77) doing exactly what they were built for. Document the pattern in the
  scenario authoring guide; it is the productized answer to "why embed an OS".

### M12. Guidance systems (the other half of design)

Breadcrumbs ≤2 hops, progressive disclosure, soft-fail hint escalation,
attention direction ranked by intrusiveness, diegetic tutorialization, the
anti-stuck contract, confirmation feedback, optional-depth layering, one-spine
reactive endings. (Round-1 §G — still the best part of v1; unchanged, but now
with clean derivations.)

- **Derived**:
  - `password:fail` 🔶#116 + **counters** (hint ladders),
  - `user:idle` 🔶#130 (stall detection),
  - actions: `balloonTip` 🔶#118, 🆕 `flashTaskbar`, `playSound` ✅,
  - 🆕 **first-class hint ladders** in the schema (`hints: [{after: …, do: …}]`
    per puzzle node — see §4 Layer 3, where the linter enforces "every required
    step declares its ladder"),
  - **no silent flag-sets on the critical path** (authoring lint rule).

---

## 2. What the zh/en split actually means

Nothing above is culture-specific. The culture package (#77/#123/#129) supplies
the *skin*: QQ vs MSN, hao123 vs AltaVista-alike, 网吧 receipts vs summer-camp
photos, 火星文 vs l33t. The scenario schema references apps and surfaces by id,
so one mechanic graph can ship with two content packs. Practical rule for
authors: **write the dependency graph culture-neutrally; write beats per
culture.** The official "2007 county-town" game is a zh skin; #123's en culture
makes an en skin possible over the identical engine.

---

## 3. The reverse-derived event catalog

Consolidated demand list. "Demanded by" points at the mechanics above; status
shows where each event lands.

| Domain | Event | Key payload | Status | Demanded by |
|---|---|---|---|---|
| file | `file:open` / `create` / `delete` / `rename` / `restore` / `unlock` | path, node | ✅ | M1 M2 M7 M10 |
| file | `file:update` (content saved) | path, size | 🔶 #116 | M3 (Notepad answers) M7 |
| file | `file:move` / `file:copy` / `folder:delete` / `recyclebin:empty` | from, to | 🔶 #116 | M7, B6 file-as-key |
| file | `file:properties-viewed` | path | 🆕 nice-to-have | M1 metadata clues |
| security | `password:fail` | target, attempt # | 🔶 #116 | M12 hint ladders, B5 |
| session | `login` / `logout` / `boot-complete` / `shutdown` | — | ✅ | M9 M11 |
| session | `login-fail` | — | 🔶 #116 | M12 |
| cmd | `cmd:exec` | command, args | ✅ (payload matching 🔶#84) | M7 |
| ie | `ie:navigate` | url, hit/miss | 🔶 #116 | M1 M5 |
| search | `search:query` | query (normalized), hit, resultIds | 🆕 | M5 |
| evidence | `evidence:collect` | termId, source | 🆕 | M3 M4 M6 |
| evidence | `evidence:pin` / `link` / `unpin` | itemId(s) | 🆕 (v2 app) | M4 |
| deduction | `deduction:submit` / `verified` / `failed` | formId, slotGroups | 🆕 | M3 M6 |
| msg | `msg:received` / `opened` / `choice`; `buddy:online` / `offline` | buddyId, msgId, choiceId | 🔶 #119 (names per this table) | M8 |
| notification | `notification:show` / `click` | id | 🔶 #118 | M12 |
| time | `time:hour`; `user:idle` / `user:active` | hour; idleMs | 🔶 #130 | M9 M12 |
| game | `game:win` / `game:lose` | appId, difficulty | 🆕 (tiny) | M7 gates |
| media | `media:ended` / `media:seek` | path, position | 🆕 **deferred** | M7 — gate on open instead |
| window/app | launch/close/focus/min/max/restore | ids | ✅ | M12 attention |

**Naming falls out of #130's grammar** (`domain:action`, past-tense facts,
ids + path arrays in payloads). The three genuinely new domains are `search`,
`evidence`, `deduction` — all three are *scenario-layer surfaces*, so their
events should be emitted by the scenario runtime/apps, not the core engine:
the engine stays ignorant of game semantics (axiom 2).

## 3.1 State & condition requirements (feeds #84 schema directly)

- **Event-history predicates**: `happened(pattern)`, `count(pattern)` over a
  persisted, bounded event journal — replaces bookkeeping flags (M2). The
  journal is also the save-game spine alongside flags/FS (#117).
- **FS predicates**: `exists(path)`, `contentContains(path, str)`,
  `isUnlocked(path)`, `attr(path, 'hidden')`.
- **Evidence/board predicates**: `collected(termId)`, `pinned(id)`,
  `linked(a,b)`, `boardComplete(id)` (M3/M4).
- **Counters + arithmetic** (`count(evidence.chapter2.*) >= 4`) and **string
  variables** with templating (M6, M8).
- **Clock predicates**: `clock.hour`, `sysdate` (virtual clock 🆕),
  `days_since_last_login`, `idle_minutes` (M9).
- **Composition**: AND/OR/NOT; payload matching equals/contains/glob.
- **Trigger semantics**: `once` (default) / `repeat` / `max: N`; priority when
  multiple triggers match; delayed/scheduled actions persisted across reload (#130).

---

## 4. Orchestration: four layers, one runtime

The owner's question — "how does all of this become *convenient to orchestrate
in code*?" — resolves into four authoring layers that compile to one runtime:

**Layer 0 — imperative host** (✅/#115): `ref.openApp()`, `onEvent`. For demos,
analytics, and host-driven set pieces. Already the escape hatch for anything the
declarative layers can't say.

**Layer 1 — declarative JSON triggers** (#84): `{on, when, do}` lists. The
lingua franca; what saves/loads, what the linter checks, what Layers 2–3 compile
into. Non-programmers can hand-write it.

**Layer 2 — typed fluent builder** (🆕, for developers): a TypeScript API that
compiles to Layer-1 JSON, giving autocomplete over the event table (§3) and
compile-time payload checking:

```ts
const s = defineScenario('county-2007');

s.on('file:open', { path: 'D:/日记.txt' })
 .when(not(flag('act2')))
 .once()
 .do(collect('term.bicycle'),
     delay('90s', msg.send('阿哲', script('nudge-1'))));

s.puzzle('unlock-private-folder', {
  requires: ['read-diary', 'seen-cafe-homepage'],   // ← Layer 3
  solvedWhen: happened('file:unlock', { path: 'D:/私人' }),
  hints: ladder({ afterIdle: '10m', fails: 3 }, 'hint.folder.1', 'hint.folder.2'),
});
```

Because Layer 2 emits Layer-1 JSON, both audiences share one runtime, one save
format, one linter — no dual implementations.

**Layer 3 — the puzzle dependency graph** (🆕, the design-level win): Ron
Gilbert's Puzzle Dependency Charts — the tool adventure games have used since
Monkey Island — become the *authoring model*, not just a diagram. Authors declare
puzzle nodes with `requires`/`solvedWhen`/`grants`; the compiler derives the
Layer-1 triggers (gating, reveals, act bottlenecks); the **linter** checks what
PDCs were invented to catch, mechanically:

- unreachable puzzles / dead ends (Maniac Mansion's famous failure mode),
- act bottlenecks that can be bypassed unintentionally,
- required steps with no hint ladder (M12's anti-stuck contract),
- "bushiness" report: how many puzzles are open in parallel at each point
  (pacing visualization for free).

**Headless solver (CI for stories)** (🆕): because triggers are data and events
are data, a scenario pack is testable without a browser: feed the intended
event sequence (the walkthrough, itself derivable from the PDG), assert the
ending is reached; fuzz alternate orderings to catch sequence-breaks. A story
whose walkthrough breaks fails CI like any other regression. This — more than
any single mechanic — is what "programmable game component" should mean.

---

## 5. Genre reference table (consolidated)

| Game | Core pattern | What this engine takes |
|---|---|---|
| Her Story | Query as the only verb | M5 search oracle; trust the player's understanding as the save file |
| Return of the Obra Dinn | Batch-verified deduction | M3 verify-in-groups anti-brute-force policy |
| The Case of the Golden Idol | Word-bank fill-in verification | M3 Deduction Sheet shape; highlighted-term collection (`evidence:collect`) |
| The Roottrees are Dead | Period search engine + slot board | M5 parser-with-generous-normalization; M4 board-as-verifier; log missed queries as tuning data |
| Outer Wilds | Knowledge is the only lock | M2 history predicates; sequence-breaking as a feature; the journal/ship-log app |
| Shadows of Doubt | Corkboard + incrimination flow | M4 pin/link events; auto-linking as assist |
| Paradise Killer | Accuse anyone, evidence grades the case | M6 weighted-predicate endings; multiple consistent readings |
| Hypnospace Outlaw | Fake OS, diegetic job, updates as acts | M7 install-as-solving, M10 fake updates, authored noise for clue density |
| Emily is Away / Digital: A Love Story | Performed typing; implied player voice | M8 input grammar — no NLP, ever |
| A Normal Lost Phone / Simulacra | Found-device forensics | M1/M8 carry a full game with minimal gating; keep visual clues generous |
| Monkey Island (design practice) | Puzzle Dependency Charts | §4 Layer 3 — the orchestration model itself |
| ARGs (This Is Not A Game) | Rabbit holes, distributed solving | M11 embedded trailheads; TINAG as the framing aesthetic for `mode="embedded"` |

## 6. Honest limits (unchanged from v1)

No real bytes (hex/EXIF/zip — fictionalize); no secrecy from devtools (hash
answers as courtesy only); no closed-tab life (compute elapsed effects on load);
no free-text NLP (choices + keyword matching); no judging creative input (Paint
edits detectable, not evaluable); everything stays inside the simulated monitor;
skill gates need mercy bypasses.

## 7. Where each derivation lands

| Requirement | Lands in |
|---|---|
| New event names + naming review | #116 (emission points), #130 (conventions, generated docs) |
| `time:hour`, `user:idle`, persisted scheduler | #130 |
| Event journal + `happened()`/`count()` predicates | #84 schema (runtime), #117 (persistence/snapshot) |
| FS predicates, counters, string vars, AND/OR, once/repeat, hint ladders | #84 schema |
| `hidden`/`protected`/`mtime` node attrs ✅ #219 (Explorer show-hidden toggle + delete/rename guard); `game:win/lose`, `setNodeIcon`, virtual clock, takeover component | follow-up implementation issues after #84 schema settles |
| `search:query` + query table; injectable IE pages | #84 content model (builds on round-1 C3/C4) |
| `msg:*`/`buddy:*` event names | #119 |
| Deduction Sheet, Evidence Board apps | v2 candidates after #84 MVP (Notepad + `contentContains` is the day-one substitute) |
| Fluent builder (Layer 2), PDG compiler + linter (Layer 3), headless solver | #84 follow-up: "scenario authoring toolkit" — file when MVP schema stabilizes |
