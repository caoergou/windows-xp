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

export const referenceContentPack: ContentPack = {
  id: 'reference-prologue',
  assets: {
    'bbs-home': BBS_HTML,
    'grandma-letter': LETTER_MD,
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
};
