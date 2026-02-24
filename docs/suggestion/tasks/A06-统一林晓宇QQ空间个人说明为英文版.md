# 统一林晓宇 QQ 空间个人说明为英文版

**类别**：A类
**优先级**：高
**依赖**：无
**修改文件**：
- `docs/解密.md`（林晓宇个人说明引用处）
- `docs/设计.md`（说说数据结构 signature 字段说明处）

## 背景

林晓宇 QQ 空间个人说明在三处文档中各不相同：解密.md 为"前两只眼看世界，第三只看真相"，设计.md 为"相机是第三只眼"，实际数据 qzone/linxiaoyu/index.json 为"Camera is the 3rd eye."。谜题3的密码是 camera3rdeye，隐写文字也是"Camera is the 3rd eye"。如果设计文档引用中文版，开发者可能误将实际数据改为中文，导致玩家无法从个性签名联想到英文密码，谜题3线索链断裂。

## 具体修改内容

1. `docs/解密.md`：将林晓宇个人说明的引用从"前两只眼看世界，第三只看真相"修改为"Camera is the 3rd eye."，并在括号内注明"与密码一致，保持英文"
2. `docs/设计.md`：将 signature 字段示例从"相机是第三只眼"修改为"Camera is the 3rd eye."

实际游戏数据 `src/data/qzone/linxiaoyu/index.json` 中的 description 字段已经是正确的英文版，不需要修改。

可在群聊或说说中保留中文翻译"相机是第三只眼"作为辅助理解，但个性签名本身必须为英文。

## 验收标准

- 解密.md 和设计.md 中林晓宇个人说明的引用均为"Camera is the 3rd eye."
- 实际数据 index.json 中 description 字段保持"Camera is the 3rd eye."不变
- 设计文档中不再出现将个性签名定义为中文的表述
