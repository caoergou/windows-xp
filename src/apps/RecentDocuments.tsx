import React from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { useRecentDocuments } from '../context/RecentDocumentsContext';
import { useWindowManager } from '../context/WindowManagerContext';
import { useFileSystem } from '../context/FileSystemContext';
import { resolveFileOpen } from '../registry/apps';
import { resolveOSTheme } from '../themes/useOSTheme';
import { useOptionalOSPackage } from '../os/OSPackageContext';
import { useAppRegistry } from '../context/AppRegistryContext';

const Table = styled.div`
  height: 100%;
  overflow: auto;
  background: ${({ theme }) => resolveOSTheme(theme).tokens.WHITE};
  font: 11px ${({ theme }) => resolveOSTheme(theme).fonts.UI};
`;

const Row = styled.button`
  width: 100%;
  display: grid;
  grid-template-columns: 1fr 150px 80px;
  gap: 8px;
  padding: 4px 8px;
  border: 0;
  background: transparent;
  text-align: left;
  font: inherit;

  &:hover {
    background: ${({ theme }) => resolveOSTheme(theme).tokens.MENU_HIGHLIGHT};
    color: ${({ theme }) => resolveOSTheme(theme).tokens.WHITE};
  }
`;

const RecentDocuments: React.FC = () => {
  const { entries } = useRecentDocuments();
  const { t, i18n } = useTranslation();
  const { getFile } = useFileSystem();
  const { openWindow } = useWindowManager();
  const os = useOptionalOSPackage();
  const { registry } = useAppRegistry();
  return (
    <Table role="list">
      {entries.map(entry => (
        <Row
          key={`${entry.path.join('/')}@${entry.openedAt}`}
          onDoubleClick={() => {
            const node = getFile(entry.path);
            if (!node) return;
            const resolved = resolveFileOpen(
              entry.path[entry.path.length - 1] ?? node.name,
              node,
              os?.appRoles,
              registry,
              entry.path
            );
            if (!resolved) return;
            openWindow(resolved.appId, node.name, resolved.component, resolved.icon, {
              ...resolved.windowProps,
              sourcePath: entry.path,
            });
          }}
        >
          <span>{entry.path.join('\\')}</span>
          <span>{new Date(entry.openedAt).toLocaleString(i18n.language)}</span>
          <span>{t(`recentDocuments.${entry.source ?? 'runtime'}`)}</span>
        </Row>
      ))}
    </Table>
  );
};

export default RecentDocuments;
