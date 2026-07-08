# Dogfood 走查报告：Windows XP Simulator

| 字段 | 值 |
|------|-----|
| **日期** | 2026-07-08 |
| **应用 URL** | http://localhost:5173/windows-xp/ |
| **走查工具** | agent-browser 0.27.0 |
| **测试分辨率** | 1280x577（默认） |
| **范围** | 登录流程、桌面、窗口管理、文件资源管理器、记事本、计算器、画图、扫雷、纸牌、IE、开始菜单、语言切换、运行对话框、帮助与支持、控制面板，以及 vitest / Playwright 自动化测试 |

## 摘要

本次走查采用 [Vercel Labs agent-browser](https://github.com/vercel-labs/agent-browser) 的真实浏览器交互方式，对 Windows XP Simulator 进行了全功能点击、截图、快照和测试验证。共发现 **1 个 Critical、2 个 Medium、3 个 Low** 问题。最严重的问题是 **记事本（Notepad）打开即白屏崩溃**，导致该核心应用完全不可用。

| 严重程度 | 数量 |
|----------|------|
| Critical | 1 |
| High | 0 |
| Medium | 2 |
| Low | 3 |
| **合计** | **6** |

---

## 问题清单

### 1. [Critical] 记事本（Notepad）打开后白屏崩溃

- **复现步骤**
  1. 启动应用并登录桌面。
  2. 双击桌面“Notepad / 记事本”图标。
- **实际结果**：页面变为全白，React 渲染崩溃，必须刷新页面才能恢复。
- **期望结果**：正常打开记事本窗口，显示可编辑文本区。
- **证据**
  - 崩溃截图：`dogfood-output/screenshots/15-notepad-check.png`（全白）
  - 控制台错误：`dogfood-output/console-errors.json`
  - 关键报错：
    ```
    ReferenceError: Cannot access 'handleNew' before initialization
        at Notepad (src/apps/Notepad.tsx:128:40)
    ```
- **根因分析**  
  在 `src/apps/Notepad.tsx:128` 中，`keyboardHandlersRef` 的初始值直接引用了 `handleNew`、`handleOpen` 等函数，而这些函数在组件体内通过 `const` 定义，位于 `useRef` 之后。`const` 变量存在暂时性死区（TDZ），在初始化阶段访问会抛出 `ReferenceError`。
- **修复建议**
  - 方案 A：将 `useRef({ ... })` 初始化为空对象，并在所有 handler 定义完成后再赋值给 `ref.current`。
  - 方案 B：把 `handleNew`、`handleOpen` 等函数定义上移到 `keyboardHandlersRef` 之前。
- **相关文件**：`src/apps/Notepad.tsx`

---

### 2. [Medium] styled-components 将非 DOM 属性透传到 HTML，产生大量控制台警告

- **复现步骤**
  1. 打开任意窗口（IE、资源管理器、照片查看器属性、普通窗口等）。
  2. 查看浏览器控制台；或运行 `npm run test`。
- **实际结果**：控制台持续输出 React/styled-components 警告，例如：
  - `Warning: Received \`true\` for a non-boolean attribute \`active\`.`（`FileProperties.tsx`）
  - `Warning: React does not recognize the \`isDrive\` prop on a DOM element.`（`Explorer.tsx`）
  - `Warning: React does not recognize the \`isFocus\` prop on a DOM element.`（`Window.tsx`）
- **期望结果**：无控制台警告，自定义样式 props 不应透传到 DOM。
- **证据**
  - `dogfood-output/console-messages.json`
  - `dogfood-output/vitest-output.txt`（多处相同警告）
- **根因分析**  
  styled-components 会把组件接收到的所有 props 默认透传给底层 DOM。`active`、`isDrive`、`isFocus` 等是样式逻辑使用的自定义 props，不属于合法 HTML 属性。
- **修复建议**
  - 为 styled-components 自定义 props 添加 `$` 前缀（如 `$isDrive`、`$isFocus`、`$active`），利用 styled-components v5+ 的自动 transient props 机制过滤。
  - 或在 `StyleSheetManager` 中配置 `shouldForwardProp` 进行统一过滤。
- **相关文件**：`src/components/FileProperties.tsx`、`src/apps/Explorer.tsx`、`src/components/Window.tsx` 等

---

### 3. [Medium] 开始菜单「运行...」点击无反应

- **复现步骤**
  1. 登录桌面后点击「开始」按钮。
  2. 在弹出的开始菜单中点击「运行... / Run...」。
- **实际结果**：开始菜单关闭，但「运行」对话框没有出现。
- **期望结果**：弹出经典的 Windows XP「运行」对话框。
- **证据**
  - 操作截图：`dogfood-output/screenshots/23-rundialog.png`（仅显示桌面/IE，无运行对话框）
  - 点击前后快照对比：`dogfood-output/snapshot-start-cn2.txt` 与 `dogfood-output/snapshot-rundialog.txt`（后者未生成，说明对话框未渲染）
- **根因分析**  
  开始菜单使用 Portal 渲染，点击事件可能未正确命中「运行...」项，或 `Taskbar`/`StartMenu` 中该菜单项的 `onClick` 未调用 `openWindow('run')`。需要检查 `src/components/Taskbar.tsx` 及对应菜单数据。
- **修复建议**
  - 确认 `src/registry/apps.tsx` 中 `run` 应用已注册。
  - 检查开始菜单项的点击冒泡/Portal 坐标，确保事件能正确触发。
- **相关文件**：`src/components/Taskbar.tsx`、`src/registry/apps.tsx`、`src/apps/RunDialog.tsx`

---

### 4. [Low] 非浏览器环境（jsdom）下 `indexedDB` 未定义导致测试报错

- **复现步骤**：运行 `npm run test`。
- **实际结果**：`FileSystemContext.test.tsx` 等多处输出：
  ```
  Failed to persist filesystem: ReferenceError: indexedDB is not defined
      at src/utils/storage.ts:45:21
  ```
  测试最终通过，但 stderr 中有大量错误日志。
- **期望结果**：测试环境下应静默降级，不输出未捕获错误。
- **根因分析**  
  `src/utils/storage.ts` 直接调用 `indexedDB`，未对非浏览器环境（如 jsdom、SSR）做保护。
- **修复建议**
  - 在 `storage.ts` 中检测 `typeof indexedDB === 'undefined'` 时回退到 `localStorage` 或内存存储。
  - 或在测试 setup 中 mock `indexedDB`。
- **相关文件**：`src/utils/storage.ts`

---

### 5. [Low] `loadPersistedData` 在路径不存在时抛出 `TypeError`

- **复现步骤**：运行 `npm run test`，尤其是 `test/ExplorerBroken.test.tsx`。
- **实际结果**：控制台出现：
  ```
  Failed to load persisted data: TypeError: Cannot set properties of undefined (setting 'children')
      at loadPersistedData (src/context/FileSystemContext.tsx:204:41)
  ```
- **期望结果**：持久化数据加载失败时应优雅降级，不抛异常。
- **根因分析**  
  `loadPersistedData` 在按路径遍历时，未对中间节点缺失的情况做防御，直接对 `undefined` 设置 `children`。
- **修复建议**  
  在 `src/context/FileSystemContext.tsx:204` 附近增加路径存在性检查，缺失路径时跳过或回退到默认文件系统。
- **相关文件**：`src/context/FileSystemContext.tsx`

---

### 6. [Low] 多个开始菜单项为占位功能，点击后提示“找不到文件”或“Coming soon”

- **复现步骤**
  - 点击「所有程序」→ 弹出 `This feature is coming soon!` 占位对话框。
  - 点击「控制面板 / 打印机和传真」→ 弹出错误框“找不到文件”。
- **实际结果**：用户看到的是占位提示或错误弹窗。
- **期望结果**：未实现的功能可隐藏菜单项，或给出更友好的提示。
- **证据**
  - `dogfood-output/screenshots/10-startmenu-allprograms.png`
  - `dogfood-output/screenshots/27-controlpanel.png`
- **说明**  
  README 已将这些列为“Basic UI (Limited Functionality)”，不属于功能缺陷，但从 dogfood 体验角度看会持续造成困惑，建议统一隐藏或标记为“即将推出”。

---

## 已验证的正常功能

以下功能在走查中表现正常：

- 登录流程、密码校验、语言切换（中/英）
- 桌面图标双击打开：我的电脑、资源管理器、计算器、画图、扫雷、纸牌、IE
- 桌面图标右键菜单（需通过 DOM 事件触发；UI 显示正常）
- 资源管理器导航（我的电脑 → 本地磁盘 C:）
- 文件属性窗口
- 计算器 1+1 运算
- IE 默认加载 hao123（iframe 内容正常渲染）
- 帮助与支持中心
- 任务栏窗口按钮、最小化/最大化/关闭

---

## 自动化测试结果

| 测试套件 | 结果 |
|----------|------|
| `npm run test`（vitest） | 6 files / 15 tests 全部通过，但伴随上述 stderr 警告与错误 |
| `npm run test:e2e`（Playwright） | 11 tests 全部通过 |

---

## 附录：截图索引

| 编号 | 文件 | 说明 |
|------|------|------|
| 01 | `screenshots/01-initial.png` | 登录界面 |
| 02 | `screenshots/02-desktop.png` | 登录后桌面 |
| 03 | `screenshots/03-explorer-mycomputer.png` | 资源管理器 - 我的电脑 |
| 04 | `screenshots/04-explorer-cdrive.png` | 资源管理器 - C 盘 |
| 06 | `screenshots/06-contextmenu-mydocs.png` | 桌面图标右键菜单 |
| 07 | `screenshots/07-properties-mydocs.png` | 文件属性窗口 |
| 09 | `screenshots/09-startmenu.png` | 开始菜单（英文） |
| 10 | `screenshots/10-startmenu-allprograms.png` | 所有程序占位弹窗 |
| 11-12 | `screenshots/11-calculator.png` / `12-calculator-result.png` | 计算器 |
| 15 | `screenshots/15-notepad-check.png` | 记事本崩溃白屏 |
| 17 | `screenshots/17-solitaire.png` | 纸牌 |
| 18-19 | `screenshots/18-minesweeper.png` / `19-minesweeper-click.png` | 扫雷 |
| 20 | `screenshots/20-paint.png` | 画图 |
| 21-22 | `screenshots/21-ie.png` / `22-ie-iframe.png` | IE + hao123 iframe |
| 23 | `screenshots/23-rundialog.png` | 点击“运行...”后无弹窗 |
| 24 | `screenshots/24-langswitch.png` | 语言切换为中文 |
| 25 | `screenshots/25-help.png` | 帮助与支持中心 |
| 27 | `screenshots/27-controlpanel.png` | 控制面板“找不到文件”占位 |

---

## 修复记录

以下 issue 已在本地修复并验证通过，对应 GitHub Issue 已关闭：

| Issue | 问题 | 修改文件 | 修复要点 |
|-------|------|----------|----------|
| #25 | 记事本打开白屏崩溃 | `src/apps/Notepad.tsx` | 将 `keyboardHandlersRef` 初始化为 `null`，并在所有 handler 定义完成后再赋值，避免初始化阶段读取 TDZ 变量 |
| #26 | styled-components 自定义 props 透传 DOM | `src/components/Window.tsx`<br>`src/apps/Explorer.tsx`<br>`src/components/FileProperties.tsx` | 将 `isFocus`、`isDrive`、`active` 改为 transient props（`$isFocus`、`$isDrive`、`$active`） |
| #27 | 开始菜单「运行...」在窗口打开时无法点击 | `src/components/Taskbar.tsx` | 将 `StartMenu` 的 `z-index` 从 `10000` 提升到 `20000`，确保菜单始终位于窗口之上 |
| #28 | jsdom 下 indexedDB 报错 / loadPersistedData 报错 | `src/utils/storage.ts`<br>`src/context/FileSystemContext.tsx` | `storage.ts` 增加 `indexedDB` 存在性检查并静默降级；`loadPersistedData` 对回收站节点做防御性判断 |
| #29 | 开始菜单占位项提示不友好 | `src/components/Taskbar.tsx` | 将 `DummyApp` 分支从错误弹窗改为打开 DummyApp 组件（显示「coming soon」） |

### 验证结果

| 检查项 | 命令 | 结果 |
|--------|------|------|
| 单元测试 | `npm run test -- --run` | 6 files / 15 tests 全部通过，stderr 无警告/报错 |
| E2E 测试 | `npm run test:e2e` | 11 tests 全部通过 |
| 类型检查 | `npm run typecheck` | `tsc --noEmit` 通过 |
| 记事本可用性 | agent-browser 手动打开并输入文本 | 正常打开、可编辑 |

---

## 后续建议

1. **优先修复记事本崩溃**（Critical），这是目前影响最大的可用性问题。
2. **统一清理 styled-components 透传 prop 警告**，减少控制台噪音，也能避免未来 SSR/测试环境出现意外。
3. **修复「运行...」菜单点击无响应**。
4. **为 `storage.ts` 和 `loadPersistedData` 增加环境防御**，让测试输出更干净。
5. 对未实现的开始菜单项进行隐藏或友好提示，提升 dogfood 体验。
