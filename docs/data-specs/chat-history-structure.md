# QQ聊天记录数据结构设计

*版本：1.0*
*日期：2026-01-21*

---

## 一、概述

QQ聊天记录包含两种类型：
1. **群聊记录** - 多人群组对话（如"山办"工作群）
2. **私聊记录** - 一对一对话（如林晓宇与陈默的私聊）

所有聊天记录以JSON格式存储，支持文本、图片、文件等多种消息类型。

---

## 二、群聊记录结构

### 文件位置

`src/data/qq/groups/{group_id}.json`

### 数据结构

```json
{
  "groupId": "shanbangongshi",
  "groupName": "山办",
  "groupAvatar": "/avatars/group_shanbangongshi.jpg",
  "memberCount": 8,
  "members": [
    {
      "userId": "linxiaoyu",
      "username": "林晓宇",
      "avatar": "/avatars/linxiaoyu.jpg",
      "role": "member"
    },
    {
      "userId": "chenmuo",
      "username": "陈默",
      "avatar": "/avatars/chenmuo.jpg",
      "role": "member"
    },
    {
      "userId": "xiadeng",
      "username": "夏灯",
      "avatar": "/avatars/xiadeng.jpg",
      "role": "admin"
    }
  ],
  "messages": [
    {
      "id": 1,
      "senderId": "xiadeng",
      "senderName": "夏灯",
      "type": "text",
      "content": "大家好，欢迎加入山办工作群！",
      "time": "2015-09-01 10:00:00"
    },
    {
      "id": 2,
      "senderId": "linxiaoyu",
      "senderName": "林晓宇",
      "type": "text",
      "content": "谢谢学长！",
      "time": "2015-09-01 10:05:00"
    },
    {
      "id": 3,
      "senderId": "chenmuo",
      "senderName": "陈默",
      "type": "image",
      "content": "/chat_images/group_photo.jpg",
      "caption": "今天的合影",
      "time": "2015-09-15 18:30:00"
    },
    {
      "id": 4,
      "senderId": "linxiaoyu",
      "senderName": "林晓宇",
      "type": "file",
      "content": "/chat_files/meeting_notes.txt",
      "fileName": "会议记录.txt",
      "fileSize": "2.3 KB",
      "time": "2015-10-20 14:00:00"
    }
  ]
}
```

### 群聊对象字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| groupId | string | 是 | 群组唯一标识符 |
| groupName | string | 是 | 群组名称 |
| groupAvatar | string | 是 | 群组头像路径 |
| memberCount | number | 是 | 成员数量 |
| members | array | 是 | 成员列表 |
| messages | array | 是 | 消息列表 |

### 成员对象字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| userId | string | 是 | 用户ID |
| username | string | 是 | 用户昵称 |
| avatar | string | 是 | 用户头像路径 |
| role | string | 是 | 角色（admin/member） |

### 消息对象字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | number | 是 | 消息唯一ID |
| senderId | string | 是 | 发送者ID |
| senderName | string | 是 | 发送者昵称 |
| type | string | 是 | 消息类型（text/image/file/system） |
| content | string | 是 | 消息内容（文本/图片路径/文件路径） |
| caption | string | 否 | 图片说明（仅type=image时） |
| fileName | string | 否 | 文件名（仅type=file时） |
| fileSize | string | 否 | 文件大小（仅type=file时） |
| time | string | 是 | 发送时间（格式：YYYY-MM-DD HH:mm:ss） |

---

## 三、私聊记录结构

### 文件位置

`src/data/qq/private/{user1_id}_{user2_id}.json`

例如：`linxiaoyu_chenmuo.json`（林晓宇与陈默的私聊）

### 数据结构

```json
{
  "chatId": "linxiaoyu_chenmuo",
  "participants": [
    {
      "userId": "linxiaoyu",
      "username": "林晓宇",
      "avatar": "/avatars/linxiaoyu.jpg"
    },
    {
      "userId": "chenmuo",
      "username": "陈默",
      "avatar": "/avatars/chenmuo.jpg"
    }
  ],
  "messages": [
    {
      "id": 1,
      "senderId": "linxiaoyu",
      "senderName": "林晓宇",
      "type": "text",
      "content": "陈默，你在吗？",
      "time": "2015-11-20 20:00:00"
    },
    {
      "id": 2,
      "senderId": "chenmuo",
      "senderName": "陈默",
      "type": "text",
      "content": "在的，怎么了？",
      "time": "2015-11-20 20:01:00"
    },
    {
      "id": 3,
      "senderId": "linxiaoyu",
      "senderName": "林晓宇",
      "type": "text",
      "content": "我发现了一些奇怪的事情...",
      "time": "2015-11-20 20:02:00"
    }
  ]
}
```

### 私聊对象字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| chatId | string | 是 | 对话唯一标识符 |
| participants | array | 是 | 参与者列表（固定2人） |
| messages | array | 是 | 消息列表 |

### 参与者对象字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| userId | string | 是 | 用户ID |
| username | string | 是 | 用户昵称 |
| avatar | string | 是 | 用户头像路径 |

---

## 四、消息类型详解

### 1. 文本消息 (type: "text")

```json
{
  "id": 1,
  "senderId": "linxiaoyu",
  "senderName": "林晓宇",
  "type": "text",
  "content": "这是一条文本消息",
  "time": "2015-11-20 20:00:00"
}
```

### 2. 图片消息 (type: "image")

```json
{
  "id": 2,
  "senderId": "linxiaoyu",
  "senderName": "林晓宇",
  "type": "image",
  "content": "/chat_images/photo_001.jpg",
  "caption": "这是图片说明",
  "time": "2015-11-20 20:05:00"
}
```

### 3. 文件消息 (type: "file")

```json
{
  "id": 3,
  "senderId": "chenmuo",
  "senderName": "陈默",
  "type": "file",
  "content": "/chat_files/document.pdf",
  "fileName": "重要文档.pdf",
  "fileSize": "1.2 MB",
  "time": "2015-11-20 20:10:00"
}
```

### 4. 系统消息 (type: "system")

```json
{
  "id": 4,
  "senderId": "system",
  "senderName": "系统消息",
  "type": "system",
  "content": "林晓宇 加入了群聊",
  "time": "2015-09-01 10:00:00"
}
```

---

## 五、完整示例

### 示例1："山办"工作群聊天记录

文件：`src/data/qq/groups/shanbangongshi.json`

```json
{
  "groupId": "shanbangongshi",
  "groupName": "山办",
  "groupAvatar": "/avatars/group_shanbangongshi.jpg",
  "memberCount": 8,
  "members": [
    {
      "userId": "xiadeng",
      "username": "夏灯",
      "avatar": "/avatars/xiadeng.jpg",
      "role": "admin"
    },
    {
      "userId": "linxiaoyu",
      "username": "林晓宇",
      "avatar": "/avatars/linxiaoyu.jpg",
      "role": "member"
    },
    {
      "userId": "chenmuo",
      "username": "陈默",
      "avatar": "/avatars/chenmuo.jpg",
      "role": "member"
    },
    {
      "userId": "zhangyu",
      "username": "张雨",
      "avatar": "/avatars/zhangyu.jpg",
      "role": "member"
    }
  ],
  "messages": [
    {
      "id": 1,
      "senderId": "system",
      "senderName": "系统消息",
      "type": "system",
      "content": "夏灯 创建了群聊",
      "time": "2015-09-01 09:00:00"
    },
    {
      "id": 2,
      "senderId": "system",
      "senderName": "系统消息",
      "type": "system",
      "content": "林晓宇 加入了群聊",
      "time": "2015-09-01 09:30:00"
    },
    {
      "id": 3,
      "senderId": "xiadeng",
      "senderName": "夏灯",
      "type": "text",
      "content": "欢迎大家加入山办工作群！这里是我们日常工作交流的地方。",
      "time": "2015-09-01 10:00:00"
    },
    {
      "id": 4,
      "senderId": "linxiaoyu",
      "senderName": "林晓宇",
      "type": "text",
      "content": "谢谢学长！很高兴能加入山办。",
      "time": "2015-09-01 10:05:00"
    },
    {
      "id": 5,
      "senderId": "chenmuo",
      "senderName": "陈默",
      "type": "text",
      "content": "+1，请多多关照！",
      "time": "2015-09-01 10:06:00"
    },
    {
      "id": 6,
      "senderId": "xiadeng",
      "senderName": "夏灯",
      "type": "text",
      "content": "下周一晚上7点开会，大家记得准时参加。",
      "time": "2015-09-03 18:00:00"
    },
    {
      "id": 7,
      "senderId": "linxiaoyu",
      "senderName": "林晓宇",
      "type": "text",
      "content": "收到！",
      "time": "2015-09-03 18:05:00"
    }
  ]
}
```

### 示例2：林晓宇与陈默的私聊记录

文件：`src/data/qq/private/linxiaoyu_chenmuo.json`

```json
{
  "chatId": "linxiaoyu_chenmuo",
  "participants": [
    {
      "userId": "linxiaoyu",
      "username": "林晓宇",
      "avatar": "/avatars/linxiaoyu.jpg"
    },
    {
      "userId": "chenmuo",
      "username": "陈默",
      "avatar": "/avatars/chenmuo.jpg"
    }
  ],
  "messages": [
    {
      "id": 1,
      "senderId": "linxiaoyu",
      "senderName": "林晓宇",
      "type": "text",
      "content": "陈默，你对计算机很熟悉吧？",
      "time": "2015-09-10 19:00:00"
    },
    {
      "id": 2,
      "senderId": "chenmuo",
      "senderName": "陈默",
      "type": "text",
      "content": "还行吧，有什么问题吗？",
      "time": "2015-09-10 19:02:00"
    },
    {
      "id": 3,
      "senderId": "linxiaoyu",
      "senderName": "林晓宇",
      "type": "text",
      "content": "我想学一些照片处理的技术，你能教我吗？",
      "time": "2015-09-10 19:05:00"
    },
    {
      "id": 4,
      "senderId": "chenmuo",
      "senderName": "陈默",
      "type": "text",
      "content": "当然可以！周末有空吗？我教你用Photoshop。",
      "time": "2015-09-10 19:07:00"
    },
    {
      "id": 5,
      "senderId": "linxiaoyu",
      "senderName": "林晓宇",
      "type": "text",
      "content": "太好了！谢谢你！",
      "time": "2015-09-10 19:08:00"
    }
  ]
}
```

---

## 六、前端集成说明

### 1. QQHistory组件加载聊天记录

```javascript
// 在 QQHistory.jsx 中
import { useState, useEffect } from 'react';

const QQHistory = ({ chatType = 'group', chatId }) => {
  const [chatData, setChatData] = useState(null);

  useEffect(() => {
    const loadChat = async () => {
      try {
        let module;
        if (chatType === 'group') {
          module = await import(`../data/qq/groups/${chatId}.json`);
        } else {
          module = await import(`../data/qq/private/${chatId}.json`);
        }
        setChatData(module.default);
      } catch (error) {
        console.error('加载聊天记录失败:', error);
      }
    };

    loadChat();
  }, [chatType, chatId]);

  if (!chatData) {
    return <div>加载中...</div>;
  }

  return (
    <div>
      <ChatHeader data={chatData} />
      <MessageList messages={chatData.messages} />
    </div>
  );
};
```

### 2. 消息渲染组件

```javascript
const MessageItem = ({ message, currentUserId }) => {
  const isSelf = message.senderId === currentUserId;

  switch (message.type) {
    case 'text':
      return (
        <div className={isSelf ? 'message-self' : 'message-other'}>
          <div className="sender">{message.senderName}</div>
          <div className="content">{message.content}</div>
          <div className="time">{message.time}</div>
        </div>
      );

    case 'image':
      return (
        <div className={isSelf ? 'message-self' : 'message-other'}>
          <div className="sender">{message.senderName}</div>
          <img src={message.content} alt={message.caption} />
          {message.caption && <div className="caption">{message.caption}</div>}
          <div className="time">{message.time}</div>
        </div>
      );

    case 'file':
      return (
        <div className={isSelf ? 'message-self' : 'message-other'}>
          <div className="sender">{message.senderName}</div>
          <div className="file-message">
            <span className="file-icon">📄</span>
            <div>
              <div className="file-name">{message.fileName}</div>
              <div className="file-size">{message.fileSize}</div>
            </div>
          </div>
          <div className="time">{message.time}</div>
        </div>
      );

    case 'system':
      return (
        <div className="message-system">
          <span>{message.content}</span>
          <span className="time">{message.time}</span>
        </div>
      );

    default:
      return null;
  }
};
```

### 3. 动态加载所有聊天记录

```javascript
// 预加载所有聊天记录（用于聊天列表）
const allChats = import.meta.glob('../data/qq/**/*.json');

const loadAllChats = async () => {
  const chats = [];

  for (const path in allChats) {
    const module = await allChats[path]();
    const chatData = module.default;

    // 判断是群聊还是私聊
    const isGroup = path.includes('/groups/');

    chats.push({
      id: isGroup ? chatData.groupId : chatData.chatId,
      name: isGroup ? chatData.groupName : chatData.participants.map(p => p.username).join('、'),
      type: isGroup ? 'group' : 'private',
      avatar: isGroup ? chatData.groupAvatar : chatData.participants[0].avatar,
      lastMessage: chatData.messages[chatData.messages.length - 1]
    });
  }

  return chats;
};
```

---

## 七、数据验证清单

在创建聊天记录数据时，请确保：

- [ ] 所有必填字段都已填写
- [ ] 时间格式正确（`YYYY-MM-DD HH:mm:ss`）
- [ ] 消息ID按时间顺序递增
- [ ] 发送者ID和昵称与成员列表一致
- [ ] 图片/文件路径正确且文件存在
- [ ] 群聊的memberCount与members数组长度一致
- [ ] 私聊的participants数组固定为2人
- [ ] 系统消息的senderId为"system"
- [ ] 所有JSON文件格式正确，无语法错误

---

## 八、命名规范

### 群聊文件命名

- 使用拼音或英文小写，单词间用下划线连接
- 例如：`shanbangongshi.json`（山办）、`class_2016_3.json`（2016级3班）

### 私聊文件命名

- 使用两个用户ID，按字母顺序排列，用下划线连接
- 例如：`chenmuo_linxiaoyu.json`（陈默与林晓宇）
- 注意：`linxiaoyu_chenmuo.json` 和 `chenmuo_linxiaoyu.json` 应该是同一个文件

---

## 九、关键对话设计参考

根据游戏设计，聊天记录应该包含以下关键信息：

### 群聊"山办"关键对话

1. **日常工作交流**（2015年9月-10月）
   - 工作安排、会议通知
   - 营造正常工作氛围

2. **林晓宇的疑问**（2015年11月）
   - 林晓宇在群里提出一些问题
   - 其他人的回避或敷衍

3. **气氛变化**（2015年12月-2016年1月）
   - 群聊逐渐冷清
   - 林晓宇的消息减少

### 林晓宇与陈默私聊关键对话

1. **建立友谊**（2015年9月-10月）
   - 技术交流、摄影讨论
   - 建立信任关系

2. **林晓宇的求助**（2015年11月）
   - 林晓宇向陈默倾诉发现的问题
   - 陈默的矛盾和挣扎

3. **最后的对话**（2016年2月）
   - 林晓宇的最后消息
   - 陈默的回复（或未回复）

---

**文档完成日期**: 2026-01-21

**下一步**: 设计EXIF元数据格式（任务 DA-03）
