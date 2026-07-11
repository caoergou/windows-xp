# AGENTS.md — 项目总览与核心原则

> 这是总览性文件（定位类似 `CLAUDE.md`）：只讲项目是什么、三条核心原则和"去哪查细则"。**不要在本文件堆砌具体规则**——细则各有其家（见文档地图）。

## 项目定位

一个**可嵌入、可定制、可编剧的 Windows XP 桌面引擎 npm 包**（`@caoergou/windows-xp`），不只是一次性的模拟器页面。目标场景：个人主页外壳、品牌营销页、网页解谜游戏、怀旧内容站、教学沙盒（逐场景需求推导见 `docs/USE-CASES.md`）。

平台级远景（#143 RFC，`docs/OS-PLATFORM-VISION.md`）：引擎与"XP"逐步解耦，OS 本身成为可定义的包——XP 是第一个也是默认的 OS 包。在此之前，保真第一的原则不变。

## 三大核心原则（按优先级）

1. **保真第一**：忠实还原 XP，不做"现代化改良版"。每个视觉/交互决定都应能指出 XP 里的对应物（截图、录屏或参考实现）；不自行"美化"，哪怕你觉得更好看。唯一例外是无障碍改进（键盘可达、aria），且不得改变视觉呈现。
2. **包优先（embedding-safe）**：任何代码都可能运行在别人的应用里。不新增全局副作用，不劫持宿主页面，存储一律走带前缀的工具层。
3. **机制与内容分离**：桌面内容（文件、快捷方式、剧情、文化元素）用声明式数据描述，组件只实现机制。判断标准：**新增一条内容不应需要写 React 代码**。

## 文档地图

| 你想知道… | 去这里 |
|-----------|--------|
| 使用方 API：props、事件、ref、子路径导入、内容/文化包编写 | `USAGE.md` |
| 架构、目录结构、开发命令、如何加应用/文件 | `CLAUDE.md` |
| 某个视觉/交互在真实 XP 里长什么样、现在差多少、颜色字体的**权威 token 值** | `FIDELITY.md`（§K.1 token 表，每个值带出处） |
| 代码怎么写：组件规范、质量红线、i18n、彩蛋政策、提交前检查清单 | `docs/DEVELOPMENT.md` |
| 工作流：如何跑检查、发 PR | `CONTRIBUTING.md` |
| 路线图与任务拆分 | GitHub issue #86（Roadmap）+ #143（平台化 RFC） |
| 五个使用场景各需要什么（博客/营销/游戏/怀旧/教学） | `docs/USE-CASES.md` |
| 解谜游戏的机制→事件→编排推导 | `docs/PUZZLE-DESIGN.md` |
| 多 OS / 自定义 OS 的平台化架构 | `docs/OS-PLATFORM-VISION.md` |
| 2026-07 全面审计（现状、缺口、issue 索引） | `docs/PROJECT-ANALYSIS-2026-07.md` |

## 十条最常犯的红线（速查）

1. 不加 XP 没有的视觉/交互（现代圆角、柔和阴影、边缘吸附、平滑滚动）
2. 颜色/字体只用 `FIDELITY.md` §K.1 的 token 值，**不许拍脑袋写色值**；中文字体宋体优先（雅黑是 Vista+）
3. 不新增 `window` 级监听、全局 CSS 裸选择器、模块级单例
4. localStorage/IndexedDB 必须走带 `storagePrefix` 的工具层
5. 窗口 `componentProps` 必须可序列化（刷新恢复的命门）
6. styled-components 非 DOM 属性加 `$` 前缀
7. 禁止新增 `@ts-nocheck` / `any`
8. 面向用户的文案一律 i18n key，禁止硬编码中英文
9. 声音走 `soundManager` 的事件映射，禁止 `new Audio`
10. 改交互/样式的 PR 必须同步更新 `FIDELITY.md` 对应条目状态
11. **机制与"XP 的样子"分层**（#143 预备）：引擎目录（`context`/`hooks`/`utils`/`events.ts`/`snapshot.ts`）禁止出现颜色字面量、xp.css 依赖和 XP 专属 chrome 假设——`guard:purity` 在 CI 强制
12. 内联 hex 色值存量**只减不增**（`guard:purity` 棘轮计数）；新应用菜单只传结构化数据给 `XPMenuBar`，不自绘菜单 DOM（为 #128 `menus:` 迁移留路）

## 参考资源

- `FIDELITY.md` 附录列出全部权威参考（xp.css、winXP、系统色对照表、声音方案文档）
- 最终仲裁：真实 Windows XP SP3 虚拟机实测
