# QQ空间数据结构设计

*版本：1.0*
*日期：2026-01-15*

---

## 一、用户信息结构

### 文件位置
`src/data/qzone/{user_id}/index.json`

### 数据结构

```json
{
  "userId": "linxiaoyu",
  "username": "林晓宇",
  "avatar": "/avatars/linxiaoyu.jpg",
  "description": "相机是第三只眼",
  "title": "林晓宇的空间",
  "background": "/backgrounds/camera.jpg",
  "friendCount": 156,
  "visitCount": 2341
}
```

### 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| userId | string | 是 | 用户唯一标识符 |
| username | string | 是 | 用户昵称 |
| avatar | string | 是 | 头像路径 |
| description | string | 否 | 个性签名 |
| title | string | 是 | 空间标题 |
| background | string | 否 | 背景图片路径 |
| friendCount | number | 否 | 好友数量 |
| visitCount | number | 否 | 访问量 |

---

## 二、说说（动态）结构

### 文件位置
`src/data/qzone/{user_id}/shuoshuo.json`

### 数据结构

```json
[
  {
    "id": 1,
    "content": "今天在山顶拍到了云海，相机记录下了这个瞬间。",
    "time": "2014-09-20 18:30:00",
    "photos": ["/photos/daily_001.jpg"],
    "location": "云山县",
    "device": "Canon EOS 600D",
    "comments": [
      {
        "user": "陈默",
        "userId": "chenmuo",
        "content": "拍得真好！",
        "time": "2014-09-20 19:00:00"
      }
    ],
    "likes": ["陈默", "夏灯", "张雨"]
  }
]
```

### 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | number | 是 | 说说唯一ID |
| content | string | 是 | 说说内容 |
| time | string | 是 | 发布时间（格式：YYYY-MM-DD HH:mm:ss） |
| photos | array | 否 | 配图路径数组 |
| location | string | 否 | 发布地点 |
| device | string | 否 | 发布设备 |
| comments | array | 否 | 评论列表 |
| likes | array | 否 | 点赞用户列表 |

### 评论对象结构

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| user | string | 是 | 评论者昵称 |
| userId | string | 是 | 评论者ID |
| content | string | 是 | 评论内容 |
| time | string | 是 | 评论时间 |

---

## 三、日志（博客）结构

### 文件位置
`src/data/qzone/{user_id}/blog.json`

### 数据结构

```json
[
  {
    "id": 1,
    "title": "相机是第三只眼",
    "content": "完整的日志内容...",
    "time": "2015-10-01 20:00:00",
    "category": "摄影",
    "locked": false,
    "viewCount": 45,
    "comments": []
  },
  {
    "id": 2,
    "title": "加密日志",
    "content": "加密的内容...",
    "time": "2016-02-10 22:00:00",
    "category": "私密",
    "locked": true,
    "password": "camera3rdeye",
    "hint": "提示：相机的第三只眼"
  }
]
```

### 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | number | 是 | 日志唯一ID |
| title | string | 是 | 日志标题 |
| content | string | 是 | 日志内容（支持换行） |
| time | string | 是 | 发布时间 |
| category | string | 否 | 分类 |
| locked | boolean | 否 | 是否加密（默认false） |
| password | string | 否 | 密码（如果locked为true） |
| hint | string | 否 | 密码提示 |
| viewCount | number | 否 | 浏览量 |
| comments | array | 否 | 评论列表 |

---

## 四、相册结构

### 文件位置
`src/data/qzone/{user_id}/albums.json`

### 数据结构

```json
[
  {
    "id": 1,
    "name": "日常相册",
    "cover": "/photos/daily/cover.jpg",
    "locked": false,
    "photoCount": 45,
    "createTime": "2014-09-15 10:00:00",
    "photos": [
      {
        "id": 1,
        "filename": "photo_001.jpg",
        "path": "/photos/daily/photo_001.jpg",
        "description": "云山县一中校门",
        "time": "2014-09-20 08:30:00",
        "exifFile": "/photos/daily/photo_001_exif.json"
      }
    ]
  },
  {
    "id": 2,
    "name": "加密相册",
    "cover": "/photos/encrypted/cover.jpg",
    "locked": true,
    "password": "28125400",
    "hint": "提示：曝光三角（光圈-快门-ISO）",
    "photoCount": 12,
    "createTime": "2015-11-20 18:00:00",
    "photos": [
      {
        "id": 1,
        "filename": "evidence_001.jpg",
        "path": "/photos/encrypted/evidence_001.jpg",
        "description": "关键证据",
        "time": "2015-11-23 14:30:15",
        "exifFile": "/photos/encrypted/evidence_001_exif.json"
      }
    ]
  }
]
```

### 相册对象字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | number | 是 | 相册唯一ID |
| name | string | 是 | 相册名称 |
| cover | string | 是 | 封面图片路径 |
| locked | boolean | 否 | 是否加密（默认false） |
| password | string | 否 | 密码（如果locked为true） |
| hint | string | 否 | 密码提示 |
| photoCount | number | 是 | 照片数量 |
| createTime | string | 是 | 创建时间 |
| photos | array | 是 | 照片列表 |

### 照片对象字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | number | 是 | 照片唯一ID |
| filename | string | 是 | 文件名 |
| path | string | 是 | 照片路径 |
| description | string | 否 | 照片描述 |
| time | string | 是 | 拍摄时间 |
| exifFile | string | 否 | EXIF数据文件路径 |

---

## 五、EXIF元数据结构

### 文件位置
`/photos/{album_name}/{filename}_exif.json`

### 数据结构

```json
{
  "fileName": "photo_001.jpg",
  "camera": "Canon EOS 600D",
  "lens": "EF-S 18-55mm f/3.5-5.6 IS II",
  "aperture": "f/2.8",
  "shutterSpeed": "1/250",
  "iso": "400",
  "focalLength": "35mm",
  "dateTime": "2015:11:23 14:30:15",
  "location": "云山县一中",
  "gps": {
    "latitude": "28.125400",
    "longitude": "112.983600"
  }
}
```

### 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| fileName | string | 是 | 照片文件名 |
| camera | string | 是 | 相机型号 |
| lens | string | 否 | 镜头型号 |
| aperture | string | 是 | 光圈值（格式：f/x.x） |
| shutterSpeed | string | 是 | 快门速度（格式：1/xxx） |
| iso | string | 是 | ISO感光度 |
| focalLength | string | 否 | 焦距 |
| dateTime | string | 是 | 拍摄时间（格式：YYYY:MM:DD HH:mm:ss） |
| location | string | 否 | 拍摄地点 |
| gps | object | 否 | GPS坐标 |

### GPS对象结构

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| latitude | string | 是 | 纬度 |
| longitude | string | 是 | 经度 |

---

## 六、完整示例

### 林晓宇QQ空间完整数据示例

#### 1. 用户信息 (`src/data/qzone/linxiaoyu/index.json`)

```json
{
  "userId": "linxiaoyu",
  "username": "林晓宇",
  "avatar": "/avatars/linxiaoyu.jpg",
  "description": "相机是第三只眼",
  "title": "林晓宇的空间",
  "background": "/backgrounds/camera.jpg",
  "friendCount": 156,
  "visitCount": 2341
}
```

#### 2. 说说示例 (`src/data/qzone/linxiaoyu/shuoshuo.json`)

```json
[
  {
    "id": 1,
    "content": "今天在山顶拍到了云海，相机记录下了这个瞬间。",
    "time": "2014-09-20 18:30:00",
    "photos": ["/photos/daily/photo_001.jpg"],
    "location": "云山县",
    "device": "Canon EOS 600D",
    "comments": [
      {
        "user": "陈默",
        "userId": "chenmuo",
        "content": "拍得真好！",
        "time": "2014-09-20 19:00:00"
      },
      {
        "user": "夏灯",
        "userId": "xiadeng",
        "content": "构图很棒",
        "time": "2014-09-20 19:15:00"
      }
    ],
    "likes": ["陈默", "夏灯", "张雨"]
  },
  {
    "id": 2,
    "content": "\"真相永远只有一个\" —— 《名侦探柯南》",
    "time": "2015-11-20 22:30:00",
    "photos": [],
    "location": "",
    "device": "Android",
    "comments": [],
    "likes": []
  }
]
```

#### 3. 日志示例 (`src/data/qzone/linxiaoyu/blog.json`)

```json
[
  {
    "id": 1,
    "title": "相机是第三只眼",
    "content": "摄影不仅仅是按下快门那么简单。每一张照片背后，都有一个故事，一段记忆。\n\n相机是我的第三只眼，它帮我看到这个世界更真实的一面。有时候，镜头比眼睛更诚实。",
    "time": "2015-10-01 20:00:00",
    "category": "摄影",
    "locked": false,
    "viewCount": 45,
    "comments": [
      {
        "user": "夏灯",
        "userId": "xiadeng",
        "content": "写得真好！",
        "time": "2015-10-02 08:30:00"
      }
    ]
  },
  {
    "id": 2,
    "title": "我看到了什么",
    "content": "[加密内容] 这是林晓宇的加密日志，记录了他发现的秘密...",
    "time": "2016-02-10 22:00:00",
    "category": "私密",
    "locked": true,
    "password": "camera3rdeye",
    "hint": "提示：相机的第三只眼（英文小写，无空格）",
    "viewCount": 0,
    "comments": []
  }
]
```

#### 4. 相册示例 (`src/data/qzone/linxiaoyu/albums.json`)

```json
[
  {
    "id": 1,
    "name": "日常摄影",
    "cover": "/photos/daily/cover.jpg",
    "locked": false,
    "photoCount": 45,
    "createTime": "2014-09-15 10:00:00",
    "photos": [
      {
        "id": 1,
        "filename": "school_gate.jpg",
        "path": "/photos/daily/school_gate.jpg",
        "description": "云山县一中校门",
        "time": "2014-09-20 08:30:00",
        "exifFile": "/photos/daily/school_gate_exif.json"
      },
      {
        "id": 2,
        "filename": "sunset.jpg",
        "path": "/photos/daily/sunset.jpg",
        "description": "山顶日落",
        "time": "2014-10-15 17:45:00",
        "exifFile": "/photos/daily/sunset_exif.json"
      }
    ]
  },
  {
    "id": 2,
    "name": "证据",
    "cover": "/photos/encrypted/cover.jpg",
    "locked": true,
    "password": "28125400",
    "hint": "提示：曝光三角（光圈f/2.8 - 快门1/250 - ISO400，连起来）",
    "photoCount": 12,
    "createTime": "2015-11-20 18:00:00",
    "photos": [
      {
        "id": 1,
        "filename": "evidence_001.jpg",
        "path": "/photos/encrypted/evidence_001.jpg",
        "description": "办公室门口",
        "time": "2015-11-23 14:30:15",
        "exifFile": "/photos/encrypted/evidence_001_exif.json"
      },
      {
        "id": 2,
        "filename": "evidence_002.jpg",
        "path": "/photos/encrypted/evidence_002.jpg",
        "description": "文件柜",
        "time": "2015-11-23 14:35:42",
        "exifFile": "/photos/encrypted/evidence_002_exif.json"
      }
    ]
  }
]
```

#### 5. EXIF数据示例 (`/photos/encrypted/evidence_001_exif.json`)

```json
{
  "fileName": "evidence_001.jpg",
  "camera": "Canon EOS 600D",
  "lens": "EF-S 18-55mm f/3.5-5.6 IS II",
  "aperture": "f/2.8",
  "shutterSpeed": "1/250",
  "iso": "400",
  "focalLength": "35mm",
  "dateTime": "2015:11:23 14:30:15",
  "location": "云山县一中",
  "gps": {
    "latitude": "28.125400",
    "longitude": "112.983600"
  }
}
```

---

## 七、前端集成说明

### 1. QZone组件需要的功能

#### 加载用户数据

```javascript
// 在 QZone.jsx 中
import { useState, useEffect } from 'react';

const QZone = ({ userId = 'linxiaoyu' }) => {
  const [userData, setUserData] = useState(null);
  const [shuoshuo, setShuoshuo] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [albums, setAlbums] = useState([]);

  useEffect(() => {
    // 加载用户信息
    import(`../data/qzone/${userId}/index.json`)
      .then(module => setUserData(module.default));

    // 加载说说
    import(`../data/qzone/${userId}/shuoshuo.json`)
      .then(module => setShuoshuo(module.default));

    // 加载日志
    import(`../data/qzone/${userId}/blog.json`)
      .then(module => setBlogs(module.default));

    // 加载相册
    import(`../data/qzone/${userId}/albums.json`)
      .then(module => setAlbums(module.default));
  }, [userId]);

  // ... 组件渲染逻辑
};
```

#### 处理加密日志

```javascript
const handleBlogClick = async (blog) => {
  if (blog.locked) {
    const success = await showPasswordDialog({
      title: "查看加密日志",
      message: blog.title,
      hint: blog.hint,
      correctPassword: blog.password
    });

    if (!success) {
      return;
    }
  }

  // 显示日志内容
  setCurrentBlog(blog);
};
```

#### 处理加密相册

```javascript
const handleAlbumClick = async (album) => {
  if (album.locked) {
    const success = await showPasswordDialog({
      title: "查看加密相册",
      message: album.name,
      hint: album.hint,
      correctPassword: album.password
    });

    if (!success) {
      return;
    }
  }

  // 显示相册内容
  setCurrentAlbum(album);
};
```

### 2. PhotoViewer组件需要的功能

#### 显示EXIF数据

```javascript
const PhotoViewer = ({ src, exifFile }) => {
  const [exifData, setExifData] = useState(null);
  const [showExif, setShowExif] = useState(false);

  useEffect(() => {
    if (exifFile) {
      import(`../data${exifFile}`)
        .then(module => setExifData(module.default))
        .catch(() => setExifData(null));
    }
  }, [exifFile]);

  return (
    <div>
      <img src={src} alt="照片" />

      {exifData && (
        <button onClick={() => setShowExif(!showExif)}>
          {showExif ? '隐藏' : '显示'}EXIF信息
        </button>
      )}

      {showExif && exifData && (
        <ExifPanel>
          <div>相机: {exifData.camera}</div>
          <div>镜头: {exifData.lens}</div>
          <div>光圈: {exifData.aperture}</div>
          <div>快门: {exifData.shutterSpeed}</div>
          <div>ISO: {exifData.iso}</div>
          <div>焦距: {exifData.focalLength}</div>
          <div>拍摄时间: {exifData.dateTime}</div>
          <div>地点: {exifData.location}</div>
          {exifData.gps && (
            <div>GPS: {exifData.gps.latitude}, {exifData.gps.longitude}</div>
          )}
        </ExifPanel>
      )}
    </div>
  );
};
```

### 3. 时间格式统一

所有时间字段使用统一格式：

- **说说/日志/相册创建时间**: `YYYY-MM-DD HH:mm:ss` (例: `2015-11-20 22:30:00`)
- **EXIF拍摄时间**: `YYYY:MM:DD HH:mm:ss` (例: `2015:11:23 14:30:15`)

前端显示时可以使用工具函数转换：

```javascript
// utils/timeFormat.js
export const formatDisplayTime = (timeStr) => {
  // 将 EXIF 格式转换为标准格式
  const normalized = timeStr.replace(/:/g, '-').replace(/-(\d{2}:\d{2}:\d{2})/, ' $1');
  const date = new Date(normalized);

  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};
```

### 4. 文件路径约定

- **头像**: `/avatars/{filename}.jpg`
- **背景图**: `/backgrounds/{filename}.jpg`
- **说说配图**: `/photos/daily/{filename}.jpg`
- **相册照片**: `/photos/{album_name}/{filename}.jpg`
- **EXIF数据**: `/photos/{album_name}/{filename}_exif.json`

所有路径都是相对于 `public/` 目录的。

### 5. 动态加载优化

使用 Vite 的 `import.meta.glob` 实现按需加载：

```javascript
// 预加载所有QQ空间数据（用于搜索等功能）
const qzoneData = import.meta.glob('../data/qzone/**/*.json');

// 按需加载特定用户数据
const loadUserData = async (userId) => {
  const indexPath = `../data/qzone/${userId}/index.json`;
  const loader = qzoneData[indexPath];

  if (loader) {
    const module = await loader();
    return module.default;
  }

  return null;
};
```

---

## 八、数据验证清单

在创建QQ空间数据时，请确保：

- [ ] 所有必填字段都已填写
- [ ] 时间格式正确（说说/日志用 `YYYY-MM-DD HH:mm:ss`，EXIF用 `YYYY:MM:DD HH:mm:ss`）
- [ ] 加密内容必须包含 `locked: true`、`password` 和 `hint` 字段
- [ ] 照片路径与实际文件位置匹配
- [ ] EXIF文件路径正确（如果有）
- [ ] 评论和点赞的用户ID与用户昵称一致
- [ ] 相册的 `photoCount` 与 `photos` 数组长度一致
- [ ] GPS坐标格式正确（字符串类型）
- [ ] 所有JSON文件格式正确，无语法错误

---

## 九、密码设计参考

根据游戏设计，密码应该与摄影参数相关：

### 曝光三角密码示例

- **光圈 f/2.8 + 快门 1/250 + ISO 400** → 密码: `28125400`
- **光圈 f/5.6 + 快门 1/125 + ISO 800** → 密码: `5612580`

### 文字密码示例

- **"相机是第三只眼"** → 密码: `camera3rdeye`
- **"真相永远只有一个"** → 密码: `truth1`

### 日期密码示例

- **林晓宇生日 1999-03-15** → 密码: `19990315`
- **事件发生日期 2016-02-14** → 密码: `20160214`

---

**文档完成日期**: 2026-01-21

**下一步**: 开始创建实际的QQ空间数据文件（任务 DA-04）
