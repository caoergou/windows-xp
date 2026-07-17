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
  Container,
  DetailsTable,
  DetailsHeadCell,
  DetailsRow,
  DetailsCell,
  DetailsNameCell,
  MainContent,
  FileArea,
  GroupHeader,
  StatusBar,
  EmptyRecycleBinMessage,
  ThumbsGrid,
  ThumbItem,
  ThumbBox,
  ThumbName,
  IconsVGrid,
  IconVItem,
  IconVName,
  ListGrid,
  ListItem,
  TilesGrid,
  TileItem,
  TileMeta,
} from './styled';
import { isOpticalDrive } from './helpers';
import type { ExplorerProps } from './types';
import { useExplorer } from './hooks/useExplorer';
import { useOSTheme } from '../../themes/useOSTheme';

const Explorer: React.FC<ExplorerProps> = props => {
  const x = useExplorer(props);
  const osTheme = useOSTheme();
  const {
    t,
    getFile,
    viewMode,
    changeView,
    sort,
    toggleSort,
    showFolders,
    toggleFolders,
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
    handleBackgroundContextMenu,
    closeContextMenu,
    menuItems,
    handleDragStart,
    handleDropOnFolder,
    childCount,
    isInRecycleBin,
    handleKeyDown,
  } = x;

  if (!currentFolder) return <div>{t('explorer.errors.pathNotFound')}</div>;

  // Render a flat list of children in whichever view is active (#211).
  const renderGrid = (entries: [string, FileNode][]) => {
    switch (viewMode) {
      case 'thumbnails':
        return <ThumbsGrid>{entries.map(([k, it]) => renderThumb(k, it))}</ThumbsGrid>;
      case 'icons':
        return <IconsVGrid>{entries.map(([k, it]) => renderIconItem(k, it))}</IconsVGrid>;
      case 'list':
        return <ListGrid>{entries.map(([k, it]) => renderListItem(k, it))}</ListGrid>;
      case 'tiles':
      default:
        return <TilesGrid>{entries.map(([k, it]) => renderTile(k, it))}</TilesGrid>;
    }
  };

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

      // My Computer keeps its grouped layout; Details still tables the flat list.
      if (drives.length > 0 && viewMode !== 'details') {
        return (
          <>
            <GroupHeader>{t('explorer.groups.hardDisks')}</GroupHeader>
            {renderGrid(drives.map(({ key, item }) => [key, item]))}

            {removableDrives.length > 0 && (
              <>
                <GroupHeader>{t('explorer.groups.removableStorage')}</GroupHeader>
                {renderGrid(removableDrives.map(({ key, item }) => [key, item]))}
              </>
            )}

            {others.length > 0 && (
              <>
                <GroupHeader>{t('explorer.groups.other')}</GroupHeader>
                {renderGrid(others.map(({ key, item }) => [key, item]))}
              </>
            )}
          </>
        );
      }
    }

    // Standard folder view — Details tables, the other four are grids.
    if (viewMode === 'details') return renderDetailsView(children);
    return renderGrid(children);
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
    const arrow = (key: typeof sort.key) =>
      sort.key === key ? (sort.dir === 'asc' ? ' ▲' : ' ▼') : '';
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

  // Handlers shared by every view's item (click routes through the multi-select
  // model, double-click navigates, right-click opens the menu, drag moves).
  const itemProps = (key: string, item: FileNode) => ({
    'data-testid': `file-item-${key}`,
    'data-item-key': key,
    'data-selected': selection.isSelected(key),
    draggable: true,
    onDragStart: (e: React.DragEvent) => handleDragStart(e, key),
    onDragOver: (e: React.DragEvent) => {
      if (item.type === 'folder') {
        e.preventDefault();
        e.dataTransfer.dropEffect = e.ctrlKey ? 'copy' : 'move';
        setDragOver(key);
      } else {
        e.dataTransfer.dropEffect = 'none';
        setDragOver(null);
      }
    },
    onDragLeave: () => setDragOver(null),
    onDrop: (e: React.DragEvent) => handleDropOnFolder(e, key, item),
    onDoubleClick: () => {
      if (isSyntheticAfterTouch()) return;
      handleNavigate(key);
    },
    onClick: (e: React.MouseEvent) => {
      if (isSyntheticAfterTouch()) return;
      selection.handleItemClick(key, orderedKeys(), e);
    },
    onContextMenu: (e: React.MouseEvent) => handleContextMenu(e, key, item),
  });

  // Per-item inline style: a dashed drop target while dragged over (folders),
  // plus ghosting for hidden files when they're shown (#219).
  const dropStyle = (key: string, item: FileNode): React.CSSProperties | undefined => {
    const dropping = dragOver === key && item.type === 'folder';
    if (!dropping && !item.hidden) return undefined;
    return {
      ...(dropping
        ? {
            background: osTheme.tokens.DROP_HIGHLIGHT,
            border: `1px dashed ${osTheme.tokens.MENU_HIGHLIGHT}`,
          }
        : {}),
      ...(item.hidden ? { opacity: 0.55 } : {}),
    };
  };

  // The small padlock overlay on locked files (kept from the previous view).
  const lockBadge = (item: FileNode) =>
    item.locked ? (
      <svg width="10" height="10" viewBox="0 0 10 10" style={{ marginLeft: 4, flexShrink: 0 }}>
        <rect x="1" y="4" width="8" height="5" rx="1" fill={osTheme.tokens.GREY_66} />
        <path
          d="M2.5 4V2.5a2.5 2.5 0 0 1 5 0V4"
          stroke={osTheme.tokens.GREY_66}
          strokeWidth="1.2"
          fill="none"
        />
      </svg>
    ) : null;

  const isImageNode = (item: FileNode): boolean =>
    item.type === 'file' &&
    !item.broken &&
    !!(item as { content?: string }).content &&
    /\.(jpe?g|png|gif|bmp)$/i.test(item.name);

  // Resolve a node's image content to a usable src. Bundled `/images/...` public
  // assets are rebased onto the app's BASE_URL (so they resolve from any route,
  // not just the root); data: URIs and absolute URLs pass through untouched.
  const thumbSrc = (item: FileNode): string | undefined => {
    const src = (item as { content?: string }).content;
    if (!src) return undefined;
    if (src.startsWith('/images/')) {
      const base = import.meta.env.BASE_URL ?? '/';
      return `${base.replace(/\/$/, '')}${src}`;
    }
    return src;
  };

  // Thumbnails (#211): ~96px preview box (real image or large icon), name below.
  const renderThumb = (key: string, item: FileNode) => {
    const displayName = getFileDisplayName(key, item, t);
    const isSelected = selection.isSelected(key);
    return (
      <ThumbItem key={key} {...itemProps(key, item)} style={dropStyle(key, item)}>
        <ThumbBox>
          {isImageNode(item) ? (
            <img src={thumbSrc(item)} alt={displayName} draggable={false} />
          ) : (
            <XPIcon name={getFileIconName(item.name, item.type, item.icon)} size={48} />
          )}
        </ThumbBox>
        <ThumbName $selected={isSelected}>
          {displayName}
          {lockBadge(item)}
        </ThumbName>
      </ThumbItem>
    );
  };

  // Icons (#211): 32px icon on top, name centred below.
  const renderIconItem = (key: string, item: FileNode) => {
    const displayName = getFileDisplayName(key, item, t);
    const isSelected = selection.isSelected(key);
    return (
      <IconVItem key={key} {...itemProps(key, item)} style={dropStyle(key, item)}>
        <XPIcon name={getFileIconName(item.name, item.type, item.icon)} size={32} />
        <IconVName $selected={isSelected}>
          {displayName}
          {lockBadge(item)}
        </IconVName>
      </IconVItem>
    );
  };

  // List (#211): 16px icon + name on one line, columns filling top-to-bottom.
  const renderListItem = (key: string, item: FileNode) => {
    const displayName = getFileDisplayName(key, item, t);
    const isSelected = selection.isSelected(key);
    return (
      <ListItem
        key={key}
        $selected={isSelected}
        {...itemProps(key, item)}
        style={dropStyle(key, item)}
      >
        <XPIcon name={getFileIconName(item.name, item.type, item.icon)} size={16} />
        <span>
          {displayName}
          {lockBadge(item)}
        </span>
      </ListItem>
    );
  };

  // Tiles (#211): 48px icon, name + type/size (or drive label at the root).
  const renderTile = (key: string, item: FileNode) => {
    const displayName = getFileDisplayName(key, item, t);
    const isSelected = selection.isSelected(key);
    const isDrive = isRoot && (item.type === 'drive' || item.icon === 'drive');
    const meta = isDrive
      ? t(isOpticalDrive(key) ? 'explorer.types.opticalDrive' : 'explorer.types.localDisk')
      : item.type === 'folder'
        ? t('explorer.types.folder')
        : `${nodeTypeLabel(item)}${formatBytes(nodeSizeBytes(item)) ? `  ${formatBytes(nodeSizeBytes(item))}` : ''}`;
    return (
      <TileItem
        key={key}
        $selected={isSelected}
        {...itemProps(key, item)}
        style={dropStyle(key, item)}
      >
        <XPIcon name={getFileIconName(item.name, item.type, item.icon)} size={48} />
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: isDrive ? 'bold' : 'normal',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {displayName}
            {lockBadge(item)}
          </span>
          <TileMeta $selected={isSelected}>{meta}</TileMeta>
        </div>
      </TileItem>
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
        if (t.closest('[data-xp-context-boundary="true"]')) return;
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
          data-testid="explorer-file-area"
          $flush={viewMode === 'details'}
          onTouchStart={handleFileAreaTouchStart}
          onTouchMove={fileTouchGestures.onTouchMove}
          onTouchEnd={fileTouchGestures.onTouchEnd}
          onContextMenu={handleBackgroundContextMenu}
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
      <StatusBar>{t('explorer.objectCount', { count: childCount })}</StatusBar>
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
