/**
 * "序章 · 2005" as a Puzzle Dependency Graph (PUZZLE-DESIGN §4 Layer 3).
 *
 * The same prologue as 'prologue.ts', but authored as a dependency graph instead
 * of hand-written triggers: four puzzle nodes in a linear chain
 * ('intro -> read-letter -> read-chat -> unlock-windows'), each with a hint ladder,
 * with 'read-chat' marked as the act gate. 'compilePuzzleGraph' turns it into the
 * Layer-1 scenario the runtime executes; the headless solver proves the
 * walkthrough completes (see 'test/prologueGraph.test.ts' - "CI for stories").
 *
 * It also demonstrates #207 "one graph, two skins": every player-visible string
 * - beat dialogue, hint ladders, and the in-world documents the grants drop on
 * the desktop - lives in per-locale 'strings' tables, referenced by key
 * ('titleKey'/'bodyKey'/'textKey'/'contentKey'). Nothing player-facing is inline,
 * so the same graph plays end-to-end in Chinese or English purely by swapping the
 * active locale. (File *names* are still structural graph identifiers.)
 */
import { compilePuzzleGraph, ladderKeys, type PuzzleGraph } from '../../scenario/puzzleGraph';
import { addFile, eventMatch, happened, notify } from '../../scenario/builder';

export const prologueGraph: PuzzleGraph = {
  id: 'prologue-graph-2005',
  // Canonical walkthrough (#207): the deterministic path through the four
  // puzzles, with named beats. Doubles as the solver's regression input and the
  // rehearsal engine's seek tape — `seekTo('finale')` replays this to the end.
  rehearsal: {
    walkthrough: [
      { event: { type: 'session:boot-complete' }, beat: 'intro' },
      {
        event: {
          type: 'file:open',
          path: ['写给未来的信.txt'],
          name: '写给未来的信.txt',
          nodeType: 'file',
        },
        beat: 'letter',
      },
      {
        event: {
          type: 'file:open',
          path: ['聊天记录.txt'],
          name: '聊天记录.txt',
          nodeType: 'file',
        },
        beat: 'chat',
      },
      { event: { type: 'file:unlock', name: 'WINDOWS' }, beat: 'finale' },
    ],
  },
  strings: {
    zh: {
      'intro.title': '还记得吗？',
      'intro.body': '桌面上的『备忘录』便签也许有用；回收站里还躺着几封没删的旧信。',
      'letter.title': '一封旧信',
      'letter.body':
        '信里提到「把东西存在 D 盘备份里」，还改了 QQ 签名。去 D 盘的「游戏」文件夹翻翻那段聊天记录。',
      'chat.qq': '还记得网吧那晚吗？你把所有东西都设成了同一个密码……',
      'chat.title': '水晶女孩',
      'chat.body': '桌面上多了一张便签——像是当年的密码提示。',
      'finale.title': '序章完成',
      'finale.body': '文件夹打开了。当年的自己，终于把东西交到了未来的手上。',
      // Hint ladders (M12) — one shared title, one rung per puzzle.
      'hint.title': '提示',
      'hint.intro': '先看看桌面上的便签，或翻翻回收站。',
      'hint.letter': '回收站里的《写给未来的信》。',
      'hint.chat': 'D 盘 → 游戏 → 聊天记录.txt。',
      'hint.unlock': '桌面上的「密码便签」写着答案——老密码，小写。',
      // In-world documents dropped on the desktop by the grants.
      'file.passwordNote':
        '给未来的我：\r\n\r\nC 盘那个藏起来的文件夹，密码就是我给所有东西设的老密码——admin（小写）。',
      'file.epilogue': '2005 年的那台电脑，你已经全部看过了。\r\n\r\n（序章 · 完）',
    },
    en: {
      'intro.title': 'Remember?',
      'intro.body':
        'The desktop "Memo" note might help; a few undeleted old letters still sit in the Recycle Bin.',
      'letter.title': 'An old letter',
      'letter.body':
        'It mentions "I backed everything up on the D: drive" and a changed QQ status. Dig up that chat log in D:\\Games.',
      'chat.qq': 'Remember that night at the cyber cafe? You set the same password on everything…',
      'chat.title': 'crystal girl',
      'chat.body': 'A new note appeared on the desktop — looks like the old password hint.',
      'finale.title': 'Prologue complete',
      'finale.body': 'The folder opened. Your younger self finally handed it all to the future.',
      'hint.title': 'Hint',
      'hint.intro': 'Check the note on the desktop, or dig through the Recycle Bin.',
      'hint.letter': '"A Letter to the Future" is in the Recycle Bin.',
      'hint.chat': 'D: drive → Games → the chat log.',
      'hint.unlock':
        'The "password note" on the desktop has the answer — the old password, lowercase.',
      'file.passwordNote':
        'To future me:\r\n\r\nThat hidden folder on the C: drive — the password is the same old one I set on everything: admin (lowercase).',
      'file.epilogue': "You've now seen everything on that 2005 machine.\r\n\r\n(Prologue · End)",
    },
  },
  puzzles: [
    {
      id: 'intro',
      solvedWhen: happened('session:boot-complete'),
      grants: [notify({ titleKey: 'intro.title', bodyKey: 'intro.body', timeout: 12000 })],
      hints: ladderKeys({ idles: 1, titleKey: 'hint.title' }, 'hint.intro'),
    },
    {
      id: 'read-letter',
      requires: ['intro'],
      on: 'file:open',
      solvedWhen: eventMatch({ name: '写给未来的信.txt' }),
      grants: [notify({ titleKey: 'letter.title', bodyKey: 'letter.body', timeout: 12000 })],
      hints: ladderKeys({ idles: 1, titleKey: 'hint.title' }, 'hint.letter'),
    },
    {
      id: 'read-chat',
      requires: ['read-letter'],
      gate: true, // the act bottleneck: the finale must come through here
      on: 'file:open',
      solvedWhen: eventMatch({ name: '聊天记录.txt' }),
      grants: [
        { qqMessage: { buddyId: 'crystal', textKey: 'chat.qq' } },
        notify({ titleKey: 'chat.title', bodyKey: 'chat.body', timeout: 12000 }),
        addFile(['密码便签.txt'], { type: 'file', app: 'Notepad' }, 'file.passwordNote'),
      ],
      hints: ladderKeys({ idles: 1, titleKey: 'hint.title' }, 'hint.chat'),
    },
    {
      id: 'unlock-windows',
      requires: ['read-chat'],
      solvedWhen: happened('file:unlock', { name: 'WINDOWS' }),
      grants: [
        notify({ titleKey: 'finale.title', bodyKey: 'finale.body', timeout: 0 }),
        addFile(['尾声.txt'], { type: 'file', app: 'Notepad' }, 'file.epilogue'),
      ],
      hints: ladderKeys({ fails: 2, titleKey: 'hint.title' }, 'hint.unlock'),
    },
  ],
};

/** The compiled Layer-1 scenario — pass this to `<WindowsXP scenario={…} />`. */
export const prologueGraphScenario = compilePuzzleGraph(prologueGraph);

export default prologueGraph;
