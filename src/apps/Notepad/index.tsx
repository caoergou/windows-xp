import { createPortal } from 'react-dom';
import ContextMenu from '../../components/ContextMenu';
import {
  Container,
  MenuBar,
  MenuItemWrapper,
  MenuItem,
  DropdownMenu,
  DropdownItem,
  DropdownSeparator,
  EditorArea,
  TextArea,
  StatusBar,
  StatusBarSection,
} from './styled';
import FindReplaceDialog from './components/FindReplaceDialog';
import { useNotepad } from './hooks/useNotepad';
import { useResolvedContent } from '../../hooks/useResolvedContent';
import { buildDropdownMenus, buildContextMenuItems } from './menus';
import type { MenuKey, NotepadProps } from './types';

const NotepadEditor = (props: NotepadProps) => {
  const np = useNotepad(props);
  const menus = buildDropdownMenus(np);
  const contextMenuItems = buildContextMenuItems(np);
  const { t } = np;

  const renderDropdown = (key: Exclude<MenuKey, null>) => {
    if (np.openMenu !== key) return null;

    const items = menus[key] || [];

    return (
      <DropdownMenu>
        {items.map((item, i) =>
          item.type === 'separator' ? (
            <DropdownSeparator key={i} />
          ) : (
            <DropdownItem
              key={i}
              $disabled={item.disabled}
              $checked={item.checked}
              onClick={() => {
                if (!item.disabled && item.action) {
                  item.action();
                }
                np.setOpenMenu(null);
              }}
            >
              <span>{item.label}</span>
              {item.shortcut && <span className="shortcut">{item.shortcut}</span>}
            </DropdownItem>
          )
        )}
      </DropdownMenu>
    );
  };

  return (
    <Container
      ref={np.menuRef}
      tabIndex={-1}
      style={{ outline: 'none' }}
      onKeyDown={np.handleShortcutKeyDown}
    >
      <MenuBar>
        <MenuItemWrapper>
          <MenuItem
            $active={np.openMenu === 'file'}
            data-xp-anchor="notepad.menu.file"
            onClick={() => np.toggleMenu('file')}
          >
            {t('notepad.menu.file')}
          </MenuItem>
          {renderDropdown('file')}
        </MenuItemWrapper>
        <MenuItemWrapper>
          <MenuItem $active={np.openMenu === 'edit'} onClick={() => np.toggleMenu('edit')}>
            {t('notepad.menu.edit')}
          </MenuItem>
          {renderDropdown('edit')}
        </MenuItemWrapper>
        <MenuItemWrapper>
          <MenuItem $active={np.openMenu === 'format'} onClick={() => np.toggleMenu('format')}>
            {t('notepad.menu.format')}
          </MenuItem>
          {renderDropdown('format')}
        </MenuItemWrapper>
        <MenuItemWrapper>
          <MenuItem $active={np.openMenu === 'view'} onClick={() => np.toggleMenu('view')}>
            {t('notepad.menu.view')}
          </MenuItem>
          {renderDropdown('view')}
        </MenuItemWrapper>
        <MenuItemWrapper>
          <MenuItem $active={np.openMenu === 'help'} onClick={() => np.toggleMenu('help')}>
            {t('notepad.menu.help')}
          </MenuItem>
          {renderDropdown('help')}
        </MenuItemWrapper>
      </MenuBar>
      <EditorArea>
        <TextArea
          ref={np.textareaRef}
          data-xp-anchor="notepad.textarea"
          value={np.content}
          onChange={np.handleContentChange}
          onSelect={np.handleSelect}
          onKeyUp={np.updateCursorPosition}
          onClick={np.updateCursorPosition}
          onContextMenu={np.handleContextMenu}
          readOnly={np.isReadOnly || np.isAutoTyping}
          className={np.isAutoTyping ? 'xp-busy' : undefined}
          $wordWrap={np.wordWrap}
          wrap={np.wordWrap ? 'soft' : 'off'}
        />
        {np.showStatusBar && (
          <StatusBar>
            <StatusBarSection>
              {t('notepad.cursorPosition', { line: np.cursorPos.line, column: np.cursorPos.col })}
            </StatusBarSection>
          </StatusBar>
        )}
      </EditorArea>
      {createPortal(
        <ContextMenu
          visible={np.contextMenu.visible}
          x={np.contextMenu.x}
          y={np.contextMenu.y}
          onClose={np.closeContextMenu}
          menuItems={contextMenuItems}
        />,
        document.body
      )}
      <FindReplaceDialog
        mode={np.dialogMode}
        onClose={np.closeDialog}
        findInputRef={np.findInputRef}
        replaceFindInputRef={np.replaceFindInputRef}
        findQuery={np.findQuery}
        setFindQuery={np.setFindQuery}
        resetFindIndex={() => {
          np.findStartIndexRef.current = 0;
        }}
        replaceQuery={np.replaceQuery}
        setReplaceQuery={np.setReplaceQuery}
        resetReplaceIndex={() => {
          np.replaceStartIndexRef.current = 0;
        }}
        replaceWith={np.replaceWith}
        setReplaceWith={np.setReplaceWith}
        onFindNext={np.handleFindNext}
        onReplaceFindNext={np.handleReplaceFindNext}
        onReplace={np.handleReplace}
        onReplaceAll={np.handleReplaceAll}
      />
    </Container>
  );
};

/**
 * Resolves a #241 `contentRef` before mounting the editor, so the editable
 * buffer (seeded once) starts from the real body rather than briefly empty.
 * Inline `content` renders immediately (no loading gate).
 */
const Notepad = ({ contentRef, ...props }: NotepadProps) => {
  const resolved = useResolvedContent(props.content, contentRef);
  if (contentRef && resolved.loading) {
    return <Container tabIndex={-1} style={{ outline: 'none' }} />;
  }
  return <NotepadEditor {...props} content={resolved.content} />;
};

export default Notepad;
