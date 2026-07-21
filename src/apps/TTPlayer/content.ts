/**
 * TTPlayer（千千静听）sample content — the declarative data layer for the app
 * (mechanism/content separation: the component only implements the player
 * mechanism; everything a user sees as "content" lives here).
 *
 * Track metadata nods to the 2002–2007 C-pop era TTPlayer belongs to (titles
 * and artist names are facts, not copyrightable expression). The lyrics are
 * ORIGINAL placeholder lines written for this project in LRC style — they are
 * deliberately not the copyrighted originals (see NOTICE.md).
 */

export interface LrcLine {
  /** Seconds from track start. */
  time: number;
  text: string;
}

export interface TTTrack {
  id: string;
  title: string;
  artist: string;
  /** Displayed track length in seconds. */
  duration: number;
  lrc: LrcLine[];
}

/**
 * Every track the in-app "add" button can offer. The initial playlist is the
 * subset listed in DEFAULT_PLAYLIST_IDS; the rest are added on demand.
 */
export const TRACK_POOL: TTTrack[] = [
  {
    id: 'sunny-day',
    title: '晴天',
    artist: '周杰伦',
    duration: 269,
    lrc: [
      { time: 0, text: '千千静听 · 示例歌词' },
      { time: 12, text: '午后的风吹过教室窗台' },
      { time: 28, text: '粉笔灰落在旧课桌上' },
      { time: 45, text: '耳机里循环着同一首歌' },
      { time: 62, text: '把你名字写进草稿纸角落' },
      { time: 80, text: '放学的铃声还没有响' },
      { time: 98, text: '单车棚下躲一场太阳雨' },
      { time: 116, text: '说好明天还要一起回家' },
      { time: 140, text: '（间奏）' },
      { time: 170, text: '晴天总会来的 别急' },
      { time: 210, text: '—— 示例歌词，非原作 ——' },
    ],
  },
  {
    id: 'river-south',
    title: '江南',
    artist: '林俊杰',
    duration: 264,
    lrc: [
      { time: 0, text: '千千静听 · 示例歌词' },
      { time: 14, text: '烟雨落在青石板的小巷' },
      { time: 30, text: '乌篷船摇过旧桥洞' },
      { time: 48, text: '油纸伞下谁的背影' },
      { time: 66, text: '一转眼就消失在雨中' },
      { time: 84, text: '茶馆里说书人拍着醒木' },
      { time: 102, text: '讲的是千年前的相逢' },
      { time: 124, text: '（间奏）' },
      { time: 160, text: '江南好 风景旧曾谙' },
      { time: 205, text: '—— 示例歌词，非原作 ——' },
    ],
  },
  {
    id: 'fairy-tale',
    title: '童话',
    artist: '光良',
    duration: 259,
    lrc: [
      { time: 0, text: '千千静听 · 示例歌词' },
      { time: 15, text: '台灯下摊开一本旧童话' },
      { time: 32, text: '王子和公主住在城堡里' },
      { time: 50, text: '妈妈说故事都是真的' },
      { time: 68, text: '只要闭上眼睛就能到达' },
      { time: 88, text: '长大后才慢慢明白' },
      { time: 106, text: '童话是留给相信的人' },
      { time: 128, text: '（间奏）' },
      { time: 165, text: '愿你永远住在童话里' },
      { time: 205, text: '—— 示例歌词，非原作 ——' },
    ],
  },
  {
    id: 'wings',
    title: '隐形的翅膀',
    artist: '张韶涵',
    duration: 224,
    lrc: [
      { time: 0, text: '千千静听 · 示例歌词' },
      { time: 12, text: '每一次跌倒都自己爬起' },
      { time: 28, text: '拍拍尘土继续往前走' },
      { time: 46, text: '风再大也不低下头来' },
      { time: 64, text: '心里有双看不见的翅膀' },
      { time: 82, text: '带我飞过绝望的山丘' },
      { time: 100, text: '看见远方升起的光' },
      { time: 122, text: '（间奏）' },
      { time: 155, text: '梦想总会开花 别怕' },
      { time: 185, text: '—— 示例歌词，非原作 ——' },
    ],
  },
  {
    id: 'love-shift',
    title: '爱情转移',
    artist: '陈奕迅',
    duration: 260,
    lrc: [
      { time: 0, text: '千千静听 · 示例歌词' },
      { time: 16, text: '地铁里人来人往的黄昏' },
      { time: 34, text: '谁把谁的手轻轻放开' },
      { time: 52, text: '回忆像站名一闪而过' },
      { time: 70, text: '下一段旅程又有新风景' },
      { time: 90, text: '感情从来不会消失' },
      { time: 108, text: '它只是换了一个方向' },
      { time: 130, text: '（间奏）' },
      { time: 168, text: '把温暖传给下一个旅人' },
      { time: 210, text: '—— 示例歌词，非原作 ——' },
    ],
  },
  {
    id: 'autumn',
    title: '秋天不回来',
    artist: '王强',
    duration: 252,
    lrc: [
      { time: 0, text: '千千静听 · 示例歌词' },
      { time: 14, text: '落叶铺满了回家的路口' },
      { time: 32, text: '风一吹就散了满地' },
      { time: 50, text: '去年这个时候你还在' },
      { time: 68, text: '今年只剩我一个人的秋' },
      { time: 88, text: '收下这封信就别回头' },
      { time: 106, text: '秋天走了不会回来' },
      { time: 128, text: '（间奏）' },
      { time: 162, text: '把思念寄给明年春天' },
      { time: 200, text: '—— 示例歌词，非原作 ——' },
    ],
  },
];

/** IDs of the tracks shown when the app first opens. */
export const DEFAULT_PLAYLIST_IDS: string[] = ['sunny-day', 'river-south', 'fairy-tale', 'wings'];
