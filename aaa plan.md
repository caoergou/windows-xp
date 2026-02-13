Claude’s Plan
Landing Page 改进计划
Context
当前 Landing Page 存在三个问题：(1) 内容单调，缺少虚构声明和游戏建议；(2) 每次访问都强制展示 Landing Page，回访用户体验差；(3) 需要一个贴合主题的域名。

修改文件
src/App.jsx -- 启动流程逻辑
src/components/LandingPage.jsx -- Landing Page 内容与样式

1. 回访用户跳过 Landing Page
修改 src/App.jsx，将 bootPhase 的初始值从硬编码 'LANDING' 改为根据 localStorage 状态动态判断：

const getInitialBootPhase = () => {
  const hasVisited = localStorage.getItem('shanyue_has_visited') === 'true';

  // 首次访问：展示完整 Landing Page
  if (!hasVisited) return 'LANDING';

  const firstBootDone = localStorage.getItem('xp_first_boot_done');
  const powerState = localStorage.getItem('xp_power_state');

  // 未完成首次启动 / 关机 / 重启 / 注销 -> 开机画面
  if (!firstBootDone || powerState === 'shutdown' || powerState === 'restart' || powerState === 'logout') {
    return 'BOOTING';
  }

  // 已登录且运行中 -> 屏保过渡
  if (localStorage.getItem('xp_logged_in') === 'true') {
    return 'SCREENSAVER';
  }

  // 其他情况 -> 登录界面
  return 'RUNNING';
};

const [bootPhase, setBootPhase] = useState(getInitialBootPhase);
同时删除 useEffect 中的 setBootPhase('LANDING') 行。

1. Landing Page 内容补充
在 src/components/LandingPage.jsx 中添加两块新内容：

2a. 游戏提示区域（ButtonGroup 下方）
位于按钮下方，延迟淡入，混合风格 -- 前两条实用建议，后两条叙事氛围：

推荐使用 Chrome / Edge 浏览器，全屏体验更佳
准备好纸笔 -- 记录你发现的每一条线索
留意时间、细节与矛盾之处
不要轻信任何单一来源的信息
前两条用略亮的颜色（#8899aa），后两条用更暗的颜色（#6a7a8a）+ 斜体，营造从实用到氛围的过渡感。

小屏幕（max-height: 700px）隐藏此区域，避免溢出。

2b. 虚构声明（页面底部）
位于 BottomInfo 上方，绝对定位，极小字号（10-11px），低调但可见。只声明虚构，不提及具体题材：

本作品纯属虚构，所有人物、事件、地点均为艺术创作。如有雷同，纯属巧合。
调整 BottomInfo 位置为 bottom: 20px，Disclaimer 位于 bottom: 50px。

1. 域名建议
偏长、有表达力的方向：

域名 说明
shanyuewusheng.cc 完整游戏名「山月无声」音译，搜索友好，一眼对应，.cc 约 $3-5/年
shanyuewusheng.ink 同上 + .ink 呼应游戏中文字记录/证据的主题
silentmountainmoon.site 英文全称，诗意，国际化友好，.site 约 $1-2/年
thesilentmoon.ink 英文变体，「沉默的月亮」，更有文学感
digitalarchaeology.site 「数字考古」-- 游戏核心玩法的直接表达
whatremains2015.cc 「留下了什么 2015」-- 悬疑感，暗示被遗忘的真相
dustydesktop.cc 「尘封的桌面」-- 直指游戏载体（父亲遗留的旧电脑）
tenyearsofsilence.site 「十年沉默」-- 2015到2026的时间跨度，主题直击
推荐首选：shanyuewusheng.ink（完整游戏名 + .ink 与文字证据主题呼应，中文玩家一眼认出）

验证方式
首次访问（清除 localStorage）：应展示完整 Landing Page，含提示和声明
点击进入后刷新页面：应跳过 Landing，直接进入开机画面或屏保
关机/重启后刷新：应跳过 Landing，进入开机画面
小屏幕测试：提示区域应隐藏，声明和底部文字不重叠
