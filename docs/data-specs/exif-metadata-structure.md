# EXIF元数据格式设计

*版本：1.0*
*日期：2026-01-21*

---

## 一、概述

EXIF（Exchangeable Image File Format）元数据是照片文件中包含的拍摄信息。在游戏中，EXIF数据是重要的解谜线索，特别是：

1. **曝光三角参数**（光圈、快门、ISO）用于生成密码
2. **拍摄时间**用于建立事件时间线
3. **GPS坐标**用于确定拍摄地点
4. **相机型号**用于验证照片真实性

---

## 二、标准EXIF数据结构

### 文件位置

`/photos/{album_name}/{filename}_exif.json`

例如：`/photos/encrypted/evidence_001_exif.json`

### 完整数据结构

```json
{
  "fileName": "evidence_001.jpg",
  "camera": {
    "make": "Canon",
    "model": "Canon EOS 600D",
    "serialNumber": "123456789"
  },
  "lens": {
    "model": "EF-S 18-55mm f/3.5-5.6 IS II",
    "focalLength": "35mm"
  },
  "exposure": {
    "aperture": "f/2.8",
    "shutterSpeed": "1/250",
    "iso": "400",
    "exposureCompensation": "0 EV",
    "meteringMode": "Pattern",
    "exposureProgram": "Manual"
  },
  "flash": {
    "fired": false,
    "mode": "Off"
  },
  "dateTime": {
    "original": "2015:11:23 14:30:15",
    "digitized": "2015:11:23 14:30:15",
    "modified": "2015:11:23 14:30:15"
  },
  "location": {
    "name": "云山县一中",
    "gps": {
      "latitude": "28.125400",
      "latitudeRef": "N",
      "longitude": "112.983600",
      "longitudeRef": "E",
      "altitude": "245.5",
      "altitudeRef": "Above Sea Level"
    }
  },
  "image": {
    "width": 5184,
    "height": 3456,
    "orientation": "Horizontal (normal)",
    "colorSpace": "sRGB",
    "whiteBalance": "Auto"
  },
  "software": "Adobe Photoshop CS6 (Windows)",
  "copyright": "林晓宇",
  "artist": "林晓宇"
}
```

---

## 三、字段详细说明

### 1. 基本信息

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| fileName | string | 是 | 照片文件名 |

### 2. 相机信息 (camera)

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| make | string | 是 | 相机制造商（Canon/Nikon/Sony等） |
| model | string | 是 | 相机型号 |
| serialNumber | string | 否 | 相机序列号 |

### 3. 镜头信息 (lens)

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| model | string | 否 | 镜头型号 |
| focalLength | string | 否 | 焦距（如"35mm"） |

### 4. 曝光信息 (exposure) ⭐核心解谜数据

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| aperture | string | 是 | 光圈值（格式：f/x.x） |
| shutterSpeed | string | 是 | 快门速度（格式：1/xxx或x"） |
| iso | string | 是 | ISO感光度 |
| exposureCompensation | string | 否 | 曝光补偿 |
| meteringMode | string | 否 | 测光模式 |
| exposureProgram | string | 否 | 曝光程序（Manual/Auto等） |

### 5. 闪光灯信息 (flash)

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| fired | boolean | 否 | 是否闪光 |
| mode | string | 否 | 闪光模式 |

### 6. 时间信息 (dateTime) ⭐核心解谜数据

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| original | string | 是 | 原始拍摄时间（格式：YYYY:MM:DD HH:mm:ss） |
| digitized | string | 否 | 数字化时间 |
| modified | string | 否 | 最后修改时间 |

**重要**：如果照片被编辑过，`modified` 会晚于 `original`，这是判断照片是否被篡改的线索！

### 7. 位置信息 (location) ⭐核心解谜数据

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 否 | 地点名称 |
| gps | object | 否 | GPS坐标信息 |

#### GPS对象结构

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| latitude | string | 是 | 纬度（十进制度数） |
| latitudeRef | string | 是 | 纬度参考（N/S） |
| longitude | string | 是 | 经度（十进制度数） |
| longitudeRef | string | 是 | 经度参考（E/W） |
| altitude | string | 否 | 海拔高度（米） |
| altitudeRef | string | 否 | 海拔参考 |

### 8. 图像信息 (image)

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| width | number | 是 | 图像宽度（像素） |
| height | number | 是 | 图像高度（像素） |
| orientation | string | 否 | 方向 |
| colorSpace | string | 否 | 色彩空间 |
| whiteBalance | string | 否 | 白平衡 |

### 9. 其他信息

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| software | string | 否 | 编辑软件（如果被编辑过） |
| copyright | string | 否 | 版权信息 |
| artist | string | 否 | 作者 |

---

## 四、游戏中的EXIF应用场景

### 场景1：曝光三角密码

**关键照片**：林晓宇加密相册的封面照片

```json
{
  "fileName": "album_cover.jpg",
  "camera": {
    "make": "Canon",
    "model": "Canon EOS 600D"
  },
  "exposure": {
    "aperture": "f/2.8",
    "shutterSpeed": "1/250",
    "iso": "400"
  },
  "dateTime": {
    "original": "2015:11:20 18:00:00"
  }
}
```

**密码生成规则**：
- 光圈 f/2.8 → `28`
- 快门 1/250 → `1250`（去掉斜杠）
- ISO 400 → `400`
- 最终密码：`28125400`

**提示文本**："提示：曝光三角（光圈-快门-ISO）"

### 场景2：时间线重建

通过对比多张照片的拍摄时间，玩家可以重建事件发生的顺序：

```json
// 照片1：林晓宇在办公室外
{
  "dateTime": {
    "original": "2015:11:23 14:30:15"
  }
}

// 照片2：办公室内的文件柜
{
  "dateTime": {
    "original": "2015:11:23 14:35:42"
  }
}

// 照片3：离开时的走廊
{
  "dateTime": {
    "original": "2015:11:23 14:42:18"
  }
}
```

玩家可以推断：林晓宇在2015年11月23日下午2:30-2:42之间进入了某个办公室。

### 场景3：GPS定位

通过GPS坐标确定拍摄地点：

```json
{
  "location": {
    "name": "云山县一中",
    "gps": {
      "latitude": "28.125400",
      "longitude": "112.983600"
    }
  }
}
```

玩家可以在地图上定位这个坐标，发现是学校的某个特定建筑。

### 场景4：照片篡改检测

对比 `original` 和 `modified` 时间：

```json
{
  "dateTime": {
    "original": "2015:11:23 14:30:15",
    "modified": "2015:12:05 22:15:30"
  },
  "software": "Adobe Photoshop CS6 (Windows)"
}
```

这表明照片在拍摄后被编辑过，可能隐藏了某些信息。

---

## 五、简化版EXIF结构（用于普通照片）

对于不需要详细信息的普通照片，可以使用简化版结构：

```json
{
  "fileName": "daily_photo.jpg",
  "camera": "Canon EOS 600D",
  "lens": "EF-S 18-55mm f/3.5-5.6 IS II",
  "aperture": "f/5.6",
  "shutterSpeed": "1/125",
  "iso": "200",
  "focalLength": "50mm",
  "dateTime": "2014:09:20 08:30:00",
  "location": "云山县"
}
```

这种简化版适用于：
- 日常摄影作品
- 不涉及解谜的照片
- 仅用于展示的照片

---

## 六、前端集成说明

### 1. PhotoViewer组件显示EXIF

```javascript
import { useState, useEffect } from 'react';
import styled from 'styled-components';

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

  const formatExposure = (exif) => {
    if (!exif.exposure) return null;
    return `${exif.exposure.aperture} ${exif.exposure.shutterSpeed} ISO${exif.exposure.iso}`;
  };

  return (
    <ViewerContainer>
      <ImageDisplay src={src} alt="照片" />

      {exifData && (
        <ExifButton onClick={() => setShowExif(!showExif)}>
          {showExif ? '隐藏' : '显示'}EXIF信息
        </ExifButton>
      )}

      {showExif && exifData && (
        <ExifPanel>
          <ExifSection>
            <SectionTitle>相机信息</SectionTitle>
            <ExifRow>
              <Label>相机:</Label>
              <Value>{exifData.camera?.model || exifData.camera}</Value>
            </ExifRow>
            {exifData.lens && (
              <ExifRow>
                <Label>镜头:</Label>
                <Value>{exifData.lens?.model || exifData.lens}</Value>
              </ExifRow>
            )}
          </ExifSection>

          <ExifSection>
            <SectionTitle>曝光参数</SectionTitle>
            <ExifRow>
              <Label>光圈:</Label>
              <Value>{exifData.exposure?.aperture || exifData.aperture}</Value>
            </ExifRow>
            <ExifRow>
              <Label>快门:</Label>
              <Value>{exifData.exposure?.shutterSpeed || exifData.shutterSpeed}</Value>
            </ExifRow>
            <ExifRow>
              <Label>ISO:</Label>
              <Value>{exifData.exposure?.iso || exifData.iso}</Value>
            </ExifRow>
            {exifData.focalLength && (
              <ExifRow>
                <Label>焦距:</Label>
                <Value>{exifData.focalLength}</Value>
              </ExifRow>
            )}
          </ExifSection>

          <ExifSection>
            <SectionTitle>拍摄信息</SectionTitle>
            <ExifRow>
              <Label>拍摄时间:</Label>
              <Value>{exifData.dateTime?.original || exifData.dateTime}</Value>
            </ExifRow>
            {exifData.dateTime?.modified && exifData.dateTime.modified !== exifData.dateTime.original && (
              <ExifRow>
                <Label>修改时间:</Label>
                <Value style={{ color: '#ff6b6b' }}>
                  {exifData.dateTime.modified} ⚠️
                </Value>
              </ExifRow>
            )}
            {exifData.location && (
              <ExifRow>
                <Label>地点:</Label>
                <Value>{exifData.location.name || exifData.location}</Value>
              </ExifRow>
            )}
            {exifData.location?.gps && (
              <ExifRow>
                <Label>GPS:</Label>
                <Value>
                  {exifData.location.gps.latitude}, {exifData.location.gps.longitude}
                </Value>
              </ExifRow>
            )}
          </ExifSection>

          {exifData.software && (
            <ExifSection>
              <SectionTitle>编辑信息</SectionTitle>
              <ExifRow>
                <Label>编辑软件:</Label>
                <Value style={{ color: '#ff6b6b' }}>
                  {exifData.software} ⚠️
                </Value>
              </ExifRow>
            </ExifSection>
          )}
        </ExifPanel>
      )}
    </ViewerContainer>
  );
};

const ViewerContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const ImageDisplay = styled.img`
  max-width: 100%;
  max-height: 70%;
  object-fit: contain;
`;

const ExifButton = styled.button`
  margin: 10px;
  padding: 5px 15px;
  background: #0066cc;
  color: white;
  border: none;
  cursor: pointer;

  &:hover {
    background: #0052a3;
  }
`;

const ExifPanel = styled.div`
  background: #f0f0f0;
  padding: 15px;
  overflow-y: auto;
  font-family: 'Courier New', monospace;
  font-size: 12px;
`;

const ExifSection = styled.div`
  margin-bottom: 15px;
`;

const SectionTitle = styled.div`
  font-weight: bold;
  margin-bottom: 8px;
  color: #0066cc;
  border-bottom: 1px solid #ccc;
  padding-bottom: 3px;
`;

const ExifRow = styled.div`
  display: flex;
  margin-bottom: 5px;
`;

const Label = styled.span`
  width: 100px;
  color: #666;
`;

const Value = styled.span`
  flex: 1;
  color: #000;
`;

export default PhotoViewer;
```

### 2. 曝光三角密码提取工具

```javascript
// utils/exifPassword.js

/**
 * 从EXIF数据提取曝光三角密码
 * @param {Object} exifData - EXIF数据对象
 * @returns {string} 密码字符串
 */
export const extractExposurePassword = (exifData) => {
  const exposure = exifData.exposure || exifData;

  // 提取光圈值（去掉 f/）
  const aperture = exposure.aperture.replace('f/', '').replace('.', '');

  // 提取快门速度（去掉 1/ 和引号）
  const shutter = exposure.shutterSpeed
    .replace('1/', '')
    .replace('"', '')
    .replace('.', '');

  // 提取ISO值
  const iso = exposure.iso.toString();

  // 组合密码
  return `${aperture}${shutter}${iso}`;
};

// 示例使用
const exif = {
  exposure: {
    aperture: 'f/2.8',
    shutterSpeed: '1/250',
    iso: '400'
  }
};

const password = extractExposurePassword(exif);
console.log(password); // 输出: "28125400"
```

---

## 七、数据验证清单

在创建EXIF数据时，请确保：

- [ ] 文件名与对应的照片文件匹配
- [ ] 相机型号与林晓宇使用的相机一致（Canon EOS 600D）
- [ ] 曝光参数格式正确（光圈 f/x.x，快门 1/xxx，ISO 数字）
- [ ] 时间格式正确（YYYY:MM:DD HH:mm:ss）
- [ ] GPS坐标为字符串类型，不是数字
- [ ] 如果照片被编辑，必须包含 `software` 和 `modified` 字段
- [ ] 关键解谜照片的曝光参数能生成正确的密码
- [ ] 所有JSON文件格式正确，无语法错误

---

## 八、关键照片EXIF设计参考

### 1. 林晓宇加密相册封面

```json
{
  "fileName": "encrypted_album_cover.jpg",
  "camera": {
    "make": "Canon",
    "model": "Canon EOS 600D"
  },
  "lens": {
    "model": "EF-S 18-55mm f/3.5-5.6 IS II",
    "focalLength": "35mm"
  },
  "exposure": {
    "aperture": "f/2.8",
    "shutterSpeed": "1/250",
    "iso": "400"
  },
  "dateTime": {
    "original": "2015:11:20 18:00:00"
  },
  "location": {
    "name": "云山县一中"
  }
}
```

**密码**: `28125400`

### 2. 关键证据照片（办公室）

```json
{
  "fileName": "evidence_office.jpg",
  "camera": {
    "make": "Canon",
    "model": "Canon EOS 600D"
  },
  "exposure": {
    "aperture": "f/4.0",
    "shutterSpeed": "1/60",
    "iso": "800"
  },
  "dateTime": {
    "original": "2015:11:23 14:30:15",
    "modified": "2015:12:05 22:15:30"
  },
  "location": {
    "name": "云山县一中",
    "gps": {
      "latitude": "28.125400",
      "longitude": "112.983600"
    }
  },
  "software": "Adobe Photoshop CS6 (Windows)"
}
```

**注意**: 这张照片被编辑过（modified时间晚于original），暗示有人试图隐藏信息。

### 3. 最后一张照片

```json
{
  "fileName": "last_photo.jpg",
  "camera": {
    "make": "Canon",
    "model": "Canon EOS 600D"
  },
  "exposure": {
    "aperture": "f/5.6",
    "shutterSpeed": "1/125",
    "iso": "400"
  },
  "dateTime": {
    "original": "2016:02:14 16:45:30"
  },
  "location": {
    "name": "云山县",
    "gps": {
      "latitude": "28.130000",
      "longitude": "112.990000"
    }
  }
}
```

**意义**: 林晓宇生前最后拍摄的照片，时间和地点是重要线索。

---

**文档完成日期**: 2026-01-21

**下一步**: 创建所有模板文件（任务 DA-04）
