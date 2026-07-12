# DEVELOPMENT.md — 开发规范细则

> 总览与原则见 `AGENTS.md`；架构与命令速查见 `CLAUDE.md`；视觉/行为的 XP 基准、design token 权威值与验收方式见 `FIDELITY.md`；工作流见 `CONTRIBUTING.md`。本文件只放**代码层面的具体规则**。

## 一、架构约定

- Provider 层次、窗口对象结构、boot 流程见 `CLAUDE.md`；应用注册的唯一入口是 `src/registry/apps.tsx` 的 `APP_REGISTRY`
- 新应用三步：`src/apps/YourApp.tsx` → registry 注册（含 `restore`）→ `filesystem.json` 或 culture 包挂入口
- **`componentProps` 必须可序列化**（JSON 安全）：窗口靠它在刷新后恢复，函数/React 元素/类实例都会静默丢失。打开窗口的一切路径都必须把内容参数（url、initialPath 等）放进 `componentProps`，不能只放进 JSX

## 二、组件写法

- styled-components 的非 DOM 属性必须 `$` 前缀（transient props），禁止属性泄漏到 DOM
- 窗口拖动：`react-draggable` 用 `defaultPosition` + `nodeRef` 模式；wrapper 必须 `top: 0; left: 0` 防偏移
- 上下文菜单/弹层：`createPortal` 到 body，避免祖先 transform 破坏定位
- 组件消费 context 尽量窄（只订阅需要的切片），不要在叶子组件里 `useWindowManager()` 拿整包状态
- 颜色/字体禁止内联魔法值，一律引用 `src/theme` token（权威值见 `FIDELITY.md` §K.1）

## 三、包安全（embedding-safe）

任何代码都可能运行在别人的应用里：

- 禁止新增全局副作用：`window` 级监听、全局 CSS 裸元素选择器、模块级可变单例、全局 i18n 实例
- 已有的全局行为（右键屏蔽、快捷键拦截）必须保留 disable 开关；新功能默认不劫持宿主
- 所有 localStorage/IndexedDB 访问必须经过带 `storagePrefix` 的 storage 工具，禁止裸调用

## 四、类型与质量红线

- **禁止新增 `@ts-nocheck` 和 `any`**（存量 11 个文件 / 15 处 any 在还债中，只减不增）
- 树遍历等文件系统操作复用工具函数，禁止复制粘贴遍历循环
- 不在 setState updater 内做副作用；定时器必须在卸载时清理
- id 生成用 `crypto.randomUUID()`，禁止 `Date.now()`
- 声音一律走 `soundManager`，按 `FIDELITY.md` §I 的事件映射表接线，禁止直接 `new Audio`

## 五、i18n 与文化包

- **禁止硬编码任何面向用户的中文/英文字符串**，一律 i18n key；registry 里用 `nameKey`
- 中英两个 locale 必须同时提供；文化差异内容（快捷方式、便签、主页）放 culture 包（`src/data/culture/`），不写死在组件里
- 机制与内容分离的判断标准：**新增一条内容不应需要写 React 代码**

## 六、内容与彩蛋政策

- 文件内容进 `filesystem.json`，回收站叙事进 `src/data/recycle_bin/*.json`；剧情类内容未来统一走 scenario 系统（#84）
- 彩蛋四原则：
  1. **可发现**：每个彩蛋至少一条游戏内线索路径（cmd help 暗示、文件内容提示），不做纯靠攻略的死彩蛋
  2. **无害**：不打断正常使用；BSOD 类"惊吓"彩蛋必须可通过 `disableGlobalShortcuts` 等开关禁用
  3. **合法**：不使用受版权保护的音视频/图像资产（已有资产除外，新增需确认来源）
  4. **时代正确**：内容锚定 2000s（参考 2005–2007 中文互联网语境），不出现穿越时代的梗

## 七、引擎纯净性与平台化预备（#143）

> 背景：#143 RFC 计划让 OS 成为可定义的包，XP 是第一个也是默认的 OS 包（全景见
> `docs/OS-PLATFORM-VISION.md`）。**现在不建平台，但每个 PR 不许扩大"XP 专属
> 代码渗入引擎"的面积**——否则 Phase B（shell 契约）的手术成本逐 PR 上涨。
> 护栏：`npm run guard:purity`（CI 强制），规则速查在 `AGENTS.md` 红线 11/12。

- **分层自问**：写代码前先问这段是"机制"（窗口生命周期、FS、事件、存储——将来
  原样成为引擎）还是"XP 的样子"（Luna 色、chrome、XP 文案、xp.css 类名）。机制
  层文件（`src/context`、`src/hooks`、`src/utils`、`src/events.ts`、
  `src/snapshot.ts`）出现后者即违规，`guard:purity` 会挡下
- **主题层与引擎的边界**（#135，详见 `docs/THEMING.md`）：一切"XP 的样子"——
  token（`COLORS`）、样式片段（`xpButtonStyles` 等）、图片资产（窗口控制按钮、
  开始按钮贴图）——收敛在 `src/themes/xp/` 之下，契约 `OSTheme` 定义在
  `src/themes/contract.ts`。**机制层禁止 import `src/themes/`**（`guard:purity`
  第 4 项强制）：主题在引擎之上选定，不能被引擎反向依赖。去硬编码（1373 处内联
  hex）是**顺手迁移**，不是独立工作量，跟随 STY-03/色值棘轮推进
- **色值棘轮**：src/ 存量内联 hex（基线见 `scripts/guard-purity.mjs`）只减不增；
  新代码引用 `COLORS`（`src/constants.ts`）/ FIDELITY §K.1 token。还债进度即
  #135 Phase A / STY-03 的进度，降到基线以下就下调基线锁住战果
- **xp.css 只在入口挂载**（`src/main.tsx`、`src/lib/index.tsx`），组件不直接
  import 皮肤表
- **菜单只声明**：新应用把菜单以结构化数据传给 `XPMenuBar`，不手写菜单 DOM；
  #128 落地后迁移为 `defineApp` 的 `menus:` 字段（OS 包届时决定渲染位置——
  窗口内 vs 全局菜单栏）
- **应用引用留角色余地**：内容数据引用应用走 registry 关联（`resolveFileOpen`），
  不在代码里散布对具体 appId 的分支判断，为 `appRoles`（files/editor/browser/
  terminal）间接层留位
- **行为语义不外溢**：不在窗口机制之外写死 XP 行为假设（如动画目标直接查
  taskbar DOM、"最小化 = 任务栏按钮"散布在多处）——这些将来是
  `BehaviorProfile` 的枚举决策
- **快捷键不散落**：#132 中央 keymap 建成前不新增独立 hotkey 监听（本就撞
  红线 3）；`Ctrl` 假设将来是 OS 包的 `primaryModifier` 输入
- **文档标注适用域**：FIDELITY.md 与视觉红线的效力范围是"XP 包"而非引擎，
  新文档写明 scope，Phase B 时免全文重扫

## 八、提交前检查清单

- [ ] `npm run typecheck && npm run lint && npm test -- --run` 全绿
- [ ] 涉及交互/样式：已对照并更新 `FIDELITY.md` 对应条目状态
- [ ] 涉及样式：通过截图基线（或有理由地更新基线）；与真实 XP 截图比对无明显差异
- [ ] 涉及窗口：刷新页面后窗口正确恢复（componentProps 可序列化）
- [ ] 无新增全局副作用、裸 storage 调用、硬编码文案、`@ts-nocheck`/`any`
- [ ] 1024×768 与 1920×1080 下布局正常；拖动无残影
- [ ] 双语（en/zh）均验证
