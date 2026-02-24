# 创建证据照片 EXIF 文件（photo_002 至 photo_005）

**类别**：B类
**优先级**：中
**依赖**：依赖 A02（先确认正确的相机型号和参数格式）
**修改文件**：`src/data/photos/evidence/`（新建4个文件）

## 背景

设计要求每张证据照片都有对应的 EXIF JSON 文件，当前只有 photo_001_exif.json（且参数错误）。缺少其余4张照片的 EXIF 文件，玩家无法通过查看照片属性获取时间戳等取证信息，削弱了"数字考古"的沉浸感。

## 具体修改内容

在 `src/data/photos/evidence/` 目录下新建以下4个 EXIF 文件，格式与 photo_001_exif.json 保持一致：

**photo_002_exif.json**（照相馆门口陌生男子）：
- 相机：Canon EOS 550D
- 光圈：f/2.8，快门：1/125，ISO：400
- 拍摄时间：2015-11-20 14:32:07
- GPS：无（林晓宇手动清除）
- 用户注释：Camera is the 3rd eye

**photo_003_exif.json**（城西工地现金交易）：
- 相机：Canon EOS 550D
- 光圈：f/4.0，快门：1/200，ISO：800
- 拍摄时间：2015-12-15 16:23:41
- GPS：无
- 用户注释：Camera is the 3rd eye

**photo_004_exif.json**（机房窗户深夜亮灯）：
- 相机：Canon EOS 550D
- 光圈：f/1.8，快门：1/30，ISO：3200
- 拍摄时间：2015-12-02 03:10:22
- GPS：无
- 用户注释：Camera is the 3rd eye

**photo_005_exif.json**（图书馆对峙自拍）：
- 相机：Canon EOS 550D
- 光圈：f/2.8，快门：1/125，ISO：400
- 拍摄时间：2016-02-14 15:42:18
- GPS：无
- 用户注释：Camera is the 3rd eye

## 验收标准

- `src/data/photos/evidence/` 目录下存在 photo_002 至 photo_005 共4个 EXIF 文件
- 所有文件相机型号均为 Canon EOS 550D
- 拍摄时间与时间线.md 中对应事件时间一致
- photo_004 的时间戳（2015-12-02 03:10）与夏父日志"深夜路过学校看到机房灯亮"可形成交叉验证
