# 文件系统优化说明

## 优化内容

将 `filesystem.json` 中的大量内联文本内容提取到独立的文件中，使配置文件更加简洁和易于维护。

## 优化前后对比

### 优化前
- `filesystem.json`: 379 行，包含大量内联文本内容
- 所有文件内容直接嵌入在 JSON 中，难以编辑和维护
- 中文引号等特殊字符需要转义，容易出错

### 优化后
- `filesystem.json`: 379 行（结构保持不变，但内容引用外部文件）
- 8 个文本文件提取到 `src/data/filesystem_content/` 目录
- 文本内容可以直接编辑，无需担心 JSON 转义问题

## 新的文件结构

```
src/data/
├── filesystem.json              # 文件系统结构定义
└── filesystem_content/          # 文件内容存储
    ├── README.txt               # 给小灯的说明
    ├── 工作日志2015-2025.txt     # 夏建国工作日志摘录
    ├── 2015_12_18_周五.txt      # 日志条目
    ├── 2015_12_22_周二.txt
    ├── 2015_12_25_周五.txt
    ├── 2016_01_10_周日.txt
    ├── 2016_02_16_周二.txt
    └── About.html               # 关于页面
```

## 使用方式

### 在 filesystem.json 中引用外部内容

```json
{
  "type": "file",
  "name": "README.txt",
  "app": "Notepad",
  "contentPath": "filesystem_content/README.txt"
}
```

### FileSystemContext 自动加载

`FileSystemContext.jsx` 会在启动时自动：
1. 使用 `import.meta.glob` 加载所有 `filesystem_content/**/*.txt` 文件
2. 递归遍历文件系统树，将 `contentPath` 解析为实际内容
3. 将内容注入到对应的文件节点中

## 添加新文件内容

### 方法 1: 直接创建文件（推荐）

1. 在 `src/data/filesystem_content/` 目录下创建新的 `.txt` 文件
2. 在 `filesystem.json` 中添加文件节点，使用 `contentPath` 引用

```json
{
  "type": "file",
  "name": "新文件.txt",
  "app": "Notepad",
  "contentPath": "filesystem_content/新文件.txt"
}
```

### 方法 2: 使用提取脚本

如果你在 `filesystem.json` 中添加了内联内容（`content` 字段），可以运行提取脚本：

```bash
node scripts/extract_filesystem_content.js
```

脚本会自动：
- 提取所有长度 > 100 字符的内联内容
- 生成唯一的文件名
- 更新 `filesystem.json`，将 `content` 替换为 `contentPath`

## 技术细节

### import.meta.glob 配置

```javascript
const contentFiles = import.meta.glob('../data/filesystem_content/**/*.txt', {
  query: '?raw',        // 以原始文本形式导入
  import: 'default',    // 使用默认导出
  eager: true           // 立即加载（非懒加载）
});
```

### 内容解析函数

```javascript
const resolveContentPaths = (node) => {
  if (node.contentPath) {
    const fullPath = `../data/${node.contentPath}`;
    if (contentFiles[fullPath]) {
      node.content = contentFiles[fullPath];
    }
  }
  // 递归处理子节点...
};
```

## 优势

1. **易于编辑**: 文本内容可以直接在文本编辑器中编辑，无需担心 JSON 语法
2. **避免转义问题**: 不需要转义引号、换行符等特殊字符
3. **版本控制友好**: Git diff 更清晰，可以看到具体的文本变更
4. **模块化**: 内容和结构分离，职责更清晰
5. **可扩展**: 未来可以支持更多文件类型（Markdown、HTML 等）

## 注意事项

1. 所有 `contentPath` 都相对于 `src/data/` 目录
2. 文件必须存在于 `filesystem_content/` 目录中，否则会在控制台显示警告
3. 如果同时存在 `content` 和 `contentPath`，`content` 会被 `contentPath` 加载的内容覆盖
4. 提取脚本只处理长度 > 100 字符的内容，短文本可以保留在 JSON 中
