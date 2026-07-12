/**
 * "序章 · 2005" — the reference prologue scenario (#84).
 *
 * A ~5–10 minute, fully declarative story built entirely on the built-in seed
 * content (the recycle-bin letter, the D-drive chat log, the locked `C:\WINDOWS`
 * folder, the QQ buddy 水晶女孩). It demonstrates the three scenario mechanics
 * end-to-end without a line of React:
 *   • doors & keys  — the finale gates on unlocking `C:\WINDOWS`;
 *   • pushes        — tray balloons + a QQ line + a planted clue file;
 *   • progress      — flags advance and persist across refresh.
 *
 * This is plain, JSON-serializable data. Pass it to `<WindowsXP scenario={…}/>`
 * (or copy it into a `.json` file) — see `docs/SCENARIOS.md`.
 */
import type { Scenario } from '../../scenario/types';

const 回收站信 = ['写给未来的信.txt'];
const 聊天记录 = ['我的电脑', '本地磁盘 (D:)', '游戏', '聊天记录.txt'];

export const prologueScenario: Scenario = {
  id: 'prologue-2005',
  initialFlags: { step: 0 },
  triggers: [
    // 开场：桌面就绪后给一个方向。
    {
      id: 'intro',
      on: 'session:boot-complete',
      once: true,
      do: [
        { setFlag: 'step', value: 1 },
        {
          notify: {
            title: '还记得吗？',
            body: '桌面上的『备忘录』便签也许有用；回收站里还躺着几封没删的旧信。',
            timeout: 12000,
          },
        },
      ],
    },

    // 第一条线索：回收站里的《写给未来的信》。
    {
      id: 'read-letter',
      on: 'file:open',
      when: { event: { name: '写给未来的信.txt' } },
      once: true,
      do: [
        { setFlag: 'readLetter' },
        { playSound: 'ding' },
        {
          notify: {
            title: '一封旧信',
            body: '信里提到「把东西存在 D 盘备份里」，还改了 QQ 签名。去 D 盘的「游戏」文件夹翻翻那段聊天记录。',
            timeout: 12000,
          },
        },
      ],
    },

    // 第二条线索：D 盘聊天记录 —— 需要先读过信（关联机制）。
    {
      id: 'read-chat',
      on: 'file:open',
      when: { all: [{ event: { name: '聊天记录.txt' } }, { flag: 'readLetter' }] },
      once: true,
      do: [
        { setFlag: 'readChat' },
        { setFlag: 'step', value: 2 },
        { qqMessage: { buddyId: 'crystal', text: '还记得网吧那晚吗？你把所有东西都设成了同一个密码……' } },
        {
          notify: {
            title: '水晶女孩',
            body: '满屏都是联机 CS 的约定。桌面上多了一张便签——像是当年的密码提示。',
            timeout: 12000,
          },
        },
        // 埋下解锁 C:\WINDOWS 的钥匙。
        {
          addFile: {
            path: ['密码便签.txt'],
            node: {
              type: 'file',
              app: 'Notepad',
              content:
                '给未来的我：\r\n\r\nC 盘那个藏起来的文件夹，密码就是我给所有东西设的老密码——admin（小写）。\r\n别再忘了。',
            },
          },
        },
      ],
    },

    // 反卡关：连续输错 2 次，把答案再推一次（M12 提示阶梯）。
    {
      id: 'password-hint',
      on: 'password:fail',
      when: { count: { type: 'password:fail' }, gte: 2 },
      max: 1,
      do: [
        {
          notify: {
            title: '提示',
            body: '桌面上的「密码便签」写着答案——老密码，小写。',
            timeout: 10000,
          },
        },
      ],
    },

    // 收尾：解锁 C:\WINDOWS 即通关。
    {
      id: 'finale',
      on: 'file:unlock',
      when: { event: { name: 'WINDOWS' } },
      once: true,
      do: [
        { setFlag: 'solved', value: true },
        { setFlag: 'step', value: 99 },
        { playSound: 'qqOnline' },
        {
          notify: {
            title: '序章完成',
            body: '文件夹打开了。当年的自己，终于把东西交到了未来的手上。',
            timeout: 0,
          },
        },
        {
          addFile: {
            path: ['尾声.txt'],
            node: {
              type: 'file',
              app: 'Notepad',
              content: '2005 年的那台电脑，你已经全部看过了。\r\n\r\n（序章 · 完）',
            },
          },
        },
      ],
    },
  ],
};

// The two clue paths are referenced above; exported for authors/tests to reuse.
export const prologuePaths = { 回收站信, 聊天记录 };

export default prologueScenario;
