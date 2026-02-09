# Data Specifications Quick Reference

Complete data format rules for game content. See full documentation at `docs/data-specs/data-specification.md`.

## Time Formats

| Context | Format | Example |
|---------|--------|---------|
| QQ posts/blogs | `YYYY-MM-DD HH:mm:ss` | `2015-11-20 22:30:00` |
| Chat logs | `YYYY-MM-DD HH:mm:ss` | `2015-11-20 22:30:00` |
| EXIF data | `YYYY:MM:DD HH:mm:ss` | `2015:11:23 14:30:15` |

**CRITICAL**: Use `-` for posts/blogs, `:` for EXIF dates

## Path Formats

All paths start with `/`, relative to `public/` directory:

```json
{
  "avatar": "/avatars/linxiaoyu.jpg",           // ✅
  "photo": "/photos/daily/photo_001.jpg",       // ✅
  "exifFile": "/photos/daily/photo_001_exif.json", // ✅

  "avatar": "avatars/linxiaoyu.jpg",            // ❌ Missing /
  "photo": "../public/photos/daily.jpg"         // ❌ No relative paths
}
```

## QQ Space Post Structure

```json
{
  "id": 1,                              // Required: number
  "content": "说说内容",                 // Required: string
  "time": "2015-11-20 22:30:00",        // Required: YYYY-MM-DD HH:mm:ss
  "photos": ["/photos/daily/001.jpg"],  // Optional: array of paths
  "location": "云山县",                  // Optional: string
  "device": "Canon EOS 600D",           // Optional: string
  "comments": [                         // Optional: array
    {
      "user": "陈默",                    // Required if comments exist
      "userId": "chenmuo",              // Required if comments exist
      "content": "评论内容",            // Required if comments exist
      "time": "2015-11-20 22:45:00"     // Required if comments exist
    }
  ],
  "likes": ["陈默", "夏灯"]             // Optional: array of names
}
```

## QQ Space Blog Structure

```json
{
  "id": 1,                              // Required: number
  "title": "日志标题",                   // Required: string
  "content": "日志正文\n\n支持换行",     // Required: string (use \n)
  "time": "2015-10-01 20:00:00",        // Required: YYYY-MM-DD HH:mm:ss
  "category": "摄影",                    // Optional: string
  "locked": false,                      // Optional: boolean (default false)
  "password": "28125400",               // Required if locked=true
  "hint": "提示:曝光三角",              // Required if locked=true
  "viewCount": 45,                      // Optional: number
  "comments": []                        // Optional: array (same as posts)
}
```

## Photo Album Structure

```json
{
  "id": 1,                              // Required: number
  "name": "相册名称",                    // Required: string
  "cover": "/photos/album/cover.jpg",   // Required: path string
  "locked": false,                      // Optional: boolean
  "password": "28125400",               // Required if locked=true
  "hint": "提示:曝光三角",              // Required if locked=true
  "photoCount": 12,                     // Required: number (must match photos.length)
  "createTime": "2015-11-20 18:00:00",  // Required: YYYY-MM-DD HH:mm:ss
  "photos": [                           // Required: array
    {
      "id": 1,                          // Required: number
      "filename": "photo_001.jpg",      // Required: string
      "path": "/photos/album/photo_001.jpg", // Required: path string
      "description": "照片描述",        // Optional: string
      "aiPrompt": "AI generation prompt in English", // Optional: string
      "time": "2015-11-23 14:30:15",    // Required: YYYY-MM-DD HH:mm:ss
      "exifFile": "/photos/album/photo_001_exif.json" // Optional: path string
    }
  ]
}
```

## EXIF Metadata Structure

```json
{
  "fileName": "photo_001.jpg",          // Required: string
  "camera": "Canon EOS 600D",           // Required: string
  "lens": "EF-S 18-55mm f/3.5-5.6 IS II", // Optional: string
  "aperture": "f/2.8",                  // Required: string (format: f/x.x)
  "shutterSpeed": "1/250",              // Required: string (format: 1/xxx)
  "iso": "400",                         // Required: string (not number!)
  "focalLength": "35mm",                // Optional: string
  "dateTime": "2015:11:23 14:30:15",    // Required: YYYY:MM:DD HH:mm:ss
  "location": "云山县一中",              // Optional: string
  "gps": {                              // Optional: object
    "latitude": "28.125400",            // String, not number!
    "longitude": "112.983600"           // String, not number!
  }
}
```

**CRITICAL**: GPS coordinates are **strings**, not numbers!

## Password Design Patterns

### 1. Exposure Triangle (曝光三角)

Combine aperture + shutter + ISO, remove symbols:

```
f/2.8 + 1/250 + ISO400 → "28125400"
f/5.6 + 1/125 + ISO800 → "5612580"
```

**Hint format**: `"提示:曝光三角(光圈-快门-ISO)"`

### 2. English Phrases

Lowercase English, no spaces:

```
"camera is third eye" → "camera3rdeye"
"truth is one" → "truth1"
```

**Hint format**: `"提示:相机的第三只眼(英文小写,无空格)"`

### 3. Date Format

YYYYMMDD format:

```
1999-03-15 (birthday) → "19990315"
2016-02-14 (event date) → "20160214"
```

**Hint format**: `"提示:林晓宇的生日(8位数字)"`

## Validation Checklist

Before submitting content, verify:

- [ ] All required fields present
- [ ] Time format correct (`-` for posts, `:` for EXIF)
- [ ] Paths start with `/`
- [ ] Encrypted content has `locked`, `password`, `hint`
- [ ] `photoCount` matches `photos.length`
- [ ] GPS coordinates are strings
- [ ] User IDs consistent across content
- [ ] JSON syntax valid (use JSONLint)
- [ ] No class hours posts (weekday 8:00-17:00)

## Common Errors

### ❌ Wrong time format

```json
"time": "2015/11/20 22:30:00"  // Uses / instead of -
```

### ✅ Correct time format

```json
"time": "2015-11-20 22:30:00"  // Uses -
```

### ❌ Missing path slash

```json
"avatar": "avatars/linxiaoyu.jpg"
```

### ✅ Correct path

```json
"avatar": "/avatars/linxiaoyu.jpg"
```

### ❌ GPS as numbers

```json
"gps": {
  "latitude": 28.125400,        // Number type
  "longitude": 112.983600
}
```

### ✅ GPS as strings

```json
"gps": {
  "latitude": "28.125400",      // String type
  "longitude": "112.983600"
}
```

### ❌ Missing encryption fields

```json
{
  "locked": true,
  "password": "28125400"
  // Missing hint!
}
```

### ✅ Complete encryption

```json
{
  "locked": true,
  "password": "28125400",
  "hint": "提示:曝光三角(光圈-快门-ISO)"
}
```

## User ID Consistency

Ensure same user has consistent ID everywhere:

| User | userId | username |
|------|--------|----------|
| Lin Xiaoyu | `linxiaoyu` | `林晓宇` |
| Chen Muo | `chenmuo` | `陈默` |
| Xia Deng | `xiadeng` | `夏灯` |
| Zhang Yu | `zhangyu` | `张雨` |

Use these exact IDs in all `userId` fields.

## AI Image Generation Prompts

When creating photo album items with `aiPrompt`:

**Format**: English, detailed, photographic style

**Include**:

- Scene description
- Lighting conditions
- Atmosphere/mood
- Composition notes
- Photography style reference

**Example**:

```
"A dimly lit school hallway at night, 35mm film photography, grainy texture, shadows in corners, documentary style, atmospheric lighting, sense of unease, cinematic composition"
```

**Styles for Lin Xiaoyu's photos**:

- `documentary photography`
- `black and white`
- `35mm film grain`
- `cinematic lighting`
- `photojournalism style`
- `decisive moment`

---

For complete specifications, see `docs/data-specs/data-specification.md`
