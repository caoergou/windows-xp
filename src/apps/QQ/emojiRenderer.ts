import React from 'react';
import { qqEmoticon } from './assets';

/**
 * QQ classic emoticon image mapping.
 * Source: qiuyinghua/wechat-emoticons — classic emoticons shared between
 * WeChat and QQ, distributed as 60x60 PNGs.
 *
 * The data layer keeps the original "[中文名]" bracketed code (e.g. "[微笑]"),
 * so culture packages and scenario JSON remain readable and engine-agnostic.
 * This module turns those codes into `<img>` tags pointing at the actual assets.
 */
export const QQ_EMOTICON_IMAGES: Record<string, string> = {
  '[爱你]': 'rock_on.png',
  '[爱情]': 'in_love.png',
  '[爱心]': 'heart.png',
  '[傲慢]': 'smug.png',
  '[白眼]': 'slight.png',
  '[抱拳]': 'fight.png',
  '[鄙视]': 'pooh_pooh.png',
  '[闭嘴]': 'silent.png',
  '[便便]': 'poop.png',
  '[擦汗]': 'speechless.png',
  '[菜刀]': 'cleaver.png',
  '[差劲]': 'pinky.png',
  '[呲牙]': 'grin.png',
  '[大哭]': 'cry.png',
  '[蛋糕]': 'cake.png',
  '[刀]': 'dagger.png',
  '[得意]': 'cool_guy.png',
  '[凋谢]': 'wilt.png',
  '[调皮]': 'tongue.png',
  '[发呆]': 'scowl.png',
  '[发抖]': 'tremble.png',
  '[发怒]': 'angry.png',
  '[饭]': 'rice.png',
  '[飞吻]': 'blowkiss.png',
  '[奋斗]': 'determined.png',
  '[疯了]': 'tormented.png',
  '[尴尬]': 'akward.png',
  '[勾引]': 'beckon.png',
  '[鼓掌]': 'clap.png',
  '[哈欠]': 'yawn.png',
  '[害羞]': 'shy.png',
  '[憨笑]': 'laugh.png',
  '[坏笑]': 'trick.png',
  '[回头]': 'dramatic.png',
  '[饥饿]': 'hungry.png',
  '[惊恐]': 'panic.png',
  '[惊讶]': 'surprise.png',
  '[咖啡]': 'coffee.png',
  '[磕头]': 'kotow.png',
  '[可怜]': 'whimper.png',
  '[抠鼻]': 'nose_pick.png',
  '[骷髅]': 'skull.png',
  '[酷]': 'ruthless.png',
  '[快哭了]': 'tearing_up.png',
  '[困]': 'drowsy.png',
  '[篮球]': 'basketball.png',
  '[冷汗]': 'blush.png',
  '[礼物]': 'gift.png',
  '[流汗]': 'sweat.png',
  '[流泪]': 'sob.png',
  '[玫瑰]': 'rose.png',
  '[难过]': 'frown.png',
  '[怄火]': 'aaagh.png',
  '[啤酒]': 'beer.png',
  '[瓢虫]': 'lady_bug.png',
  '[撇嘴]': 'grimance.png',
  '[乒乓]': 'ping_pong.png',
  '[强]': 'thumbs_up.png',
  '[敲打]': 'hammer.png',
  '[亲亲]': 'kiss.png',
  '[糗大了]': 'shame.png',
  '[拳头]': 'fist.png',
  '[弱]': 'thumbs_down.png',
  '[色]': 'drool.png',
  '[闪电]': 'lightning.png',
  '[胜利]': 'peace.png',
  '[衰]': 'toasted.png',
  '[睡]': 'sleep.png',
  '[太阳]': 'sun.png',
  '[跳绳]': 'jump_rope.png',
  '[跳跳]': 'waddle.png',
  '[偷笑]': 'chuckle.png',
  '[投降]': 'surrender.png',
  '[吐]': 'puke.png',
  '[微笑]': 'smile.png',
  '[委屈]': 'shrunken.png',
  '[握手]': 'shake.png',
  '[西瓜]': 'watermelon.png',
  '[吓]': 'wrath.png',
  '[心碎]': 'broken_heart.png',
  '[嘘]': 'shhh.png',
  '[疑问]': 'shocked.png',
  '[阴险]': 'sly.png',
  '[拥抱]': 'hug.png',
  '[悠闲]': 'commando.png',
  '[右哼哼]': 'bah_r.png',
  '[愉快]': 'joyful.png',
  '[月亮]': 'moon.png',
  '[晕]': 'dizzy.png',
  '[再见]': 'wave.png',
  '[炸弹]': 'bomb.png',
  '[咒骂]': 'scold.png',
  '[猪头]': 'pig.png',
  '[抓狂]': 'scream.png',
  '[转圈]': 'twirl.png',
  '[足球]': 'soccer.png',
  '[嘴唇]': 'lips.png',
  '[左哼哼]': 'bah_l.png',
  '[Hooray]': 'hooray.png',
  '[Meditate]': 'meditate.png',
  '[NO]': 'nuh_uh.png',
  '[OK]': 'ok.png',
  '[Smooch]': 'smooch.png',
  '[TaiChi L]': 'taichi_l.png',
  '[TaiChi R]': 'taichi_r.png',
};

/** Ordered list for the emoji picker panel. */
export const QQ_EMOJI_LIST: ReadonlyArray<{ code: string; file: string }> = Object.entries(
  QQ_EMOTICON_IMAGES
).map(([code, file]) => ({ code, file }));

/** Classic QQ emoticon pinyin abbreviations -> "[中文名]" bracketed codes. */
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

/** Normalize abbreviations like "/wx" into bracketed codes like "[微笑]". */
export const normalizeShorthand = (text: string): string => {
  if (!text) return text;
  return text.replace(/\/([a-z]+)/gi, (whole, code: string) => {
    const mapped = SHORTHAND_MAP[code.toLowerCase()];
    return mapped ?? whole;
  });
};

const EMOJI_TOKEN = new RegExp(
  '(' +
    Object.keys(QQ_EMOTICON_IMAGES)
      .map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('|') +
    ')',
  'g'
);

/**
 * Render message text as a React node array: first normalize /wx abbreviations to "[微笑]",
 * then replace "[微笑]"-style emoticon codes with 16x16 inline PNG images.
 * Plain text is preserved as-is.
 */
export const renderMessageNodes = (text: string): React.ReactNode[] => {
  if (!text) return [];
  const normalized = normalizeShorthand(text);
  const parts = normalized.split(EMOJI_TOKEN);
  const nodes: React.ReactNode[] = [];
  parts.forEach((part, i) => {
    if (!part) return;
    const file = QQ_EMOTICON_IMAGES[part];
    if (file) {
      const src = qqEmoticon(file);
      nodes.push(
        React.createElement('img', {
          key: i,
          className: 'qq-emoticon-img',
          src,
          alt: part,
          title: part,
        })
      );
    } else {
      nodes.push(part);
    }
  });
  return nodes;
};
