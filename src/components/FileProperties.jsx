import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useWindowManager } from '../context/WindowManagerContext';

// Load all EXIF data files eagerly
const exifFiles = import.meta.glob('../data/photos/**/*.json', { eager: true });

const WindowContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #ECE9D8;
  padding: 10px;
  box-sizing: border-box;
  font-family: Tahoma, "Microsoft YaHei", sans-serif;
  font-size: 11px;
`;

const TabsContainer = styled.div`
  display: flex;
  margin-bottom: -1px;
  padding-left: 2px;
`;

const Tab = styled.div`
  padding: 3px 6px;
  border: 1px solid #919B9C;
  border-bottom: 1px solid ${props => props.active ? '#ECE9D8' : '#919B9C'};
  background-color: ${props => props.active ? '#ECE9D8' : '#ECE9D8'};
  border-top-left-radius: 3px;
  border-top-right-radius: 3px;
  margin-right: 2px;
  cursor: pointer;
  position: relative;
  z-index: ${props => props.active ? 1 : 0};

  &:hover {
    background-color: #fff;
  }
`;

const TabContent = styled.div`
  flex: 1;
  border: 1px solid #919B9C;
  background-color: #fff;
  padding: 15px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
  box-shadow: 1px 1px 1px rgba(0,0,0,0.1);
`;

const PropertyRow = styled.div`
  display: flex;
  margin-bottom: 5px;
`;

const Label = styled.span`
  width: 100px;
  color: #666;
`;

const Value = styled.span`
  flex: 1;
  word-break: break-all;
`;

const SectionHeader = styled.div`
  font-weight: bold;
  margin-bottom: 5px;
  margin-top: 10px;
  padding-bottom: 2px;
  border-bottom: 1px solid #eee;
  color: #15428B;
`;

const ButtonRow = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
  gap: 10px;
`;

const Button = styled.button`
  min-width: 75px;
  padding: 2px 10px;
  font-family: Tahoma, sans-serif;
  font-size: 11px;
`;

const FileProperties = ({ fileItem, onClose }) => {
  const [activeTab, setActiveTab] = useState('general');
  const [exifData, setExifData] = useState(null);
  const { closeWindow } = useWindowManager();

  useEffect(() => {
    if (fileItem && fileItem.exifPath) {
      // Try to find the matching file in the glob results
      // We need to resolve the path.
      // Assuming exifPath is relative to src/data or absolute like /src/data/...

      // Normalize lookup. The glob keys are like "../data/photos/evidence/photo_001_exif.json"
      // If fileItem.exifPath is "src/data/photos/evidence/photo_001_exif.json", we need to match.

      const normalize = (path) => path.replace(/^(\.\.\/|\.\/|src\/|@\/)/, '').replace(/\\/g, '/');
      const target = normalize(fileItem.exifPath);

      const foundKey = Object.keys(exifFiles).find(key => {
          return normalize(key).endsWith(target) || normalize(key) === target;
      });

      if (foundKey && exifFiles[foundKey]) {
        setExifData(exifFiles[foundKey].default || exifFiles[foundKey]);
      }
    } else if (fileItem && fileItem.exifData) {
        // Direct embedding support
        setExifData(fileItem.exifData);
    }
  }, [fileItem]);

  const handleClose = () => {
    if (onClose) onClose();
    // We assume this component is wrapped in a Window, but if we need to close self:
    // This prop might not be passed by standard WindowManager, so we rely on WindowManager's close.
    // Actually, usually buttons in the content call window.close logic if available.
    // But for a properties dialog, the "OK" / "Cancel" buttons usually close the window.
    // We might need the window ID to close it.
    // Since we don't have the ID easily here unless passed, we might just not implement close on buttons for now,
    // or assume the user uses the X button.
    // However, let's look at props.
  };

  return (
    <WindowContainer>
      <TabsContainer>
        <Tab active={activeTab === 'general'} onClick={() => setActiveTab('general')}>常规</Tab>
        <Tab active={activeTab === 'summary'} onClick={() => setActiveTab('summary')}>摘要</Tab>
      </TabsContainer>

      <TabContent>
        {activeTab === 'general' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
               {/* Icon placeholder */}
               <div style={{ width: 32, height: 32, marginRight: 10, background: 'url(/icons/image.png) no-repeat center' }}></div>
               <span style={{ fontWeight: 'bold' }}>{fileItem?.name}</span>
            </div>
            <div style={{ borderTop: '1px solid #ccc', margin: '5px 0' }}></div>
            <PropertyRow>
              <Label>文件类型:</Label>
              <Value>JPEG 图像</Value>
            </PropertyRow>
            <PropertyRow>
              <Label>打开方式:</Label>
              <Value>Windows 图片查看器</Value>
            </PropertyRow>
            <div style={{ borderTop: '1px solid #ccc', margin: '5px 0' }}></div>
            <PropertyRow>
              <Label>位置:</Label>
              <Value>{fileItem?.path || 'My Documents'}</Value>
            </PropertyRow>
            <PropertyRow>
              <Label>大小:</Label>
              <Value>2.45 MB (2,569,011 字节)</Value>
            </PropertyRow>
             <div style={{ borderTop: '1px solid #ccc', margin: '5px 0' }}></div>
            <PropertyRow>
              <Label>创建时间:</Label>
              <Value>2026年1月15日, 14:30:00</Value>
            </PropertyRow>
             <PropertyRow>
              <Label>修改时间:</Label>
              <Value>2026年1月15日, 14:30:00</Value>
            </PropertyRow>
          </>
        )}

        {activeTab === 'summary' && (
          <>
            <SectionHeader>图像</SectionHeader>
            {exifData ? (
                <>
                    <PropertyRow>
                    <Label>相机型号:</Label>
                    <Value>{exifData.Model || 'Unknown'}</Value>
                    </PropertyRow>
                    <PropertyRow>
                    <Label>制造商:</Label>
                    <Value>{exifData.Make || 'Unknown'}</Value>
                    </PropertyRow>

                    <SectionHeader>拍摄参数</SectionHeader>
                    <PropertyRow>
                    <Label>光圈值:</Label>
                    <Value>{exifData.FNumber ? `f/${exifData.FNumber}` : 'N/A'}</Value>
                    </PropertyRow>
                    <PropertyRow>
                    <Label>曝光时间:</Label>
                    <Value>{exifData.ExposureTime ? `${exifData.ExposureTime} 秒` : 'N/A'}</Value>
                    </PropertyRow>
                    <PropertyRow>
                    <Label>ISO 速度:</Label>
                    <Value>{exifData.ISOSpeedRatings || 'N/A'}</Value>
                    </PropertyRow>
                    <PropertyRow>
                    <Label>焦距:</Label>
                    <Value>{exifData.FocalLength ? `${exifData.FocalLength} mm` : 'N/A'}</Value>
                    </PropertyRow>

                     <SectionHeader>来源</SectionHeader>
                     <PropertyRow>
                    <Label>拍摄日期:</Label>
                    <Value>{exifData.DateTimeOriginal || 'Unknown'}</Value>
                    </PropertyRow>
                </>
            ) : (
                <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                    无可用摘要信息
                </div>
            )}
          </>
        )}
      </TabContent>

      <ButtonRow>
          {/* In a real modal, these would close the window */}
          <Button disabled>确定</Button>
          <Button disabled>取消</Button>
          <Button disabled>应用(A)</Button>
      </ButtonRow>
    </WindowContainer>
  );
};

export default FileProperties;
