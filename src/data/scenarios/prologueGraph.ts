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
 * This is the reference example of the graph authoring model + its linter: it
 * lints with zero issues (every node reachable, hinted, and behind the gate).
 */
import {
  compilePuzzleGraph,
  ladder,
  type PuzzleGraph,
} from '../../scenario/puzzleGraph';
import { addFile, eventMatch, happened, notify, qqMessage } from '../../scenario/builder';

export const prologueGraph: PuzzleGraph = {
  id: 'prologue-graph-2005',
  puzzles: [
    {
      id: 'intro',
      solvedWhen: happened('session:boot-complete'),
      grants: [
        notify({
          title: '还记得吗？',
          body: '桌面上的『备忘录』便签也许有用；回收站里还躺着几封没删的旧信。',
          timeout: 12000,
        }),
      ],
      hints: ladder({ idles: 1, title: '提示' }, '先看看桌面上的便签，或翻翻回收站。'),
    },
    {
      id: 'read-letter',
      requires: ['intro'],
      on: 'file:open',
      solvedWhen: eventMatch({ name: '写给未来的信.txt' }),
      grants: [
        notify({
          title: '一封旧信',
          body: '信里提到「把东西存在 D 盘备份里」，还改了 QQ 签名。去 D 盘的「游戏」文件夹翻翻那段聊天记录。',
          timeout: 12000,
        }),
      ],
      hints: ladder({ idles: 1, title: '提示' }, '回收站里的《写给未来的信》。'),
    },
    {
      id: 'read-chat',
      requires: ['read-letter'],
      gate: true, // the act bottleneck: the finale must come through here
      on: 'file:open',
      solvedWhen: eventMatch({ name: '聊天记录.txt' }),
      grants: [
        qqMessage('crystal', '还记得网吧那晚吗？你把所有东西都设成了同一个密码……'),
        notify({ title: '水晶女孩', body: '桌面上多了一张便签——像是当年的密码提示。', timeout: 12000 }),
        addFile(['密码便签.txt'], {
          type: 'file',
          app: 'Notepad',
          content: '给未来的我：\r\n\r\nC 盘那个藏起来的文件夹，密码就是我给所有东西设的老密码——admin（小写）。',
        }),
      ],
      hints: ladder({ idles: 1, title: '提示' }, 'D 盘 → 游戏 → 聊天记录.txt。'),
    },
    {
      id: 'unlock-windows',
      requires: ['read-chat'],
      solvedWhen: happened('file:unlock', { name: 'WINDOWS' }),
      grants: [
        notify({ title: '序章完成', body: '文件夹打开了。当年的自己，终于把东西交到了未来的手上。', timeout: 0 }),
        addFile(['尾声.txt'], { type: 'file', app: 'Notepad', content: '2005 年的那台电脑，你已经全部看过了。\r\n\r\n（序章 · 完）' }),
      ],
      hints: ladder({ fails: 2, title: '提示' }, '桌面上的「密码便签」写着答案——老密码，小写。'),
    },
  ],
};

/** The compiled Layer-1 scenario — pass this to `<WindowsXP scenario={…} />`. */
export const prologueGraphScenario = compilePuzzleGraph(prologueGraph);

export default prologueGraph;
