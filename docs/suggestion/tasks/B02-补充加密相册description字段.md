# 补充加密相册 description 字段

**类别**：B类
**优先级**：高
**依赖**：无
**修改文件**：`src/data/qzone/linxiaoyu/albums.json`

## 背景

albums.json 中加密相册缺少 description 字段，玩家面对加密相册时没有任何密码提示，也没有引导去看加密日志的文字。这是从谜题1到谜题3的叙事桥梁，缺失会导致玩家在阶段二到阶段三的过渡中失去方向。

## 具体修改内容

在 albums.json 的加密相册对象中，添加 description 字段，内容为：

```
能定格时间的三个数字。
爸爸说，摄影师用光圈、快门、感光度控制光。
这三个数字，是我的密码，也是我的信仰。

解锁后，记得去看我的日志《第三只眼》。
```

同时确认 coverImg 字段有值（可设为 zhang_yu_photo_studio.jpg 或任意占位图路径），避免相册封面显示为空。

## 验收标准

- albums.json 加密相册包含 description 字段
- description 内容包含"光圈、快门、感光度"的暗示
- description 内容包含引导去看《第三只眼》日志的文字
- coverImg 字段不为空字符串
