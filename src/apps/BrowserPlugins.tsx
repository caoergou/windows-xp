import React, { useState } from 'react';
import styled from 'styled-components';

// ─── Shared link helpers ─────────────────────────────────────────────────────

interface LinkItemProps {
  href: string;
  children: React.ReactNode;
  onNav?: (href: string) => void;
}

const LinkItem = ({ href, children, onNav }: LinkItemProps) => (
  <a
    href={href}
    style={{ color: '#1843C5', textDecoration: 'none', fontSize: 12 }}
    onClick={(e) => { e.preventDefault(); onNav && onNav(href); }}
  >
    {children}
  </a>
);

// ─── Hao123 Portal ───────────────────────────────────────────────────────────

const PageWrap = styled.div`
  width: 100%;
  height: 100%;
  overflow-y: auto;
  background: #f5f5f5;
  font-family: SimSun, '宋体', Arial, sans-serif;
  font-size: 12px;
  color: #333;
`;

const TopBar = styled.div`
  background: linear-gradient(to bottom, #0066cc 0%, #004b99 100%);
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
  text-shadow: 1px 1px 2px rgba(0,0,0,0.4);

  .h { color: #FF4444; }
  .a { color: #FFAA00; }
  .o { color: #66CC00; }
  .one { color: white; }
  .two { color: #FF4444; }
  .three { color: #FFAA00; }
`;

const SearchBox = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  background: white;
  border: 2px solid #ff6600;
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
    background: #ff6600;
    color: white;
    border: none;
    padding: 5px 14px;
    cursor: pointer;
    font-size: 13px;
    font-weight: bold;

    &:hover { background: #e05500; }
  }
`;

const TopRight = styled.div`
  color: white;
  font-size: 11px;
  text-align: right;
  line-height: 1.6;
`;

const NavTabs = styled.div`
  background: #e8f0fb;
  border-bottom: 2px solid #3366cc;
  display: flex;
  padding: 0 8px;
`;

const NavTab = styled.div<{ $active: boolean }>`
  padding: 5px 12px;
  font-size: 12px;
  cursor: pointer;
  border-bottom: 2px solid ${p => p.$active ? '#003399' : 'transparent'};
  color: ${p => p.$active ? '#003399' : '#555'};
  font-weight: ${p => p.$active ? 'bold' : 'normal'};
  margin-bottom: -2px;

  &:hover { color: #003399; }
`;

const ContentArea = styled.div`
  padding: 8px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
`;

const Category = styled.div<{ $color?: string }>`
  background: white;
  border: 1px solid #ddd;
  border-top: 2px solid ${p => p.$color || '#3366cc'};
  padding: 0;
  border-radius: 2px;
`;

const CatHeader = styled.div<{ $bg?: string; $color?: string }>`
  background: ${p => p.$bg || '#eef3fc'};
  color: ${p => p.$color || '#003399'};
  font-weight: bold;
  font-size: 12px;
  padding: 3px 8px;
  border-bottom: 1px solid #ddd;
`;

const CatLinks = styled.div`
  padding: 4px 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px 10px;
  line-height: 1.9;
`;

const Dot = styled.span`
  color: #aaa;
  margin: 0 2px;
`;

const BottomBanner = styled.div`
  margin: 4px 8px;
  background: #fff3cc;
  border: 1px solid #ffcc66;
  padding: 5px 10px;
  font-size: 11px;
  color: #666;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const now = new Date();
const dateStr = `${now.getFullYear()}年${now.getMonth()+1}月${now.getDate()}日 星期${'日一二三四五六'[now.getDay()]}`;
const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

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
    title: '搜索引擎', color: '#c00', bg: '#fff0f0', tcol: '#c00',
    links: [['百度','http://www.baidu.com'],['谷歌','http://www.google.com'],['搜狗','http://www.sogou.com'],['必应','http://www.bing.com'],['雅虎','http://www.yahoo.com.cn']]
  },
  {
    title: '常用邮箱', color: '#006600', bg: '#f0fff0', tcol: '#006600',
    links: [['QQ邮箱','http://mail.qq.com'],['163邮箱','http://mail.163.com'],['126邮箱','http://mail.126.com'],['新浪邮箱','http://mail.sina.com.cn'],['Gmail','http://mail.google.com']]
  },
  {
    title: '购物网站', color: '#cc6600', bg: '#fff8f0', tcol: '#cc6600',
    links: [['淘宝网','http://www.taobao.com'],['天猫','http://www.tmall.com'],['京东商城','http://www.jd.com'],['当当网','http://www.dangdang.com'],['拍拍网','http://www.paipai.com'],['亚马逊','http://www.amazon.cn']]
  },
  {
    title: '视频影音', color: '#7700cc', bg: '#f8f0ff', tcol: '#7700cc',
    links: [['优酷','http://www.youku.com'],['土豆网','http://www.tudou.com'],['爱奇艺','http://www.iqiyi.com'],['搜狐视频','http://tv.sohu.com'],['乐视网','http://www.letv.com'],['暴风影音','http://www.baofeng.com']]
  },
  {
    title: '新闻门户', color: '#003399', bg: '#eef3fc', tcol: '#003399',
    links: [['新浪','http://www.sina.com.cn'],['网易','http://www.163.com'],['搜狐','http://www.sohu.com'],['腾讯','http://www.qq.com'],['凤凰网','http://www.ifeng.com'],['人民网','http://www.people.com.cn']]
  },
  {
    title: '社交网络', color: '#cc0066', bg: '#fff0f6', tcol: '#cc0066',
    links: [['QQ空间','http://qzone.qq.com'],['人人网','http://www.renren.com'],['微博','http://www.weibo.com'],['开心网','http://www.kaixin001.com'],['豆瓣','http://www.douban.com']]
  },
  {
    title: '音乐欣赏', color: '#006666', bg: '#f0ffff', tcol: '#006666',
    links: [['酷狗音乐','http://www.kugou.com'],['QQ音乐','http://y.qq.com'],['虾米音乐','http://www.xiami.com'],['酷我音乐','http://www.kuwo.cn'],['百度音乐','http://music.baidu.com']]
  },
  {
    title: '游戏娱乐', color: '#336600', bg: '#f0fff0', tcol: '#336600',
    links: [['腾讯游戏','http://games.qq.com'],['4399小游戏','http://www.4399.com'],['7k7k小游戏','http://www.7k7k.com'],['17173','http://www.17173.com'],['第九城市','http://www.the9.com']]
  },
  {
    title: '旅游出行', color: '#8800aa', bg: '#fdf0ff', tcol: '#8800aa',
    links: [['12306铁路','http://www.12306.cn'],['携程旅行','http://www.ctrip.com'],['去哪儿','http://www.qunar.com'],['艺龙','http://www.elong.com'],['驴妈妈','http://www.lvmama.com']]
  },
  {
    title: '网上银行', color: '#8B0000', bg: '#fff5f5', tcol: '#8B0000',
    links: [['支付宝','http://www.alipay.com'],['工商银行','http://www.icbc.com.cn'],['建设银行','http://www.ccb.com'],['招商银行','http://www.cmbchina.com'],['农业银行','http://www.abchina.com']]
  },
  {
    title: '论坛社区', color: '#555500', bg: '#fffef0', tcol: '#555500',
    links: [['百度贴吧','http://tieba.baidu.com'],['天涯社区','http://www.tianya.cn'],['猫扑','http://www.mop.com'],['西祠胡同','http://www.xici.net'],['知乎','http://www.zhihu.com']]
  },
  {
    title: '实用工具', color: '#005555', bg: '#f0fffe', tcol: '#005555',
    links: [['天气预报','http://weather.com.cn'],['百度地图','http://map.baidu.com'],['谷歌地图','http://maps.google.cn'],['百度翻译','http://fanyi.baidu.com'],['在线词典','http://dict.baidu.com']]
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
      handleLink(`http://www.baidu.com/s?wd=${encodeURIComponent(query)}`);
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
          <div style={{ color: '#aad4ff' }}>北京 晴 12°C ~ 24°C</div>
          <div style={{ color: '#aad4ff' }}>{timeStr}</div>
        </TopRight>
      </TopBar>

      <NavTabs>
        {TABS.map((t, i) => (
          <NavTab key={t} $active={activeTab === i} onClick={() => setActiveTab(i)}>{t}</NavTab>
        ))}
      </NavTabs>

      <BottomBanner>
        <span>🔔 hao123 网址之家 — 中国最大的上网导航，为您精选最常用的网址</span>
        <span style={{ color: '#999' }}>设为主页</span>
      </BottomBanner>

      <ContentArea>
        {CATEGORIES.map(cat => (
          <Category key={cat.title} $color={cat.color}>
            <CatHeader $bg={cat.bg} $color={cat.tcol}>{cat.title}</CatHeader>
            <CatLinks>
              {cat.links.map(([name, url], i) => (
                <span key={name}>
                  <LinkItem href={url} onNav={handleLink}>{name}</LinkItem>
                  {i < cat.links.length - 1 && <Dot>·</Dot>}
                </span>
              ))}
            </CatLinks>
          </Category>
        ))}
      </ContentArea>

      <div style={{ textAlign: 'center', color: '#aaa', fontSize: 11, padding: '12px 0 6px' }}>
        Copyright © 2010 hao123.com All Rights Reserved &nbsp;|&nbsp; 百度旗下网站
      </div>
    </PageWrap>
  );
}

// ─── 白名单 ───────────────────────────────────────────────────────────────────
// 白名单内的 URL 使用自定义渲染，不走 Wayback Machine。
// 暂时清空；需要恢复时取消下方注释即可。
export const BROWSER_WHITELIST = [
  // {
  //   match: (url) => {
  //     const u = url.toLowerCase().replace(/\/$/, '');
  //     return u === 'http://www.hao123.com' || u === 'http://hao123.com';
  //   },
  //   render: (navigateTo, openNewWindow) => <Hao123Page onNavigate={navigateTo} onOpenNew={openNewWindow} />,
  // },
];

// ─── 黑名单 ───────────────────────────────────────────────────────────────────
// 黑名单内的域名将被拦截，显示连接失败错误页。
export const BROWSER_BLACKLIST = [
  { match: (url: string) => url.includes('google.com'), label: 'www.google.com' },
];

// ─── Plugin entry point ───────────────────────────────────────────────────────

export const defaultPlugin = (url: string, navigateTo: (url: string) => void, openNewWindow: (url: string) => void) => {
  if (!url) return null;

  for (const entry of BROWSER_WHITELIST) {
    if (entry.match(url)) {
      return entry.render(navigateTo, openNewWindow);
    }
  }

  return null;
};
