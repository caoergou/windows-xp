/**
 * Original QQ2006 skin / sprite assets.
 *
 * Assets extracted from the original QQ2006 installer by mengkunsoft/QQ2006
 * (https://github.com/mengkunsoft/QQ2006); the author states they "can be freely
 * shared and modified, please keep the source"; copyright belongs to Tencent.
 * See 'src/apps/QQ/assets/NOTICE.md'. Introduced for pixel-level recreation of the
 * 2005-2007 classic QQ interface (#119; user explicitly requested "仿真最重要").
 *
 * Loaded in one go via 'import.meta.glob' as URLs, then handed to Vite /
 * libAssetsPlugin to be extracted as standalone files (same pattern as
 * recycle_bin/exif).
 */
const imgUrls = import.meta.glob('./assets/img/**/*.{png,gif}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

/** Get a skin image URL; 'rel' is relative to 'assets/img/', e.g. 'BackgroundTitleLeft.png', 'im/icon.png'. */
export const qqImg = (rel: string): string => imgUrls[`./assets/img/${rel}`] ?? '';

/** Return as a 'css url(...)' string; returns 'none' when not found to avoid errors. */
export const qqUrl = (rel: string): string => {
  const src = qqImg(rel);
  return src ? `url(${src})` : 'none';
};

/** Get an avatar URL ('assets/img/avatar/<n>.png'), falling back to #1 when out of range. */
export const qqAvatar = (n: number | string): string =>
  qqImg(`avatar/${n}.png`) || qqImg('avatar/1.png');

/** Get a classic emoticon PNG URL ('assets/img/emoticons/<name>.png'). */
export const qqEmoticon = (name: string): string => qqImg(`emoticons/${name}`) ?? '';
