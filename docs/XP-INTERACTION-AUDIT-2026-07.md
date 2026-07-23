# Windows XP 交互与怀旧内容审计（2026-07）

> 范围：默认 Luna 主题下的任务栏／共享右键菜单、`cn-net-research/` 的可转化价值，以及 GTA Vice City 浏览器移植的集成可行性。最终视觉仲裁仍以真实 Windows XP SP3 虚拟机为准。

## 1. 本轮结论

1. **任务栏最明显的偏差不是整体蓝色，而是任务按钮细节和菜单锚点。** 当前按钮主体源自仓库内 `winXP` 参考，但漏掉了非激活按钮左上角的一像素高光；任务栏右键菜单又以鼠标点位为底边，导致右键点在按钮下半部时菜单侵入任务栏。
2. **共享右键菜单此前偏向“通用网页菜单”。** 黑色硬边、无模糊的灰色投影、12px 字号和立即出现的子菜单，都与 XP 默认菜单的系统色、11px Tahoma 以及默认 `MenuShowDelay` 语义不一致。
3. **任务按钮右键存在状态错误。** 右键最小化窗口会先将窗口恢复；菜单缺少“还原／移动／大小”，且“还原”错误地走了最大化切换逻辑。
4. **`cn-net-research/` 有价值，但应继续保持“研究语料库”身份。** 最值得转化的是状态机、资源切片、时代内容结构和 WASM／Flash 资产隔离方式，不是直接复制整套组件。
5. **不建议把 GTA VC Web 直接合入默认包。** 技术上可包成独立 iframe／自定义 App；法律、许可证、素材来源和部署体积则都不满足默认内置的门槛。更安全的边界是“宿主自带 URL／自有合法游戏数据的可选集成”，仓库不分发引擎二进制或游戏素材。

## 2. 任务栏与右键菜单：实测偏差和处理状态

| 项目             | 修正前证据                               | XP 目标                                     | 本轮处理                                                | 后续                                       |
| ---------------- | ---------------------------------------- | ------------------------------------------- | ------------------------------------------------------- | ------------------------------------------ |
| 非激活任务按钮   | 纯色块，左上角显得平                     | `winXP/Footer` 参考实现有 10×1px 的局部高光 | 已补回伪元素高光                                        | 用真实 XP 组件截图做像素差基线             |
| 激活／按下态     | 已采用 `#1E52B7` 与内凹阴影              | 激活按钮为深蓝内凹                          | 保留，不额外“渐变美化”                                  | 核对中文 ClearType 下文字基线              |
| 任务栏菜单锚点   | 菜单底边停在鼠标 Y，侵入任务栏约 10–15px | 菜单从任务栏上沿向上展开                    | 已改为锚定任务栏／任务按钮上沿，并加 e2e 几何断言       | 覆盖缩放视口和嵌入模式                     |
| 菜单表面         | `#F0F0F0`、黑边、硬质 2px 灰影           | XP `Menu` 系统色米灰面、灰边、软投影        | 已改用主题 `SURFACE`／`DIVIDER_GREY` 和 3px 软投影      | 用 SP3 截图取样确认阴影透明度              |
| 菜单文字         | 12px，无统一字体声明                     | Tahoma 8pt（Web 近似 11px），中文宋体回退   | 已走主题 UI 字体与 11px                                 | 核对禁用文字的浮雕亮边                     |
| 子菜单展开       | CSS `:hover` 立即显示                    | XP 默认菜单存在约 400ms 展开延迟            | 已加入 400ms 延迟                                       | 补键盘左右键导航与跨屏翻转                 |
| 任务按钮系统菜单 | 仅最大化／最小化／关闭                   | 还原、移动、大小、最小化、最大化、关闭      | 已补齐结构、禁用态和 `Alt+F4`；修复最小化窗口被右键恢复 | “移动／大小”暂禁用，待接入完整键盘交互模式 |

参考证据：

- 仓库内参考实现：`xp-research/winXP/src/WinXP/Footer/index.js`。
- 真实 XP 任务栏菜单截图可见完整的窗口排列、显示桌面、任务管理器、锁定任务栏和属性结构：[PeteNetLive 的 Windows XP SP3 截图](https://www.petenetlive.com/KB/Article/0000364)。
- 本项目权威 token 和验收矩阵：`FIDELITY.md` §K.1、TSK-05、TSK-09、STY-07、ANM-02。

## 3. 下一轮视觉优化优先级

### P0：可验证的交互错误

- 为任务按钮系统菜单实现真正的键盘“移动／大小”模式；在完成前保持禁用，避免做出可点但无效果的假功能。
- 给共享 `ContextMenu` 增加键盘焦点、上下选择、左右进入／退出子菜单、Esc 关闭和默认项激活。
- 子菜单靠近右／下边缘时向左／向上翻转；当前只校正根菜单。
- 右键切换目标时应在新位置直接替换菜单，不能出现浏览器原生菜单或先关闭再闪烁。

### P1：组件级视觉基线

- 新建专门的任务栏按钮、空白任务栏菜单、最小化窗口系统菜单三张组件截图，而不是依赖整屏截图。
- 在 100%、125% 和项目的缩放视口下核对 30px 任务栏、22px 按钮和文字垂直基线。
- 将菜单表面、禁用文字、分隔线、箭头和阴影逐项与 XP SP3 VM 截图并排放大 8 倍核验。

### P2：仍待核查的壳层细节

- 快速启动栏的抓手、分隔线和显示桌面按钮；当前任务栏中只有占位分隔结构。
- 系统托盘隐藏图标箭头、气泡尾部锚点、时钟宽度在 12／24 小时制下的变化。
- 任务分组菜单的组标题、窗口顺序、组内右键命令与 XP 默认分组阈值。
- 任务栏“属性”和“锁定任务栏”目前仍是占位／禁用，TSK-09 不能转为完成。

## 4. `cn-net-research/`：可以参考什么

该目录已经正确地被 `.gitignore`、Vite watch 和 TypeScript 构建隔离。建议保留这个边界，并按“机制／内容／素材”三层使用：

| 语料                                         | 最值得借鉴                                           | 适合落点                                      | 不应直接复制的部分                                   |
| -------------------------------------------- | ---------------------------------------------------- | --------------------------------------------- | ---------------------------------------------------- |
| `security-tools/qt_360_safe`                 | 多模块导航、扫描进度、资源切片和桌面软件状态层级     | `SafeGuard360` 的信息架构与交互状态           | Qt 控件代码、来源不明的商标素材                      |
| `security-tools/LooksLike360safe`            | 可快速运行的页面切换与启动态                         | 只用于对照现代 360 与旧版 360 的差别          | “领航版”视觉晚于本项目主要年代，不能反向覆盖时代基准 |
| `download-video/XMP-VideoPlayer-Duilib`      | XML 皮肤布局、播放列表／控制栏／菜单的空间关系       | `BaofengPlayer`、`Thunder` 的老式媒体壳层研究 | 它复刻的是迅雷看看，不能把品牌样式直接套给暴风影音   |
| `music-players/ttplayer-react`               | Web 音频状态、频谱、播放队列                         | `TTPlayer` 的机制参考                         | 现代 React 视觉和未经核实的素材                      |
| `music-players/TTKMusicPlayer`               | 大型播放器的皮肤资源组织                             | `KugouMusic` 的皮肤包／资源清单设计           | Qt 实现和较晚版本酷狗视觉                            |
| `qq-zone/last-qq-group`                      | 零依赖叙事节奏、聊天记录作为线索、怀旧内容与谜题结合 | scenario/content pack 示例                    | CRT 扫描线是作品风格，不是 QQ2006 或 XP 系统视觉     |
| `old-portals/openhao123.github.io`           | 大量时代链接、栏目和图标构成的内容语料               | IE 内的离线时代网页 content pack              | 失效脚本、跨域 iframe、未逐项确认授权的素材          |
| `web-games/qqpet_automation`／`qqpet-online` | Ruffle/WASM 懒加载、游戏资产与壳层分离、存档边界     | 可选 Web 游戏 App 的通用机制                  | SWF、QQ 品牌和游戏资源不能随 npm 包默认分发          |
| `chat-tools/msn-react-clone`                 | 登录窗→联系人→聊天窗的阶段状态机                     | 英文文化包的 Messenger 内容机制               | Gemini 后端和现代化装饰不属于 XP fidelity            |

转化顺序建议：

1. 先把“资源清单、状态机、事件”整理为声明式数据或 App provider 接口。
2. 再用本项目 token 和共享 XP primitives 重建 UI，不把参考项目 CSS 整块移入。
3. 最后逐项做许可证和素材来源审计；没有明确许可的图片只用于本地比对，不进入 `src/assets` 或发布包。

## 5. GTA Vice City Web：质量核验

截至 2026-07-22，能明确定位的两个仓库是：

| 仓库                                                            | 质量信号                                                 | 许可证／来源信号                                                                                              | 结论                                             |
| --------------------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| [`Lolendor/reVCDOS`](https://github.com/Lolendor/reVCDOS)       | 339 stars、149 forks、4 位贡献者；2026-05-29 仍有 push   | 仓库标 MIT，但 README 明说是 DOS.Zone 版本的“deobfuscated”实现，默认还可代理第三方 CDN 资源                   | 有研究价值，不足以成为默认依赖或可信素材源       |
| [`Carter54git/revcdos`](https://github.com/Carter54git/revcdos) | 102 stars、23 forks、2 位贡献者；最近 push 为 2026-01-04 | GitHub 无许可证；README 称其为 DOS.Zone 官方实现，要求保留署名、云存档和 Logo，并要求用户提供原版 GTA VC 数据 | 技术入口较可信，但授权条件不清，不可直接合并发布 |

仓库质量不属于“0 star 一夜项目”，但成熟度仍有限：两个仓库都创建于 2025-12，贡献者很少，且官方二进制仓库没有标准许可证。更关键的是，DOS.Zone 托管版本已收到 Take-Two 的 DMCA 下架请求；这不是抽象风险，而是同一实现已经发生的外部状态。[GamesRadar 的下架报道](https://www.gamesradar.com/games/grand-theft-auto/gta-vice-city-was-briefly-playable-in-your-browser-until-rockstar-owner-take-two-reportedly-struck-it-down/)、[Tom's Hardware 的 DMCA 报道](https://www.tomshardware.com/video-games/browser-run-copy-of-grand-theft-auto-gets-taken-down-by-dcma-take-two-says-dos-zone-infringed-companys-intellectual-property-rights-despite-disclaimers-and-requirement-to-own-original-copy-of-title-to-run-full-game-online)。

## 6. GTA VC Web：技术适配与决策

### 技术上如何接入

官方 README 描述的客户端由 Emscripten/WASM、`game.js`、IndexedDB 文件系统和按需资产请求组成：启动资源约 50MB，其余数据运行时加载；宿主页通过 `postMessage` 向游戏 iframe 提供预加载文件和异步 URL。用户必须提供原版游戏数据，再通过仓库脚本转换成兼容资源。

因此它不适合被编译进 `@caoergou/windows-xp` 主 bundle。若未来法律审查通过，合理形态应是：

```text
Windows XP engine
  └─ optional consumer app registration
      └─ sandboxed game iframe（独立 origin）
          ├─ user-supplied reVCDOS endpoint
          ├─ explicit postMessage adapter
          ├─ pointer-lock / fullscreen user gesture
          └─ game-owned IndexedDB / save namespace
```

这个边界同时保护 package-first 原则：引擎不注册 Service Worker、不要求宿主页改安全头、不占用宿主 IndexedDB 键、不把大体积 WASM／资产塞进 npm 包。

### 当前决策：不直接合并

- **不复制** reVCDOS 二进制、反混淆代码、CDN 地址、Logo 或 GTA 游戏数据到仓库。
- **不在默认中文桌面放置可用的 GTA VC 快捷方式**，避免把不稳定外部服务包装成项目能力。
- 可以在文档或示例中提供一个**品牌中立的外部 Web 游戏 App recipe**：URL 由使用者配置，默认无 URL、无素材、无网络请求。
- 若用户拥有合法数据并自行部署，可用自定义 App 或 IE iframe 打开其 endpoint；宿主自行承担来源、许可证、安全头、带宽和存档策略。
- 在决定做正式 provider 前，至少需要：书面许可证结论、无侵权素材的最小启动路径、CSP／sandbox／pointer-lock 威胁模型、存储前缀方案和 50MB 冷启动性能预算。

## 7. 可执行路线图

1. 完成 `ContextMenu` 键盘与子菜单翻转，转正 STY-07 的“共享右键菜单”子项。
2. 完成任务按钮“移动／大小”交互，再将 TSK-05 从部分完成转为完成。
3. 从 `cn-net-research` 产出三个独立设计说明：360 状态机、老播放器皮肤资源模型、Web 游戏 provider；不搬运素材。
4. 建立品牌中立的 `ExternalWebApp`／recipe，验证 iframe、事件桥和存储隔离；用自有测试页而不是 GTA 做验收。
5. GTA VC 仅在法律和许可证审查通过后，作为 consumer-owned integration 示例重新评估。
