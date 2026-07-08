# Cultural Localization 文化包

本目录存放与语言/地域强相关的「2000s 互联网记忆」内容，与通用 UI 文本（`src/i18n/locales/*.json`）解耦。

## 所有权边界

- **通用 UI 文本**：继续放在 `src/i18n/locales/*.json` 中，例如菜单、按钮、窗口标题。
- **文化包内容**：放在本目录下，按语言隔离：
  - `desktopShortcuts.ts` — 桌面快捷方式（中文：360/迅雷/暴风影音/酷狗；英文：Norton/Winamp/uTorrent/Office/iTunes）。
  - `stickyNotes.ts` — 桌面便签内容。
  - `startMenu.ts` — 开始菜单「所有程序」列表中的应用。

## 回退策略

`getXXX(lang)` 工具函数在语言以 `zh` 开头时返回中文包，否则返回英文包；若未来新增语言，默认回退到英文包。

## 扩展方式

新增语言时，只需在本目录对应文件里增加一个 locale key，不需要修改 `filesystem.json` 或其他通用组件。
