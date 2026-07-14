/**
 * Reference search corpus (#219 / #134). A small in-world "web" for the 序章
 * fiction — period pages a player digs up through the search engine inside IE.
 * Open the browser at the search engine and hand it this corpus:
 *
 *   ref.openApp('InternetExplorer', { url: 'http://www.baidu.com', searchCorpus: demoSearchCorpus })
 *
 * Each result carries the `html` landing page IE renders when it's clicked, so
 * the player can actually read into a clue. A scenario then gates on
 * `searched('水晶女孩')` or `found('bbs-thread')`.
 */
import type { SearchResultPage } from '../../apps/InternetExplorer/types';

const page = (heading: string, body: string): string =>
  `<html><head><meta charset="utf-8" /><style>` +
  `body{font-family:Tahoma,sans-serif;font-size:13px;color:black;margin:16px;line-height:1.6}` +
  `h1{font-size:18px;color:darkblue}</style></head>` +
  `<body><h1>${heading}</h1><p>${body}</p></body></html>`;

export const demoSearchCorpus: SearchResultPage[] = [
  {
    id: 'bbs-thread',
    title: '【求助】有人认识“水晶女孩”吗？_同城论坛',
    url: 'http://bbs.county.com/thread-2007-08-11.html',
    snippet: '楼主：那天在网吧看到她，网名叫水晶女孩，一直在打字……有没有人知道她是谁？',
    match: ['水晶女孩', 'crystal', '网吧'],
    html: page(
      '同城论坛 · 求助帖',
      '楼主：那天在城东网吧看到她，网名叫“水晶女孩”，一直低头打字，走的时候留了半张网吧充值单。有没有人知道她是谁？急。'
    ),
  },
  {
    id: 'cafe-news',
    title: '本地新闻：城东网吧深夜火灾 无人员伤亡',
    url: 'http://news.county.com/2007/fire.html',
    snippet: '8月，城东一家网吧凌晨发生火灾，监控设备损毁，警方正在调查起火原因。',
    match: ['网吧', '火灾', 'cafe'],
    html: page(
      '本地新闻',
      '8月，城东“蓝光”网吧凌晨发生火灾，监控设备损毁严重，起火点疑在机房。所幸无人员伤亡，警方正在调查起火原因。'
    ),
  },
  {
    id: 'qq-space',
    title: '水晶女孩 的QQ空间',
    url: 'http://qzone.qq.com/crystalgirl',
    snippet: '心情：想给未来的自己写一封信。访问量 1024。',
    match: ['水晶女孩', 'qq', '未来的信'],
    html: page(
      '水晶女孩 的QQ空间',
      '最新日志《写给未来的信》：如果十年后有人看到这条，请替我去城东的网吧看看，它还在吗？访问量 1024。'
    ),
  },
];

export default demoSearchCorpus;
