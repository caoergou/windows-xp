---
title: "函数：defineCulture()"
---

[@caoergou/windows-xp](/windows-xp/docs/zh/api/index.md) / [index](/windows-xp/docs/zh/api/index/index.md) / defineCulture

# 函数：defineCulture()

> **defineCulture**(`config`): [`CulturePackage`](/windows-xp/docs/zh/api/index/interfaces/CulturePackage.md)

定义于：src/data/culture/defineCulture.ts:82

通过创作时校验定义一个文化包。

## 参数

### config

[`CulturePackage`](/windows-xp/docs/zh/api/index/interfaces/CulturePackage.md)

## 返回值

[`CulturePackage`](/windows-xp/docs/zh/api/index/interfaces/CulturePackage.md)

## 示例

```ts
const jpRetro = defineCulture({
  id: 'jp-retro',
  displayName: '日本 2000s',
  locales: ['ja', 'ja-JP'],
  desktopShortcuts: [{ id: 'nico', name: 'ニコニコ動画', app: 'InternetExplorer', icon: 'ie' }],
  i18n: { ja: { 'apps.notepad': 'メモ帳' } },
});
```
