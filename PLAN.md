# Windows XP 模拟器 TypeScript 迁移计划

## 概述

将 Windows XP 模拟器项目从 JavaScript 迁移到 TypeScript，目标是提高代码质量、类型安全性和可维护性，同时确保迁移过程的快速和高效。

## 核心原则

1. **快速完成优先**：利用 AI 的批量处理能力，快速完成主要文件的迁移
2. **类型安全基础**：确保核心类型定义的正确性，为后续开发奠定基础
3. **渐进式迁移**：先迁移简单文件，再处理复杂组件
4. **测试保障**：在迁移过程中保持测试的相对稳定

## 迁移策略

### 1. 分阶段迁移（共 3 阶段）

#### 阶段一：基础配置（快速完成，1 天）
- 安装 TypeScript 依赖
- 创建核心类型定义
- 更新构建配置

#### 阶段二：快速迁移（批量处理，2-3 天）
- 使用 subagent 批量迁移简单文件
- 处理相似组件的类型定义

#### 阶段三：验证和修复（1-2 天）
- 运行测试验证代码质量
- 修复主要类型错误
- 优化类型定义

### 2. 批量编辑策略

使用 subagent 的批量编辑能力，快速处理相似文件。

## 详细实施计划

### 阶段一：基础配置（1 天）

#### 1.1 安装依赖
```bash
npm install typescript @types/react @types/react-dom @types/styled-components --save-dev
```

#### 1.2 创建 TypeScript 配置
**文件**：`tsconfig.json`
**文件**：`tsconfig.node.json`
**文件**：`vite.config.ts`
**文件**：`vite.config.lib.ts`
**文件**：`vitest.config.ts`

#### 1.3 创建核心类型定义
**文件**：`src/types/index.ts`
```typescript
// 文件系统类型
export interface FileNode {
  type: 'file' | 'folder' | 'drive' | 'root' | 'app_shortcut';
  name: string;
  icon?: string;
  locked?: boolean;
  password?: string;
  broken?: boolean;
  children?: Record<string, FileNode>;
  content?: string;
  app?: string;
  hint?: string;
}

// 窗口类型
export interface WindowState {
  id: string;
  appId: string;
  title: string;
  component: React.ReactNode;
  componentProps?: any;
  icon?: string;
  props: WindowProps;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  width?: number;
  height?: number;
  left?: number;
  top?: number;
  badge?: string | number | null;
  progress?: number | null;
  isFlashing?: boolean;
  onOpen?: (id: string) => void;
  onClose?: (id: string) => void;
  onFocus?: (id: string) => void;
}

export interface WindowProps {
  singleton?: boolean;
  width?: number;
  height?: number;
  left?: number;
  top?: number;
  isMaximized?: boolean;
  onOpen?: (id: string) => void;
  onClose?: (id: string) => void;
  onFocus?: (id: string) => void;
  [key: string]: any;
}

// 用户会话类型
export interface UserSession {
  isLoggedIn: boolean;
  username: string;
}

// 剪贴板类型
export interface ClipboardItem {
  type: 'cut' | 'copy';
  sourcePath: string[];
  fileName: string;
}
```

### 阶段二：快速迁移（2-3 天）

#### 2.1 批量迁移简单文件

**使用 subagent 批量处理以下文件：**

1. **组件文件（18个）**
   - `src/components/*.jsx` → `src/components/*.tsx`
   - 重点：BootScreen、LoginScreen、Taskbar、Desktop 等简单 UI 组件

2. **应用程序文件（18个）**
   - `src/apps/*.jsx` → `src/apps/*.tsx`
   - 重点：Notepad、PhotoViewer、Calculator 等简单应用

3. **工具函数文件**
   - `src/utils/*.js` → `src/utils/*.ts`
   - 重点：emojiRenderer、soundManager 等简单工具

**批量编辑模板：**
```typescript
import React from 'react';

interface ComponentProps {
  // 通用属性
}

const Component: React.FC<ComponentProps> = ({ /* props */ }) => {
  return (
    // JSX 内容
  );
};

export default Component;
```

#### 2.2 处理核心上下文文件

**文件**：`src/context/FileSystemContext.tsx`
**文件**：`src/context/WindowManagerContext.tsx`
**文件**：`src/context/UserSessionContext.tsx`

#### 2.3 处理自定义 Hook 和工具函数

**文件**：`src/hooks/useApp.ts`
**文件**：`src/utils/WindowFactory.tsx`

### 阶段三：验证和修复（1-2 天）

#### 3.1 运行测试验证
```bash
npm test
```

#### 3.2 修复主要类型错误
- 处理 `any` 类型的使用
- 修复类型不匹配问题
- 优化类型定义

#### 3.3 构建验证
```bash
npm run build
npm run build:lib
```

## 测试策略

### 1. 保持现有测试覆盖
确保所有现有 9 个测试文件能够正常运行。

### 2. 快速测试方法
使用以下命令快速验证代码质量：
```bash
npm run build  # 检查是否有编译错误
npm run test -- --run  # 运行所有测试
npm run test -- --run --reporter verbose  # 详细测试输出
```

### 3. 重点测试文件
- `basic.test.js` - 基础应用渲染测试
- `Desktop_refresh.test.jsx` - 桌面刷新逻辑测试
- `ExplorerBroken.test.jsx` - 文件管理器处理损坏文件测试

## Clean Code 原则应用

### 1. 有意义的命名
- 类型名使用名词（`FileNode`, `WindowState`）
- 方法名使用动词（`getFile`, `openWindow`）

### 2. 小函数原则
- 保持函数短小（< 20 行）
- 每个函数只做一件事

### 3. 类型安全
- 避免 `any` 类型的滥用
- 为所有数据结构创建明确的类型

## 预期成果

### 1. 代码质量提升
- 类型安全的代码库
- 更好的可维护性
- 清晰的架构和类型定义

### 2. 开发体验改善
- 更好的代码提示和自动完成
- 更早的错误检测

### 3. 测试保障
- 保持 80% 以上的测试覆盖率
- 确保核心功能的测试通过

## 风险和应对策略

### 1. 类型定义不准确
**应对策略**：
- 优先为核心类型创建准确的定义
- 使用类型断言作为临时解决方案

### 2. 复杂组件迁移困难
**应对策略**：
- 分解复杂组件为多个小组件
- 先迁移核心逻辑，再处理边缘情况

### 3. 第三方库类型问题
**应对策略**：
- 使用 `@types/` 包提供的类型
- 为无类型库创建声明文件

### 4. 测试覆盖率下降
**应对策略**：
- 确保所有现有测试通过
- 为新类型和组件添加测试

## 资源需求

### 1. 开发工具
- TypeScript 5.0+
- VS Code 或其他支持 TypeScript 的编辑器
- Vitest 测试框架

### 2. 人员要求
- 熟悉 TypeScript 和 React 的开发者
- 能够使用 subagent 进行批量编辑

## 总结

这个迁移计划重点关注快速完成和相对稳定的代码质量。通过分阶段实施、批量编辑策略和测试保障，我们可以在 4-6 天内完成项目的基本迁移，确保代码质量的相对稳定。
