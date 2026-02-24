# AGENTS.md

本文件为参与《山月无声》项目的 AI 编程助手提供指导。

## 项目概述

这是一款使用 React 18 + Vite 5 构建的互动解谜游戏。玩家通过模拟的 Windows XP 桌面环境调查 2015-2016 年的悲剧真相。

**当前阶段**：内容创作（故事框架已完成，正在填充游戏素材）

## 快速开始

```bash
npm install
npm run dev          # 启动开发服务器 http://localhost:5173
npm run build        # 生产构建
npm test             # 运行测试
```

## 创作内容前必读

**创作任何游戏内容前必须阅读以下文件：**

1. **`docs/人物.md`** - 人物性格、语气、QQ 号、关系
   - 阅读此文件以了解每个角色的说话方式和行为特征
   - 包含人物背景和心理画像

2. **`docs/data-specs/data-specification.md`** - 完整的 JSON 格式规范
   - 所有数据结构的权威参考
   - 包括 QQ 空间、贴吧、邮件、聊天记录格式
   - 包含验证规则和必填字段

3. **`docs/大纲.md`** - 故事大纲和四阶段剧透管理
   - 理解每个阶段应该揭示/隐藏什么信息的关键文档
   - 包含完整的叙事结构
   - 解释"红鲱鱼"系统

4. **`docs/设计.md`** - 内容设计规范和玩家视角控制
   - 创作符合各调查阶段的内容指南
   - 素材设计原则

5. **`docs/时间线.md`** - 详细事件时间线（2014-2026）
   - 用于确保时间戳准确性
   - 包含所有关键事件及其日期

6. **`docs/解密.md`** - 谜题和解密机制设计
   - 密码系统（摄影参数、生日）
   - 跨平台证据综合

## 项目结构

```
src/data/            # 游戏数据（JSON）- 主要工作区域
  ├── qzone/         # QQ 空间内容（按用户 ID 组织）
  ├── tieba/         # 贴吧帖子（按贴吧名称组织）
  ├── email/         # 邮件消息（收件箱/已发送/垃圾邮件）
  └── qq/            # QQ 聊天记录

docs/                # 设计文档 - 首先阅读这些
  ├── 大纲.md         # 故事大纲 ⭐⭐⭐
  ├── 人物.md         # 人物设定 ⭐⭐⭐
  ├── 设计.md         # 设计规范 ⭐⭐
  ├── 时间线.md       # 时间线 ⭐⭐
  ├── 解密.md         # 谜题设计 ⭐
  └── data-specs/    # JSON 格式规范 ⭐⭐⭐
      ├── data-specification.md
      └── exif-metadata-structure.md

assets/              # 内容草稿（markdown，不在游戏中使用）
  └── 清单.md         # 内容清单

CLAUDE.md            # 详细架构文档
```

## 内容创作工作流程

### 步骤 1：阅读核心设计文档（必须）

**创作任何内容前必须阅读以下 3 个文件：**

```bash
1. docs/大纲.md    # 故事结构、四阶段剧透管理、叙事框架
2. docs/设计.md    # 设计原则、玩家视角控制、内容指南
3. docs/解密.md    # 谜题机制、密码系统、证据综合
```

这些文档包含了指导所有内容创作的基本设计原则。

### 步骤 2：根据需要阅读特定任务文档

根据你要创作的内容，阅读：

```bash
# 创作角色内容（QQ 空间、聊天记录）？
→ docs/人物.md              # 角色语气、性格、关系

# 需要具体日期/时间戳？
→ docs/时间线.md            # 详细事件时间线

# 创作 JSON 数据文件？
→ docs/data-specs/data-specification.md  # 完整格式规范
```

### 步骤 3：创作内容

- 遵守 `docs/大纲.md` 中的剧透边界
- 遵循 `docs/设计.md` 中的设计原则
- 考虑 `docs/解密.md` 中的谜题整合
- 匹配 `docs/人物.md` 中的角色语气（如适用）
- 使用 `docs/时间线.md` 中的准确时间戳（如适用）
- 遵循 `docs/data-specs/data-specification.md` 中的 JSON 格式（如适用）

### 步骤 4：放置文件

```bash
# QQ 空间内容
src/data/qzone/{user_id}/
  ├── index.json       # 用户资料
  ├── shuoshuo.json    # 说说数组
  ├── blog.json        # 日志数组
  └── pictures/        # 相册

# 贴吧内容
src/data/tieba/{forum_name}/
  ├── index.json       # 贴吧信息
  └── tiezi/{id}.json  # 单个帖子

# 邮件
src/data/email/{inbox|sent|spam}/{id}.json

# 聊天记录
src/data/qq/{conversation_id}.json
```

### 步骤 5：验证

- ✅ JSON 语法有效
- ✅ 时间戳在有效范围内（参见 `docs/时间线.md`）
- ✅ 角色语气符合 `docs/人物.md`
- ✅ 无过早剧透（检查 `docs/大纲.md` 阶段边界）
- ✅ 符合时代语言（2015-2016，参见 `docs/设计.md`）

## 快速参考

### 角色 QQ 号

完整设定参见 `docs/人物.md`。

- 林晓宇：809261392
- 陈默：待定
- 夏灯：待定

### 时间线边界

详细事件参见 `docs/时间线.md`。

```
2014.09 - 高中开学
2015.09 - 高二开学
2016.04 - 林晓宇去世
2016.06 - 高考
2026.XX - 调查时间线
```

### 剧透管理

完整阶段划分参见 `docs/大纲.md`。

| 阶段 | 时长 | 阅读大纲.md中的章节 |
|-------|----------|------------------------|
| 阶段一 | 60分钟 | 阶段一：个体悬疑 |
| 阶段二 | 70分钟 | 阶段二：证据指向 |
| 阶段三 | 50分钟 | 阶段三：真相反转 |
| 阶段四 | 40分钟 | 阶段四：系统揭露 |

**关键**：始终检查你的内容属于哪个阶段，以及应该隐藏哪些信息。

## 数据格式参考

**不要在此处重复格式规范。** 始终参考：

- **`docs/data-specs/data-specification.md`** - 完整的 JSON 模式
- **`docs/data-specs/exif-metadata-structure.md`** - 照片元数据格式

常用格式快速链接：

- QQ 空间说说：参见 `data-specification.md` § QQ空间说说
- QQ 空间日志：参见 `data-specification.md` § QQ空间日志
- 贴吧帖子：参见 `data-specification.md` § 贴吧帖子
- 邮件：参见 `data-specification.md` § 邮件
- 聊天记录：参见 `data-specification.md` § QQ聊天记录

## 代码风格

- **React**：函数式组件 + Hooks
- **样式**：styled-components + xp.css（Windows XP 主题）
- **状态管理**：React Context（不使用 Redux）
- **文件命名**：组件使用 PascalCase，工具函数使用 camelCase

## 测试

```bash
npm test              # 单元测试（Vitest）
npm run test:e2e      # E2E 测试（Playwright）
```

## Git 规范

```bash
# 提交信息格式
feat(qzone): add Lin Xiaoyu posts for Dec 2015
fix(tieba): correct timestamp in thread 12345
content(email): add investigation emails for stage 2
docs: update character profile for Chen Mo
```

## 常见任务

**所有任务的前提**：首先阅读 3 个核心文档（`docs/大纲.md`、`docs/设计.md`、`docs/解密.md`）。

### 添加 QQ 空间内容

1. 阅读 `docs/人物.md` 了解角色语气
2. 在 `docs/时间线.md` 中验证时间戳
3. 遵循 `docs/data-specs/data-specification.md` 中的格式
4. 编辑 `src/data/qzone/{user_id}/shuoshuo.json` 或 `blog.json`

### 添加贴吧帖子

1. 遵循 `docs/data-specs/data-specification.md` 中的格式
2. 创建 `src/data/tieba/{forum}/tiezi/{id}.json`
3. 更新 `src/data/tieba/{forum}/index.json` 中的帖子列表

### 添加邮件

1. 在 `docs/人物.md` 中验证发件人/收件人
2. 在 `docs/时间线.md` 中检查时间线
3. 遵循 `docs/data-specs/data-specification.md` 中的格式
4. 在 `src/data/email/{folder}/` 中创建 JSON

## 关键规则

### 沟通

- ✅ **始终**使用中文回复
- ✅ **始终**使用中文进行解释、总结和文档编写
- ✅ 代码注释可以使用英文，但与用户的所有沟通必须使用中文

### 内容创作

- ❌ **绝不**在未阅读 3 个核心文档（`docs/大纲.md`、`docs/设计.md`、`docs/解密.md`）的情况下创作内容
- ❌ **绝不**提前透露信息（阶段边界在 `docs/大纲.md` 中）
- ❌ **绝不**违反设计原则（所有原则在 `docs/设计.md` 中）
- ❌ **绝不**使用有效范围外的时间戳（参见 `docs/时间线.md`）
- ❌ **绝不**猜测 JSON 格式（始终检查 `docs/data-specs/`）
- ❌ **绝不**使用 2016 年后的语言/文化（时代要求在 `docs/设计.md` 中）

### 长文本文件写入

写入大型文件时（超过200行），**绝不**尝试一次性写入完整内容，否则会触发32000 token输出上限导致失败。

**正确做法：分段写入 + bash合并**

```bash
# 步骤1：将内容拆分为多个小文件（每个不超过150行）
Write → 提议:xxx_part1.md   # 第一部分
Write → 提议:xxx_part2.md   # 第二部分
Write → 提议:xxx_part3.md   # 第三部分

# 步骤2：用bash合并为最终文件
cat 提议:xxx_part1.md 提议:xxx_part2.md 提议:xxx_part3.md > /tmp/combined.md
\cp /tmp/combined.md 提议:xxx.md

# 步骤3：删除中间文件
rm -f 提议:xxx_part1.md 提议:xxx_part2.md 提议:xxx_part3.md
```

**关键要点：**
- 每次Write/Edit调用的内容不超过150行
- 合并时用 `\cp`（加反斜杠）避免交互式确认提示
- 删除中间文件时用 `rm -f` 避免交互式确认提示
- 宁可多分几个part，也不要超限

### 代码修改

- ❌ **绝不**在不理解架构的情况下修改 `src/context/*`
- ❌ **绝不**在未阅读 `CLAUDE.md` 的情况下更改窗口管理系统
- ❌ **绝不**破坏 `WindowFactory.jsx` 中的组件恢复逻辑

## 架构说明

详细技术架构参见 `CLAUDE.md`。

关键系统：

- **窗口持久化**：localStorage + WindowFactory
- **动态加载**：使用 `import.meta.glob` 加载内容文件
- **Context 层级**：UserSession → FileSystem → WindowManager → Modal

## 遇到疑问时

1. **角色语气？** → 阅读 `docs/人物.md`
2. **应该透露什么？** → 阅读 `docs/大纲.md`
3. **这件事什么时候发生？** → 阅读 `docs/时间线.md`
4. **JSON 格式？** → 阅读 `docs/data-specs/data-specification.md`
5. **设计原则？** → 阅读 `docs/设计.md`
6. **技术架构？** → 阅读 `CLAUDE.md`

## 内容检查清单

提交任何内容前，请验证：

**核心文档（必须）**：

- [ ] 已阅读 `docs/大纲.md` - 理解故事结构和阶段边界
- [ ] 已阅读 `docs/设计.md` - 遵循设计原则和时代要求
- [ ] 已阅读 `docs/解密.md` - 考虑谜题整合

**特定任务文档（按需）**：

- [ ] 已阅读 `docs/人物.md` - 匹配角色语气（如果是角色内容）
- [ ] 已阅读 `docs/时间线.md` - 验证时间戳准确性（如果是有日期的内容）
- [ ] 已阅读 `docs/data-specs/data-specification.md` - 遵循 JSON 格式（如果创建数据文件）

**验证**：

- [ ] JSON 语法有效
- [ ] 无过早剧透（遵守阶段边界）
- [ ] 角色语气一致
- [ ] 无时代错误（仅限 2015-2016 年）
- [ ] 遵循设计原则
