import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import XPIcon from '../XPIcon';
import { FileNode, isContainerNode } from '../../types';
import { getFileDisplayName } from '../../utils/fileDisplayName';
import { getFileIconName } from '../../utils/fileIcon';

/**
 * Explorer "Folders" tree pane (#120, EXP) — the signature XP left-hand tree.
 *
 * Replaces the blue task sidebar when the toolbar Folders toggle is on. Shows
 * the filesystem's container nodes (folders/drives) as a collapsible tree over
 * the same FS the file list reads; clicking a node navigates, and the branch to
 * the current folder auto-expands. Files are omitted (XP shows folders only).
 */
const TreeContainer = styled.div`
  width: 200px;
  min-width: 200px;
  background: #fff;
  border-right: 1px solid #aca899;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-size: 11px;
  font-family: 'Tahoma', 'SimSun', 'Microsoft YaHei', sans-serif;
  user-select: none;
`;

/* Fixed header bar — stays put while the tree body scrolls, so the close box
   sits flush in the pane's top-right corner (XP). */
const TreeHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  height: 20px;
  padding: 0 3px 0 6px;
  font-weight: bold;
  color: #333;
  border-bottom: 1px solid #d4d0c8;
`;

const TreeBody = styled.div`
  flex: 1;
  overflow: auto;
  padding: 4px 2px;
`;

const CloseX = styled.button`
  /* min-width:0 overrides the global button min-width so the box is truly 16px
     and the × sits flush in the top-right corner (measured, not assumed). */
  width: 16px;
  min-width: 0;
  height: 16px;
  flex: 0 0 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 1px solid transparent;
  background: transparent;
  font-size: 12px;
  line-height: 1;
  color: #555;
  cursor: pointer;

  &:hover {
    background: #e5e5c5;
    border-color: #aca899;
  }
`;

const Row = styled.div<{ $active?: boolean; $depth: number }>`
  display: flex;
  align-items: center;
  height: 18px;
  padding-left: ${p => 2 + p.$depth * 16}px;
  cursor: pointer;
  white-space: nowrap;
  color: ${p => (p.$active ? '#fff' : '#000')};
  background: ${p => (p.$active ? '#316AC5' : 'transparent')};

  &:hover {
    background: ${p => (p.$active ? '#316AC5' : '#e8f0fb')};
  }
`;

/**
 * XP tree expand box: a 9px bordered square with crisp 1px bars drawn as
 * pseudo-elements (a horizontal bar always; a vertical bar only when collapsed,
 * making "+"), rather than text glyphs that never center cleanly.
 */
const Toggle = styled.span<{ $expanded: boolean }>`
  position: relative;
  box-sizing: border-box;
  width: 9px;
  height: 9px;
  flex: 0 0 9px;
  border: 1px solid #808080;
  background: #fff;
  margin-right: 4px;
  cursor: pointer;

  &::before {
    content: '';
    position: absolute;
    left: 1px;
    right: 1px;
    top: 3px;
    height: 1px;
    background: #000;
  }

  &::after {
    content: '';
    position: absolute;
    top: 1px;
    bottom: 1px;
    left: 3px;
    width: 1px;
    background: ${p => (p.$expanded ? 'transparent' : '#000')};
  }
`;

const TogglePlaceholder = styled.span`
  width: 9px;
  flex: 0 0 9px;
  margin-right: 4px;
`;

const NodeIcon = styled.span`
  width: 16px;
  height: 16px;
  margin-right: 4px;
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
`;

const Name = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
`;

interface ExplorerFolderTreeProps {
  /** Root filesystem node (its container children become the top-level tree). */
  root: FileNode | null;
  currentPath: string[];
  onNavigate: (path: string[]) => void;
  /** Hide the pane (toolbar Folders toggle / header close box). */
  onClose?: () => void;
}

const pathKey = (path: string[]) => path.join('/');

/** Every ancestor path of `path`, including the path itself and the root ''. */
const ancestorsOf = (path: string[]): Set<string> => {
  const set = new Set<string>(['']);
  for (let i = 1; i <= path.length; i++) set.add(pathKey(path.slice(0, i)));
  return set;
};

const containerChildren = (node: FileNode): [string, FileNode][] =>
  isContainerNode(node)
    ? Object.entries(node.children).filter(([, child]) => isContainerNode(child))
    : [];

const ExplorerFolderTree: React.FC<ExplorerFolderTreeProps> = ({
  root,
  currentPath,
  onNavigate,
  onClose,
}) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState<Set<string>>(() => ancestorsOf(currentPath));

  // Auto-expand the branch down to the current folder whenever it changes.
  const currentKey = pathKey(currentPath);
  useEffect(() => {
    setExpanded(prev => {
      const next = new Set(prev);
      ancestorsOf(currentPath).forEach(k => next.add(k));
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentKey]);

  const toggle = (key: string) =>
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const topLevel = useMemo(() => (root ? containerChildren(root) : []), [root]);

  const renderNode = (childKey: string, node: FileNode, path: string[], depth: number) => {
    const key = pathKey(path);
    const kids = containerChildren(node);
    const hasKids = kids.length > 0;
    const isOpen = expanded.has(key);
    const active = key === currentKey;
    return (
      <React.Fragment key={key}>
        <Row
          $active={active}
          $depth={depth}
          data-testid={`tree-node-${childKey}`}
          onClick={() => onNavigate(path)}
        >
          {hasKids ? (
            <Toggle
              $expanded={isOpen}
              data-testid={`tree-toggle-${childKey}`}
              aria-label={isOpen ? 'collapse' : 'expand'}
              onClick={e => {
                e.stopPropagation();
                toggle(key);
              }}
            />
          ) : (
            <TogglePlaceholder />
          )}
          <NodeIcon>
            <XPIcon name={getFileIconName(node.name, node.type, node.icon)} size={16} />
          </NodeIcon>
          <Name>{getFileDisplayName(childKey, node, t)}</Name>
        </Row>
        {hasKids && isOpen && kids.map(([k, n]) => renderNode(k, n, [...path, k], depth + 1))}
      </React.Fragment>
    );
  };

  return (
    <TreeContainer data-testid="explorer-folder-tree">
      <TreeHeader>
        <span>{t('explorer.folders')}</span>
        {onClose && (
          <CloseX type="button" aria-label={t('window.close')} onClick={onClose}>
            ×
          </CloseX>
        )}
      </TreeHeader>
      <TreeBody>{topLevel.map(([k, n]) => renderNode(k, n, [k], 0))}</TreeBody>
    </TreeContainer>
  );
};

export default ExplorerFolderTree;
