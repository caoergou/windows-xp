import React, { useState } from 'react';
import styled from 'styled-components';
import XPIcon from '../components/XPIcon';
import { FONTS } from '../constants';

/* brand-palette:start — centrally declared app-identity colours (#213 batch 4).
   Exempt from the guard:purity hex ratchet; NOT COLORS tokens on purpose: this
   app keeps its own period look even if the OS theme is swapped (#143). */
const PALETTE = {
  blue600: '#0000CC',
  blue700: '#003399',
  blue7002: '#004B99',
  cyan800: '#005555',
  green800: '#006600',
  cyan8002: '#006666',
  blue6002: '#0066CC',
  blue7003: '#174A86',
  blue6003: '#1843C5',
  blue6004: '#1F5AA6',
  grey800: '#333333',
  green8002: '#336600',
  blue500: '#3366CC',
  yellow800: '#555500',
  grey700: '#555555',
  grey600: '#666666',
  green600: '#66CC00',
  purple600: '#7700CC',
  purple700: '#8800AA',
  red700: '#8B0000',
  blue300: '#8BA8C8',
  grey400: '#999999',
  grey300: '#AAAAAA',
  blue200: '#AAD4FF',
  red600: '#CC0000',
  pink600: '#CC0066',
  orange600: '#CC6600',
  blue100: '#DCE8F5',
  grey100: '#DDDDDD',
  orange6002: '#E05500',
  orange500: '#E65C00',
  blue1002: '#E8F0FB',
  blue1003: '#EEF3FC',
  orange5002: '#EF8B1E',
  green100: '#F0FFF0',
  cyan100: '#F0FFFE',
  cyan1002: '#F0FFFF',
  white: '#F5F5F5',
  purple100: '#F8F0FF',
  pink100: '#FDF0FF',
  red400: '#FF4444',
  orange5003: '#FF6600',
  orange5004: '#FF7B00',
  orange400: '#FF9D2E',
  yellow500: '#FFAA00',
  yellow300: '#FFCC66',
  orange200: '#FFCC80',
  red100: '#FFF0F0',
  red1002: '#FFF0F6',
  yellow100: '#FFF3CC',
  red1003: '#FFF5F5',
  yellow1002: '#FFF7E6',
  orange100: '#FFF8F0',
  yellow1003: '#FFFEF0',
  white2: '#FFFFFF',
};
/* brand-palette:end */

// ─── Shared link helpers ─────────────────────────────────────────────────────

interface LinkItemProps {
  href: string;
  children: React.ReactNode;
  onNav?: (href: string) => void;
}

const LinkItem = ({ href, children, onNav }: LinkItemProps) => (
  <a
    href={href}
    style={{ color: PALETTE.blue6003, textDecoration: 'none', fontSize: 12 }}
    onClick={e => {
      e.preventDefault();
      onNav?.(href);
    }}
  >
    {children}
  </a>
);

// ─── Hao123 Portal ───────────────────────────────────────────────────────────

const PageWrap = styled.div`
  width: 100%;
  height: 100%;
  overflow-y: auto;
  background: ${PALETTE.white};
  font-family: ${FONTS.UI};
  font-size: 12px;
  color: ${PALETTE.grey800};
`;

const TopBar = styled.div`
  background: linear-gradient(to bottom, ${PALETTE.blue6002} 0%, ${PALETTE.blue7002} 100%);
  padding: 6px 10px;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const Logo = styled.div`
  font-size: 22px;
  font-weight: bold;
  color: white;
  letter-spacing: -1px;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.4);

  .h {
    color: ${PALETTE.red400};
  }
  .a {
    color: ${PALETTE.yellow500};
  }
  .o {
    color: ${PALETTE.green600};
  }
  .one {
    color: white;
  }
  .two {
    color: ${PALETTE.red400};
  }
  .three {
    color: ${PALETTE.yellow500};
  }
`;

const SearchBox = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  background: white;
  border: 2px solid ${PALETTE.orange5003};
  border-radius: 3px;
  overflow: hidden;
  max-width: 420px;

  input {
    flex: 1;
    border: none;
    outline: none;
    padding: 4px 8px;
    font-size: 13px;
    font-family: inherit;
  }

  button {
    background: ${PALETTE.orange5003};
    color: white;
    border: none;
    padding: 5px 14px;
    cursor: pointer;
    font-size: 13px;
    font-weight: bold;

    &:hover {
      background: ${PALETTE.orange6002};
    }
  }
`;

const TopRight = styled.div`
  color: white;
  font-size: 11px;
  text-align: right;
  line-height: 1.6;
`;

const NavTabs = styled.div`
  background: ${PALETTE.blue1002};
  border-bottom: 2px solid ${PALETTE.blue500};
  display: flex;
  padding: 0 8px;
`;

const NavTab = styled.div<{ $active: boolean }>`
  padding: 5px 12px;
  font-size: 12px;
  cursor: pointer;
  border-bottom: 2px solid ${p => (p.$active ? PALETTE.blue700 : 'transparent')};
  color: ${p => (p.$active ? PALETTE.blue700 : PALETTE.grey700)};
  font-weight: ${p => (p.$active ? 'bold' : 'normal')};
  margin-bottom: -2px;

  &:hover {
    color: ${PALETTE.blue700};
  }
`;

const ContentArea = styled.div`
  padding: 8px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
`;

const Category = styled.div<{ $color?: string }>`
  background: white;
  border: 1px solid ${PALETTE.grey100};
  border-top: 2px solid ${p => p.$color || PALETTE.blue500};
  padding: 0;
  border-radius: 2px;
`;

const CatHeader = styled.div<{ $bg?: string; $color?: string }>`
  background: ${p => p.$bg || PALETTE.blue1003};
  color: ${p => p.$color || PALETTE.blue700};
  font-weight: bold;
  font-size: 12px;
  padding: 3px 8px;
  border-bottom: 1px solid ${PALETTE.grey100};
`;

const CatLinks = styled.div`
  padding: 4px 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px 10px;
  line-height: 1.9;
`;

const Dot = styled.span`
  color: ${PALETTE.grey300};
  margin: 0 2px;
`;

const BottomBanner = styled.div`
  margin: 4px 8px;
  background: ${PALETTE.yellow100};
  border: 1px solid ${PALETTE.yellow300};
  padding: 5px 10px;
  font-size: 11px;
  color: ${PALETTE.grey600};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const MsnHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 14px;
  color: ${PALETTE.white2};
  background: ${PALETTE.blue6004};
  border-bottom: 4px solid ${PALETTE.orange5002};
`;

const MsnLogo = styled.div`
  font:
    bold 26px Arial,
    sans-serif;
`;

const MsnColumns = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 10px;
  padding: 10px;
`;

const MsnPanel = styled.div`
  border: 1px solid ${PALETTE.blue300};
  background: ${PALETTE.white2};

  h2 {
    margin: 0;
    padding: 5px 8px;
    color: ${PALETTE.blue7003};
    background: ${PALETTE.blue100};
    font-size: 13px;
  }

  div {
    padding: 8px;
    line-height: 2;
  }
`;

const now = new Date();
const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 星期${'日一二三四五六'[now.getDay()]}`;
const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

const TABS = ['网址导航', '网购专区', '影音娱乐', '旅游出行', '资讯新闻'];

interface CategoryData {
  title: string;
  color: string;
  bg: string;
  tcol: string;
  links: [string, string][];
}

const CATEGORIES: CategoryData[] = [
  {
    title: '搜索引擎',
    color: PALETTE.red600,
    bg: PALETTE.red100,
    tcol: PALETTE.red600,
    links: [
      ['百度', 'http://www.baidu.com'],
      ['谷歌', 'http://www.google.com'],
      ['搜狗', 'http://www.sogou.com'],
      ['必应', 'http://www.bing.com'],
      ['雅虎', 'http://www.yahoo.com.cn'],
    ],
  },
  {
    title: '常用邮箱',
    color: PALETTE.green800,
    bg: PALETTE.green100,
    tcol: PALETTE.green800,
    links: [
      ['QQ邮箱', 'http://mail.qq.com'],
      ['163邮箱', 'http://mail.163.com'],
      ['126邮箱', 'http://mail.126.com'],
      ['新浪邮箱', 'http://mail.sina.com.cn'],
      ['Gmail', 'http://mail.google.com'],
    ],
  },
  {
    title: '购物网站',
    color: PALETTE.orange600,
    bg: PALETTE.orange100,
    tcol: PALETTE.orange600,
    links: [
      ['淘宝网', 'http://www.taobao.com'],
      ['天猫', 'http://www.tmall.com'],
      ['京东商城', 'http://www.jd.com'],
      ['当当网', 'http://www.dangdang.com'],
      ['拍拍网', 'http://www.paipai.com'],
      ['亚马逊', 'http://www.amazon.cn'],
    ],
  },
  {
    title: '视频影音',
    color: PALETTE.purple600,
    bg: PALETTE.purple100,
    tcol: PALETTE.purple600,
    links: [
      ['优酷', 'http://www.youku.com'],
      ['土豆网', 'http://www.tudou.com'],
      ['爱奇艺', 'http://www.iqiyi.com'],
      ['搜狐视频', 'http://tv.sohu.com'],
      ['乐视网', 'http://www.letv.com'],
      ['暴风影音', 'http://www.baofeng.com'],
    ],
  },
  {
    title: '休闲游戏',
    color: PALETTE.orange500,
    bg: PALETTE.yellow1002,
    tcol: PALETTE.orange500,
    links: [
      ['4399小游戏', 'http://www.4399.com'],
      ['7k7k', 'http://www.7k7k.com'],
      ['QQ游戏', 'http://qqgame.qq.com'],
      ['联众', 'http://www.ourgame.com'],
    ],
  },
  {
    title: '新闻门户',
    color: PALETTE.blue700,
    bg: PALETTE.blue1003,
    tcol: PALETTE.blue700,
    links: [
      ['新浪', 'http://www.sina.com.cn'],
      ['网易', 'http://www.163.com'],
      ['搜狐', 'http://www.sohu.com'],
      ['腾讯', 'http://www.qq.com'],
      ['凤凰网', 'http://www.ifeng.com'],
      ['人民网', 'http://www.people.com.cn'],
    ],
  },
  {
    title: '社交网络',
    color: PALETTE.pink600,
    bg: PALETTE.red1002,
    tcol: PALETTE.pink600,
    links: [
      ['QQ空间', 'http://qzone.qq.com'],
      ['人人网', 'http://www.renren.com'],
      ['微博', 'http://www.weibo.com'],
      ['开心网', 'http://www.kaixin001.com'],
      ['豆瓣', 'http://www.douban.com'],
    ],
  },
  {
    title: '音乐欣赏',
    color: PALETTE.cyan8002,
    bg: PALETTE.cyan1002,
    tcol: PALETTE.cyan8002,
    links: [
      ['酷狗音乐', 'http://www.kugou.com'],
      ['QQ音乐', 'http://y.qq.com'],
      ['虾米音乐', 'http://www.xiami.com'],
      ['酷我音乐', 'http://www.kuwo.cn'],
      ['百度音乐', 'http://music.baidu.com'],
    ],
  },
  {
    title: '游戏娱乐',
    color: PALETTE.green8002,
    bg: PALETTE.green100,
    tcol: PALETTE.green8002,
    links: [
      ['腾讯游戏', 'http://games.qq.com'],
      ['4399小游戏', 'http://www.4399.com'],
      ['7k7k小游戏', 'http://www.7k7k.com'],
      ['17173', 'http://www.17173.com'],
      ['第九城市', 'http://www.the9.com'],
    ],
  },
  {
    title: '旅游出行',
    color: PALETTE.purple700,
    bg: PALETTE.pink100,
    tcol: PALETTE.purple700,
    links: [
      ['12306铁路', 'http://www.12306.cn'],
      ['携程旅行', 'http://www.ctrip.com'],
      ['去哪儿', 'http://www.qunar.com'],
      ['艺龙', 'http://www.elong.com'],
      ['驴妈妈', 'http://www.lvmama.com'],
    ],
  },
  {
    title: '网上银行',
    color: PALETTE.red700,
    bg: PALETTE.red1003,
    tcol: PALETTE.red700,
    links: [
      ['支付宝', 'http://www.alipay.com'],
      ['工商银行', 'http://www.icbc.com.cn'],
      ['建设银行', 'http://www.ccb.com'],
      ['招商银行', 'http://www.cmbchina.com'],
      ['农业银行', 'http://www.abchina.com'],
    ],
  },
  {
    title: '论坛社区',
    color: PALETTE.yellow800,
    bg: PALETTE.yellow1003,
    tcol: PALETTE.yellow800,
    links: [
      ['百度贴吧', 'http://tieba.baidu.com'],
      ['天涯社区', 'http://www.tianya.cn'],
      ['猫扑', 'http://www.mop.com'],
      ['西祠胡同', 'http://www.xici.net'],
      ['知乎', 'http://www.zhihu.com'],
    ],
  },
  {
    title: '实用工具',
    color: PALETTE.cyan800,
    bg: PALETTE.cyan100,
    tcol: PALETTE.cyan800,
    links: [
      ['天气预报', 'http://weather.com.cn'],
      ['百度地图', 'http://map.baidu.com'],
      ['谷歌地图', 'http://maps.google.cn'],
      ['百度翻译', 'http://fanyi.baidu.com'],
      ['在线词典', 'http://dict.baidu.com'],
    ],
  },
];

interface Hao123PageProps {
  onNavigate?: (url: string) => void;
  onOpenNew?: (url: string) => void;
}

function Hao123Page({ onNavigate, onOpenNew }: Hao123PageProps) {
  const handleLink = onOpenNew || onNavigate;
  const [activeTab, setActiveTab] = useState(0);
  const [query, setQuery] = useState<string>('');

  const handleSearch = () => {
    if (query.trim()) {
      handleLink?.(`http://www.baidu.com/s?wd=${encodeURIComponent(query)}`);
    }
  };

  return (
    <PageWrap>
      <TopBar>
        <Logo>
          <span className="h">h</span>
          <span className="a">a</span>
          <span className="o">o</span>
          <span className="one">1</span>
          <span className="two">2</span>
          <span className="three">3</span>
        </Logo>
        <SearchBox>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="百度一下，你就知道"
          />
          <button onClick={handleSearch}>百度搜索</button>
        </SearchBox>
        <TopRight>
          <div>{dateStr}</div>
          <div style={{ color: PALETTE.blue200 }}>北京 晴 12°C ~ 24°C</div>
          <div style={{ color: PALETTE.blue200 }}>{timeStr}</div>
        </TopRight>
      </TopBar>

      <NavTabs>
        {TABS.map((t, i) => (
          <NavTab key={t} $active={activeTab === i} onClick={() => setActiveTab(i)}>
            {t}
          </NavTab>
        ))}
      </NavTabs>

      <BottomBanner>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <XPIcon name="alert_warning" size={14} />
          hao123 网址之家 — 中国最大的上网导航，为您精选最常用的网址
        </span>
        <span style={{ color: PALETTE.grey400 }}>设为主页</span>
      </BottomBanner>

      <ContentArea>
        {CATEGORIES.map(cat => (
          <Category key={cat.title} $color={cat.color}>
            <CatHeader $bg={cat.bg} $color={cat.tcol}>
              {cat.title}
            </CatHeader>
            <CatLinks>
              {cat.links.map(([name, url], i) => (
                <span key={name}>
                  <LinkItem href={url} onNav={handleLink}>
                    {name}
                  </LinkItem>
                  {i < cat.links.length - 1 && <Dot>·</Dot>}
                </span>
              ))}
            </CatLinks>
          </Category>
        ))}
      </ContentArea>

      <div
        style={{ textAlign: 'center', color: PALETTE.grey300, fontSize: 11, padding: '12px 0 6px' }}
      >
        Copyright © 2010 hao123.com All Rights Reserved &nbsp;|&nbsp; 百度旗下网站
      </div>
    </PageWrap>
  );
}

function MsnPage({ onNavigate }: { onNavigate: (url: string) => void }) {
  const links: Array<[string, string]> = [
    ['MSN News', 'http://www.msn.com/news'],
    ['Hotmail', 'http://www.hotmail.com'],
    ['MSN Messenger', 'http://messenger.msn.com'],
    ['Weather', 'http://weather.msn.com'],
    ['Encarta', 'http://encarta.msn.com'],
    ['MSNBC', 'http://www.msnbc.com'],
  ];

  return (
    <PageWrap>
      <MsnHeader>
        <MsnLogo>MSN</MsnLogo>
        <span>Welcome to MSN</span>
      </MsnHeader>
      <MsnColumns>
        <MsnPanel>
          <h2>Today on MSN</h2>
          <div>
            {links.map(([label, href]) => (
              <React.Fragment key={href}>
                <LinkItem href={href} onNav={onNavigate}>
                  {label}
                </LinkItem>
                <br />
              </React.Fragment>
            ))}
          </div>
        </MsnPanel>
        <MsnPanel>
          <h2>Sign in</h2>
          <div>Check your Hotmail inbox and see who is online in Messenger.</div>
        </MsnPanel>
      </MsnColumns>
    </PageWrap>
  );
}

// 4399 mini-games - after-school memories of the 2000s Chinese internet (#85 nostalgia page).
function Game4399Page() {
  const games = [
    '黄金矿工',
    '合金弹头',
    '连连看',
    '泡泡堂',
    '造梦西游',
    '奥特曼打怪兽',
    '双人闯关',
    '植物大战僵尸',
  ];
  return (
    <PageWrap style={{ background: PALETTE.yellow1002 }}>
      <div
        style={{
          background: `linear-gradient(to bottom, ${PALETTE.orange400}, ${PALETTE.orange5004})`,
          color: PALETTE.white2,
          padding: '10px 14px',
          fontSize: 22,
          fontWeight: 'bold',
          fontStyle: 'italic',
        }}
      >
        4399<span style={{ fontSize: 13, fontWeight: 'normal' }}> 小游戏 · 在线玩</span>
      </div>
      <div style={{ padding: 14 }}>
        <h2 style={{ fontSize: 15, color: PALETTE.orange500, margin: '0 0 10px' }}>
          热门小游戏排行榜
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {games.map((g, i) => (
            <div
              key={g}
              style={{
                border: `1px solid ${PALETTE.orange200}`,
                borderRadius: 4,
                background: PALETTE.white2,
                padding: '10px 6px',
                textAlign: 'center',
                cursor: 'pointer',
                fontSize: 12,
              }}
            >
              <div
                style={{
                  height: 44,
                  background: `hsl(${(i * 43) % 360}, 70%, 85%)`,
                  borderRadius: 3,
                  marginBottom: 6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22,
                }}
              >
                🎮
              </div>
              <div style={{ color: PALETTE.blue600, textDecoration: 'underline' }}>{g}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 14, fontSize: 11, color: PALETTE.grey400 }}>
          Copyright © 2009 4399.com 版权所有
        </div>
      </div>
    </PageWrap>
  );
}

// --- Whitelist ----------------------------------------------------------------
// URLs in the whitelist use custom rendering, not Wayback Machine.
// Temporarily cleared; uncomment the entries below to restore.
export const BROWSER_WHITELIST = [
  {
    match: (url: string) => {
      const normalized = url.toLowerCase().replace(/\/$/, '');
      return normalized === 'http://www.4399.com' || normalized === 'http://4399.com';
    },
    render: () => <Game4399Page />,
  },
  {
    match: (url: string) => {
      const normalized = url.toLowerCase().replace(/\/$/, '');
      return normalized === 'http://www.hao123.com' || normalized === 'http://hao123.com';
    },
    render: (navigateTo: (url: string) => void, openNewWindow: (url: string) => void) => (
      <Hao123Page onNavigate={navigateTo} onOpenNew={openNewWindow} />
    ),
  },
  {
    match: (url: string) => {
      const normalized = url.toLowerCase().replace(/\/$/, '');
      return normalized === 'http://www.msn.com' || normalized === 'http://msn.com';
    },
    render: (navigateTo: (url: string) => void) => <MsnPage onNavigate={navigateTo} />,
  },
];

// --- Blacklist ----------------------------------------------------------------
// Domains in the blacklist are blocked and show a connection-failure error page.
export const BROWSER_BLACKLIST = [
  { match: (url: string) => url.includes('google.com'), label: 'www.google.com' },
];

// ─── Plugin entry point ───────────────────────────────────────────────────────

export const defaultPlugin = (
  url: string,
  navigateTo: (url: string) => void,
  openNewWindow: (url: string) => void
) => {
  if (!url) return null;

  for (const entry of BROWSER_WHITELIST) {
    if (entry.match(url)) {
      return entry.render(navigateTo, openNewWindow);
    }
  }

  return null;
};
