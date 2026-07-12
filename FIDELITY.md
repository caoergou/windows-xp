# FIDELITY.md — Windows XP 行为仿真质量清单

> 本文件是 issue #87 的核心交付物，与 `AGENTS.md` 互补：
> **AGENTS.md 是开发时的视觉规范速查（怎么写才对），本文件是质量基线与验收清单（现在差多少、怎么验收）**——行为条目靠人工比对 + e2e 转正，视觉条目靠 design token + 截图基线自动化验收（见 §K）。
>
> 仲裁基准：真实 Windows XP SP3（Luna 默认主题、默认视觉效果、默认声音方案）。有争议时以真实 XP 虚拟机的录屏/实测为准，参考实现可对照 [ShizukuIchi/winXP](https://github.com/ShizukuIchi/winXP) 与 [XP.css](https://botoxparty.github.io/XP.css/)。

## 使用规则

1. **任何修改 UI 交互的 PR，必须对照本清单更新对应条目的状态列**；新增交互先在此登记基准行为。
2. 状态取值（只允许以下五种）：
   - ✅ 已还原 —— 与真实 XP 行为一致（有测试或人工比对记录）
   - 🟡 部分 —— 存在但细节/覆盖面有差距
   - ❌ 未实现
   - 🔍 待核查 —— 可能已实现，尚未与真实 XP 比对确认
   - 🚫 浏览器限制 —— 浏览器/OS 截获，无法原样实现（需提供替代方案并在文档注明）
3. 感知度 = 用户注意到差异的概率，决定修复优先级：
   - ⭐⭐⭐ 肌肉记忆级（每次使用都会碰到）
   - ⭐⭐ 常见（一次会话内大概率碰到）
   - ⭐ 细节（刻意对比才会发现）
4. **修复优先级 = 感知度 ⭐⭐⭐ 且状态 ❌ 的条目优先**，其次是 ⭐⭐⭐/🟡 与 ⭐⭐/❌。
5. 🔍 条目的转正流程：与真实 XP 比对 → 补 e2e 或截图记录 → 改为 ✅/🟡/❌。
6. **视觉审阅用组件级截图**：用 Playwright `locator.screenshot()` 只截目标组件（对话框、按钮、菜单栏本身），不要全屏截图——目标更聚焦，色值/渐变方向/圆角/边框的偏差一眼可辨。细到图标内部的像素位置，用 sharp 放大 8 倍并与 xp.css 的像素描摹 SVG 并排对照。
7. **修复批次进度**：第一批（桌面键盘 + Ctrl+Esc）已完成（PR #111）；Explorer 键盘（EXP-03/04）已随 #87 第二批落地；剩余第二批（WIN-03 动画、DLG-01 模态、TSK-04 分组、SND-03~05 接线）继续在 #87 推进；Explorer 视图/目录树/地址栏历史独立为 #120；各键位的跨平台可实施性由 #132 的审计矩阵补充。

---

## A. 开机 / 登录 / 关机（BOOT）

| ID | XP 基准行为 | 感知度 | 状态 | 备注 |
|----|------------|:---:|:---:|------|
| BOOT-01 | 黑屏 + XP logo + 循环滚动的蓝色进度块 | ⭐⭐⭐ | ✅ | `BootScreen.tsx` |
| BOOT-02 | 欢迎屏幕：蓝色渐变背景、用户磁贴列表、点击磁贴后出现密码框与绿色箭头按钮 | ⭐⭐⭐ | 🔍 | `LoginScreen.tsx` 已有，细节（磁贴 hover 高亮、布局）待比对 |
| BOOT-03 | 密码错误：磁贴下方出现提示（"是否忘记了密码？"），不弹系统对话框 | ⭐⭐ | 🔍 | |
| BOOT-04 | 登录成功播放 logon 音；注销播放 logoff 音；关机播放 shutdown 音 | ⭐⭐⭐ | ✅ | 音频已接入 soundManager |
| BOOT-05 | "关闭计算机"对话框：待机（黄）/ 关闭（红）/ 重新启动（绿）三按钮；**弹出时桌面其余部分渐变为灰度** | ⭐⭐⭐ | 🟡 | `TurnOffDialog.tsx` 有对话框；灰度渐变待核查/实现 |
| BOOT-06 | 注销对话框：切换用户 / 注销 双按钮，同样灰度背景 | ⭐⭐ | 🔍 | |
| BOOT-07 | 登录后短暂"正在加载个人设置…"过渡 | ⭐ | ❌ | 低优先级氛围项 |

## B. 桌面（DSK）

| ID | XP 基准行为 | 感知度 | 状态 | 备注 |
|----|------------|:---:|:---:|------|
| DSK-01 | 单击选中（图标蓝色覆盖 + 文字反白），双击打开 | ⭐⭐⭐ | ✅ | |
| DSK-02 | 鼠标拖出半透明蓝色橡皮筋框选，可多选 | ⭐⭐⭐ | ✅ | `Desktop.tsx:255-288`；触屏不可用（见 CUR-04） |
| DSK-03 | **F2 对选中图标重命名** | ⭐⭐⭐ | ✅ | 桌面 F2 → 重命名对话框（#87 第一批）。inline 就地编辑留待后续 |
| DSK-04 | **Del 将选中项放入回收站**，弹确认框 | ⭐⭐⭐ | ✅ | 键盘 Del → 复用删除确认流程（#87 第一批） |
| DSK-05 | **方向键在图标间移动选择焦点，Enter 打开，Ctrl+A 全选** | ⭐⭐⭐ | ✅ | 桌面容器获焦后监听键盘：方向键移动选择、Enter 打开、Ctrl+A 全选（#87 第一批） |
| DSK-06 | 图标可自由拖放摆位（XP 默认"自动排列"关、"对齐到网格"开） | ⭐⭐ | 🔍 | 拖 icon 到文件夹已有；自由摆位/网格对齐待核查 |
| DSK-07 | 桌面右键菜单：排列图标 / 刷新 / 粘贴 / 新建（文件夹、快捷方式、文本文档）/ 属性 | ⭐⭐⭐ | 🟡 | `ContextMenu` + `DesktopProperties` 已有，菜单项完整度待比对 |
| DSK-08 | 拖动图标时显示半透明 ghost 跟随 | ⭐⭐ | 🔍 | |
| DSK-09 | 图标视觉规范（阴影、快捷方式箭头） | — | ✅ | 视觉项，规范见 `AGENTS.md` §3/§4 |

## C. 窗口（WIN）

| ID | XP 基准行为 | 感知度 | 状态 | 备注 |
|----|------------|:---:|:---:|------|
| WIN-01 | 双击标题栏最大化/还原；不可调大小的窗口双击无效果 | ⭐⭐⭐ | ✅ | `WindowChrome.tsx:165` `onDoubleClick={() => isResizable && onMaximize()}`——非 resizable 窗口双击为 no-op |
| WIN-02 | 最小化/最大化/关闭按钮的 normal/hover/active 三态 | ⭐⭐⭐ | ✅ | luna 贴图全套已接。已核查：最小化横线位于按钮底部偏左（21×21 中 x=5–11、y=13–15），与 xp.css 像素描摹 SVG 逐像素一致——"偏下"是 XP 原版设计而非缺陷 |
| WIN-03 | **最小化时窗口缩放动画飞向对应任务栏按钮；最大化/还原有展开动画**（XP 默认开启"最小化和最大化时显示窗口动画"） | ⭐⭐⭐ | ❌ | #87 第一批；建议在 #80 重构后实现 |
| WIN-04 | 非激活窗口标题栏使用浅色渐变（色值见 AGENTS.md） | ⭐⭐⭐ | 🔍 | |
| WIN-05 | 八方向边缘/角拉伸，对应方向的 resize 光标 | ⭐⭐ | 🔍 | react-resizable 默认仅右下角，需核查已启用的方向数 |
| WIN-06 | 不可调大小窗口：最大化按钮禁用态、边缘无 resize 光标 | ⭐⭐ | 🔍 | |
| WIN-07 | Alt+Space 打开系统菜单（还原/移动/大小/最小化/最大化/关闭），"移动"支持方向键移窗 | ⭐⭐ | ❌ | 也是"窗口拖丢了"的官方恢复手段，见 WIN-08 |
| WIN-08 | XP 无边缘吸附、无拖到顶部最大化，窗口可拖出屏幕边缘 | ⭐⭐ | 🟡 | 当前行为恰好一致，但缺 WIN-07 的恢复手段；可选提供"标题栏始终可见"约束作为非仿真增强（默认关） |
| WIN-09 | 需要注意的窗口任务栏按钮闪烁橙色（FlashWindow） | ⭐⭐ | 🟡 | `flashWindow` 机制已有；颜色/节奏待比对 |
| WIN-10 | 最小化/还原播放对应系统音（XP 默认方案含"最小化/还原"事件） | ⭐ | ✅ | 已接线：`Window/index.tsx:42`（min）/`:51`（restore）、`Taskbar/index.tsx:213/217` → `sounds.minimize()/restore()` |
| WIN-11 | 点击窗口任意处置顶获得焦点 | ⭐⭐⭐ | ✅ | |
| WIN-12 | 层叠窗口 / 横向平铺 / 纵向平铺（任务栏右键） | ⭐⭐ | ❌ | 菜单项恢复为 disabled 直至实现（#121 修掉了"可点无效"的死点击，`Taskbar/index.tsx:383-388` 附实现前提注释：需受控窗口定位） |

## D. 任务栏 / 开始菜单 / 托盘（TSK）

| ID | XP 基准行为 | 感知度 | 状态 | 备注 |
|----|------------|:---:|:---:|------|
| TSK-01 | 开始按钮绿色渐变三态（normal/hover/pressed） | ⭐⭐⭐ | ✅ | spriteSheet 已接 |
| TSK-02 | 开始菜单双栏：顶部用户头像条、左栏固定+常用程序、右栏系统位置、底部"所有程序"与注销/关机 | ⭐⭐⭐ | ✅ | 布局已经 #35 审计 |
| TSK-03 | "所有程序"级联子菜单，hover 约 400ms 延迟展开 | ⭐⭐ | 🟡 | `StartMenuFlyout` 已有；展开延迟与嵌套行为待比对 |
| TSK-04 | **同应用多窗口自动分组折叠为一个带数字和箭头的按钮**（XP 默认开启） | ⭐⭐⭐ | ❌ | 当前每窗口一按钮+横向滚动（`TaskList.tsx:100-115`），非 XP 行为。#87 |
| TSK-05 | 任务栏按钮：激活态凹陷、非激活凸起；右键有 还原/移动/大小/最小化/最大化/关闭 菜单 | ⭐⭐ | 🔍 | |
| TSK-06 | 时钟不显示秒；hover 显示完整日期 tooltip | ⭐⭐ | 🔍 | `SystemClock.tsx` |
| TSK-07 | 托盘"隐藏不活动的图标"折叠箭头（chevron） | ⭐ | ❌ | 低优先级 |
| TSK-08 | 托盘气球提示：浅黄圆角气泡 + 指向托盘的尾巴 + 右上角 X，自动淡出，弹出播 notify 音 | ⭐⭐ | ✅ | `BalloonTip` 通用组件 + `useTray().notify()` 队列 API（#118）；360 提醒改由 zh 文化包 `startupNotification` 驱动 |
| TSK-09 | 任务栏右键菜单：工具栏 / 层叠窗口 / 平铺 / 显示桌面 / 任务管理器 / 锁定任务栏 / 属性 | ⭐⭐ | 🟡 | 菜单已有；层叠/平铺项 disabled（见 WIN-12） |
| TSK-10 | 快速启动栏（XP 默认隐藏，可通过工具栏菜单开启） | ⭐ | ❌ | 低优先级 |
| TSK-11 | "显示桌面"：一键最小化全部窗口，再点还原 | ⭐⭐ | 🔍 | |

## E. 资源管理器（EXP）

| ID | XP 基准行为 | 感知度 | 状态 | 备注 |
|----|------------|:---:|:---:|------|
| EXP-01 | 左侧蓝色任务面板（文件和文件夹任务 / 其它位置 / 详细信息，分组可折叠） | ⭐⭐⭐ | ✅ | `ExplorerSidebar.tsx` |
| EXP-02 | 查看方式切换：缩略图 / 平铺 / 图标 / 列表 / 详细信息 | ⭐⭐ | ✅ | 五视图全部实现（#211）：缩略图（图片文件夹默认，真实缩略图）/ 平铺（48px 图标 + 类型/大小两行）/ 图标（32px 竖排）/ 列表（16px 纵向多列）/ 详细信息（可排序列）。工具栏"查看"下拉与查看菜单均可选，**按文件夹持久化** |
| EXP-03 | **Backspace = 向上一级**（XP 特有，不是"后退"） | ⭐⭐ | ✅ | Explorer Backspace → 上一级（#87 第二批） |
| EXP-04 | F5 刷新 / F2 重命名 / Del 删除 在 Explorer 内可用 | ⭐⭐⭐ | ✅ | Explorer F5 刷新、F2 重命名、Del 删除选中项（#87 第二批）；#120 追加 Enter 打开、方向键/Home/End 移动选择；#211 补齐 Ctrl+A 全选、Shift+方向键扩展选区、多选批量删除 |
| EXP-05 | 剪切（Ctrl+X）的项目图标半透明显示 | ⭐⭐ | 🔍 | 剪贴板逻辑已有 |
| EXP-06 | 重命名为 inline 编辑框（选中文件名不含扩展名） | ⭐⭐ | 🟡 | 重命名已有，交互方式待比对 |
| EXP-07 | 拖放移动；按住 Ctrl 拖放为复制（光标带 + 号） | ⭐⭐ | 🟡 | 拖放移动已有；Ctrl 复制待核查 |
| EXP-08 | 地址栏下拉显示路径历史 | ⭐ | ✅ | 地址栏下拉列出访问过的路径（按实例持久化的 MRU，键盘可达），选择即导航（#120）；另补"文件夹"目录树面板（工具栏切换，读取同一 FS 树）与 Explorer 内 Enter/方向键选择 |
| EXP-09 | 状态栏显示对象数与选中项大小 | ⭐ | 🔍 | |
| EXP-10 | 双击文件夹同窗口导航（默认），Back/Forward/Up 工具栏可用 | ⭐⭐⭐ | ✅ | |

## F. 对话框与模态（DLG）

| ID | XP 基准行为 | 感知度 | 状态 | 备注 |
|----|------------|:---:|:---:|------|
| DLG-01 | **模态对话框弹出时父窗口整体禁用；点击父窗口 → 对话框标题栏闪烁 + 播放 Default Beep（ding）** | ⭐⭐⭐ | ❌ | XP 标志性行为。#87 第一批 |
| DLG-02 | 错误框弹出播 Critical Stop；警告框播 Exclamation；信息框播 Asterisk/notify | ⭐⭐⭐ | 🔍 | wav 资产齐全，需逐一核查 Modal 类型 → 声音的接线 |
| DLG-03 | 默认按钮带加深边框，Enter 触发；Esc 等价"取消" | ⭐⭐ | ✅ | #124：`XPButton $default` 2px 边框；焦点默认按钮，Enter 触发，Esc 取消（`useModalA11y`）；`e2e/keyboardA11y.spec.ts` |
| DLG-04 | Tab/Shift+Tab 在控件间移动焦点，焦点控件显示虚线框 | ⭐⭐ | ✅ | #124：`useModalA11y` 焦点陷阱 + 关闭时恢复焦点；`test/modalA11y.test.tsx` |
| DLG-05 | 对话框相对父窗口居中弹出 | ⭐⭐ | 🔍 | |
| DLG-06 | 消息框图标与 XP 原版一致（红圈白叉 / 黄三角叹号 / 蓝圈 i / 问号） | ⭐⭐ | 🔍 | |

## G. 全局键盘（KBD）

「可行性」列来源于 #132 的逐 OS×浏览器审计（权威表见 [`docs/KEYMAP.md`](docs/KEYMAP.md)）：
✅ 可用 · 🟦 OS 保留（需替代键）· 🟥 浏览器保留（不可拦截）。所有 global/app
快捷键现由中央 keymap（`src/utils/keymap.ts`）登记，宿主可用 `keymap` prop 重映射。

| ID | XP 基准行为 | 感知度 | 状态 | 可行性 | 备注 |
|----|------------|:---:|:---:|:---:|------|
| KBD-01 | Alt+Tab 切换器：灰色覆盖层、图标网格、蓝色选择框、底部窗口标题 | ⭐⭐⭐ | 🟡 | 🟥 | 浏览器/OS 截获 Alt+Tab（keyup 收不到；mac 为 Cmd+Tab）。官方替代 **Alt+`**；覆盖层 UI 可先做。keymap id `switcher.next` |
| KBD-02 | Alt+F4 关闭当前窗口 | ⭐⭐⭐ | ✅ | 🟦 | Windows 下可能关闭浏览器窗口（OS 级）；mac/Linux ✅。可被 `disableGlobalShortcuts` 关闭。id `window.close` |
| KBD-03 | **Ctrl+Esc 打开开始菜单**（XP 原生快捷键，浏览器不截获，天然替代 Win 键） | ⭐⭐⭐ | ✅ | ✅ | 各平台可用。id `startMenu.toggle`（#87 第一批） |
| KBD-04 | Win / Win+D / Win+E / Win+R | ⭐⭐ | 🚫 | 🟥 | OS 保留。替代：Ctrl+Esc（其余可自定义） |
| KBD-05 | 菜单栏 Alt 加速键（Alt+F 打开"文件"；XP 默认按 Alt 前隐藏下划线） | ⭐ | ❌ | ✅ | 低优先级 |
| KBD-06 | 应用内标准快捷键（记事本 Ctrl+S/F/H、画图 Ctrl+O/S 等） | ⭐⭐ | 🟡 | ✅ | Notepad/Paint 已登记；**Ctrl+N 已移除**（浏览器保留=开新窗口，见 KEYMAP.md）。`Mod` 归一化 Cmd/Ctrl |

## H. 鼠标 / 光标 / 提示（CUR）

| ID | XP 基准行为 | 感知度 | 状态 | 备注 |
|----|------------|:---:|:---:|------|
| CUR-01 | 全套 XP 光标（箭头/手型/I 型/沙漏/移动/各方向 resize） | ⭐⭐⭐ | ✅ | `.cur` 资产已接入 |
| CUR-02 | 启动应用瞬间显示"箭头+沙漏"忙碌光标 | ⭐⭐ | ❌ | 氛围项，成本低 |
| CUR-03 | tooltip：浅黄 `#FFFFE1` 底、1px 黑边、Tahoma 8pt、约 500ms 延迟、淡入 | ⭐⭐ | ✅ | 已做成统一组件 `XPTooltip`（= STY-14，#99） |
| CUR-04 | 触屏：点按/双击/长按右键等价操作 | ⭐⭐ | 🟡 | 点按=单击、双击=打开、长按=右键菜单，拖标题栏移动窗口（桌面/资源管理器；`useTapGestures` + `Desktop`/`Explorer`，#125）；`MobileWarning` 降级为一次性触摸提示。**未做**：触屏橡皮筋框选、图标拖入文件夹、pan/zoom 视口（后续）。XP 本身无触屏，属"可用性"而非仿真 |

## I. 声音事件映射（SND）

> XP 默认方案的事件 → 本项目资产（`src/assets/audio/xp/`）→ 接线状态。资产已齐全，缺的是触发点。

| ID | 系统事件 | XP 声音 | 本地资产 | 状态 | 触发点 |
|----|---------|--------|---------|:---:|--------|
| SND-01 | 启动 Windows | Startup | `startup.wav` | ✅ | 开机流程 |
| SND-02 | 登录 / 注销 / 退出 Windows | Logon / Logoff / Shutdown | `logon/logoff/shutdown.wav` | ✅ | 会话流程 |
| SND-03 | 严重错误（Critical Stop） | Critical Stop | `critical_stop.wav` | 🔍 | 错误类 Modal、BSOD 前奏 |
| SND-04 | 警告（Exclamation） | Exclamation | `exclamation.wav` | 🔍 | 警告类 Modal |
| SND-05 | 默认响声（Default Beep） | Ding | `ding.wav` | ❌ | 点击模态框的父窗口（依赖 DLG-01） |
| SND-06 | 系统通知 | Notify | `notify.wav` | 🟡 | 气球提示（TSK-08） |
| SND-07 | 清空回收站 | Recycle | `recycle.wav` | ✅ | 删除文件时触发 `sounds.recycle()`（`useFileOperations.ts:152`） |
| SND-08 | 最小化 / 还原 | Minimize / Restore | `minimize/restore.wav` | ✅ | `Window/index.tsx:42/51`、`Taskbar/index.tsx:213/217`；WIN-03 动画落地时同步校准时序 |
| SND-09 | 菜单命令 | Menu Command | `menu_command.wav` | ✅ | 菜单项点击：`ContextMenu.tsx:112`、`Taskbar/index.tsx:203`、`StartMenu.tsx:274` |
| SND-10 | IE 导航点击（"开始导航"） | Start Navigation | ❌ 缺资产 | ❌ | IE 内点链接；低优先级 |

## J. 动画与视觉效果（ANM）

> XP 默认（"让 Windows 选择最佳设置"）：窗口最小化/最大化动画 **开**、菜单淡入 **开**、菜单阴影 **开**、拖动时显示窗口内容 **开**、字体平滑为"标准"（**ClearType 默认关**）。

| ID | XP 基准行为 | 感知度 | 状态 | 备注 |
|----|------------|:---:|:---:|------|
| ANM-01 | 窗口最小化/最大化/还原动画 | ⭐⭐⭐ | ❌ | = WIN-03 |
| ANM-02 | 菜单淡入 + 菜单阴影；子菜单展开延迟 | ⭐⭐ | 🔍 | 开始菜单/右键菜单统一核查 |
| ANM-03 | 拖动窗口时实时显示内容（非线框） | ⭐⭐⭐ | ✅ | react-draggable 天然如此 |
| ANM-04 | 字体渲染：像素感（非现代抗锯齿），UI 字体 Tahoma 8pt | — | ✅ | 视觉项，见 AGENTS.md；web 端以像素字体近似 |
| ANM-05 | 屏保：空闲触发、动一下即退出；XP 内置多款（变幻线/三维管道/字幕等） | ⭐⭐ | 🟡 | 已有单款 logo 浮动屏保；多款化见 #13 |

## K. 视觉样式（STY）

> 样式与行为的验收方式不同：**样式应当被自动化**。路线是三层——
> ① **Token 化**：把 Luna 的色值/字体/尺寸收敛为 `src/theme` 中的具名 token，消灭散落的内联魔法值；
> ② **截图基线**：现有 e2e 已在截图但只存档不断言（`e2e/interaction-verify.spec.ts`），升级为 Playwright `toHaveScreenshot()` 基线断言，样式回归自动报警；
> ③ **对照审计**：与真实 XP 截图 side-by-side 比对（#35 已完成一轮，其结论直接吸收为本节初始打分）。

| ID | XP 基准 | 感知度 | 状态 | 备注 |
|----|--------|:---:|:---:|------|
| STY-01 | 窗口 chrome：Luna 蓝渐变标题栏、顶部圆角、粗边框、贴图控制按钮 | ⭐⭐⭐ | ✅ | #35 已审计修正一轮（去现代阴影、Trebuchet MS 标题字体） |
| STY-02 | **中文 UI 字体为宋体（SimSun）优先**——雅黑是 Vista 之后的字体，XP 时代中文界面是宋体 9pt | ⭐⭐⭐ | ✅ | 代码字体栈正确（`Tahoma, SimSun, Microsoft YaHei`），与 AGENTS.md 红线条目一致；字体权威值以本文件 §K.1 为唯一出处 |
| STY-03 | 字体声明 token 化：同一 font-family 内联重复 30+ 处，无统一出口 | — | ❌ | 收敛进 `src/theme`；这是截图基线的前置（改一处即全局生效） |
| STY-04 | 表单控件（按钮/输入框/复选框/单选/下拉）的 normal/hover/active/disabled 四态 | ⭐⭐⭐ | 🟡 | xp.css 提供，但多处组件手写偏离：已修 Calculator 按钮（原 Win2000 灰平面 → Luna 渐变+橙 hover）、4 个对话框按钮统一为共享 `XPButton`（xp.css 逐值对齐）、4 个对话框关闭钮从橙色渐变条统一为 Luna 贴图 `CloseBtn`、3 个应用菜单栏统一为 `XPMenuBar`（#99/PR #100）、3 处对话框文本输入框统一为共享 `XPTextInput`（#99）、复选框统一为 `XPCheckbox`/`XPRadio`（STY-17）、下拉统一为 `XPSelect`（STY-18）、滑块统一为 `xpTrackbarStyles`（STY-19）。按钮四态基本收敛，剩余散落手写按钮（ControlPanel/Notepad/FileProperties 等）待并入 XPButton |
| STY-05 | disabled 文字的经典浮雕效果（灰字 + 1px 白色右下偏移） | ⭐ | 🔍 | |
| STY-06 | Luna 滚动条（浅蓝立体滑块、箭头按钮三态） | ⭐⭐⭐ | 🟡 | `src/theme/index.ts` 已有样式导出；应用覆盖面待核查（哪些滚动区域还是原生滚动条） |
| STY-07 | 菜单样式：高亮 `#316AC5` 白字、左侧图标列、分隔线、菜单阴影 | ⭐⭐⭐ | 🔍 | 开始菜单/右键菜单/应用菜单栏统一核查 |
| STY-08 | 列表/文件选中高亮 `#316AC5` + 白字；失焦后变灰高亮 | ⭐⭐ | 🔍 | "失焦变灰"最易被忽略 |
| STY-09 | 焦点虚线框（1px 点线 marching ants） | ⭐⭐ | ✅ | #124：`scoped.css` `:focus-visible` 1px 点线框，覆盖按钮/链接/菜单项/可聚焦项（仅键盘焦点显示） |
| STY-10 | 任务栏/开始按钮渐变与贴图 | ⭐⭐⭐ | ✅ | #35 已修正（winXP 渐变、authentic start.png） |
| STY-11 | 图标使用规范：48px（桌面）/ 32px（大图标）/ 16px（标题栏、菜单、任务栏）各就各位，不做非原生缩放 | ⭐⭐ | 🔍 | 资产库丰富（5.2MB），核查取用尺寸 |
| STY-12 | 桌面图标/文字阴影、快捷方式箭头 | ⭐⭐⭐ | ✅ | 规范见 AGENTS.md §3/§4 |
| STY-13 | IE6 chrome（绿色前进后退、#ECE9D8、状态栏） | ⭐⭐⭐ | ✅ | 规范见 AGENTS.md §2 |
| STY-14 | tooltip 黄底样式 | ⭐⭐ | ✅ | 共享 `XPTooltip`：`#FFFFE1` 底、1px 黑边、Tahoma 11px、~500ms 延迟、淡入，body portal 防裁剪。gallery 登记；广泛替换 `title=` 为渐进采用 |
| STY-20 | 进度条：白色圆角槽（1px `#686868`、radius 4px、14px 高）+ Luna 绿分段填充 | ⭐⭐ | ✅ | 共享 `XPProgressBar`，逐值取自 xp.css `progress`（绿色纵向渐变 + 重复白色分段）。gallery 登记；替换散落自绘进度条为渐进采用 |
| STY-15 | 对话框 chrome 与窗口 chrome 完全一致（同款纵向 Luna 渐变标题栏、蓝色窗框、Luna 关闭钮） | ⭐⭐⭐ | ✅ | 曾为横向 `#0058EE→#3593FF` 渐变 + 独立窗框，4 个对话框各一份；已统一复用 `WindowChrome` 的 `TitleBar`/`WindowContainer`（`XPDialogChrome`），组件级截图对照确认与窗口一致。#121 又将 Notepad 查找/替换对话框与 MobileWarning 迁移到 `XPDialogFrame`，消除最后残留的横向渐变标题栏与橙色关闭钮 |
| STY-16 | 文本输入框（sunken 样式）：`#7f9db9` 单像素边框、`#fff` 底、23px 高、无 focus 高亮描边 | ⭐⭐ | ✅ | xp.css `input[type=text/password]` 逐值核对：XPInput（原 21px 高+2px 3px padding）、PasswordDialog（原多出 `border-radius:1px`+内阴影+发明的蓝色 focus 描边，无 XP 依据）、RunDialog（原缺 height/background，按钮也未接入 XPButton）三处分歧已统一为共享 `XPTextInput`；组件级截图核对三处（运行对话框、密码对话框、重命名对话框）视觉一致 |
| STY-17 | 复选框/单选框：13px sunken 白底方框 + 7px 勾选贴图；单选 12px sunken 圆 + 4px 圆点 | ⭐⭐ | ✅ | **原生 `<input type=checkbox>` 被 xp.css 全局规则 `opacity:0;position:fixed` 隐藏**（它靠相邻 `input+label::before` 重绘，而 app 标记多不满足该结构）——静音开关、QQ「记住密码/自动登录/隐身登录」等复选框在屏幕上**完全不可见**。新增自绘的共享 `XPCheckbox`/`XPRadio`（逐值取自 xp.css `--border-field` + `checkmark.svg`/`radio-*.svg`），不依赖兄弟结构，处处一致可见。迁移 VolumePopup、VolumeControl、ControlPanel 声音/鼠标、QQ 登录；组件级截图确认 |
| STY-18 | 下拉框（combobox）：`#7f9db9` sunken 白字段 + 右侧米色凸起下拉钮 + 黑箭头贴图 | ⭐⭐ | ✅ | 原生 `<select>`（ControlPanel 语言、DisplaySettings 壁纸/分辨率/屏保、DesktopProperties 背景/位置）渲染宿主 OS 控件，与 XP Luna combobox 无关。统一为共享 `XPSelect`（xp.css `select` 逐值：`button-down.svg` 米色钮 + 箭头），截图确认 |
| STY-19 | 轨道条（trackbar/slider）：2px sunken 黑槽 + 11×21 Luna 尖头滑块贴图 | ⭐⭐ | ✅ | 原为 16px 方形/圆形灰滑块（浏览器味），与 XP 尖头 trackbar 无关。新增共享 `xpTrackbarStyles`（`src/theme`，逐值取自 xp.css `input[type=range]` + `indicator-horizontal.svg`）；迁移 VolumeControl/VolumePopup/声音/鼠标四处。**坑**：需 `!important` 覆盖 xp.css 元素选择器（`input[type=range]::-webkit-slider-thumb` 特指度更高），否则默认滑块从贴图透明角露出绿色 |

### K.1 Design Token 基准表（收敛目标）

> **每个值必须带出处**，只允许三种：① XP Luna 默认系统色（Control Panel\Colors 注册表值，见参考资料的系统色对照表）；② xp.css 产物实测（`node_modules/xp.css/dist/XP.css` 内的拟合值——注意 Luna 标题栏原版是位图，xp.css 的渐变是对位图的拟合）；③ 真实 XP 截图逐像素测量。**"待核查"= 现值出处不明，禁止再扩散使用**。全部值最终落地为 `src/theme` 导出。

| Token | 值 | 出处与证据 |
|-------|-----|------|
| `surface`（窗口/对话框底色） | `#ECE9D8` | ✅ 双源：系统色 ButtonFace = RGB(236,233,216)；xp.css `.surface`/`.window`/`button` 同值 |
| `highlight`（选中/菜单，白字前景） | `#316AC5` | ✅ 系统色 Highlight = RGB(49,106,197) |
| `text.disabled`（禁用文字） | `#ACA899` | ✅ 系统色 GrayText 与 ButtonShadow 均为 RGB(172,168,153) |
| `tooltip.bg` | `#FFFFE1` | ✅ 系统色 InfoWindow = RGB(255,255,225) |
| `window.bg`（输入区/列表底） | `#FFFFFF` | ✅ 系统色 Window |
| `desktop.fallback`(无壁纸底色) | `#004E98` | ✅ 系统色 Desktop = RGB(0,78,152)。**勘误**：本表曾写 `#3A6EA5`，那是 Windows 2000 的桌面蓝，非 XP Luna。**代码已修**：`constants.ts` `DESKTOP_BACKGROUND` 与 `Desktop.tsx` 底色由 `#3A6EA5` → `#004E98`（#99） |
| `titlebar.active` | `linear-gradient(180deg, #0997FF, #0053EE 8%, #0050EE 40%, #0066FF 88%, #0066FF 93%, #005BFF 95%, #003DD7 96%, #003DD7)` | ✅ xp.css `title-bar` 实测。**勘误**：旧 AGENTS.md 的 `to right` 双色简化版方向就是错的（Luna 是垂直渐变） |
| `titlebar.activeSolid` / `gradient`（经典绘制场合） | `#0054E3` / `#3D95FF` | ✅ 系统色 ActiveTitle / GradientActiveTitle |
| `titlebar.inactive` | `#7A96DF → ?` | 🔍 待核查：`#7A96DF` 与系统色 InactiveTitle 吻合；现用第二段 `#5A7ACF` 出处不明（系统色 GradientInactiveTitle 为 `#9DB9EB`），xp.css 无非激活样式，需截图测量定值 |
| `border.button` | `#003C74` | 🔍 待核查：xp.css 中未找到，需从按钮控件截图验证 |
| `titlebar` 度量 | 高 21px + padding 3px、顶部圆角 8px/7px、字号 13px、text-shadow `1px 1px #0F1089`、边框 `#0831D9`/`#001EA0`、控制按钮 21×21px | ✅ xp.css `title-bar` 实测（最终以截图仲裁） |
| `font.ui` | `Tahoma 11px`（en）/ `SimSun 12px`（zh） | ✅ XP 8pt/9pt 换算；中文宋体优先（雅黑系 Vista+） |
| `font.titlebar` | `Trebuchet MS` bold | ✅ xp.css 实测 + #35 结论 |
| `metrics.windowBorder` / `scrollbarWidth` / `taskbarHeight` | 待测量 | 真实 XP 截图测量后回填 |

### K.2 截图基线清单（Playwright `toHaveScreenshot`）

**✅ 已落地（#99）**：微组件 gallery（`?gallery` 路由，`src/gallery/Gallery.tsx`）逐组件渲染全部共享原件，`e2e-visual/gallery.spec.ts` 用 `toHaveScreenshot` 锁定 9 个基线（整页 + 8 个分区：按钮/输入/复选单选/下拉/滑块/进度条/tooltip/菜单栏）。独立配置 `playwright.visual.config.ts`（不干扰行为 e2e），CI 走官方 Playwright 容器 `mcr.microsoft.com/playwright:v1.57.0-jammy`（Chromium + 字体与 `-linux` 基线一致），workflow `.github/workflows/visual.yml`。基线重生成：`npm run test:visual:update`。

后续可补的整机画面基线（第二批，非本 issue 验收必需）：

1. 空桌面（图标 + 任务栏 + 开始按钮）
2. 开始菜单展开（双栏全貌）
3. 标准窗口（激活 + 非激活各一，含标题栏三按钮）
4. 模态对话框（含默认按钮描边）
5. Explorer（侧栏 + 工具栏 + 文件列表）
6. IE 窗口（工具栏 + 地址栏 + 状态栏）
7. 右键菜单展开
8. 关机对话框

---

## 浏览器环境的现实约束（🚫 条目的统一说明)

以下按键被浏览器或操作系统截获，**无法**原样仿真，处理原则是"提供 XP 原生就存在的替代路径优先，其次自定义键位，并在帮助中心（HelpAndSupport）内向用户说明"：

| 被截获 | 替代方案 |
|--------|---------|
| Win 键 | **Ctrl+Esc**（XP 原生等价键，浏览器不截获）→ KBD-03 |
| Alt+Tab | Alt+`（或可配置）；切换器覆盖层 UI 照常实现 → KBD-01 |
| Win+D/E/R | 任务栏"显示桌面"、开始菜单、运行对话框的鼠标路径 + 可配置键位 |
| F11 / Ctrl+W 等 | 不拦截，不模拟 |

## 修复批次（与 #87 对齐，2026-07 更新）

- **✅ 第一批·键盘部分已完成**（PR #111）：DSK-03/04/05 桌面键盘 + KBD-03 Ctrl+Esc
- **✅ Explorer 键盘已完成**（#87 第二批）：EXP-03 Backspace 上一级、EXP-04 F5/F2/Del；死菜单已由 #121 修复（层叠/平铺恢复 disabled 待 WIN-12 实现）
- **第一批·剩余（感知度 ⭐⭐⭐ 且 ❌，继续在 #87）**：WIN-03 最小化/最大化动画、DLG-01 模态行为（父窗口禁用 + 闪烁 + ding）、TSK-04 任务栏分组、WIN-12 层叠/平铺实现
- **Explorer 深化已独立为 #120**：EXP-02 详细信息视图（切换器）、EXP-08 地址栏历史下拉、目录树面板
- **第二批（#87）**：SND-03~05 声音接线（criticalStop/exclamation 已定义但零调用方，DLG-02）、TSK-08 BalloonTip 组件化（→ #118）、DLG-03~04（与 #124 可访问性合并实施）、CUR-02
- **样式基线批**：STY-03 token 化 → K.1 表落地 `src/theme`（与 #135 主题层第一接缝为同一份工作）→ K.2 整机画面基线补齐
- **持续**：全部 🔍 条目的核查转正（每次核查附截图或 e2e；样式类 🔍 一律以截图基线形式转正）；KBD 各条的跨平台可实施性列由 #132 审计矩阵回填

## 参考资料

- [XP.css](https://botoxparty.github.io/XP.css/) / [ShizukuIchi/winXP](https://github.com/ShizukuIchi/winXP) —— 视觉与交互参考实现（本项目已安装 xp.css，产物可直接查证：`node_modules/xp.css/dist/XP.css`）
- [Windows System Colours by OS (zaxbux gist)](https://gist.github.com/zaxbux/64b5a88e2e390fb8f8d24eb1736f71e0) / [Windows System Colours Reference (quppa.net)](https://www.quppa.net/syscol/) —— 各版本 Windows 系统色对照（K.1 系统色出处）
- [When Is Each Sound From A Windows Sound Scheme Played? (Digital Citizen)](https://www.digitalcitizen.life/when-each-sound-windows-sound-scheme-played/) —— 声音事件触发时机
- [List of Windows sounds (Microsoft Wiki)](https://microsoft.fandom.com/wiki/List_of_Windows_sounds) / [Internet Archive: ALL Windows XP Sounds](https://archive.org/details/windowsxpstartup_201910) —— XP 默认方案音源与事件清单
- 最终仲裁：Windows XP SP3 虚拟机实测
