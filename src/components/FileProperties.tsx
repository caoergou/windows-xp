import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { useWindowManager } from '../context/WindowManagerContext';
import { useFileSystem } from '../context/FileSystemContext';
import XPIcon from './XPIcon';
import { FileItem } from '../types';

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

interface FilePropertiesProps {
  fileItem?: FileItem;
  onClose?: () => void;
  parentPath?: string[];
  windowId?: string;
}

const FileProperties: React.FC<FilePropertiesProps> = ({ fileItem, onClose, parentPath, windowId }) => {
  const [activeTab, setActiveTab] = useState('general');
  const [exifData, setExifData] = useState<any>(null);
  const { closeWindow } = useWindowManager();
  const { getFileProperties } = useFileSystem();

  const properties = fileItem
    ? getFileProperties(parentPath || [], fileItem.name)
    : null;

  useEffect(() => {
    if (fileItem && fileItem.exifPath) {
      // Try to find the matching file in the glob results
      const normalize = (path: string): string => path.replace(/^(\.\.\/|\.\/|src\/|@\/)/, '').replace(/\\/g, '/');
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
    if (windowId) closeWindow(windowId);
  };

  return (
    <WindowContainer>
      <TabsContainer>
        <Tab active={activeTab === 'general'} onClick={() => setActiveTab('general')}>常规</Tab>
        <Tab active={activeTab === 'summary'} onClick={() => setActiveTab('summary')}>摘要</Tab>
      </TabsContainer>

      <TabContent>
        {activeTab === 'general' && properties && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
               {/* Icon */}
               <div style={{ marginRight: 10 }}>
                 <XPIcon name={properties.icon || (properties.type === 'folder' ? 'folder' : 'file')} size={32} />
               </div>
               <span style={{ fontWeight: 'bold' }}>{properties.name}</span>
            </div>
            <div style={{ borderTop: '1px solid #ccc', margin: '5px 0' }}></div>
            <PropertyRow>
              <Label>文件类型:</Label>
              <Value>{properties.type === 'folder' ? '文件夹' : '文件'}</Value>
            </PropertyRow>
            <div style={{ borderTop: '1px solid #ccc', margin: '5px 0' }}></div>
            <PropertyRow>
              <Label>位置:</Label>
              <Value>{parentPath?.join('\\') || '桌面'}</Value>
            </PropertyRow>
            <PropertyRow>
              <Label>大小:</Label>
              <Value>{properties.size}</Value>
            </PropertyRow>
             <div style={{ borderTop: '1px solid #ccc', margin: '5px 0' }}></div>
            <PropertyRow>
              <Label>创建时间:</Label>
              <Value>{properties.created}</Value>
            </PropertyRow>
             <PropertyRow>
              <Label>修改时间:</Label>
              <Value>{properties.modified}</Value>
            </PropertyRow>
             <PropertyRow>
              <Label>访问时间:</Label>
              <Value>{properties.accessed}</Value>
            </PropertyRow>
             {properties.locked && (
              <PropertyRow>
                <Label>状态:</Label>
                <Value>已加密</Value>
              </PropertyRow>
             )}
             {properties.broken && (
              <PropertyRow>
                <Label>状态:</Label>
                <Value>已损坏</Value>
              </PropertyRow>
             )}
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
          <Button onClick={handleClose}>确定</Button>
          <Button onClick={handleClose}>取消</Button>
          <Button disabled>应用(A)</Button>
      </ButtonRow>
    </WindowContainer>
  );
};

export default FileProperties;
