// 将普通 URL 转为互联网档案馆（Wayback Machine）存档链接，
// 呈现 2006 年 Windows XP 全盛期的真实网页样貌。
// if_ 后缀使存档页面以内嵌模式呈现，不显示 Wayback 顶部工具条。
export const WAYBACK_TS = '20060615120000';

export const toWaybackUrl = (url: string): string => {
  if (!url || url === 'about:blank') return url;
  if (url.includes('web.archive.org')) return url;
  return `https://web.archive.org/web/${WAYBACK_TS}if_/${url}`;
};

export const DEFAULT_HOMEPAGE = 'https://web.archive.org/web/20060615000000/http://www.hao123.com/';
