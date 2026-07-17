/**
 * Reference content pack (#241, PR-C).
 *
 * A tiny, self-contained {@link ContentPack} that demonstrates the two authoring
 * patterns from `docs/SCENARIO-PATTERNS.md` end-to-end — the template an
 * official puzzle content repository is built from:
 *
 *  1. **Fictional website** — an authorized IE site (`qingchun-bbs.com`) whose
 *     HTML lives behind an `{ asset }` reference, so IE serves it instead of the
 *     Wayback fallback.
 *  2. **Long document clue** — a `.md` letter on the desktop whose body is a
 *     `contentRef`, resolved lazily when the file is opened.
 *
 * Assets are inline here so the pack is portable and needs no host files; a real
 * pack would point `{ url }` at `.html` / `.md` files in its repository. Mount it
 * via `<WindowsXP contentPacks={[referenceContentPack]} />`.
 */
import type { ContentPack } from '../content/types';

const BBS_HTML = `<!doctype html>
<html lang="zh"><head><meta charset="utf-8"><title>青春 BBS</title>
<style>
  body { font-family: Tahoma, SimSun, sans-serif; margin: 0; background: rgb(231,239,250); color: rgb(32,32,32); }
  h1 { background: linear-gradient(rgb(90,143,214), rgb(58,111,192)); color: white; margin: 0; padding: 10px 14px; font-size: 18px; }
  .body { padding: 14px; }
  ul { padding-left: 20px; }
  a { color: rgb(6,69,173); }
</style></head>
<body>
  <h1>青春 BBS — 首页</h1>
  <div class="body">
    <p>欢迎回到 2005 年的论坛。</p>
    <ul>
      <li><a href="http://qingchun-bbs.com/post/1">【灌水】今天你签到了吗？</a></li>
      <li><a href="http://qingchun-bbs.com/post/2">【求助】谁有周杰伦的新专辑？</a></li>
    </ul>
  </div>
</body></html>`;

const LETTER_MD = `# 外婆的信

亲爱的孩子：

见字如面。家里一切都好，院子里的石榴树又结果了。

你走的时候忘在抽屉里的那本相册，我替你收好了。密码还是你生日那天。

  —— 外婆
`;

const QQ_NOTE = `城东蓝光网吧\n充值时间：2006-08-11 20:03\n座位：17 号\n`;

export const referenceContentPack: ContentPack = {
  id: 'reference-prologue',
  assets: {
    'bbs-home': BBS_HTML,
    'grandma-letter': LETTER_MD,
    'qq-netbar-note': QQ_NOTE,
  },
  sites: {
    'https://www.qingchun-bbs.com/': {
      title: '青春 BBS — 首页',
      html: { asset: 'bbs-home' },
    },
  },
  files: {
    'letter.md': {
      type: 'file',
      name: 'letter.md',
      app: 'MarkdownViewer',
      contentRef: { asset: 'grandma-letter' },
    },
  },
  qqArchives: [
    {
      id: 'reference-qq-history',
      title: '本地消息记录',
      conversations: [
        {
          id: 'crystal-history',
          title: '水晶女孩',
          kind: 'direct',
          memberIds: ['crystal'],
          messages: [
            {
              id: 'crystal-20060811-1',
              senderId: 'crystal',
              senderName: '水晶女孩',
              sentAt: '2006-08-11T20:14:00+08:00',
              text: '你还记得城东那家蓝光网吧吗？',
            },
            {
              id: 'crystal-20060811-2',
              senderId: '10001',
              senderName: '往事随风',
              sentAt: '2006-08-11T20:15:00+08:00',
              text: '记得，17 号机旁边的窗户总是关不上。',
            },
            {
              id: 'crystal-20060811-3',
              senderId: 'crystal',
              senderName: '水晶女孩',
              sentAt: '2006-08-11T20:17:00+08:00',
              text: '我翻到了那天的充值单，你看看时间。',
              attachments: [
                {
                  id: 'netbar-note',
                  name: '蓝光网吧充值单.txt',
                  content: { asset: 'qq-netbar-note' },
                },
              ],
            },
            {
              id: 'crystal-20060812-1',
              senderId: '10001',
              senderName: '往事随风',
              sentAt: '2006-08-12T09:02:00+08:00',
              text: '收到了，晚上老地方见。',
            },
          ],
        },
        {
          id: 'friends-history',
          title: '周末联机小队',
          kind: 'group',
          memberIds: ['crystal', 'ahui'],
          messages: [
            {
              id: 'friends-20060812-1',
              senderId: 'ahui',
              senderName: '阿辉',
              sentAt: '2006-08-12T17:41:00+08:00',
              text: '今晚八点，还是 CS 1.6？',
            },
          ],
        },
      ],
    },
  ],
};
