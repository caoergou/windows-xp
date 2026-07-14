import React from 'react';

/**
 * QQ emoticon mapping table - convert text emoticons to emoji.
 * Based on QQ emoticons from around 2015.
 */
const EMOJI_MAP: Record<string, string> = {
  // Common emoticons
  '[微笑]': '😊',
  '[撇嘴]': '😒',
  '[色]': '😍',
  '[发呆]': '😳',
  '[得意]': '😎',
  '[流泪]': '😢',
  '[害羞]': '😳',
  '[闭嘴]': '🤐',
  '[睡]': '😴',
  '[大哭]': '😭',
  '[尴尬]': '😅',
  '[发怒]': '😠',
  '[调皮]': '😜',
  '[呲牙]': '😁',
  '[惊讶]': '😲',
  '[难过]': '😞',
  '[酷]': '😎',
  '[冷汗]': '😰',
  '[抓狂]': '😫',
  '[吐]': '🤮',

  // Gesture emoticons
  '[偷笑]': '🤭',
  '[可爱]': '🥰',
  '[白眼]': '🙄',
  '[傲慢]': '😤',
  '[饥饿]': '🤤',
  '[困]': '😪',
  '[惊恐]': '😱',
  '[流汗]': '😓',
  '[憨笑]': '😄',
  '[悠闲]': '😌',
  '[奋斗]': '💪',
  '[咒骂]': '🤬',
  '[疑问]': '🤔',
  '[嘘]': '🤫',
  '[晕]': '😵',
  '[衰]': '😩',
  '[骷髅]': '💀',
  '[敲打]': '🔨',
  '[再见]': '👋',

  // Other emoticons
  '[擦汗]': '😅',
  '[抠鼻]': '🤧',
  '[鼓掌]': '👏',
  '[糗大了]': '😳',
  '[坏笑]': '😏',
  '[左哼哼]': '😤',
  '[右哼哼]': '😤',
  '[哈欠]': '🥱',
  '[鄙视]': '😒',
  '[委屈]': '🥺',
  '[快哭了]': '😢',
  '[阴险]': '😈',
  '[亲亲]': '😘',
  '[吓]': '😨',
  '[可怜]': '🥺',
  '[菜刀]': '🔪',
  '[西瓜]': '🍉',
  '[啤酒]': '🍺',
  '[篮球]': '🏀',
  '[乒乓]': '🏓',
  '[咖啡]': '☕',
  '[饭]': '🍚',
  '[猪头]': '🐷',
  '[玫瑰]': '🌹',
  '[凋谢]': '🥀',
  '[嘴唇]': '💋',
  '[爱心]': '❤️',
  '[心碎]': '💔',
  '[蛋糕]': '🎂',
  '[闪电]': '⚡',
  '[炸弹]': '💣',
  '[刀]': '🔪',
  '[足球]': '⚽',
  '[瓢虫]': '🐞',
  '[便便]': '💩',
  '[月亮]': '🌙',
  '[太阳]': '☀️',
  '[礼物]': '🎁',
  '[拥抱]': '🤗',
  '[强]': '👍',
  '[弱]': '👎',
  '[握手]': '🤝',
  '[胜利]': '✌️',
  '[抱拳]': '🙏',
  '[勾引]': '👉',
  '[拳头]': '✊',
  '[OK]': '👌',
  '[爱你]': '🫶',
  '[NO]': '🙅',
  '[爱情]': '💕',
  '[飞吻]': '😘',
  '[跳跳]': '🦘',
  '[发抖]': '🥶',
  '[怄火]': '😡',
  '[转圈]': '😵‍💫',
  '[磕头]': '🙇',
  '[回头]': '↩️',
  '[跳绳]': '🤸',
  '[投降]': '🏳️',
};

/**
 * Ordered list for the emoji picker panel: 'code' is the bracketed code like "[微笑]"
 * inserted into the input box, 'emoji' is the corresponding Unicode yellow face
 * displayed in the grid. Derived from {@link EMOJI_MAP}, so the picker and message
 * rendering share the same mapping (#refine-qq emoji panel).
 */
export const QQ_EMOJI_LIST: ReadonlyArray<{ code: string; emoji: string }> = Object.entries(
  EMOJI_MAP
).map(([code, emoji]) => ({ code, emoji }));

/**
 * Convert emoticon symbols in message text to emoji.
 * @param {string} text - Original message text
 * @returns {string} Converted text
 */
export const renderEmoji = (text: string): string => {
  if (!text) return text;

  let result = text;

  // Replace all matched emoticons
  Object.entries(EMOJI_MAP).forEach(([key, emoji]) => {
    // Escape special characters
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedKey, 'g');
    result = result.replace(regex, emoji);
  });

  return result;
};

/**
 * Convert emoticon symbols in message text to styled HTML.
 * @param {string} text - Original message text
 * @returns {string} Converted HTML string
 */
export const renderEmojiHTML = (text: string): string => {
  if (!text) return text;

  let result = text;

  // Replace all matched emoticons and wrap them in spans for styling control
  Object.entries(EMOJI_MAP).forEach(([key, emoji]) => {
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedKey, 'g');
    result = result.replace(regex, `<span class="emoji">${emoji}</span>`);
  });

  return result;
};

/**
 * Classic QQ emoticon pinyin abbreviations (real millennium-era notation) -> "[中文名]" bracketed codes.
 * The input layer supports abbreviations like /wx; the data layer keeps "[微笑]" for readability.
 * See docs/QQ-CLASSIC-UI.md §3.
 */
const SHORTHAND_MAP: Record<string, string> = {
  wx: '[微笑]',
  pz: '[撇嘴]',
  se: '[色]',
  fd: '[发呆]',
  dy: '[得意]',
  ll: '[流泪]',
  hx: '[害羞]',
  bz: '[闭嘴]',
  shui: '[睡]',
  dk: '[大哭]',
  gg: '[尴尬]',
  fn: '[发怒]',
  tp: '[调皮]',
  cy: '[呲牙]',
  jy: '[惊讶]',
  ng: '[难过]',
  ku: '[酷]',
  lh: '[冷汗]',
  zk: '[抓狂]',
  tu: '[吐]',
  tx: '[偷笑]',
  ka: '[可爱]',
  by: '[白眼]',
  am: '[傲慢]',
  kel: '[可怜]',
  qiang: '[强]',
  ruo: '[弱]',
  ys: '[拥抱]',
  hq: '[握手]',
  bq: '[抱拳]',
  ok: '[OK]',
  mg: '[玫瑰]',
  ax: '[爱心]',
  dg: '[大哭]',
};

/** Normalize abbreviations like '/wx' into bracketed codes like "[微笑]". */
export const normalizeShorthand = (text: string): string => {
  if (!text) return text;
  // Match /letter (may contain digits), longest first
  return text.replace(/\/([a-z]+)/gi, (whole, code: string) => {
    const mapped = SHORTHAND_MAP[code.toLowerCase()];
    return mapped ?? whole;
  });
};

/** Single emoticon emoji (for the rendering layer to style: 16px, increased saturation, approaching the classic yellow-face look). */
const EMOTICON_STYLE: React.CSSProperties = {
  display: 'inline-block',
  fontSize: '16px',
  lineHeight: '16px',
  verticalAlign: 'text-bottom',
  filter: 'saturate(1.4)',
};

// Match any known "[中文名]" emoticon code
const EMOJI_TOKEN = new RegExp(
  '(' +
    Object.keys(EMOJI_MAP)
      .map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('|') +
    ')',
  'g'
);

/**
 * Render message text as a React node array: first normalize /wx abbreviations to "[微笑]",
 * then replace "[微笑]"-style emoticon codes with 16px inline "classic yellow faces"
 * (emoji + saturation boost, following docs/QQ-CLASSIC-UI.md §7 zero-image self-draw strategy).
 * Plain text is preserved as-is.
 *
 * This finally turns the previously dead emojiRenderer code into live code (#119).
 */
export const renderMessageNodes = (text: string): React.ReactNode[] => {
  if (!text) return [];
  const normalized = normalizeShorthand(text);
  const parts = normalized.split(EMOJI_TOKEN);
  const nodes: React.ReactNode[] = [];
  parts.forEach((part, i) => {
    if (!part) return;
    const emoji = EMOJI_MAP[part];
    if (emoji) {
      nodes.push(
        React.createElement(
          'span',
          { key: i, className: 'qq-emoticon', style: EMOTICON_STYLE, title: part },
          emoji
        )
      );
    } else {
      nodes.push(part);
    }
  });
  return nodes;
};
