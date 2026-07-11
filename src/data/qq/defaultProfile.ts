import { QQProfile } from './types';

/**
 * 默认 QQ 档案：2005–2007 中国网民记忆，作为 `zh` 文化包的默认内容。
 *
 * 「我」= 往事随风、脚本好友 = 水晶女孩，与 D 盘 `聊天记录.txt` 的两位主角呼应
 * （#119 验收场景）。其余好友的昵称 / 签名 / 头像取自 mengkunsoft/QQ2006 的
 * 原版素材，保留时代质感。宿主可经 `XPHandle.qq.loadProfile()` 覆盖。
 */
export const defaultQQProfile: QQProfile = {
  me: {
    number: '10001',
    nickname: '往事随风',
    signature: '回不去的是青春，等不到的是旧人',
    avatar: 50,
    status: 'online',
  },
  groups: [
    { id: 'friends', name: '我的好友', open: true },
    { id: 'family', name: '家人' },
    { id: 'classmates', name: '同学' },
    { id: 'strangers', name: '陌生人', system: true },
    { id: 'blacklist', name: '黑名单', system: true },
  ],
  buddies: [
    // 脚本主角：登录后 5 秒敲门上线，主动发来两条带打字停顿的消息，
    // 并对玩家的每条回复循环脚本作答（#119 验收）。
    {
      id: 'crystal',
      number: '3453674',
      nickname: '水晶女孩',
      signature: '若无法为你撑起晴空，那我便陪你共沐风雨',
      avatar: 97,
      group: 'friends',
      status: 'offline',
      badges: ['music'],
      onlineDelayMs: 5000,
      script: [
        { delayMs: 900, typingMs: 1200, text: '在吗？晚上去网吧联机 CS 吗？[呲牙]' },
        { delayMs: 700, typingMs: 1500, text: '记得把迅雷下好的电影拷给我~ [害羞]' },
      ],
      reply: {
        kind: 'script',
        steps: [
          { typingMs: 1000, text: '好呀，我先把 QQ 隐身挂好等级 [调皮]' },
          { typingMs: 1100, text: '哈哈，你也在网上冲浪啊 [憨笑]' },
          { typingMs: 1200, text: '回不去的是青春，等不到的是旧人…' },
          { typingMs: 900, text: '8 点老地方见，别迟到 [强]' },
        ],
      },
    },
    {
      id: 'ahui',
      number: '286512',
      nickname: '阿辉',
      signature: '人生沟坎多因能力不足，门槛高低全凭实力',
      avatar: 16,
      group: 'friends',
      status: 'online',
      reply: {
        kind: 'script',
        steps: [{ typingMs: 900, text: '哈哈，真有意思 [偷笑]' }],
      },
    },
    {
      id: 'aiyo',
      number: '661234',
      nickname: '哎哟喂',
      signature: '我爱吃红烧肉',
      avatar: 22,
      group: 'friends',
      status: 'online',
      vip: true,
      badges: ['music', 'mobile'],
    },
    {
      id: 'prince',
      number: '520130',
      nickname: '小王子',
      signature: '我珍忄昔、祢鳪忄董，我放掱、你却拉住我。。',
      avatar: 5,
      group: 'friends',
      status: 'online',
      badges: ['ring'],
    },
    {
      id: 'happy',
      number: '778899',
      nickname: 'happy',
      avatar: 7,
      group: 'friends',
      status: 'online',
      badges: ['mobile'],
    },
    {
      id: 'muzi',
      number: '135246',
      nickname: '木子',
      signature: '你也在网上冲浪啊',
      avatar: 9,
      group: 'friends',
      status: 'away',
    },
    {
      id: 'hui',
      number: '246810',
      nickname: '灰',
      signature: '有事请留言',
      avatar: 11,
      group: 'friends',
      status: 'online',
      badges: ['music', 'mobile'],
    },
    {
      id: 'aipin',
      number: '990011',
      nickname: '爱拼才会赢',
      signature: '我还年轻，所以我可以',
      avatar: 18,
      group: 'family',
      status: 'offline',
    },
    {
      id: 'memory',
      number: '445566',
      nickname: '最深的记忆',
      signature: '把你留在心中',
      avatar: 100,
      group: 'family',
      status: 'offline',
      badges: ['mobile'],
    },
  ],
};
