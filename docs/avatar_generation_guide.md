# 《山月无声》角色头像生成指南

## 整体风格要求

- 2015年QQ头像风格
- 真实照片质感，但略带柔光滤镜（符合当时流行的美图秀秀风格）
- 正方形构图，128x128px或更高分辨率
- 背景虚化或纯色

---

## 角色头像Prompt

### 1. 夏灯（女主角）

```
A profile photo of a Chinese teenage girl, around 16 years old, short black hair, gentle and melancholic eyes, wearing a simple white t-shirt, soft natural lighting, slightly blurred background, 2015 QQ avatar style, realistic photo with subtle beauty filter, square composition
```

**关键词**：内向、忧郁、安静、短发

---

### 2. 林晓宇（已故好友）

```
A profile photo of a Chinese teenage boy, around 16 years old, wearing round glasses, gentle smile, artistic temperament, wearing a plaid shirt, warm lighting, slightly blurred background, 2015 QQ avatar style, realistic photo with subtle beauty filter, square composition
```

**关键词**：文艺、温和、戴眼镜、理想主义

---

### 3. 陈默（关键角色）

```
A profile photo of a Chinese teenage boy, around 16 years old, plain appearance, tired eyes, simple dark t-shirt, neutral expression, natural lighting, slightly blurred background, 2015 QQ avatar style, realistic photo with subtle beauty filter, square composition
```

**关键词**：沉默、朴素、疲惫、普通

---

### 4. 夏建国（夏灯父亲）

```
A profile photo of a Chinese middle-aged man, around 50 years old, serious expression, short hair, wearing a white shirt, government official appearance, formal lighting, slightly blurred background, 2015 QQ avatar style, realistic photo, square composition
```

**关键词**：严肃、中年、公务员、权威

---

### 5. 李娜（大学室友）

```
A profile photo of a Chinese young woman, around 20 years old, cheerful smile, long hair, wearing casual clothes, bright and friendly expression, warm lighting, slightly blurred background, 2015 QQ avatar style, realistic photo with subtle beauty filter, square composition
```

**关键词**：活泼、开朗、友善

---

### 6. 王芳（大学室友）

```
A profile photo of a Chinese young woman, around 20 years old, gentle smile, shoulder-length hair, wearing a soft-colored sweater, warm and caring expression, natural lighting, slightly blurred background, 2015 QQ avatar style, realistic photo with subtle beauty filter, square composition
```

**关键词**：温柔、体贴、善良

---

### 7. 张明（大学同学）

```
A profile photo of a Chinese young man, around 20 years old, casual smile, short hair, wearing a hoodie, friendly and ordinary appearance, natural lighting, slightly blurred background, 2015 QQ avatar style, realistic photo, square composition
```

**关键词**：普通、友好、大学生

---

## 技术参数建议

### Midjourney参数

```
--ar 1:1 --style raw --v 6 --q 2
```

### DALL-E 3参数

- Size: 1024x1024
- Style: Natural
- Quality: HD

### Stable Diffusion参数

```
Positive: realistic photo, soft lighting, 2015 style, Chinese person, portrait
Negative: anime, cartoon, illustration, painting, drawing, art, sketch
```

---

## 文件命名规范

保存到 `src/assets/avatars/` 目录：

```
xiadeng.jpg          # 夏灯
linxiaoyu.jpg        # 林晓宇
chenmo.jpg           # 陈默
xiajianguo.jpg       # 夏建国
lina.jpg             # 李娜
wangfang.jpg         # 王芳
zhangming.jpg        # 张明
```

---

## 更新JSON配置

生成头像后，更新 `src/data/qq/index.json`：

```json
{
  "id": "1847592036",
  "nickname": "夏灯",
  "avatar": "/src/assets/avatars/xiadeng.jpg",
  "status": "online"
}
```

---

## 备选方案：使用真实照片

如果AI生成效果不理想，可以从以下免费图库寻找：

- Unsplash (unsplash.com)
- Pexels (pexels.com)
- Pixabay (pixabay.com)

搜索关键词：

- "Chinese teenager portrait"
- "Asian student profile"
- "Young woman headshot"

注意选择CC0协议（完全免费商用）的图片。
