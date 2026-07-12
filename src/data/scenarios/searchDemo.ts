/**
 * Reference Search Oracle content (#219 / #134). A small authored result set for
 * the 序章 fiction — period web pages a player might dig up. Open with
 * `ref.openApp('SearchOracle', demoSearch)`; a scenario can then gate on
 * `searched('水晶女孩')` or `found('bbs-thread')`.
 */
import type { SearchOracleProps } from '../../apps/SearchOracle';

export const demoSearch: SearchOracleProps = {
  engineId: 'county-web',
  brand: '百度',
  results: [
    {
      id: 'bbs-thread',
      title: '【求助】有人认识“水晶女孩”吗？_同城论坛',
      url: 'http://bbs.county.com/thread-2007-08-11.html',
      snippet: '楼主：那天在网吧看到她，网名叫水晶女孩，一直在打字……有没有人知道她是谁？',
      match: ['水晶女孩', 'crystal', '网吧'],
    },
    {
      id: 'cafe-news',
      title: '本地新闻：城东网吧深夜火灾 无人员伤亡',
      url: 'http://news.county.com/2007/fire.html',
      snippet: '8月，城东一家网吧凌晨发生火灾，监控设备损毁，警方正在调查起火原因。',
      match: ['网吧', '火灾', 'cafe'],
    },
    {
      id: 'qq-space',
      title: '水晶女孩 的QQ空间',
      url: 'http://qzone.qq.com/crystalgirl',
      snippet: '心情：想给未来的自己写一封信。访问量 1024。',
      match: ['水晶女孩', 'qq', '未来的信'],
    },
  ],
};

export default demoSearch;
