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
☐ 晚上 8 点网吧联机 CS

🔑 密码提示：为了 2000s（小写）

💡 小贴士：
   右键桌面可刷新
   回收站里还有几封旧信`,
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
☐ 8 PM LAN party for Counter-Strike

🔑 Password hint: for the 2000s (lowercase)

💡 Tip:
   Right-click desktop to refresh
   Check the Recycle Bin for old letters`,
    },
  ],
};

export const getStickyNote = (lang: string): StickyNoteContent => {
  const normalized = lang?.startsWith('zh') ? 'zh' : 'en';
  return STICKY_NOTES_BY_LOCALE[normalized]?.[0] ?? STICKY_NOTES_BY_LOCALE.zh[0];
};
