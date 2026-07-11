import React from 'react';

/**
 * QQ 表情映射表 - 将文本表情转换为 emoji
 * 基于 2015 年左右的 QQ 表情
 */
const EMOJI_MAP: Record<string, string> = {
    // 常用表情
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

    // 手势表情
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

    // 其他表情
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
    '[投降]': '🏳️'
};

/**
 * 将消息文本中的表情符号转换为 emoji
 * @param {string} text - 原始消息文本
 * @returns {string} 转换后的文本
 */
export const renderEmoji = (text: string): string => {
    if (!text) return text;

    let result = text;

    // 替换所有匹配的表情
    Object.entries(EMOJI_MAP).forEach(([key, emoji]) => {
        // 转义特殊字符
        const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escapedKey, 'g');
        result = result.replace(regex, emoji);
    });

    return result;
};

/**
 * 将消息文本中的表情符号转换为带样式的 HTML
 * @param {string} text - 原始消息文本
 * @returns {string} 转换后的 HTML 字符串
 */
export const renderEmojiHTML = (text: string): string => {
    if (!text) return text;

    let result = text;

    // 替换所有匹配的表情,添加 span 包裹以便样式控制
    Object.entries(EMOJI_MAP).forEach(([key, emoji]) => {
        const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escapedKey, 'g');
        result = result.replace(regex, `<span class="emoji">${emoji}</span>`);
    });

    return result;
};

/**
 * 经典 QQ 表情拼音缩写码（千禧年代真实写法）→ `[中文名]` 方括号码。
 * 输入层支持 `/wx` 等缩写；数据层保留 `[微笑]` 以便可读。见 docs/QQ-CLASSIC-UI.md §3。
 */
const SHORTHAND_MAP: Record<string, string> = {
    wx: '[微笑]', pz: '[撇嘴]', se: '[色]', fd: '[发呆]', dy: '[得意]',
    ll: '[流泪]', hx: '[害羞]', bz: '[闭嘴]', shui: '[睡]', dk: '[大哭]',
    gg: '[尴尬]', fn: '[发怒]', tp: '[调皮]', cy: '[呲牙]', jy: '[惊讶]',
    ng: '[难过]', ku: '[酷]', lh: '[冷汗]', zk: '[抓狂]', tu: '[吐]',
    tx: '[偷笑]', ka: '[可爱]', by: '[白眼]', am: '[傲慢]', kel: '[可怜]',
    qiang: '[强]', ruo: '[弱]', ys: '[拥抱]', hq: '[握手]', bq: '[抱拳]',
    ok: '[OK]', mg: '[玫瑰]', ax: '[爱心]', dg: '[大哭]',
};

/** 将 `/wx` 等缩写码规范化为 `[微笑]` 方括号码。 */
export const normalizeShorthand = (text: string): string => {
    if (!text) return text;
    // 匹配 /字母（可含数字），最长优先
    return text.replace(/\/([a-z]+)/gi, (whole, code: string) => {
        const mapped = SHORTHAND_MAP[code.toLowerCase()];
        return mapped ?? whole;
    });
};

/** 单个表情 emoji（供渲染层加样式：16px、提高饱和度，逼近经典黄脸观感）。 */
const EMOTICON_STYLE: React.CSSProperties = {
    display: 'inline-block',
    fontSize: '16px',
    lineHeight: '16px',
    verticalAlign: 'text-bottom',
    filter: 'saturate(1.4)',
};

// 匹配任意已知 `[中文名]` 表情码
const EMOJI_TOKEN = new RegExp(
    '(' +
        Object.keys(EMOJI_MAP)
            .map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
            .join('|') +
        ')',
    'g'
);

/**
 * 将消息文本渲染为 React 节点数组：先把 `/wx` 缩写归一化为 `[微笑]`，
 * 再把 `[微笑]` 等表情码替换为 16px 内联「经典黄脸」（emoji + 饱和度增强，
 * 遵循 docs/QQ-CLASSIC-UI.md §7 的零图片自绘策略）。纯文本原样保留。
 *
 * 这让此前的死代码 emojiRenderer 终于成为活代码（#119）。
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
