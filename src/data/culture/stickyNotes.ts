import { StickyNoteContent } from './types';

/**
 * 桌面便签文化包。
 */
const STICKY_NOTES_BY_LOCALE: Record<string, StickyNoteContent[]> = {
  zh: [
    {
      id: 'default',
      title: '备忘录',
      content: `📁 双击打开{{docsPath}}

☑ 电脑密码已设置
☐ 更新 360 安全卫士
☐ 用迅雷下载暴风影音

💡 小贴士：
   右键桌面可刷新`,
    },
  ],
  en: [
    {
      id: 'default',
      title: 'Memo',
      content: `📁 Double-click to open {{docsPath}}

☑ PC password is configured
☐ Update Norton AntiVirus
☐ Download Winamp with uTorrent

💡 Tip:
   Right-click desktop to refresh`,
    },
  ],
};

export const getStickyNote = (lang: string): StickyNoteContent => {
  const normalized = lang?.startsWith('zh') ? 'zh' : 'en';
  return STICKY_NOTES_BY_LOCALE[normalized]?.[0] ?? STICKY_NOTES_BY_LOCALE.zh[0];
};
