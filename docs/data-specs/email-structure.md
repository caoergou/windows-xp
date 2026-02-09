# 邮件数据结构设计

*版本：1.0*
*日期：2026-01-31*

---

## 一、概述

邮件系统是游戏中重要的叙事推动机制，主要用于陈默与夏灯之间的往来。邮件系统采用触发机制，根据玩家的游戏进度自动生成草稿或接收新邮件。

### 设计原则

1. **情感递进**：邮件从试探→回避→痛苦→坦白→告别，展现陈默的心理变化
2. **方向性引导**：邮件只提供方向性引导，不直接给密码
3. **自动交互**：系统根据进度自动生成草稿，玩家一键发送即可触发回复

---

## 二、邮件数据结构

### 文件位置

`src/data/email/chenmo_correspondence.json`

### 完整数据结构

```json
{
  "correspondence": [
    {
      "id": "email_001",
      "from": "chenmo.dev@gmail.com",
      "fromName": "陈默",
      "to": "xiadeng@163.com",
      "toName": "夏灯",
      "subject": "惊闻噩耗",
      "body": "夏灯：\n\n惊闻伯父去世的消息，我深感悲痛。虽然我们已经很多年没有联系，但我一直记得伯父对我们的关心。\n\n如果你需要任何帮助，请随时联系我。\n\n陈默\n2026年1月5日",
      "time": "2026-01-05 10:30:00",
      "trigger": "game_start",
      "status": "unread",
      "attachments": []
    },
    {
      "id": "email_002",
      "from": "xiadeng@163.com",
      "fromName": "夏灯",
      "to": "chenmo.dev@gmail.com",
      "toName": "陈默",
      "subject": "Re: 惊闻噩耗",
      "body": "陈默：\n\n谢谢你的慰问。这些天我在整理父亲的遗物，发现了一些关于十年前的事情。\n\n你还记得林晓宇吗？\n\n夏灯",
      "time": "2026-01-06 14:20:00",
      "trigger": "player_reply_email_001",
      "status": "draft",
      "attachments": []
    },
    {
      "id": "email_003",
      "from": "chenmo.dev@gmail.com",
      "fromName": "陈默",
      "to": "xiadeng@163.com",
      "toName": "夏灯",
      "subject": "Re: Re: 惊闻噩耗",
      "body": "夏灯：\n\n当然记得。晓宇是我最好的朋友之一。\n\n为什么突然提起他？\n\n陈默",
      "time": "2026-01-06 20:15:00",
      "trigger": "player_send_email_002",
      "status": "unread",
      "attachments": []
    },
    {
      "id": "email_004",
      "from": "xiadeng@163.com",
      "fromName": "夏灯",
      "to": "chenmo.dev@gmail.com",
      "toName": "陈默",
      "subject": "关于林晓宇",
      "body": "陈默：\n\n我在父亲的电脑里发现了一些东西。林晓宇的QQ空间，他的照片，还有一些加密的文件。\n\n我看到了他拍的照片。2015年12月2日凌晨，机房的窗户亮着灯。\n\n你知道那天晚上发生了什么吗？\n\n夏灯",
      "time": "2026-01-08 16:40:00",
      "trigger": "player_unlock_album",
      "status": "draft",
      "attachments": []
    },
    {
      "id": "email_005",
      "from": "chenmo.dev@gmail.com",
      "fromName": "陈默",
      "to": "xiadeng@163.com",
      "toName": "夏灯",
      "subject": "Re: 关于林晓宇",
      "body": "夏灯：\n\n我知道你看到了什么。\n\n是的，那天晚上我在机房。我做了一些我不该做的事情。\n\n但事情不是你想的那样。如果你想知道真相，去看看晓宇的日志。他理解我，即使在最后。\n\n我知道我没有资格请求你的理解。但请相信我，我从未想过伤害他。\n\n陈默",
      "time": "2026-01-08 22:30:00",
      "trigger": "player_send_email_004",
      "status": "unread",
      "attachments": []
    },
    {
      "id": "email_006",
      "from": "xiadeng@163.com",
      "fromName": "夏灯",
      "to": "chenmo.dev@gmail.com",
      "toName": "陈默",
      "subject": "我看到了日志",
      "body": "陈默：\n\n我看到了林晓宇的日志。我知道你奶奶的事情，我知道你被迫参与。\n\n但2月15日那天，你在现场吗？那副眼镜是你的吗？\n\n我需要知道真相。\n\n夏灯",
      "time": "2026-01-10 11:20:00",
      "trigger": "player_read_diary",
      "status": "draft",
      "attachments": []
    },
    {
      "id": "email_007",
      "from": "chenmo.dev@gmail.com",
      "fromName": "陈默",
      "to": "xiadeng@163.com",
      "toName": "夏灯",
      "subject": "真相",
      "body": "夏灯：\n\n是的，我在现场。眼镜是我的。\n\n但我不是去伤害他的。我是去保护他的。\n\n我知道王虎派了人去抢晓宇的书包。我提前到了烂尾医院，想阻止他们。但我失败了。\n\n我看着他从楼顶掉下去，我什么都做不了。我的眼镜在拉扯中掉了，但我连捡起来的勇气都没有。\n\n九年了，我每天都活在那个画面里。\n\n我保存了所有的证据——系统日志、短信记录、王虎的产业链资料。明天，我会去深圳市公安局自首。\n\n三天后，你会在新闻上看到完整的真相。\n\n晓宇说过，真相应该被所有人看见。我终于有勇气做到了。\n\n谢谢你，夏灯。是你让我明白，逃避不是赎罪。\n\n陈默\n2026年1月12日",
      "time": "2026-01-12 23:45:00",
      "trigger": "player_send_email_006",
      "status": "unread",
      "attachments": []
    }
  ]
}
```

---

## 三、字段说明

### 邮件对象字段

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 邮件唯一标识符 |
| from | string | 是 | 发件人邮箱地址 |
| fromName | string | 是 | 发件人姓名 |
| to | string | 是 | 收件人邮箱地址 |
| toName | string | 是 | 收件人姓名 |
| subject | string | 是 | 邮件主题 |
| body | string | 是 | 邮件正文（支持换行符\n） |
| time | string | 是 | 发送/接收时间（格式：YYYY-MM-DD HH:mm:ss） |
| trigger | string | 是 | 触发条件（见触发机制表） |
| status | string | 是 | 邮件状态（unread/read/draft/sent） |
| attachments | array | 否 | 附件列表（暂不使用） |

---

## 四、触发机制

### 触发条件表

| 触发条件 | 说明 | 触发的邮件 |
|---------|------|-----------|
| `game_start` | 游戏开始 | email_001（陈默第一封邮件） |
| `player_reply_email_001` | 玩家回复email_001 | email_002（夏灯草稿自动生成） |
| `player_send_email_002` | 玩家发送email_002 | email_003（陈默回复） |
| `player_unlock_album` | 玩家破解林晓宇加密相册 | email_004（夏灯草稿自动生成） |
| `player_send_email_004` | 玩家发送email_004 | email_005（陈默承认在机房） |
| `player_read_diary` | 玩家阅读林晓宇日志 | email_006（夏灯草稿自动生成） |
| `player_send_email_006` | 玩家发送email_006 | email_007（陈默完整坦白） |

### 自动交互流程

```
玩家完成关键进度
    ↓
系统检测触发条件
    ↓
自动生成草稿邮件（status: "draft"）
    ↓
邮件客户端显示草稿提示
    ↓
玩家打开邮件客户端，看到草稿
    ↓
玩家点击"发送"按钮
    ↓
草稿状态变为"sent"
    ↓
模拟延迟（3-5秒）
    ↓
收到陈默的回复（status: "unread"）
    ↓
邮件客户端显示新邮件提示
```

---

## 五、邮件状态管理

### 状态类型

| 状态 | 说明 | 显示方式 |
|------|------|---------|
| `unread` | 未读邮件 | 粗体显示，邮件图标有红点 |
| `read` | 已读邮件 | 正常显示 |
| `draft` | 草稿邮件 | 显示在"草稿箱"，可编辑/发送 |
| `sent` | 已发送邮件 | 显示在"已发送" |

### 状态转换

```
unread → read（玩家打开邮件）
draft → sent（玩家点击发送）
```

---

## 六、前端集成说明

### 1. 邮件列表加载

```javascript
import { useState, useEffect } from 'react';

const EmailClient = () => {
  const [emails, setEmails] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // 加载邮件数据
    import('../data/email/chenmo_correspondence.json')
      .then(module => {
        const allEmails = module.default.correspondence;

        // 根据游戏进度过滤可见邮件
        const visibleEmails = allEmails.filter(email =>
          checkTriggerCondition(email.trigger)
        );

        setEmails(visibleEmails);

        // 计算未读数量
        const unread = visibleEmails.filter(e => e.status === 'unread').length;
        setUnreadCount(unread);
      });
  }, []);

  return (
    <div>
      <EmailList emails={emails} unreadCount={unreadCount} />
    </div>
  );
};
```

### 2. 触发条件检查

```javascript
// utils/emailTriggers.js

export const checkTriggerCondition = (trigger) => {
  const progress = getGameProgress(); // 从游戏状态获取进度

  const triggerMap = {
    'game_start': true, // 游戏开始就可见
    'player_reply_email_001': progress.repliedToEmail001,
    'player_send_email_002': progress.sentEmail002,
    'player_unlock_album': progress.unlockedAlbum,
    'player_send_email_004': progress.sentEmail004,
    'player_read_diary': progress.readDiary,
    'player_send_email_006': progress.sentEmail006
  };

  return triggerMap[trigger] || false;
};
```

### 3. 自动生成草稿

```javascript
// 当玩家完成关键进度时调用
const triggerDraftEmail = (emailId) => {
  // 更新邮件状态
  updateEmailStatus(emailId, 'draft');

  // 显示通知
  showNotification({
    title: '新草稿',
    message: '系统已为您生成一封草稿邮件',
    icon: 'email'
  });

  // 如果邮件客户端已打开，刷新列表
  if (isEmailClientOpen()) {
    refreshEmailList();
  }
};
```

### 4. 发送邮件

```javascript
const sendDraftEmail = async (emailId) => {
  // 更新邮件状态为已发送
  updateEmailStatus(emailId, 'sent');

  // 记录游戏进度
  updateGameProgress(`sent_${emailId}`);

  // 模拟延迟
  await delay(3000);

  // 触发陈默的回复
  const replyEmailId = getReplyEmailId(emailId);
  if (replyEmailId) {
    updateEmailStatus(replyEmailId, 'unread');

    // 显示新邮件通知
    showNotification({
      title: '新邮件',
      message: '您收到了陈默的回复',
      icon: 'email'
    });
  }
};
```

---

## 七、设计要点

### 1. 情感递进

邮件的情感基调按阶段变化：

- **email_001-003**：试探、客套、回避
- **email_004-005**：质问、承认、痛苦
- **email_006-007**：追问、坦白、救赎

### 2. 信息控制

邮件遵循"信息分阶段释放"原则：

- **阶段一**：不提及"替考"、"高考移民"等关键词
- **阶段二**：承认在机房，但不说明动机
- **阶段三**：揭示动机（奶奶手术费），但不说明2.15真相
- **阶段四**：完整坦白，包括现场经过和自首决定

### 3. 不直接提供密码

邮件只提供方向性引导，例如：

- ✅ "去看看晓宇的日志"
- ✅ "他理解我，即使在最后"
- ❌ "密码是camera3rdeye"
- ❌ "你可以在群聊中找到相机参数"

---

## 八、数据验证清单

创建邮件数据时，请确保：

- [ ] 所有必填字段都已填写
- [ ] 时间格式正确（YYYY-MM-DD HH:mm:ss）
- [ ] 时间顺序符合逻辑（回复晚于原邮件）
- [ ] 触发条件与游戏进度匹配
- [ ] 邮件状态正确（unread/draft）
- [ ] 邮件内容符合角色性格和情感基调
- [ ] 不直接提供密码或答案
- [ ] 正文使用\n表示换行
- [ ] JSON格式正确，无语法错误

---

## 九、扩展功能（可选）

### 附件支持

如果需要支持附件，可以扩展数据结构：

```json
{
  "attachments": [
    {
      "filename": "evidence.jpg",
      "path": "/email_attachments/evidence.jpg",
      "size": "2.3 MB",
      "type": "image/jpeg"
    }
  ]
}
```

### 邮件分类

可以添加文件夹分类：

```json
{
  "folder": "inbox",  // inbox/sent/draft/trash
  "isStarred": false,
  "isImportant": true
}
```

---

**文档完成日期**: 2026-01-31

**下一步**: 创建document-structure.md（父亲文件夹和调查报道）
