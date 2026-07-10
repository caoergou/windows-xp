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

## 七、提交前检查清单

- [ ] `npm run typecheck && npm run lint && npm test -- --run` 全绿
- [ ] 涉及交互/样式：已对照并更新 `FIDELITY.md` 对应条目状态
- [ ] 涉及样式：通过截图基线（或有理由地更新基线）；与真实 XP 截图比对无明显差异
- [ ] 涉及窗口：刷新页面后窗口正确恢复（componentProps 可序列化）
- [ ] 无新增全局副作用、裸 storage 调用、硬编码文案、`@ts-nocheck`/`any`
- [ ] 1024×768 与 1920×1080 下布局正常；拖动无残影
- [ ] 双语（en/zh）均验证
