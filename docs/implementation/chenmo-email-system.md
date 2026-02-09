# 陈默邮件系统实现说明

## 概述

陈默邮件系统是《山月无声》游戏中的核心叙事机制，通过六封邮件展现陈默从试探到坦白再到自首的心理历程。邮件根据玩家游戏进度阶段性显示，配合四阶段玩家视角递进。

## 文件结构

```
src/data/email/
├── chenmo_correspondence.json  # 陈默六封邮件数据
├── inbox/                      # 其他收件箱邮件
├── sent/                       # 已发送邮件
└── spam/                       # 垃圾邮件

src/apps/
└── Email.jsx                   # 邮件客户端组件（已更新）

src/context/
└── UserProgressContext.jsx     # 游戏进度管理
```

## 邮件数据结构

### chenmo_correspondence.json

```json
{
  "correspondence": [
    {
      "id": "email_chenmo_001",
      "from": "chenmo.dev@gmail.com",
      "fromName": "陈默",
      "to": "xiadeng@163.com",
      "toName": "夏灯",
      "subject": "惊闻噩耗",
      "body": "邮件正文内容...",
      "time": "2026-01-05 10:30:00",
      "trigger": "game_start",
      "status": "unread",
      "attachments": []
    }
  ]
}
```

### 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 邮件唯一标识符 |
| from | string | 发件人邮箱地址 |
| fromName | string | 发件人姓名 |
| to | string | 收件人邮箱地址 |
| toName | string | 收件人姓名 |
| subject | string | 邮件主题 |
| body | string | 邮件正文（支持\n换行） |
| time | string | 发送时间（YYYY-MM-DD HH:mm:ss） |
| trigger | string | 触发条件（见下表） |
| status | string | 邮件状态（unread/read） |
| attachments | array | 附件列表（暂未使用） |

## 触发机制

### 触发条件映射表

| 邮件ID | 触发条件 | 对应游戏进度 | 所属阶段 |
|--------|---------|-------------|---------|
| email_chenmo_001 | `game_start` | 游戏开始 | 阶段一 |
| email_chenmo_002 | `player_view_qzone` | 玩家登录QQ并查看空间 | 阶段一末期 |
| email_chenmo_003 | `player_unlock_album` | 玩家破解林晓宇加密相册 | 阶段二 |
| email_chenmo_004 | `player_read_father_diary_layer1` | 玩家解密父亲日志第一层 | 阶段二末期 |
| email_chenmo_005 | `player_read_linxiaoyu_diary` | 玩家阅读林晓宇日志 | 阶段三 |
| email_chenmo_006 | `player_read_father_diary_layer2` | 玩家解密父亲日志第二层 | 阶段四 |

### 触发条件检查逻辑

在 [Email.jsx](../../src/apps/Email.jsx#L186-L197) 中实现：

```javascript
const checkEmailTrigger = (trigger, progress) => {
  const triggerMap = {
    'game_start': true,
    'player_view_qzone': progress.qqLoggedIn,
    'player_unlock_album': progress.albumUnlocked,
    'player_read_father_diary_layer1': progress.fatherLogLayer1Unlocked,
    'player_read_linxiaoyu_diary': progress.encryptedDiaryUnlocked,
    'player_read_father_diary_layer2': progress.fatherLogLayer2Unlocked
  };

  return triggerMap[trigger] || false;
};
```

## 邮件内容设计

### 邮件1：惊闻噩耗（500字）

**阶段**: 阶段一（个体悬疑）
**情感**: 慰问、试探、克制的愧疚
**信息控制**: 不提及具体事件，只模糊暗示

**关键内容**:
- 陈默自我介绍
- 提及"山顶事务所"
- 暗示夏父可能记录了一些东西
- 提到林晓宇和"约定"

### 邮件2：试探性回复（600字）

**阶段**: 阶段一末期/阶段二初期
**情感**: 回避、试探、部分承认
**信息控制**: 承认在机房，但不说明目的

**关键内容**:
- 承认12月2日凌晨在机房
- 提及奶奶病重需要手术费
- 承认被人找到"帮忙"
- 警告林晓宇是为了保护他

### 邮件3：破解相册后的痛苦坦白（800字）

**阶段**: 阶段二（证据指向陈默）
**情感**: 痛苦、挣扎、部分坦白
**信息控制**: 详细承认技术操作，但不说明完整动机

**关键内容**:
- 承认篡改6个学生的学籍数据
- 描述2月14日图书馆对峙
- 林晓宇的话："但总要有人按下Ctrl+Z"
- 强调"我不是凶手"

### 邮件4：承认在现场（1000字）

**阶段**: 阶段二末期（红鲱鱼高潮）
**情感**: 崩溃、恳求、绝望的坦白
**信息控制**: 完整描述2月15日现场经过

**关键内容**:
- 承认眼镜是他的
- 详细描述烂尾医院现场
- "我的手指碰到了他的衣角，但我没抓住"
- 解释为什么沉默九年（奶奶、王虎威胁）

### 邮件5：看完林晓宇日志后的完整证词（1200字）

**阶段**: 阶段三（真相反转）
**情感**: 释然、感激、决心
**信息控制**: 揭示完整产业链数据

**关键内容**:
- 林晓宇理解陈默
- 2月14日图书馆完整对话
- 林晓宇把相册密码告诉陈默
- 揭示18人、2000万、受害者故事
- 宣布明天自首

### 邮件6：决定自首的告别（800字）

**阶段**: 阶段四（系统揭露）
**情感**: 平静、坚定、告别
**信息控制**: 全部揭示

**关键内容**:
- 整理好所有材料（156页日志、47条短信等）
- 山顶的梦境
- "真正的惩罚不是坐牢，而是沉默"
- 预告三天后的调查报道
- "山月无声，但光终究会找到裂缝"

## 实现细节

### Email组件更新

在 [Email.jsx](../../src/apps/Email.jsx) 中：

1. **导入UserProgressContext**（第4行）
```javascript
import { useUserProgress } from '../context/UserProgressContext';
```

2. **加载陈默邮件**（第223-232行）
```javascript
const chenMoEmails = useMemo(() => {
  try {
    const correspondence = require('../data/email/chenmo_correspondence.json');
    return correspondence.correspondence || [];
  } catch (e) {
    console.error('Failed to load Chen Mo emails:', e);
    return [];
  }
}, []);
```

3. **过滤可见邮件**（第234-237行）
```javascript
const visibleChenMoEmails = useMemo(() => {
  return chenMoEmails.filter(email => checkEmailTrigger(email.trigger, progress));
}, [chenMoEmails, progress]);
```

4. **合并到收件箱**（第239-267行）
- 将陈默邮件转换为UI格式
- 合并到inbox
- 按时间倒序排序

### 游戏进度管理

在 [UserProgressContext.jsx](../../src/context/UserProgressContext.jsx) 中已有的进度标记：

- `qqLoggedIn` - 玩家登录QQ
- `albumUnlocked` - 破解相册
- `fatherLogLayer1Unlocked` - 解密父亲日志第一层
- `encryptedDiaryUnlocked` - 阅读林晓宇日志
- `fatherLogLayer2Unlocked` - 解密父亲日志第二层

## 测试方法

### 1. 测试邮件1（游戏开始）

```javascript
// 游戏开始时应该自动显示
// 打开邮件客户端，收件箱应该有"惊闻噩耗"邮件
```

### 2. 测试邮件2（登录QQ后）

```javascript
// 在浏览器控制台执行
const progress = JSON.parse(localStorage.getItem('xp_game_progress'));
progress.qqLoggedIn = true;
localStorage.setItem('xp_game_progress', JSON.stringify(progress));
// 刷新页面，打开邮件客户端，应该看到第二封邮件
```

### 3. 测试邮件3（破解相册后）

```javascript
const progress = JSON.parse(localStorage.getItem('xp_game_progress'));
progress.albumUnlocked = true;
localStorage.setItem('xp_game_progress', JSON.stringify(progress));
```

### 4. 测试邮件4（解密父亲日志第一层）

```javascript
const progress = JSON.parse(localStorage.getItem('xp_game_progress'));
progress.fatherLogLayer1Unlocked = true;
localStorage.setItem('xp_game_progress', JSON.stringify(progress));
```

### 5. 测试邮件5（阅读林晓宇日志）

```javascript
const progress = JSON.parse(localStorage.getItem('xp_game_progress'));
progress.encryptedDiaryUnlocked = true;
localStorage.setItem('xp_game_progress', JSON.stringify(progress));
```

### 6. 测试邮件6（解密父亲日志第二层）

```javascript
const progress = JSON.parse(localStorage.getItem('xp_game_progress'));
progress.fatherLogLayer2Unlocked = true;
localStorage.setItem('xp_game_progress', JSON.stringify(progress));
```

### 测试所有邮件

```javascript
// 一次性解锁所有进度
const progress = {
  qqLoggedIn: true,
  albumUnlocked: true,
  fatherLogLayer1Unlocked: true,
  encryptedDiaryUnlocked: true,
  fatherLogLayer2Unlocked: true
};
localStorage.setItem('xp_game_progress', JSON.stringify(progress));
// 刷新页面，应该看到全部6封邮件
```

## 设计原则

### 1. 信息分阶段释放

遵循社会派推理的叙事节奏：

- **阶段一**：不提及"高考移民"、"产业链"等关键词
- **阶段二**：承认技术操作，但不说明完整动机
- **阶段三**：揭示动机和真相反转
- **阶段四**：完整揭露产业链数据

### 2. 情感递进

陈默的情感变化：

```
试探 → 回避 → 痛苦 → 崩溃 → 释然 → 决心
```

### 3. 不直接喂剧情

邮件只提供方向性引导，不直接给密码或答案：

- ✅ "去看看晓宇留下的东西"
- ✅ "他理解我，即使在最后"
- ❌ "密码是camera3rdeye"
- ❌ "你可以在群聊中找到相机参数"

### 4. 真实感优先

- 2015年的语言风格
- 16岁/27岁的口吻差异
- 技术宅的表达方式
- 克制的情感表达

## 注意事项

1. **邮件顺序**: 邮件按时间倒序显示（最新的在最上面）
2. **进度持久化**: 游戏进度保存在localStorage中，刷新页面不会丢失
3. **触发条件**: 必须严格按照游戏进度触发，不能跳过
4. **内容质量**: 每封邮件都经过精心设计，符合人物性格和叙事节奏
5. **字数控制**: 严格控制字数（500-1200字），保持节奏感

## 未来扩展

### 可选功能

1. **邮件通知**: 新邮件到达时显示桌面通知
2. **未读标记**: 显示未读邮件数量
3. **邮件回复**: 玩家可以回复邮件（自动生成草稿）
4. **附件支持**: 支持邮件附件（照片、文档等）

### 扩展示例

```javascript
// 添加邮件通知
if (newEmailArrived) {
  showNotification({
    title: '新邮件',
    message: '您收到了陈默的回复',
    icon: 'email'
  });
}
```

## 相关文档

- [邮件数据结构设计](../data-specs/email-structure.md)
- [游戏进度管理](../data-specs/progress-tracking.md)
- [叙事控制规则](../../.claude/skills/shanyue-writer/references/narrative-control.md)
- [写作指南](../../.claude/skills/shanyue-writer/references/writing-guidelines.md)

## 总结

陈默邮件系统通过六封精心设计的邮件，配合游戏进度阶段性显示，实现了社会派推理的叙事节奏。系统设计简洁、可扩展，完全集成到现有的游戏架构中。

**核心特点**:
- ✅ 阶段性可见，配合游戏进度
- ✅ 情感递进自然，符合人物性格
- ✅ 信息分层释放，制造认知落差
- ✅ 真实感强，语言风格准确
- ✅ 易于测试和调试

---

**创建日期**: 2026-02-08
**最后更新**: 2026-02-08
**作者**: Claude Code + shanyue-writer skill
