---
name: session-commit
description: 智能提交会话中的修改到 Git 并推送。当用户要求提交本会话中的修改、创建 commit、或 push 代码时使用。特别适用于需要精准提交会话修改而不包含其他人修改的场景。
---

# Session Commit

智能提交会话中的修改到 Git 仓库。

## 核心原则

1. **只提交会话中的修改** - 基于会话历史，只提交 Claude 在本次对话中实际修改的内容
2. **精准的提交信息** - 根据修改内容生成准确的 commit message
3. **处理冲突** - 如果文件被其他人修改，只保留会话中的修改部分

## 工作流程

### 1. 识别会话中修改的文件

回顾会话历史，列出所有通过 Edit 或 Write 工具修改的文件：

```
会话中修改的文件：
- AGENTS.md: 将整个文件翻译成中文
- src/components/App.jsx: 添加了新功能
```

### 2. 检查 Git 状态

```bash
git status
```

查看当前工作区状态，确认哪些文件有修改。

### 3. 处理文件修改

对于每个会话中修改的文件：

**情况 A：文件只有会话中的修改**

```bash
git add <file>
```

**情况 B：文件有其他人的修改（冲突）**

使用 `git diff` 查看差异：

```bash
git diff <file>
```

分析差异，确定哪些是会话中的修改，哪些是其他人的修改。

如果需要只提交会话中的部分修改，使用交互式暂存：

```bash
git add -p <file>
```

然后选择性地暂存会话中修改的 hunks（选择 `y` 暂存，`n` 跳过）。

### 4. 生成提交信息

根据修改内容生成符合项目规范的 commit message：

**单文件修改**：

```
docs: 将 AGENTS.md 翻译成中文
```

**多文件修改**：

```
chore: 更新多个文件

- AGENTS.md: 翻译成中文
- src/App.jsx: 添加新功能
```

**提交信息格式**：

- 使用项目的 commit 规范（如果在 CLAUDE.md 或 AGENTS.md 中有说明）
- 简洁描述修改内容
- 添加 Co-Authored-By 标记

### 5. 创建提交

```bash
git commit -m "$(cat <<'EOF'
<commit message>

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
EOF
)"
```

### 6. 推送到远程

```bash
git push
```

如果推送失败（如远程有新提交），先拉取：

```bash
git pull --rebase
git push
```

## 示例场景

### 场景 1：简单修改，无冲突

```bash
# 1. 检查状态
git status

# 2. 暂存文件
git add AGENTS.md

# 3. 提交
git commit -m "$(cat <<'EOF'
docs: 将 AGENTS.md 翻译成中文

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
EOF
)"

# 4. 推送
git push
```

### 场景 2：文件有冲突，需要精准提交

```bash
# 1. 查看差异
git diff AGENTS.md

# 2. 使用交互式暂存
git add -p AGENTS.md
# 对于会话中修改的部分选择 'y'
# 对于其他人修改的部分选择 'n'

# 3. 提交
git commit -m "$(cat <<'EOF'
docs: 将 AGENTS.md 翻译成中文

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
EOF
)"

# 4. 推送
git push
```

## 注意事项

1. **始终基于会话历史** - 只提交通过工具实际修改的内容
2. **检查 git status** - 确认要提交的文件列表
3. **使用 HEREDOC** - 提交信息使用 HEREDOC 格式确保格式正确
4. **遵循项目规范** - 参考 CLAUDE.md 或 AGENTS.md 中的 Git 规范
5. **处理推送失败** - 如果 push 失败，使用 `git pull --rebase` 后重试
