# 陈默邮件交互系统实现方案

## 1. 数据结构扩展

### 添加草稿邮件数据

在 `chenmo_correspondence.json` 中添加：

```json
{
  "correspondence": [...],
  "drafts": [
    {
      "id": "draft_xiadeng_001",
      "from": "xiadeng@163.com",
      "fromName": "夏灯",
      "to": "chenmo.dev@gmail.com",
      "toName": "陈默",
      "subject": "Re: 惊闻噩耗",
      "body": "陈默：\n\n谢谢你的慰问。\n\n我在整理父亲的遗物时，发现了一些关于十年前的记录。\n\n你还记得林晓宇吗？\n\n夏灯",
      "trigger": "player_view_qzone",
      "replyTo": "email_chenmo_001",
      "triggerResponse": "email_chenmo_002",
      "responseDelay": 3000
    }
  ]
}
```

## 2. UserProgressContext 扩展

### 添加邮件时间戳记录

```javascript
// src/context/UserProgressContext.jsx

const [progress, setProgress] = useState(() => {
  // ... 现有代码
  return {
    // ... 现有字段
    emailTimestamps: {}, // 记录每个邮件触发的时间
    emailSent: [], // 记录已发送的邮件ID
    emailRead: [] // 记录已读的邮件ID
  };
});

// 记录邮件触发时间
const recordEmailTrigger = (emailId) => {
  setProgress(prev => ({
    ...prev,
    emailTimestamps: {
      ...prev.emailTimestamps,
      [emailId]: Date.now()
    }
  }));
};

// 标记邮件已发送
const markEmailSent = (emailId) => {
  setProgress(prev => ({
    ...prev,
    emailSent: [...prev.emailSent, emailId]
  }));
};

// 标记邮件已读
const markEmailRead = (emailId) => {
  setProgress(prev => ({
    ...prev,
    emailRead: [...prev.emailRead, emailId]
  }));
};
```

## 3. Email 组件更新

### 添加草稿和新邮件通知

```javascript
// src/apps/Email.jsx

import { useState, useMemo, useEffect } from 'react';
import { useUserProgress } from '../context/UserProgressContext';
import { useWindowManager } from '../context/WindowManagerContext';

const Email = () => {
  const { progress, markEmailSent, markEmailRead } = useUserProgress();
  const { showNotification } = useWindowManager(); // 假设有这个方法

  const [pendingResponse, setPendingResponse] = useState(null);

  // 加载草稿邮件
  const drafts = useMemo(() => {
    try {
      const correspondence = require('../data/email/chenmo_correspondence.json');
      return correspondence.drafts || [];
    } catch (e) {
      return [];
    }
  }, []);

  // 过滤可见草稿
  const visibleDrafts = useMemo(() => {
    return drafts.filter(draft => {
      const triggered = checkEmailTrigger(draft.trigger, progress);
      const notSent = !progress.emailSent.includes(draft.id);
      return triggered && notSent;
    });
  }, [drafts, progress]);

  // 监听新邮件到达
  useEffect(() => {
    if (pendingResponse) {
      const timer = setTimeout(() => {
        // 触发新邮件通知
        showNotification({
          title: '新邮件',
          message: `您收到了${pendingResponse.fromName}的回复`,
          icon: 'email',
          sound: true
        });
        setPendingResponse(null);
      }, pendingResponse.delay);

      return () => clearTimeout(timer);
    }
  }, [pendingResponse]);

  // 发送草稿
  const sendDraft = (draft) => {
    // 标记为已发送
    markEmailSent(draft.id);

    // 显示"正在发送"动画
    showSendingAnimation();

    // 延迟后触发回复
    setTimeout(() => {
      setPendingResponse({
        emailId: draft.triggerResponse,
        fromName: '陈默',
        delay: draft.responseDelay || 3000
      });
    }, 1000); // 先延迟1秒显示"已发送"
  };

  // ... 其他代码
};
```

## 4. 邮件时间动态计算

### 时间计算工具函数

```javascript
// src/utils/emailTimeCalculator.js

export const calculateEmailTime = (trigger, progress) => {
  const triggerTime = progress.emailTimestamps[trigger];

  if (!triggerTime) {
    return null; // 还未触发
  }

  // 根据触发类型设置不同的延迟
  const delayMap = {
    'player_view_qzone': 2 * 3600000,      // 2小时后
    'player_unlock_album': 4 * 3600000,    // 4小时后
    'player_read_father_diary_layer1': 6 * 3600000,  // 6小时后
    'player_read_linxiaoyu_diary': 3 * 3600000,      // 3小时后
    'player_read_father_diary_layer2': 2 * 3600000   // 2小时后
  };

  const delay = delayMap[trigger] || 3600000; // 默认1小时
  const emailTime = new Date(triggerTime + delay);

  // 格式化为 YYYY-MM-DD HH:mm:ss
  return emailTime.toISOString().replace('T', ' ').split('.')[0];
};

export const formatEmailTime = (timestamp) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;

  // 刚刚（1分钟内）
  if (diff < 60000) {
    return '刚刚';
  }

  // X分钟前（1小时内）
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes}分钟前`;
  }

  // X小时前（今天）
  if (date.toDateString() === now.toDateString()) {
    const hours = Math.floor(diff / 3600000);
    return `${hours}小时前`;
  }

  // 昨天
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return `昨天 ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
  }

  // 完整日期
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};
```

## 5. 新邮件通知系统

### 桌面通知组件

```javascript
// src/components/EmailNotification.jsx

import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';

const NotificationContainer = styled(motion.div)`
  position: fixed;
  bottom: 40px;
  right: 20px;
  background: linear-gradient(180deg, #fff 0%, #ece9d8 100%);
  border: 2px solid #0054e3;
  border-radius: 2px;
  padding: 12px;
  min-width: 250px;
  max-width: 300px;
  box-shadow: 4px 4px 8px rgba(0, 0, 0, 0.3);
  cursor: pointer;
  z-index: 10000;

  display: flex;
  align-items: center;
  gap: 10px;
`;

const NotificationIcon = styled.div`
  width: 32px;
  height: 32px;
  background: url('/icons/email.png') no-repeat center;
  background-size: contain;
`;

const NotificationContent = styled.div`
  flex: 1;

  .title {
    font-weight: bold;
    font-size: 12px;
    margin-bottom: 4px;
  }

  .message {
    font-size: 11px;
    color: #333;
  }
`;

export const EmailNotification = ({ email, onClose, onClick }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000); // 5秒后自动关闭
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <AnimatePresence>
      <NotificationContainer
        initial={{ x: 400, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 400, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        onClick={onClick}
      >
        <NotificationIcon />
        <NotificationContent>
          <div className="title">新邮件</div>
          <div className="message">
            来自 {email.fromName}: {email.subject}
          </div>
        </NotificationContent>
      </NotificationContainer>
    </AnimatePresence>
  );
};
```

## 6. 任务栏图标闪烁

### 添加未读邮件提示

```javascript
// src/components/Taskbar.jsx

const EmailButton = styled.button`
  position: relative;

  ${props => props.$hasUnread && css`
    &::after {
      content: '';
      position: absolute;
      top: 2px;
      right: 2px;
      width: 8px;
      height: 8px;
      background: #ff0000;
      border-radius: 50%;
      animation: pulse 1s infinite;
    }
  `}

  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.7; transform: scale(1.2); }
  }
`;

// 在任务栏中
const unreadEmails = emails.filter(e =>
  e.status === 'unread' && !progress.emailRead.includes(e.id)
).length;

<EmailButton $hasUnread={unreadEmails > 0}>
  <XPIcon name="email" />
  {unreadEmails > 0 && <span className="badge">{unreadEmails}</span>}
</EmailButton>
```

## 7. 完整的邮件交互流程

### 示例：破解相册后的完整流程

```javascript
// 1. 玩家破解相册
const handleAlbumUnlock = () => {
  // 标记进度
  markAlbumUnlocked();

  // 记录触发时间
  recordEmailTrigger('player_unlock_album');

  // 延迟5秒生成草稿
  setTimeout(() => {
    // 显示草稿通知
    showNotification({
      title: '草稿邮件',
      message: '系统为您生成了一封草稿邮件',
      icon: 'email'
    });

    // 如果邮件窗口打开，自动刷新
    if (isWindowOpen('Email')) {
      refreshEmailList();
    }
  }, 5000);
};

// 2. 玩家发送草稿
const handleSendDraft = (draft) => {
  // 标记已发送
  markEmailSent(draft.id);

  // 显示发送动画
  showSendingAnimation();

  // 1秒后显示"已发送"
  setTimeout(() => {
    hideSendingAnimation();
    showSuccessMessage('邮件已发送');

    // 3秒后收到回复
    setTimeout(() => {
      // 显示新邮件通知
      showEmailNotification({
        fromName: '陈默',
        subject: 'Re: 那些照片'
      });

      // 记录触发时间
      recordEmailTrigger(draft.triggerResponse);

      // 刷新邮件列表
      refreshEmailList();
    }, draft.responseDelay || 3000);
  }, 1000);
};
```

## 8. 建议的优先级

### Phase 1（核心功能）
- ✅ 邮件触发机制（已完成）
- ⬜ 新邮件桌面通知
- ⬜ 任务栏未读提示

### Phase 2（交互增强）
- ⬜ 草稿邮件自动生成
- ⬜ 发送邮件功能
- ⬜ 邮件时间动态计算

### Phase 3（体验优化）
- ⬜ 发送/接收动画
- ⬜ 邮件音效
- ⬜ 与调查笔记系统联动

## 9. 测试检查清单

- [ ] 邮件1在游戏开始时可见
- [ ] 破解相册后，草稿2自动生成
- [ ] 发送草稿2后，邮件3在3秒后到达
- [ ] 新邮件到达时有桌面通知
- [ ] 任务栏显示未读邮件数量
- [ ] 邮件时间显示合理（"刚刚"/"X小时前"）
- [ ] 草稿可以正常发送
- [ ] 已发送的草稿不再显示
- [ ] 刷新页面后邮件状态保持

## 10. 配置建议

### 推荐配置（平衡真实性和游戏性）

```javascript
const EMAIL_CONFIG = {
  // 草稿生成延迟（触发进度后多久生成草稿）
  draftDelay: 5000, // 5秒

  // 回复延迟（发送邮件后多久收到回复）
  replyDelay: 3000, // 3秒

  // 通知持续时间
  notificationDuration: 5000, // 5秒

  // 是否使用动态时间
  useDynamicTime: true,

  // 邮件时间偏移（小时）
  emailTimeOffset: {
    'email_chenmo_002': 2,  // 触发后2小时
    'email_chenmo_003': 4,  // 触发后4小时
    'email_chenmo_004': 6,  // 触发后6小时
    'email_chenmo_005': 3,  // 触发后3小时
    'email_chenmo_006': 2   // 触发后2小时
  }
};
```

---

**创建日期**: 2026-02-08
**作者**: Claude Code
