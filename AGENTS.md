# AGENTS.md — 开发规范与设计守则

> 本文件回答"**怎么做才对**"（开发时的规范速查）；`FIDELITY.md` 回答"**现在差多少、如何验收**"（逐项打分的质量基线）。两者冲突时，以真实 Windows XP SP3 实测为最终仲裁，并同步修正文件。

## 〇、项目定位与三大原则

本项目是一个**可嵌入、可定制、可编剧的 Windows XP 桌面引擎 npm 包**（`@caoergou/windows-xp`），不只是一次性的模拟器页面。所有决策服从三条原则，按优先级排列：

1. **保真第一**：目标是忠实还原 XP，不是"现代化改良版"。
   - ❌ 不添加 XP 没有的视觉元素（现代圆角、柔和阴影、玻璃拟态、平滑滚动）
   - ❌ 不自行"美化"或"优化"XP 的设计，哪怕你觉得更好看
   - ✅ 每个视觉/交互决定都应能指出 XP 里的对应物（截图、录屏或参考实现）
   - 例外：无障碍改进（键盘可达、aria）允许超出 XP，但不得改变视觉呈现
2. **包优先（embedding-safe）**：任何代码都可能运行在别人的应用里。
   - 禁止新增全局副作用：`window` 级监听、全局 CSS 裸元素选择器、模块级可变单例、全局 i18n 实例
   - 已有的全局行为（右键屏蔽、快捷键拦截）必须保留 disable 开关，且新功能默认不劫持宿主
   - 所有 localStorage/IndexedDB 访问必须经过带 `storagePrefix` 的 storage 工具，禁止裸调用
3. **机制与内容分离**：桌面内容（文件、快捷方式、剧情、文化元素）用声明式数据描述（JSON / culture 包 / registry），组件只实现机制。判断标准：**新增一条内容不应需要写 React 代码**。

---

## 一、视觉规范

### 1.1 颜色 token（权威值）

写样式时**必须**使用以下值（最终收敛为 `src/theme` 导出，禁止散落新的魔法色值）：

| 用途 | 值 |
|------|-----|
| 窗口/对话框表面 | `#ECE9D8` |
| 标题栏激活渐变 | `linear-gradient(to right, #0997FF, #0053EE)` |
| 标题栏未激活渐变 | `linear-gradient(to right, #7A96DF, #5A7ACF)` |
| 按钮边框 | `#003C74` |
| 选中/菜单高亮（前景白字） | `#316AC5` |
| 禁用文字（GrayText） | `#ACA899` |
| tooltip 背景（InfoBackground） | `#FFFFE1`（1px 黑边） |
| 桌面无壁纸底色 | `#3A6EA5` |
| 输入区/列表背景（Window） | `#FFFFFF` |

尺寸类 token（标题栏高度、窗口边框、滚动条宽、任务栏高）**以真实 XP 截图逐像素测量后回填** `FIDELITY.md` §K.1，不允许拍脑袋。

### 1.2 字体

- 主字体栈：`Tahoma, "SimSun", "Microsoft YaHei", sans-serif`
  - **中文必须宋体（SimSun）优先**——XP 中文界面是宋体 9pt；微软雅黑是 Vista 之后的字体，仅作现代环境兜底
- 字号：英文 UI 11px（XP 的 8pt）；中文 UI 12px（9pt）
- 标题栏：`Trebuchet MS` bold
- 渲染追求像素感（XP 默认无 ClearType），禁止刻意开抗锯齿"优化"
- 字体声明一律引用 theme token，**禁止再新增内联 font-family**（存量 30+ 处内联待收敛，见 FIDELITY STY-03）

### 1.3 控件与部件

- **表单控件**（按钮/输入框/复选/单选/下拉）：基于 xp.css，必须具备 normal/hover/active/disabled 四态；disabled 文字用经典浮雕（`#ACA899` + 1px 白色右下偏移）
- **滚动条**：使用 `src/theme` 的 Luna 滚动条样式，新增可滚动区域必须挂载，禁止裸原生滚动条
- **菜单**：高亮 `#316AC5` 白字、左侧图标列、分隔线、菜单阴影（XP 原生有菜单阴影）
- **焦点**：键盘焦点用 1px 点线框（marching ants），不用现代 outline 光晕
- **图标尺寸各就各位**：48px 桌面 / 32px 大图标视图 / 16px 标题栏、菜单、任务栏、托盘；禁止非原生尺寸缩放
- **桌面图标**：图标阴影 `filter: drop-shadow(2px 2px 3px rgba(0,0,0,0.7))`；文字阴影 `text-shadow: 1px 1px 2px rgba(0,0,0,0.8)`；不要多重/过重阴影
- **快捷方式箭头**：简洁 SVG 弯箭头，白色填充深色描边，图标右下角。路径示例：`M2,11 L2,9 L5,9 L5,2 L3,2 L6,0 L9,2 L7,2 L7,11 Z`

### 1.4 Internet Explorer 6

- 菜单栏：文件(F) 编辑(E) 查看(V) 收藏(A) 工具(T) 帮助(H)
- 工具栏：**绿色**的前进/后退按钮（不是蓝色！）
- 地址栏 XP 经典输入框；底部状态栏；整体 `#ECE9D8`

### 1.5 视觉验收方式

- 新样式必须与真实 XP 截图或参考实现（xp.css / ShizukuIchi/winXP）比对
- 核心画面受 Playwright 截图基线保护（`FIDELITY.md` §K.2 的 8 个画面）；样式 PR 必须通过视觉回归，刻意变更需更新基线并在 PR 说明

## 二、行为规范

> 完整基准与打分见 `FIDELITY.md`（§A–§J）。改任何交互前先查对应条目；下面是最常犯错的速查。

- **桌面/文件**：单击选中、双击打开；F2 重命名、Del 进回收站（带确认框）、方向键移动选择、Enter 打开
- **窗口**：双击标题栏最大化（不可 resize 的窗口无效）；XP **没有**边缘吸附和拖顶最大化，不要加；最小化/最大化应有窗口动画（XP 默认开）
- **模态**：模态对话框弹出时父窗口禁用；点击父窗口 → 对话框标题栏闪烁 + Default Beep
- **声音**：一律走 `soundManager`，按 `FIDELITY.md` §I 的事件映射表接线（错误=critical_stop、警告=exclamation、气球=notify…），禁止直接 `new Audio`
- **键盘**：Ctrl+Esc 是开始菜单的 XP 原生键（浏览器不截获，代替 Win 键）；被 OS 截获的键（Win、Alt+Tab）提供替代并在帮助中说明，禁止硬抢
- **Explorer**：Backspace 是"向上一级"（XP 特有），不是后退
- **动画节奏**：菜单淡入、子菜单 ~400ms 延迟展开；动画是仿真的一部分，但禁止加 XP 没有的过渡效果

## 三、架构与代码规范

### 3.1 结构约定

- Provider 层次、窗口对象结构、boot 流程见 `CLAUDE.md`；应用注册的唯一入口是 `src/registry/apps.tsx` 的 `APP_REGISTRY`
- 新应用三步：`src/apps/YourApp.tsx` → registry 注册（含 `restore`）→ `filesystem.json` 或 culture 包挂入口
- **`componentProps` 必须可序列化**（JSON 安全）：窗口靠它在刷新后恢复，函数/元素/类实例都会静默丢失。打开窗口的一切路径都必须把内容参数（url、initialPath 等）放进 `componentProps`，不能只放进 JSX

### 3.2 组件写法

- styled-components 的非 DOM 属性必须 `$` 前缀（transient props），禁止属性泄漏到 DOM
- 窗口拖动：`react-draggable` 用 `defaultPosition` + `nodeRef` 模式；wrapper 必须 `top: 0; left: 0` 防偏移
- 上下文菜单/弹层：`createPortal` 到 body，避免祖先 transform 破坏定位
- 组件消费 context 尽量窄（只订阅需要的切片），不要在叶子组件里 `useWindowManager()` 拿整包状态

### 3.3 类型与质量红线

- **禁止新增 `@ts-nocheck` 和 `any`**（存量 11 个文件 / 15 处 any 在还债中，只减不增）
- 树遍历等文件系统操作复用工具函数，禁止复制粘贴遍历循环
- 不在 setState updater 内做副作用；定时器必须在卸载时清理
- id 生成用 `crypto.randomUUID()`，禁止 `Date.now()`

### 3.4 i18n 与文化包

- **禁止硬编码任何面向用户的中文/英文字符串**，一律 i18n key；registry 里用 `nameKey`
- 中英两个 locale 必须同时提供；文化差异内容（快捷方式、便签、主页）放 culture 包（`src/data/culture/`），不写死在组件里
- culture 包内容遵循"机制与内容分离"：新增文化内容 = 改数据，不改组件

## 四、内容与彩蛋政策

- 文件内容进 `filesystem.json`，回收站叙事进 `src/data/recycle_bin/*.json`；剧情类内容未来统一走 scenario 系统（#84）
- 彩蛋原则：
  1. **可发现**：每个彩蛋至少一条游戏内线索路径（cmd help 暗示、文件内容提示），不做纯靠攻略的死彩蛋
  2. **无害**：不打断正常使用；BSOD 类"惊吓"彩蛋必须可通过 `disableGlobalShortcuts` 等开关禁用
  3. **合法**：不使用受版权保护的音视频/图像资产（音效等已有资产除外，新增需确认来源）
  4. **时代正确**：内容锚定 2000s（参考 2005–2007 中文互联网语境），不出现穿越时代的梗

## 五、提交前检查清单

- [ ] `npm run typecheck && npm run lint && npm test -- --run` 全绿
- [ ] 涉及交互/样式：已对照并更新 `FIDELITY.md` 对应条目状态
- [ ] 涉及样式：通过截图基线（或有理由地更新基线）；与真实 XP 截图比对无明显差异
- [ ] 涉及窗口：刷新页面后窗口正确恢复（componentProps 可序列化）
- [ ] 无新增全局副作用、裸 storage 调用、硬编码文案、`@ts-nocheck`/`any`
- [ ] 1024×768 与 1920×1080 下布局正常；拖动无残影
- [ ] 双语（en/zh）均验证

## 参考资源

- `FIDELITY.md` — 行为/样式质量基线（本项目）
- [xp.css](https://botoxparty.github.io/XP.css/)、[ShizukuIchi/winXP](https://github.com/ShizukuIchi/winXP) — 参考实现
- 真实 Windows XP SP3 虚拟机截图/录屏 — 最终仲裁
