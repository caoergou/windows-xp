/**
 * "序章 · 2005" as a Puzzle Dependency Graph (PUZZLE-DESIGN §4 Layer 3).
 *
 * The same prologue as `prologue.ts`, but authored as a dependency graph instead
 * of hand-written triggers: four puzzle nodes in a linear chain
 * (`intro → read-letter → read-chat → unlock-windows`), each with a hint ladder,
 * with `read-chat` marked as the act gate. `compilePuzzleGraph` turns it into the
 * Layer-1 scenario the runtime executes; the headless solver proves the
 * walkthrough completes (see `test/prologueGraph.test.ts` — "CI for stories").
 *
 * It also demonstrates #207 "one graph, two skins": the beat **dialogue** lives
 * in per-locale `strings` tables and the grants reference it by key (`titleKey`
 * /`bodyKey`/`textKey`), so the same graph plays in Chinese or English by
 * swapping the active locale. (Hint text and embedded file contents are still
 * inline Chinese — a follow-up.)
 */
import { compilePuzzleGraph, ladder, type PuzzleGraph } from '../../scenario/puzzleGraph';
import { addFile, eventMatch, happened, notify } from '../../scenario/builder';

export const prologueGraph: PuzzleGraph = {
  id: 'prologue-graph-2005',
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
    },
  },
  puzzles: [
    {
      id: 'intro',
      solvedWhen: happened('session:boot-complete'),
      grants: [notify({ titleKey: 'intro.title', bodyKey: 'intro.body', timeout: 12000 })],
      hints: ladder({ idles: 1, title: '提示' }, '先看看桌面上的便签，或翻翻回收站。'),
    },
    {
      id: 'read-letter',
      requires: ['intro'],
      on: 'file:open',
      solvedWhen: eventMatch({ name: '写给未来的信.txt' }),
      grants: [notify({ titleKey: 'letter.title', bodyKey: 'letter.body', timeout: 12000 })],
      hints: ladder({ idles: 1, title: '提示' }, '回收站里的《写给未来的信》。'),
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
        addFile(['密码便签.txt'], {
          type: 'file',
          app: 'Notepad',
          content:
            '给未来的我：\r\n\r\nC 盘那个藏起来的文件夹，密码就是我给所有东西设的老密码——admin（小写）。',
        }),
      ],
      hints: ladder({ idles: 1, title: '提示' }, 'D 盘 → 游戏 → 聊天记录.txt。'),
    },
    {
      id: 'unlock-windows',
      requires: ['read-chat'],
      solvedWhen: happened('file:unlock', { name: 'WINDOWS' }),
      grants: [
        notify({ titleKey: 'finale.title', bodyKey: 'finale.body', timeout: 0 }),
        addFile(['尾声.txt'], {
          type: 'file',
          app: 'Notepad',
          content: '2005 年的那台电脑，你已经全部看过了。\r\n\r\n（序章 · 完）',
        }),
      ],
      hints: ladder({ fails: 2, title: '提示' }, '桌面上的「密码便签」写着答案——老密码，小写。'),
    },
  ],
};

/** The compiled Layer-1 scenario — pass this to `<WindowsXP scenario={…} />`. */
export const prologueGraphScenario = compilePuzzleGraph(prologueGraph);

export default prologueGraph;
