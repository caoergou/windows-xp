# 开场引导系统实现文档

## 实现概述

已完成《山月无声》游戏的开场引导系统，包括：

1. **用户进度追踪系统** (`UserProgressContext`)
2. **首次登录引导对话框** (`FirstLoginGuide`)
3. **桌面便签闪烁提示** (`StickyNote` 增强)

---

## 实现的功能

### 1. 用户进度追踪系统

**文件**: `src/context/UserProgressContext.jsx`

**功能**:

- 追踪玩家游戏进度（首次登录、便签已读、QQ登录、各阶段解密等）
- 自动持久化到 `localStorage`（键名：`xp_game_progress`）
- 提供进度标记方法和重置功能

**进度标记**:

```javascript
{
  firstLogin: true,              // 首次登录
  stickyNoteRead: false,         // 便签已读
  qqLoggedIn: false,             // QQ已登录
  albumUnlocked: false,          // 相册已解锁
  fatherLogLayer1Unlocked: false,// 父亲日志第一层已解锁
  encryptedDiaryUnlocked: false, // 加密日志已解锁
  fatherLogLayer2Unlocked: false,// 父亲日志第二层已解锁
  reportRead: false,             // 调查报道已读
  gameCompleted: false,          // 游戏完成
  investigationNotes: []         // 调查笔记列表
}
```

**API**:

```javascript
const {
  progress,                      // 当前进度对象
  markStickyNoteRead,           // 标记便签已读
  markQqLoggedIn,               // 标记QQ已登录
  markAlbumUnlocked,            // 标记相册已解锁
  // ... 其他标记方法
  addInvestigationNote,         // 添加调查笔记
  resetProgress                 // 重置进度（用于测试）
} = useUserProgress();
```

---

### 2. 首次登录引导对话框

**文件**: `src/components/FirstLoginGuide.jsx`

**功能**:

- 在首次登录时自动显示（延迟1秒，等待桌面加载完成）
- Windows XP 风格的对话框设计
- 引导玩家点击桌面便签开始游戏
- 提示密码格式（生日：YYYYMMDD）

**触发条件**:

```javascript
progress.firstLogin === true && progress.stickyNoteRead === false
```

**UI特点**:

- 半透明黑色遮罩层
- XP风格蓝色标题栏
- 淡入+滑入动画效果
- 高亮关键信息（便签、生日）
- 点击遮罩或按钮关闭

---

### 3. 桌面便签闪烁提示

**文件**: `src/components/StickyNote.jsx`（已增强）

**新增功能**:

- 首次登录时自动闪烁10秒（金色光晕效果）
- 标题显示手指图标 👆 吸引注意
- 点击后自动标记为已读，停止闪烁
- 自动打开文件管理器到D盘

**闪烁效果**:

```css
@keyframes glow {
  0%, 100% {
    box-shadow: 0 0 20px rgba(251, 191, 36, 0.6);
  }
  50% {
    box-shadow: 0 0 40px rgba(251, 191, 36, 0.9);
  }
}
```

---

## 集成方式

### Context Provider 层级

在 `src/main.jsx` 中添加了 `UserProgressProvider`：

```javascript
<UserSessionProvider>
  <UserProgressProvider>        {/* 新增 */}
    <FileSystemProvider>
      <WindowManagerProvider>
        <App />
      </WindowManagerProvider>
    </FileSystemProvider>
  </UserProgressProvider>
</UserSessionProvider>
```

### Desktop 组件集成

在 `src/components/Desktop.jsx` 中添加了 `FirstLoginGuide` 组件：

```javascript
<DesktopContainer>
  {/* ... 其他内容 */}
  <StickyNote />
  <FirstLoginGuide />  {/* 新增 */}
</DesktopContainer>
```

---

## 用户体验流程

### 首次登录流程

1. **登录后进入桌面** (0秒)
   - 桌面加载完成
   - 便签开始闪烁（金色光晕）

2. **引导对话框出现** (1秒后)
   - 半透明遮罩覆盖桌面
   - XP风格对话框滑入
   - 显示引导文字

3. **玩家阅读引导** (用户操作)
   - 了解游戏开始方式
   - 了解密码格式
   - 点击"我知道了"关闭对话框

4. **点击便签** (用户操作)
   - 便签停止闪烁
   - 自动打开文件管理器到D盘
   - 标记 `stickyNoteRead = true`
   - 标记 `firstLogin = false`

5. **后续登录** (再次进入游戏)
   - 不再显示引导对话框
   - 便签不再闪烁
   - 直接进入游戏

---

## 测试方法

### 测试首次登录

1. 清除浏览器 localStorage：

   ```javascript
   localStorage.removeItem('xp_game_progress');
   ```

2. 刷新页面

3. 验证：
   - ✅ 1秒后出现引导对话框
   - ✅ 便签闪烁金色光晕
   - ✅ 便签标题显示 👆
   - ✅ 点击"我知道了"关闭对话框
   - ✅ 点击便签停止闪烁并打开D盘

### 测试重复登录

1. 完成首次登录流程

2. 刷新页面

3. 验证：
   - ✅ 不再显示引导对话框
   - ✅ 便签不再闪烁

### 测试进度重置

在浏览器控制台执行：

```javascript
// 获取 UserProgressContext
// 调用 resetProgress()
localStorage.removeItem('xp_game_progress');
location.reload();
```

---

## 文件清单

### 新增文件

1. `src/context/UserProgressContext.jsx` - 用户进度追踪系统
2. `src/components/FirstLoginGuide.jsx` - 首次登录引导对话框

### 修改文件

1. `src/main.jsx` - 添加 UserProgressProvider
2. `src/components/Desktop.jsx` - 添加 FirstLoginGuide 组件
3. `src/components/StickyNote.jsx` - 添加闪烁效果和进度追踪

---

## 后续扩展

### 已预留的进度标记

以下进度标记已在 `UserProgressContext` 中定义，可在后续功能中使用：

- `markQqLoggedIn()` - QQ登录后调用
- `markAlbumUnlocked()` - 破解相册后调用
- `markFatherLogLayer1Unlocked()` - 破解父亲日志第一层后调用
- `markEncryptedDiaryUnlocked()` - 破解林晓宇加密日志后调用
- `markFatherLogLayer2Unlocked()` - 破解父亲日志第二层后调用
- `markReportRead()` - 阅读调查报道后调用
- `markGameCompleted()` - 游戏结束时调用

### 调查笔记系统

已预留 `addInvestigationNote(noteId, content)` 方法，用于后续实现调查笔记自动打字系统。

---

## 设计决策

### 为什么延迟1秒显示引导对话框？

- 让桌面先完全加载，避免视觉混乱
- 给玩家短暂的观察时间
- 更自然的引导体验

### 为什么便签闪烁10秒后停止？

- 避免长时间闪烁造成视觉疲劳
- 10秒足够吸引玩家注意
- 如果玩家仍未点击，说明可能在阅读引导对话框

### 为什么使用 localStorage 而非 sessionStorage？

- 玩家可能中途关闭浏览器
- 需要跨会话保存进度
- 方便测试和调试（可手动清除）

---

## 已知问题

无

---

## 构建状态

✅ 构建成功（2026-02-08）

```
✓ 1836 modules transformed.
✓ built in 1.31s
```

---

**实现者**: Claude
**完成时间**: 2026-02-08
**状态**: ✅ 完成
