import React from 'react';
import styled from 'styled-components';
import { useWindowManager } from '../context/WindowManagerContext';
import FileProperties from '../components/FileProperties';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #EEF3FA;
`;

const Toolbar = styled.div`
  height: 36px;
  background: linear-gradient(to bottom, #F9FCFD 0%, #DDECFD 100%);
  border-bottom: 1px solid #A0B2C8;
  display: flex;
  align-items: center;
  padding: 0 10px;
  gap: 10px;
`;

const Content = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: auto;
  padding: 10px;
`;

const StyledImage = styled.img`
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  box-shadow: 2px 2px 5px rgba(0,0,0,0.2);
`;

const InfoBar = styled.div`
  height: 24px;
  background-color: #EEF3FA;
  border-top: 1px solid #A0B2C8;
  display: flex;
  align-items: center;
  padding: 0 10px;
  font-size: 11px;
  color: #333;
`;

const ToolbarButton = styled.button`
  border: 1px solid transparent;
  background: transparent;
  cursor: pointer;
  padding: 2px 5px;
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-family: Tahoma, sans-serif;

  &:hover {
    border: 1px solid #A0B2C8;
    background-color: rgba(255, 255, 255, 0.5);
    border-radius: 2px;
  }

  &:active {
    background-color: rgba(0, 0, 0, 0.1);
  }
`;

const PhotoViewer = ({ src, fileItem }) => {
  const { openWindow } = useWindowManager();

  const handleProperties = () => {
      if (fileItem) {
          openWindow(
              `properties-${fileItem.name}-${Date.now()}`,
              `${fileItem.name} 属性`,
              <FileProperties fileItem={fileItem} />,
              'properties',
              { width: 350, height: 450, resizable: false }
          );
      }
  };

  return (
    <Container>
      <Toolbar>
         <span style={{ fontSize: '11px', marginRight: 'auto', fontWeight: 'bold', color: '#333' }}>
             Windows 图片和传真查看器
         </span>
         {fileItem && (
             <ToolbarButton onClick={handleProperties} title="查看属性">
                 <span style={{ fontSize: '14px' }}>ℹ️</span>
                 属性
             </ToolbarButton>
         )}
      </Toolbar>
      <Content>
        {src ? (
            <StyledImage src={src} alt="View" draggable={false} />
        ) : (
            <div>No image selected</div>
        )}
      </Content>
      <InfoBar>
        {src ? src.split('/').pop() : 'Ready'}
      </InfoBar>
    </Container>
  );
};

export default PhotoViewer;
