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

---
