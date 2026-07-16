import React from 'react';
import styled from 'styled-components';
import { useApp } from '../hooks/useApp';
import { APP_REGISTRY } from '../registry/apps';
import { useTranslation } from 'react-i18next';
import { FileNode } from '../types';
import { FONTS } from '../constants';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #eef3fa;
`;

const Toolbar = styled.div`
  height: 36px;
  background: linear-gradient(to bottom, #f9fcfd 0%, #ddecfd 100%);
  border-bottom: 1px solid #a0b2c8;
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
  box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.2);
`;

const InfoBar = styled.div`
  height: 24px;
  background-color: #eef3fa;
  border-top: 1px solid #a0b2c8;
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
  font-family: ${FONTS.UI};

  &:hover {
    border: 1px solid #a0b2c8;
    background-color: rgba(255, 255, 255, 0.5);
    border-radius: 2px;
  }

  &:active {
    background-color: rgba(0, 0, 0, 0.1);
  }
`;

interface PhotoViewerProps {
  src?: string;
  fileItem?: FileNode;
  windowId?: string;
}

// windowId is auto-injected by Window.jsx via cloneElement
const normalizeImageSrc = (src?: string): string | undefined => {
  if (!src) return undefined;
  // Handle legacy absolute paths under the deployed base URL.
  // When the app is served under /windows-xp/, absolute /images/... would
  // resolve to the domain root and 404. Convert them to relative paths.
  if (src.startsWith('/images/')) {
    return `.${src}`;
  }
  return src;
};

const PhotoViewer = ({ src, fileItem, windowId }: PhotoViewerProps) => {
  const api = useApp(windowId);
  const { t } = useTranslation();
  const imageSrc = normalizeImageSrc(src);

  const handleProperties = () => {
    if (fileItem) {
      const def = APP_REGISTRY.FileProperties;
      api.openWindow(
        `properties-${fileItem.name}-${Date.now()}`,
        t('common.propertiesTitle', { name: fileItem.name }),
        def.restore({ fileItem }),
        def.icon,
        def.window
      );
    }
  };

  return (
    <Container>
      <Toolbar>
        <span style={{ fontSize: '11px', marginRight: 'auto', fontWeight: 'bold', color: '#333' }}>
          {t('photoViewer.title')}
        </span>
        {fileItem && (
          <ToolbarButton onClick={handleProperties} title={t('photoViewer.viewProperties')}>
            <span style={{ fontSize: '14px' }}>ℹ️</span>
            {t('contextMenu.properties')}
          </ToolbarButton>
        )}
      </Toolbar>
      <Content>
        {imageSrc ? (
          <StyledImage src={imageSrc} alt={t('photoViewer.view')} draggable={false} />
        ) : (
          <div>{t('photoViewer.noImageSelected')}</div>
        )}
      </Content>
      <InfoBar>{src ? src.split('/').pop() : t('photoViewer.ready')}</InfoBar>
    </Container>
  );
};

export default PhotoViewer;
