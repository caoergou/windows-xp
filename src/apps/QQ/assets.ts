/**
 * 原版 QQ2006 皮肤 / 精灵图资源。
 *
 * 素材由 mengkunsoft/QQ2006（https://github.com/mengkunsoft/QQ2006）从原版
 * QQ2006 安装包提取，作者声明「可自由分享和修改，请保留出处」；版权归腾讯。
 * 详见 `src/apps/QQ/assets/NOTICE.md`。为像素级还原 2005–2007 经典 QQ 界面
 * （#119，用户明确要求「仿真最重要」）而引入。
 *
 * 通过 `import.meta.glob` 一次性加载为 URL，交由 Vite / libAssetsPlugin
 * 抽取为独立文件（与 recycle_bin/exif 的用法一致）。
 */
const imgUrls = import.meta.glob('./assets/img/**/*.{png,gif}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

/** 取皮肤图 URL，`rel` 相对 `assets/img/`，例如 `'BackgroundTitleLeft.png'`、`'im/icon.png'`。 */
export const qqImg = (rel: string): string => imgUrls[`./assets/img/${rel}`] ?? '';

/** 取 `css url(...)` 形式，找不到时返回 `none` 以免报错。 */
export const qqUrl = (rel: string): string => {
  const src = qqImg(rel);
  return src ? `url(${src})` : 'none';
};

/** 取头像 URL（`assets/img/avatar/<n>.png`），越界时回退到 1 号。 */
export const qqAvatar = (n: number | string): string =>
  qqImg(`avatar/${n}.png`) || qqImg('avatar/1.png');
