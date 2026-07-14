---
title: "接口：BootBranding"
---

[@caoergou/windows-xp](/windows-xp/docs/zh/api/index.md) / [index](/windows-xp/docs/zh/api/index/index.md) / BootBranding

# 接口：BootBranding

定义于：src/branding.ts:11

开机画面品牌定制。

## 属性

### logo?

&gt; `optional` **logo?**: `string`

定义于：src/branding.ts:13

替代 XP 徽标显示的主徽标图片（URL 或导入）。

---

### progressColor?

&gt; `optional` **progressColor?**: `string`

定义于：src/branding.ts:17

加载条的 CSS 颜色；设置后，将用定制条替换 XP GIF。

---

### startupSound?

&gt; `optional` **startupSound?**: `string`

定义于：src/branding.ts:19

开机时播放的音频 URL，替代 XP 启动音（遵循静音/音量设置）。

---

### text?

&gt; `optional` **text?**: `string`

定义于：src/branding.ts:15

徽标下方的标题（例如你的产品名），替换“Microsoft Windows XP”。
