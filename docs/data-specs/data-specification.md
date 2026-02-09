# 游戏数据规范文档

*版本：1.0*
*日期：2026-01-21*
*数据架构师：Claude*

---

## 一、文档概述

本文档是《山月无声》游戏的完整数据规范，涵盖所有游戏内容的数据结构、命名规范、文件组织和最佳实践。

### 相关文档

- [QQ空间数据结构设计](./qzone-structure.md)
- [聊天记录数据结构设计](./chat-history-structure.md)
- [EXIF元数据格式设计](./exif-metadata-structure.md)
- [邮件数据结构设计](./email-structure.md)
- [文档数据结构设计](./document-structure.md)
- [贴吧数据结构设计](./tieba-structure.md)
- [调查笔记数据结构设计](./investigation-notes-structure.md)

---

## 二、数据组织架构

### 目录结构

```
src/data/
├── qzone/                      # QQ空间数据
│   ├── linxiaoyu/             # 林晓宇的空间
│   │   ├── index.json         # 用户信息
│   │   ├── shuoshuo.json      # 说说
│   │   ├── blog.json          # 日志
│   │   └── albums.json        # 相册
│   ├── chenmuo/               # 陈默的空间
│   └── xiadeng/               # 夏灯的空间
│
├── qq/                        # QQ聊天记录
│   ├── groups/                # 群聊
│   │   └── shanding_shiwusuo.json
│   └── private/               # 私聊
│       └── linxiaoyu_chenmuo.json
│
├── email/                     # 邮件
│   ├── inbox/                 # 收件箱
│   ├── sent/                  # 已发送
│   └── spam/                  # 垃圾邮件
│
├── tieba/                     # 贴吧
│   └── yunshan/               # 云山县贴吧
│       ├── index.json
│       └── tiezi/
│
└── filesystem.json            # 文件系统结构
```

### 媒体资源目录

```
public/
├── avatars/                   # 用户头像
├── backgrounds/               # 背景图片
├── photos/                    # 照片
│   ├── daily/                 # 日常照片
│   ├── encrypted/             # 加密相册照片
│   └── evidence/              # 证据照片
├── chat_images/               # 聊天图片
└── chat_files/                # 聊天文件
```

---

## 三、命名规范

### 文件命名

#### JSON数据文件

- 使用小写字母和下划线
- 英文或拼音，避免中文
- 描述性命名

**示例**：
- ✅ `linxiaoyu_chenmuo.json`
- ✅ `shanding_shiwusuo.json`
- ❌ `林晓宇_陈默.json`
- ❌ `chat1.json`

#### 图片文件

- 使用小写字母和下划线
- 包含类型前缀（可选）
- 使用序号编号

**示例**：
- ✅ `evidence_001.jpg`
- ✅ `daily_photo_20151120.jpg`
- ✅ `avatar_linxiaoyu.jpg`
- ❌ `照片1.jpg`
- ❌ `IMG_1234.jpg`

### 字段命名

#### JSON字段

- 使用驼峰命名法（camelCase）
- 英文命名，避免拼音
- 布尔值使用 `is/has` 前缀

**示例**：
```json
{
  "userId": "linxiaoyu",           // ✅
  "userName": "林晓宇",             // ✅
  "isLocked": true,                // ✅
  "hasComments": false,            // ✅
  "user_id": "linxiaoyu",          // ❌ 应使用驼峰
  "yonghuming": "林晓宇",          // ❌ 应使用英文
  "locked": true                   // ⚠️ 可接受，但 isLocked 更清晰
}
```

---

## 四、时间格式规范

### 标准格式

| 用途 | 格式 | 示例 | 说明 |
|------|------|------|------|
| QQ空间说说/日志 | `YYYY-MM-DD HH:mm:ss` | `2015-11-20 22:30:00` | 标准日期时间 |
| 聊天记录 | `YYYY-MM-DD HH:mm:ss` | `2015-11-20 22:30:00` | 标准日期时间 |
| EXIF拍摄时间 | `YYYY:MM:DD HH:mm:ss` | `2015:11:23 14:30:15` | EXIF标准格式 |
| 文件系统时间 | `YYYY-MM-DD HH:mm:ss` | `2015-11-20 22:30:00` | 标准日期时间 |

### 时间转换工具

```javascript
// utils/timeFormat.js

/**
 * 将EXIF时间格式转换为标准格式
 * @param {string} exifTime - EXIF时间 (YYYY:MM:DD HH:mm:ss)
 * @returns {string} 标准时间 (YYYY-MM-DD HH:mm:ss)
 */
export const exifToStandard = (exifTime) => {
  return exifTime.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3');
};

/**
 * 格式化显示时间
 * @param {string} timeStr - 任意格式的时间字符串
 * @returns {string} 格式化后的显示文本
 */
export const formatDisplayTime = (timeStr) => {
  const normalized = timeStr.replace(/:/g, '-').replace(/-(\d{2}:\d{2}:\d{2})/, ' $1');
  const date = new Date(normalized);

  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};
```

---

## 五、路径规范

### 相对路径约定

所有路径都是相对于 `public/` 目录的，以 `/` 开头。

**示例**：
```json
{
  "avatar": "/avatars/linxiaoyu.jpg",           // ✅
  "photo": "/photos/daily/photo_001.jpg",       // ✅
  "exifFile": "/photos/daily/photo_001_exif.json", // ✅

  "avatar": "avatars/linxiaoyu.jpg",            // ❌ 缺少开头的 /
  "photo": "../public/photos/daily/photo_001.jpg", // ❌ 不要使用相对路径
  "exifFile": "C:/photos/photo_001_exif.json"   // ❌ 不要使用绝对路径
}
```

### 路径类型

| 资源类型 | 路径格式 | 示例 |
|---------|---------|------|
| 用户头像 | `/avatars/{userId}.jpg` | `/avatars/linxiaoyu.jpg` |
| 群组头像 | `/avatars/group_{groupId}.jpg` | `/avatars/group_shanbangongshi.jpg` |
| 背景图片 | `/backgrounds/{name}.jpg` | `/backgrounds/camera.jpg` |
| 日常照片 | `/photos/daily/{filename}.jpg` | `/photos/daily/photo_001.jpg` |
| 加密照片 | `/photos/encrypted/{filename}.jpg` | `/photos/encrypted/evidence_001.jpg` |
| EXIF数据 | `/photos/{album}/{filename}_exif.json` | `/photos/encrypted/evidence_001_exif.json` |
| 聊天图片 | `/chat_images/{filename}.jpg` | `/chat_images/group_photo.jpg` |
| 聊天文件 | `/chat_files/{filename}.{ext}` | `/chat_files/meeting_notes.txt` |

---

## 六、加密内容规范

### 加密字段要求

所有加密内容（文件夹、相册、日志）必须包含以下字段：

```json
{
  "locked": true,                    // 必填：是否加密
  "password": "28125400",            // 必填：密码
  "hint": "提示：曝光三角（光圈-快门-ISO）" // 必填：密码提示
}
```

### 密码设计原则

#### 1. 曝光三角密码

**规则**：光圈 + 快门 + ISO，去掉所有符号

**示例**：
- 光圈 `f/2.8` + 快门 `1/125` + ISO `400` → `28125400`
- 光圈 `f/5.6` + 快门 `1/125` + ISO `800` → `56125800`

**提示文本**：
- "提示：曝光三角（光圈-快门-ISO）"
- "提示：这张照片的拍摄参数"

#### 2. 文字密码

**规则**：英文小写，无空格

**示例**：
- "相机是第三只眼" → `camera3rdeye`
- "真相永远只有一个" → `truth1`

**提示文本**：
- "提示：相机的第三只眼（英文小写，无空格）"
- "提示：柯南的名言（英文）"

#### 3. 现代诗藏头密码

**诗歌**：《第三只眼》（林晓宇加密日志中）

**规则**：每行第3个字连起来读

**隐藏信息**：我会被王虎杀死他在操作高考移民

**解密流程**：
1. 阅读诗歌《第三只眼》
2. 回忆群聊中林晓宇的提示："我试了一下，每行第三个字连起来读"
3. 提取每行第3字组合成完整信息

**提示文本**：
- 群聊中林晓宇提到："每行第三个字连起来读"
- 日志中提示："看看诗歌里藏了什么"

#### 4. 隐写文字密码

**规则**：与背景同色的文字，需要选中才能看到

**实现方式**：
- QQ空间预览区域使用白色文字（与白色背景同色）
- 玩家需要选中文字（Ctrl+A或鼠标拖选）才能看到隐藏内容
- 这是2000年代QQ空间常见的"私密分享"方式

**HTML实现示例**：
```html
<div style="color: #000;">前两只眼看世界，</div>
<div style="color: #fff;">Camera is the 3rd eye</div>
<div style="color: #000;">第三只看真相</div>
```

**JSON数据结构**：
```json
{
  "preview": {
    "visible": "前两只眼看世界，第三只看真相",
    "hidden": "Camera is the 3rd eye"  // 白色文字，默认看不见
  }
}
```

**提示文本**：
- "密码在我的QQ个人说明里，需要'用心看'"
- "选中文字试试看"

---

## 七、数据完整性规范

### 必填字段检查

#### QQ空间用户信息

```json
{
  "userId": "必填",
  "username": "必填",
  "avatar": "必填",
  "title": "必填"
}
```

#### QQ空间说说

```json
{
  "id": "必填",
  "content": "必填",
  "time": "必填"
}
```

#### 聊天消息

```json
{
  "id": "必填",
  "senderId": "必填",
  "senderName": "必填",
  "type": "必填",
  "content": "必填",
  "time": "必填"
}
```

#### EXIF数据（简化版）

```json
{
  "fileName": "必填",
  "camera": "必填",
  "aperture": "必填",
  "shutterSpeed": "必填",
  "iso": "必填",
  "dateTime": "必填"
}
```

### 引用完整性

#### 用户ID一致性

确保同一用户在所有地方使用相同的ID和昵称：

```json
// ✅ 正确：ID和昵称一致
{
  "userId": "linxiaoyu",
  "username": "林晓宇"
}

// 在评论中
{
  "userId": "linxiaoyu",
  "user": "林晓宇"
}

// ❌ 错误：ID不一致
{
  "userId": "linxiaoyu",
  "username": "林晓宇"
}

// 在评论中
{
  "userId": "lin_xiaoyu",  // ❌ ID不一致
  "user": "林晓宇"
}
```

#### 文件路径有效性

确保所有引用的文件路径都存在：

```json
{
  "avatar": "/avatars/linxiaoyu.jpg",  // 必须存在 public/avatars/linxiaoyu.jpg
  "exifFile": "/photos/daily/photo_001_exif.json"  // 必须存在对应的JSON文件
}
```

#### 数量一致性

确保计数字段与实际数组长度一致：

```json
{
  "memberCount": 8,
  "members": [/* 必须有8个元素 */]
}

{
  "photoCount": 12,
  "photos": [/* 必须有12个元素 */]
}
```

---

## 八、数据验证清单

### 创建新数据前的检查

- [ ] 所有必填字段都已填写
- [ ] 时间格式正确（根据数据类型选择正确格式）
- [ ] 用户ID和昵称在所有地方保持一致
- [ ] 文件路径使用正确的格式（以 `/` 开头）
- [ ] 引用的文件都存在
- [ ] 加密内容包含 `locked`、`password`、`hint` 三个字段
- [ ] 计数字段与数组长度一致
- [ ] GPS坐标是字符串类型，不是数字
- [ ] JSON格式正确，无语法错误
- [ ] 文件名符合命名规范

### JSON验证工具

```javascript
// utils/dataValidator.js

/**
 * 验证QQ空间用户数据
 */
export const validateQZoneUser = (data) => {
  const required = ['userId', 'username', 'avatar', 'title'];
  const missing = required.filter(field => !data[field]);

  if (missing.length > 0) {
    throw new Error(`缺少必填字段: ${missing.join(', ')}`);
  }

  return true;
};

/**
 * 验证加密内容
 */
export const validateEncrypted = (data) => {
  if (data.locked) {
    if (!data.password) {
      throw new Error('加密内容必须包含password字段');
    }
    if (!data.hint) {
      throw new Error('加密内容必须包含hint字段');
    }
  }

  return true;
};

/**
 * 验证时间格式
 */
export const validateTimeFormat = (timeStr, type = 'standard') => {
  const patterns = {
    standard: /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/,
    exif: /^\d{4}:\d{2}:\d{2} \d{2}:\d{2}:\d{2}$/
  };

  if (!patterns[type].test(timeStr)) {
    throw new Error(`时间格式错误: ${timeStr}，应为 ${type} 格式`);
  }

  return true;
};
```

---

## 九、最佳实践

### 1. 数据分离

- 将大型数据拆分为多个文件
- 每个用户的QQ空间数据独立存储
- 每个群聊/私聊独立存储

### 2. 渐进式加载

- 使用 `import.meta.glob` 实现按需加载
- 不要在启动时加载所有数据
- 只在需要时加载特定数据

### 3. 数据版本控制

- 在文件顶部注释中标注版本号
- 记录重要修改的日期和原因
- 使用Git跟踪所有数据变更

```json
{
  "_meta": {
    "version": "1.0",
    "lastModified": "2026-01-21",
    "author": "数据架构师"
  },
  "userId": "linxiaoyu",
  "username": "林晓宇"
}
```

### 4. 注释和文档

- 在复杂数据结构中添加注释（使用 `_comment` 字段）
- 为每个数据文件编写简短说明
- 维护数据变更日志

```json
{
  "_comment": "这是林晓宇的加密日志，包含关键线索",
  "id": 2,
  "title": "我看到了什么",
  "locked": true,
  "password": "camera3rdeye"
}
```

### 5. 测试数据

- 创建测试用的小型数据集
- 验证所有数据加载逻辑
- 测试加密/解密功能

---

## 十、常见错误和解决方案

### 错误1：时间格式不一致

**问题**：
```json
{
  "time": "2015/11/20 22:30:00"  // ❌ 使用了斜杠
}
```

**解决**：
```json
{
  "time": "2015-11-20 22:30:00"  // ✅ 使用连字符
}
```

### 错误2：路径格式错误

**问题**：
```json
{
  "avatar": "avatars/linxiaoyu.jpg"  // ❌ 缺少开头的 /
}
```

**解决**：
```json
{
  "avatar": "/avatars/linxiaoyu.jpg"  // ✅ 以 / 开头
}
```

### 错误3：GPS坐标类型错误

**问题**：
```json
{
  "gps": {
    "latitude": 28.125400,  // ❌ 数字类型
    "longitude": 112.983600
  }
}
```

**解决**：
```json
{
  "gps": {
    "latitude": "28.125400",  // ✅ 字符串类型
    "longitude": "112.983600"
  }
}
```

### 错误4：加密内容缺少字段

**问题**：
```json
{
  "locked": true,
  "password": "28125400"
  // ❌ 缺少 hint 字段
}
```

**解决**：
```json
{
  "locked": true,
  "password": "28125400",
  "hint": "提示：曝光三角（光圈-快门-ISO）"  // ✅ 添加提示
}
```

### 错误5：用户ID不一致

**问题**：
```json
// 在用户信息中
{
  "userId": "linxiaoyu"
}

// 在评论中
{
  "userId": "lin_xiaoyu"  // ❌ ID不一致
}
```

**解决**：
```json
// 统一使用相同的ID
{
  "userId": "linxiaoyu"  // ✅ 保持一致
}
```

---

## 十一、数据创建工作流

### 步骤1：规划数据结构

1. 确定数据类型（QQ空间/聊天/EXIF等）
2. 查阅对应的数据结构文档
3. 确定必填字段和可选字段

### 步骤2：创建数据文件

1. 使用模板文件作为起点
2. 填写所有必填字段
3. 根据需要添加可选字段

### 步骤3：验证数据

1. 检查JSON语法是否正确
2. 运行数据验证工具
3. 确认所有引用的文件存在

### 步骤4：测试数据

1. 在开发环境中加载数据
2. 测试所有功能（加密、显示、交互等）
3. 修复发现的问题

### 步骤5：文档化

1. 在数据文件中添加注释
2. 更新数据清单
3. 记录特殊设计决策

---

## 十二、工具和资源

### 推荐工具

- **JSON编辑器**：VS Code + JSON插件
- **JSON验证**：[JSONLint](https://jsonlint.com/)
- **时间格式转换**：使用本文档提供的工具函数
- **批量重命名**：使用脚本批量处理文件名

### 参考资源

- [QQ空间数据结构设计](./qzone-structure.md)
- [聊天记录数据结构设计](./chat-history-structure.md)
- [EXIF元数据格式设计](./exif-metadata-structure.md)
- [邮件数据结构设计](./email-structure.md)
- [文档数据结构设计](./document-structure.md)
- [贴吧数据结构设计](./tieba-structure.md)
- [调查笔记数据结构设计](./investigation-notes-structure.md)
- [游戏设计文档](../设计.md)
- [故事大纲](../大纲.md)

---

## 十三、更新日志

### v1.0 (2026-01-21)

- 初始版本
- 定义了所有数据类型的规范
- 建立了命名规范和最佳实践
- 创建了验证清单和工具函数

### v1.1 (2026-01-31)

- 修正相机型号：Canon EOS 600D → Canon EOS 550D
- 修正快门速度：1/250 → 1/125（密码28125400）
- 修正群聊名称：山办 → 山顶事务所
- 新增邮件数据结构规范
- 新增文档数据结构规范（父亲文件夹、调查报道）
- 新增贴吧数据结构规范
- 新增调查笔记数据结构规范
- 完善密码设计规范（现代诗藏头）

---

**文档维护者**：数据架构师
**最后更新**：2026-01-21
**状态**：已完成

---

## 附录：快速参考

### 时间格式速查

| 类型 | 格式 | 示例 |
|------|------|------|
| 标准 | `YYYY-MM-DD HH:mm:ss` | `2015-11-20 22:30:00` |
| EXIF | `YYYY:MM:DD HH:mm:ss` | `2015:11:23 14:30:15` |

### 路径格式速查

| 资源 | 格式 |
|------|------|
| 头像 | `/avatars/{userId}.jpg` |
| 照片 | `/photos/{album}/{filename}.jpg` |
| EXIF | `/photos/{album}/{filename}_exif.json` |

### 加密内容速查

```json
{
  "locked": true,
  "password": "密码",
  "hint": "提示文本"
}
```

### 必填字段速查

| 数据类型 | 必填字段 |
|---------|---------|
| QQ空间用户 | userId, username, avatar, title |
| 说说 | id, content, time |
| 聊天消息 | id, senderId, senderName, type, content, time |
| EXIF | fileName, camera, aperture, shutterSpeed, iso, dateTime |
