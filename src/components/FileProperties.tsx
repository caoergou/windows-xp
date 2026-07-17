import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { getSystemPathDisplay } from '../data/systemPaths';
import { useWindowManagerActions } from '../context/WindowManagerContext';
import { useFileSystem } from '../context/FileSystemContext';
import { useXPEventBus } from '../context/EventBusContext';
import { useWindowId } from '../context/WindowIdContext';
import XPIcon from './XPIcon';
import { FileNode, ExifData } from '../types';
import { resolveOSTheme, useOSTheme } from '../themes/useOSTheme';

export const FILE_PROPERTIES_WINDOW_PROPS = {
  width: 380,
  height: 420,
  resizable: false,
};

// Load all EXIF data files eagerly
const exifFiles = import.meta.glob<ExifData & { default?: ExifData }>('../data/photos/**/*.json', {
  eager: true,
});

const WindowContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: ${({ theme }) => resolveOSTheme(theme).tokens.SURFACE};
  padding: 10px;
  box-sizing: border-box;
  font-family: ${({ theme }) => resolveOSTheme(theme).fonts.UI};
  font-size: 11px;
`;

const TabsContainer = styled.div`
  display: flex;
  margin-bottom: -1px;
  padding-left: 2px;
`;

const Tab = styled.div<{ $active: boolean }>`
  padding: 3px 6px;
  border: 1px solid ${({ theme }) => resolveOSTheme(theme).tokens.BORDER_GREY};
  border-bottom: 1px solid
    ${props =>
      props.$active
        ? resolveOSTheme(props.theme).tokens.SURFACE
        : resolveOSTheme(props.theme).tokens.BORDER_GREY};
  background-color: ${props =>
    props.$active
      ? resolveOSTheme(props.theme).tokens.SURFACE
      : resolveOSTheme(props.theme).tokens.SURFACE};
  border-radius: 0;
  margin-right: 2px;
  cursor: pointer;
  position: relative;
  z-index: ${props => (props.$active ? 1 : 0)};

  &:hover {
    background-color: ${({ theme }) => resolveOSTheme(theme).tokens.WHITE};
  }
`;

const TabContent = styled.div`
  flex: 1;
  border: 1px solid ${({ theme }) => resolveOSTheme(theme).tokens.BORDER_GREY};
  background-color: ${({ theme }) => resolveOSTheme(theme).tokens.WHITE};
  padding: 15px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
`;

const PropertyRow = styled.div`
  display: flex;
  margin-bottom: 5px;
`;

const Label = styled.span`
  width: 100px;
  color: ${({ theme }) => resolveOSTheme(theme).tokens.GREY_66};
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
  border-bottom: 1px solid ${({ theme }) => resolveOSTheme(theme).tokens.GREY_EE};
  color: ${({ theme }) => resolveOSTheme(theme).tokens.SIDEBAR_TITLE_BLUE};
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
  font-family: ${({ theme }) => resolveOSTheme(theme).fonts.UI};
  font-size: 11px;
`;

interface FilePropertiesProps {
  fileItem?: FileNode;
  onClose?: () => void;
  parentPath?: string[];
  windowId?: string;
}

const FileProperties: React.FC<FilePropertiesProps> = ({
  fileItem,
  onClose,
  parentPath,
  windowId,
}) => {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState('general');
  const [exifData, setExifData] = useState<ExifData | null>(null);
  const { closeWindow } = useWindowManagerActions();
  const { getFileProperties } = useFileSystem();
  const bus = useXPEventBus();
  const contextWindowId = useWindowId();
  const osTheme = useOSTheme();

  const properties = fileItem ? getFileProperties(parentPath || [], fileItem.name) : null;

  // The Properties dialog is the one layer where "metadata was inspected" is
  // observable — emit once per open so scenarios can treat it as a clue channel.
  useEffect(() => {
    if (!fileItem) return;
    bus.emit({
      type: 'file:properties',
      path: [...(parentPath || []), fileItem.name],
      name: fileItem.name,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Localize the raw values the filesystem layer returns (#121): size as a
  // byte/object count and the XP-era date, both formatted for the active locale.
  const sizeDisplay = properties
    ? properties.childCount !== null
      ? t('fileProperties.objectCount', { count: properties.childCount })
      : t('fileProperties.bytes', { count: properties.sizeBytes })
    : '';
  const formatDate = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return new Intl.DateTimeFormat(i18n.language, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(d);
  };

  useEffect(() => {
    if (fileItem && fileItem.exifPath) {
      // Try to find the matching file in the glob results
      const normalize = (path: string): string =>
        path.replace(/^(\.\.\/|\.\/|src\/|@\/)/, '').replace(/\\/g, '/');
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
    const id = windowId ?? contextWindowId;
    if (id) closeWindow(id);
  };

  const typeLabel = properties
    ? properties.icon === 'drive'
      ? t(
          /dvd|cd/i.test(properties.name)
            ? 'explorer.types.opticalDrive'
            : 'explorer.types.localDisk'
        )
      : t(properties.type === 'folder' ? 'explorer.types.folder' : 'explorer.types.file')
    : '';

  return (
    <WindowContainer>
      <TabsContainer>
        <Tab $active={activeTab === 'general'} onClick={() => setActiveTab('general')}>
          {t('fileProperties.general')}
        </Tab>
        <Tab $active={activeTab === 'summary'} onClick={() => setActiveTab('summary')}>
          {t('fileProperties.summary')}
        </Tab>
      </TabsContainer>

      <TabContent>
        {activeTab === 'general' && properties && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
              {/* Icon */}
              <div style={{ marginRight: 10 }}>
                <XPIcon
                  name={properties.icon || (properties.type === 'folder' ? 'folder' : 'file')}
                  size={32}
                />
              </div>
              <span style={{ fontWeight: 'bold' }}>{properties.name}</span>
            </div>
            <div
              style={{ borderTop: `1px solid ${osTheme.tokens.GREY_CC}`, margin: '5px 0' }}
            ></div>
            <PropertyRow>
              <Label>{t('fileProperties.fileType')}:</Label>
              <Value>{typeLabel}</Value>
            </PropertyRow>
            <div
              style={{ borderTop: `1px solid ${osTheme.tokens.GREY_CC}`, margin: '5px 0' }}
            ></div>
            <PropertyRow>
              <Label>{t('fileProperties.location')}:</Label>
              <Value>
                {parentPath?.length
                  ? getSystemPathDisplay(parentPath, t)
                  : t('fileProperties.desktop')}
              </Value>
            </PropertyRow>
            <PropertyRow>
              <Label>{t('fileProperties.size')}:</Label>
              <Value>{sizeDisplay}</Value>
            </PropertyRow>
            <div
              style={{ borderTop: `1px solid ${osTheme.tokens.GREY_CC}`, margin: '5px 0' }}
            ></div>
            <PropertyRow>
              <Label>{t('fileProperties.created')}:</Label>
              <Value>{formatDate(properties.created)}</Value>
            </PropertyRow>
            <PropertyRow>
              <Label>{t('fileProperties.modified')}:</Label>
              <Value>{formatDate(properties.modified)}</Value>
            </PropertyRow>
            <PropertyRow>
              <Label>{t('fileProperties.accessed')}:</Label>
              <Value>{formatDate(properties.accessed)}</Value>
            </PropertyRow>
            {properties.locked && (
              <PropertyRow>
                <Label>{t('fileProperties.status')}:</Label>
                <Value>{t('fileProperties.encrypted')}</Value>
              </PropertyRow>
            )}
            {properties.broken && (
              <PropertyRow>
                <Label>{t('fileProperties.status')}:</Label>
                <Value>{t('fileProperties.damaged')}</Value>
              </PropertyRow>
            )}
          </>
        )}

        {activeTab === 'summary' && (
          <>
            <SectionHeader>{t('fileProperties.image')}</SectionHeader>
            {exifData ? (
              <>
                <PropertyRow>
                  <Label>{t('fileProperties.cameraModel')}:</Label>
                  <Value>{exifData.Model || 'Unknown'}</Value>
                </PropertyRow>
                <PropertyRow>
                  <Label>{t('fileProperties.manufacturer')}:</Label>
                  <Value>{exifData.Make || 'Unknown'}</Value>
                </PropertyRow>

                <SectionHeader>{t('fileProperties.shootingParameters')}</SectionHeader>
                <PropertyRow>
                  <Label>{t('fileProperties.aperture')}:</Label>
                  <Value>{exifData.FNumber ? `f/${exifData.FNumber}` : 'N/A'}</Value>
                </PropertyRow>
                <PropertyRow>
                  <Label>{t('fileProperties.exposureTime')}:</Label>
                  <Value>
                    {exifData.ExposureTime
                      ? t('fileProperties.seconds', { value: exifData.ExposureTime })
                      : 'N/A'}
                  </Value>
                </PropertyRow>
                <PropertyRow>
                  <Label>{t('fileProperties.isoSpeed')}:</Label>
                  <Value>{exifData.ISOSpeedRatings || 'N/A'}</Value>
                </PropertyRow>
                <PropertyRow>
                  <Label>{t('fileProperties.focalLength')}:</Label>
                  <Value>{exifData.FocalLength ? `${exifData.FocalLength} mm` : 'N/A'}</Value>
                </PropertyRow>

                <SectionHeader>{t('fileProperties.origin')}</SectionHeader>
                <PropertyRow>
                  <Label>{t('fileProperties.dateTaken')}:</Label>
                  <Value>{exifData.DateTimeOriginal || 'Unknown'}</Value>
                </PropertyRow>
              </>
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: osTheme.tokens.GREY_99 }}>
                {t('fileProperties.noSummary')}
              </div>
            )}
          </>
        )}
      </TabContent>

      <ButtonRow>
        <Button onClick={handleClose}>{t('common.ok')}</Button>
        <Button onClick={handleClose}>{t('common.cancel')}</Button>
        <Button disabled>{t('common.apply')}</Button>
      </ButtonRow>
    </WindowContainer>
  );
};

export default FileProperties;
