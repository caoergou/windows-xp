# 《山月无声》技术实施与 LLM 协作路线图

## 1. 架构分析与重构策略

### 1.1 现状 vs 目标

| 维度 | 当前状态 (Current) | 目标状态 (Target) | 差距分析 |
| :--- | :--- | :--- | :--- |
| **数据位置** | `src/data/qzone/{id}/` (按 ID 硬编码) | `src/assets/{category}/{id}/` (语义化分类) | 需要迁移数据文件并建立新的目录结构 |
| **数据加载** | 组件内硬编码导入 (`import ... from ...`) | 动态导入 (`import.meta.glob`) | 现有组件无法适应新增内容，必须重构为数据驱动 |
| **加密机制** | `QZone.jsx` 内嵌临时逻辑 | 全局 `ModalContext` + 统一验证组件 | 缺乏系统级密码输入、验证和反馈机制 |
| **图片元数据** | 无 EXIF 支持 | JSON Sidecar (`.jpg` + `_exif.json`) | 浏览器端无法直接读取 EXIF，需通过伴随文件模拟 |
| **内容扩展** | 需修改代码才能添加新用户/帖子 | 仅需添加 JSON 文件 | 需解耦组件逻辑与数据内容 |

### 1.2 核心决策

1.  **重构优先 (Option A)**: 不修补旧代码，而是直接按照 `docs/设计.md` 描述的结构重构核心应用（QZone, QQHistory, Explorer）。
2.  **占位符策略 (Option 3)**: 对于图片素材，生成带文字说明的占位图（或纯色块），配套真实的 `_exif.json` 文件，确保解密逻辑可验证。
3.  **Prompt 驱动开发**: 将每个任务拆解为原子化的 Prompt，直接指导 LLM 进行代码生成。

---

## 2. 详细执行计划与 Prompt 库

以下任务按依赖关系排序。您可以按顺序将 "LLM Prompt" 发送给 AI 助手来逐步完成项目。

### 📅 第一阶段：基础设施与安全 (Infrastructure & Security)
*目标：建立通用的交互机制，为解密玩法打底。*

#### 任务 1.1: 全局密码输入组件
*   **说明**: 替换各处散落的 `prompt()` 或临时 Input，统一使用 XP 风格弹窗。
*   **文件**: `src/components/XPPasswordDialog.jsx`, `src/context/ModalContext.jsx`
*   **LLM Prompt**:
    ```markdown
    请创建一个 Windows XP 风格的密码输入组件 `src/components/XPPasswordDialog.jsx`。
    需求：
    1. UI 需模仿 XP 的系统密码框（包含钥匙图标、确定/取消按钮、错误时的震动动画）。
    2. 修改 `src/context/ModalContext.jsx`，新增 `showPasswordPrompt({ title, hint, onVerify })` 方法。
    3. `onVerify` 是一个异步函数，返回 boolean。如果返回 false，对话框应显示错误提示而不关闭。
    4. 请提供组件代码和 Context 的修改代码。
    ```

#### 任务 1.2: 模拟 EXIF 数据读取器
*   **说明**: 让图片查看器能“看到”只有解密者才能看到的信息。
*   **文件**: `src/apps/PhotoViewer.jsx`
*   **LLM Prompt**:
    ```markdown
    我们需要在 `src/apps/PhotoViewer.jsx` 中模拟 EXIF 查看功能。
    需求：
    1. 在工具栏添加一个“属性”或“信息”图标按钮。
    2. 点击时，根据当前图片的路径（例如 `path/to/img.jpg`），尝试请求伴随的 JSON 文件（例如 `path/to/img_exif.json`）。
    3. 你需要使用 `import.meta.glob` 预先加载所有 `_exif.json` 文件以供查询。
    4. 如果找到 EXIF 数据，弹出一个 XP 风格的“属性”窗口，显示：相机型号、拍摄时间、光圈、快门、ISO。
    5. 如果没有数据，显示“无附加信息”。
    ```

#### 任务 1.3: 文件系统加密集成
*   **说明**: 只有通过验证才能进入特定文件夹。
*   **文件**: `src/apps/Explorer.jsx`
*   **LLM Prompt**:
    ```markdown
    请重构 `src/apps/Explorer.jsx` 的 `handleNavigate` 逻辑以支持文件夹加密。
    需求：
    1. 当用户试图打开一个节点时，检查 `node.locked === true`。
    2. 如果锁定，调用 `useModal().showPasswordPrompt`。
    3. 验证逻辑：对比用户输入与 `node.password`。
    4. 只有验证通过后，才更新路径（`setHistory`）进入该文件夹。
    5. 确保这一逻辑对“我的电脑”中的驱动器和普通文件夹都有效。
    ```

---

### 📅 第二阶段：数据层重构 (Data Architecture Refactor)
*目标：解耦代码与数据，支持文档中描述的目录结构。*

#### 任务 2.1: 建立新的资产目录结构
*   **说明**: 物理创建文件夹。
*   **文件**: `src/assets/*`
*   **LLM Prompt**:
    ```markdown
    请执行 Shell 命令或编写脚本，创建符合 `docs/CLAUDE.md` 规范的目录结构：
    - `src/assets/qq-space/` (按 userId 分子目录)
    - `src/assets/chat-logs/`
    - `src/assets/emails/`
    - `src/assets/documents/`
    - `src/assets/photos/`
    - `src/assets/web-archives/`
    请同时创建一个 `src/utils/assetLoader.js` 工具函数，封装 `import.meta.glob` 逻辑，方便应用层按路径模式加载 JSON。
    ```

#### 任务 2.2: QZone 数据加载重构
*   **说明**: 让 QZone 应用支持动态加载任何用户的数据。
*   **文件**: `src/apps/QZone.jsx`
*   **LLM Prompt**:
    ```markdown
    请重构 `src/apps/QZone.jsx`。
    需求：
    1. 移除对 '1001'/'1002' ID 的硬编码判断。
    2. 使用 `import.meta.glob` 动态扫描 `src/assets/qq-space/{userId}/*.json`。
    3. 组件应根据传入的 `userId` prop，自动加载对应的 `index.json` (个人信息), `shuoshuo.json` (说说), `blog.json` (日志)。
    4. 实现对 `encrypted` 属性的支持：点击加密相册或日志时，复用 `showPasswordPrompt`。
    5. 图片加载失败时，自动降级显示 Placeholder。
    ```

#### 任务 2.3: QQHistory 数据加载重构
*   **说明**: 支持加载不同的聊天记录文件。
*   **文件**: `src/apps/QQHistory.jsx`
*   **LLM Prompt**:
    ```markdown
    请重构 `src/apps/QQHistory.jsx`。
    需求：
    1. 组件不再默认读取 `src/data/qq/history.json`。
    2. 新增 prop `dataSource` (字符串路径)。
    3. 根据 `dataSource` 动态加载 `src/assets/chat-logs/` 下对应的 JSON 文件。
    4. 适配 `docs/设计.md` 中定义的群聊数据结构（包含 `members` 列表和 `messages` 数组）。
    ```

---

### 📅 第三阶段：内容注入 (Content Injection)
*目标：填入“灵魂”，即具体的剧情数据。*

#### 任务 3.1: 生成林晓宇的 QQ 空间数据
*   **说明**: 这是游戏的核心叙事载体。
*   **文件**: `src/assets/qq-space/lin-xiaoyu/*.json`
*   **LLM Prompt**:
    ```markdown
    请根据 `docs/人物.md` 和 `docs/设计.md`，为主角“林晓宇”生成 QQ 空间数据 JSON。
    1. **说说 (shuoshuo.json)**: 生成约 20 条数据。时间跨度 2014.09 - 2015.12。前期阳光（摄影、读书），后期压抑（引用晦涩诗句，暗示“第三只眼”）。
    2. **日志 (blog.json)**: 包含一篇加密日志《第三只眼》，内容包含藏头诗线索（请设计一首简单的藏头诗，暗示“陈默被迫”）。密码设为 `camera3rdeye`。
    3. **相册**: 配置一个加密相册 `evidence`，密码 `28125400`。
    请直接输出 JSON 文件内容。
    ```

#### 任务 3.2: 生成群聊记录
*   **说明**: “山顶事务所”的群聊。
*   **文件**: `src/assets/chat-logs/mountain-office.json`
*   **LLM Prompt**:
    ```markdown
    请生成“山顶事务所”的群聊记录 `mountain-office.json`。
    参与者：林晓宇、陈默、夏灯。
    内容跨度：
    - 2014年：成立事务所，轻松愉快。
    - 2015年中：林晓宇开始提到“奇怪的发现”。
    - 2015年末：陈默警告林晓宇“不要查了”，“清理EXIF”。
    - 2016.02：最后的争吵。
    请包含至少 50 条对话，务必埋入“光之公式”（ISO 400, f/2.8）的线索讨论。
    ```

#### 任务 3.3: 构造证据图片与 EXIF
*   **说明**: 核心解密道具。
*   **文件**: `src/assets/photos/evidence/*`
*   **LLM Prompt**:
    ```markdown
    我们需要创建 4 组证据文件。
    1. 请生成 4 个占位图片文件（可以使用纯色块 SVG 或 1x1 jpg）。
    2. 为每张图片创建对应的 `_exif.json` 文件。
    3. **关键数据**：
       - `img_001_exif.json`: 必须包含 Aperture: f/2.8, Shutter: 1/125, ISO: 400（这是解开相册的密码线索）。
       - 拍摄时间需对应剧情时间线（2015年冬）。
    ```

---

### 📅 第四阶段：整合与打磨 (Integration & Polish)

#### 任务 4.1: 桌面初始状态配置
*   **说明**: 游戏开始时的默认状态。
*   **文件**: `src/data/filesystem.json` (或新版配置)
*   **LLM Prompt**:
    ```markdown
    请更新文件系统配置。
    1. 在桌面放置一个 `Sticky Note` (文本文件)，内容：“密码还是你的生日 (19990315)”。
    2. 在 D 盘创建文件夹 `Dad_Files`，设为 `locked: true`，密码 `19990315`。
    3. 确保桌面上只有：我的电脑、回收站、IE浏览器、QQ。
    ```

#### 任务 4.2: 陈默的邮件系统
*   **说明**: 推进剧情的触发器。
*   **文件**: `src/apps/Email.jsx`
*   **LLM Prompt**:
    ```markdown
    更新邮件应用以加载 `src/assets/emails/chenmo.json`。
    实现简单的触发逻辑：当玩家打开并通过验证某个特定文件（如解开加密相册）后，模拟收到新邮件（在 UI 上显示红点或弹窗通知）。
    ```

---

## 3. 工作流建议

1.  **按序执行**: 请严格按照 Phase 1 -> 2 -> 3 的顺序进行，因为后续的内容注入依赖于重构后的数据架构。
2.  **测试验证**: 每个任务完成后，都应运行 `npm run dev` 并在浏览器中验证（例如：点击加密文件夹是否真的弹出了密码框？输入错误密码是否提示错误？）。
3.  **保持文档同步**: 如果在实现过程中发现代码逻辑与 `docs/` 有出入，请优先更新文档。
