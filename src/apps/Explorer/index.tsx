import React from 'react';
import XPIcon from '../../components/XPIcon';
import { getFileIconName } from '../../utils/fileIcon';
import ExplorerSidebar from '../../components/Explorer/ExplorerSidebar';
import ExplorerFolderTree from '../../components/Explorer/ExplorerFolderTree';
import ExplorerToolbar from '../../components/Explorer/ExplorerToolbar';
import AddressBar from '../../components/Explorer/AddressBar';
import ContextMenu from '../../components/ContextMenu';
import { FileNode, isContainerNode } from '../../types';
import { getFileDisplayName } from '../../utils/fileDisplayName';
import { getSystemPathDisplay } from '../../data/systemPaths';
import {
  Container, DetailsTable, DetailsHeadCell, DetailsRow, DetailsCell, DetailsNameCell, MainContent, FileArea, GroupHeader, IconsGrid, FileItem, IconWrapper, FileInfo, FileName, FileType, StatusBar, EmptyRecycleBinMessage,
} from './styled';
import { isOpticalDrive } from './helpers';
import type { ExplorerProps } from './types';
import { useExplorer } from './hooks/useExplorer';

const Explorer: React.FC<ExplorerProps> = (props) => {
  const x = useExplorer(props);
  const {
    t,
    getFile,
    viewMode,
    changeView,
    sort,
    toggleSort,
    showFolders,
    toggleFolders,
    showHidden,
    visibleEntries,
    addrHistory,
    history,
    historyIndex,
    selectedItem,
    selection,
    orderedKeys,
    refreshKey,
    setRefreshKey,
    containerRef,
    isSyntheticAfterTouch,
    address,
    setAddress,
    dragOver,
    setDragOver,
    contextMenu,
    setContextMenu,
    currentPath,
    currentFolder,
    handleAddressGo,
    handleNavigate,
    handleBack,
    handleForward,
    handleUp,
    handleNavigateToPath,
    fileTouchGestures,
    handleFileAreaTouchStart,
    isRoot,
    nodeSizeBytes,
    nodeTypeLabel,
    formatBytes,
    detailsDate,
    handleContextMenu,
    closeContextMenu,
    menuItems,
    handleDragStart,
    handleDropOnFolder,
    childCount,
    isInRecycleBin,
    handleKeyDown,
  } = x;

  if (!currentFolder) return <div>{t('explorer.errors.pathNotFound')}</div>;

  const renderContent = () => {
    if (!isContainerNode(currentFolder)) return null;

    const children = visibleEntries(Object.entries(currentFolder.children));

    if (isRoot) {
      const drives: { key: string; item: FileNode }[] = [];
      const removableDrives: { key: string; item: FileNode }[] = [];
      const others: { key: string; item: FileNode }[] = [];

      children.forEach(([key, item]) => {
        if (
          item.type === 'drive' ||
          item.icon === 'drive' ||
          key.includes('Drive') ||
          key.includes('Disk')
        ) {
          if (isOpticalDrive(key)) {
            removableDrives.push({ key, item });
          } else {
            drives.push({ key, item });
          }
        } else {
          others.push({ key, item });
        }
      });

      // If we have drives, we assume this is the "My Computer" view-like structure
      if (drives.length > 0) {
        return (
          <>
            <GroupHeader>{t('explorer.groups.hardDisks')}</GroupHeader>
            <IconsGrid>{drives.map(({ key, item }) => renderFileItem(key, item))}</IconsGrid>

            {removableDrives.length > 0 && (
              <>
                <GroupHeader>{t('explorer.groups.removableStorage')}</GroupHeader>
                <IconsGrid>
                  {removableDrives.map(({ key, item }) => renderFileItem(key, item))}
                </IconsGrid>
              </>
            )}

            {others.length > 0 && (
              <>
                <GroupHeader>{t('explorer.groups.other')}</GroupHeader>
                <IconsGrid>{others.map(({ key, item }) => renderFileItem(key, item))}</IconsGrid>
              </>
            )}
          </>
        );
      }
    }

    // Standard Folder View
    if (viewMode === 'details') return renderDetailsView(children);
    return <IconsGrid>{children.map(([key, item]) => renderFileItem(key, item))}</IconsGrid>;
  };

  const renderDetailsView = (children: [string, FileNode][]) => {
    const sorted = [...children].sort(([ka, a], [kb, b]) => {
      const dir = sort.dir === 'asc' ? 1 : -1;
      if (sort.key === 'size') {
        return ((nodeSizeBytes(a) ?? -1) - (nodeSizeBytes(b) ?? -1)) * dir;
      }
      if (sort.key === 'type') {
        return nodeTypeLabel(a).localeCompare(nodeTypeLabel(b)) * dir;
      }
      if (sort.key === 'modified') {
        return (a.mtime ?? '2003-10-25').localeCompare(b.mtime ?? '2003-10-25') * dir;
      }
      return getFileDisplayName(ka, a, t).localeCompare(getFileDisplayName(kb, b, t)) * dir;
    });
    const arrow = (key: typeof sort.key) => (sort.key === key ? (sort.dir === 'asc' ? ' ▲' : ' ▼') : '');
    return (
      <DetailsTable role="table">
        <colgroup>
          <col style={{ width: '45%' }} />
          <col style={{ width: '18%' }} />
          <col style={{ width: '22%' }} />
          <col style={{ width: '15%' }} />
        </colgroup>
        <thead>
          <tr>
            <DetailsHeadCell onClick={() => toggleSort('name')}>
              {t('explorer.details.name')}
              {arrow('name')}
            </DetailsHeadCell>
            <DetailsHeadCell onClick={() => toggleSort('size')}>
              {t('explorer.details.size')}
              {arrow('size')}
            </DetailsHeadCell>
            <DetailsHeadCell onClick={() => toggleSort('type')}>
              {t('explorer.details.type')}
              {arrow('type')}
            </DetailsHeadCell>
            <DetailsHeadCell onClick={() => toggleSort('modified')}>
              {t('explorer.details.dateModified')}
              {arrow('modified')}
            </DetailsHeadCell>
          </tr>
        </thead>
        <tbody>
          {sorted.map(([key, item]) => {
            const displayName = getFileDisplayName(key, item, t);
            const isSelected = selection.isSelected(key);
            return (
              <DetailsRow
                key={key}
                data-testid={`file-row-${key}`}
                data-item-key={key}
                data-selected={isSelected}
                $selected={isSelected}
                style={item.hidden ? { opacity: 0.55 } : undefined}
                onClick={e => {
                  if (isSyntheticAfterTouch()) return;
                  selection.handleItemClick(key, orderedKeys(), e);
                }}
                onDoubleClick={() => {
                  if (isSyntheticAfterTouch()) return;
                  handleNavigate(key);
                }}
                onContextMenu={e => handleContextMenu(e, key, item)}
              >
                <DetailsNameCell>
                  <XPIcon name={getFileIconName(item.name, item.type, item.icon)} size={16} />
                  <span
                    style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  >
                    {displayName}
                  </span>
                </DetailsNameCell>
                <DetailsCell>{formatBytes(nodeSizeBytes(item))}</DetailsCell>
                <DetailsCell>{nodeTypeLabel(item)}</DetailsCell>
                <DetailsCell>{detailsDate(item)}</DetailsCell>
              </DetailsRow>
            );
          })}
        </tbody>
      </DetailsTable>
    );
  };

  const renderFileItem = (key: string, item: FileNode) => {
    const displayName = getFileDisplayName(key, item, t);
    const isSelected = selection.isSelected(key);

    return (
      <FileItem
        key={key}
        data-testid={`file-item-${key}`}
        data-item-key={key}
        data-selected={isSelected}
        onDoubleClick={() => {
          if (isSyntheticAfterTouch()) return;
          handleNavigate(key);
        }}
        onClick={e => {
          if (isSyntheticAfterTouch()) return;
          selection.handleItemClick(key, orderedKeys(), e);
        }}
        onContextMenu={e => handleContextMenu(e, key, item)}
        $selected={isSelected}
        draggable
        onDragStart={e => handleDragStart(e, key)}
        onDragOver={e => {
          if (item.type === 'folder') {
            e.preventDefault();
            setDragOver(key);
          }
        }}
        onDragLeave={() => setDragOver(null)}
        onDrop={e => handleDropOnFolder(e, key, item)}
        style={{
          ...(dragOver === key && item.type === 'folder'
            ? { background: '#C1D2EE', border: '1px dashed #316AC5' }
            : {}),
          ...(item.hidden ? { opacity: 0.55 } : {}),
        }}
      >
        <IconWrapper>
          <XPIcon name={getFileIconName(item.name, item.type, item.icon)} size={32} />
        </IconWrapper>
        <FileInfo>
          <FileName $isDrive={isRoot && (item.type === 'drive' || item.icon === 'drive')}>
            {displayName}
            {item.locked && (
              <svg
                width="10"
                height="10"
                viewBox="0 0 10 10"
                style={{ marginLeft: '5px', flexShrink: 0 }}
              >
                <rect x="1" y="4" width="8" height="5" rx="1" fill="#666" />
                <path
                  d="M2.5 4V2.5a2.5 2.5 0 0 1 5 0V4"
                  stroke="#666"
                  strokeWidth="1.2"
                  fill="none"
                />
              </svg>
            )}
          </FileName>
          {isRoot && (item.type === 'drive' || item.icon === 'drive') && (
            <FileType $selected={isSelected}>
              {t(isOpticalDrive(key) ? 'explorer.types.opticalDrive' : 'explorer.types.localDisk')}
            </FileType>
          )}
        </FileInfo>
      </FileItem>
    );
  };

  return (
    <Container
      ref={containerRef}
      tabIndex={0}
      style={{ outline: 'none' }}
      onKeyDown={handleKeyDown}
      onMouseDown={e => {
        const t = e.target as HTMLElement;
        if (!t.closest('input,textarea,button,[contenteditable]')) {
          containerRef.current?.focus();
        }
        // A left-click on empty space (not an item or control) clears the
        // selection, matching XP. Ctrl/Shift keep it for additive gestures.
        if (
          e.button === 0 &&
          !e.ctrlKey &&
          !e.metaKey &&
          !e.shiftKey &&
          !t.closest('[data-item-key],input,textarea,button,[contenteditable]')
        ) {
          selection.clear();
        }
      }}
      onContextMenu={e => {
        e.preventDefault();
        e.stopPropagation();
        selection.clear();
        setContextMenu({ visible: true, x: e.clientX, y: e.clientY, targetItem: null });
      }}
    >
      <ExplorerToolbar
        onBack={handleBack}
        onForward={handleForward}
        onUp={handleUp}
        onRefresh={() => setRefreshKey(k => k + 1)}
        canGoBack={historyIndex > 0}
        canGoForward={historyIndex < history.length - 1}
        canGoUp={currentPath.length > 0}
        view={viewMode}
        onViewChange={changeView}
        foldersOpen={showFolders}
        onToggleFolders={toggleFolders}
      />
      <AddressBar
        address={address}
        onAddressChange={setAddress}
        onGo={handleAddressGo}
        history={addrHistory.map(p => ({ label: getSystemPathDisplay(p, t), path: p }))}
        onSelectHistory={handleNavigateToPath}
      />
      <MainContent>
        {showFolders ? (
          <ExplorerFolderTree
            root={getFile([])}
            currentPath={currentPath}
            onNavigate={handleNavigateToPath}
            onClose={toggleFolders}
          />
        ) : (
          <ExplorerSidebar
            currentPath={currentPath}
            currentItem={selectedItem}
            onNavigate={handleNavigateToPath}
          />
        )}
        <FileArea
          key={refreshKey}
          $flush={viewMode === 'details'}
          onTouchStart={handleFileAreaTouchStart}
          onTouchMove={fileTouchGestures.onTouchMove}
          onTouchEnd={fileTouchGestures.onTouchEnd}
        >
          {isInRecycleBin && childCount === 0 ? (
            <EmptyRecycleBinMessage>
              <XPIcon name="recycle_bin" size={48} />
              <span>{t('explorer.recycleBin.emptyMessage')}</span>
            </EmptyRecycleBinMessage>
          ) : (
            renderContent()
          )}
        </FileArea>
      </MainContent>
      <StatusBar>
        {t('explorer.objectCount', { count: childCount })}
      </StatusBar>
      <ContextMenu
        visible={contextMenu.visible}
        x={contextMenu.x}
        y={contextMenu.y}
        onClose={closeContextMenu}
        menuItems={menuItems}
      />
    </Container>
  );
};

export default Explorer;
