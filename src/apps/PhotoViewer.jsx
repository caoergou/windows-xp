import React from 'react';
import styled from 'styled-components';

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

const PhotoViewer = ({ src }) => {
  return (
    <Container>
      <Toolbar>
         {/* Placeholder for toolbar buttons like Zoom, Next, Prev, Print, etc. */}
         <span style={{ fontSize: '11px' }}>Windows 图片和传真查看器</span>
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
