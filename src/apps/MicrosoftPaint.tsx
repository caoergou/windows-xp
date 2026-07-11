import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { useApp } from '../hooks/useApp';
import { useFileSystem } from '../context/FileSystemContext';
import { isContainerNode, isFileContentNode } from '../types';

const Wrap = styled.div`
  width: 100%;
  height: 100%;
  background: #ece9d8;
  display: flex;
  flex-direction: column;
  padding: 6px;
  box-sizing: border-box;
  font-family: 'Tahoma', 'SimSun', 'Microsoft YaHei', sans-serif;
  font-size: 12px;
  user-select: none;

  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }
`;

const MenuBar = styled.div`
  height: 20px;
  background: linear-gradient(to bottom, #f0f0f0 0%, #e0e0e0 100%);
  border-bottom: 1px solid #808080;
  display: flex;
  align-items: center;
  padding: 0 2px;
  font-size: 11px;
  font-family: 'Tahoma', 'SimSun', 'Microsoft YaHei', sans-serif;
  flex-shrink: 0;
  margin: -6px -6px 6px -6px;
`;

const MenuItemWrapper = styled.div`
  position: relative;
`;

const MenuItem = styled.div<{ $active?: boolean }>`
  padding: 2px 8px;
  cursor: pointer;
  background: ${p => (p.$active ? '#316AC5' : 'transparent')};
  color: ${p => (p.$active ? 'white' : 'inherit')};

  &:hover {
    background: #316ac5;
    color: white;
  }
`;

const DropdownMenu = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  min-width: 160px;
  background: #f0f0f0;
  border: 1px solid #000;
  box-shadow: 2px 2px 0px #808080;
  padding: 2px 0;
  z-index: 9999;
  font-size: 12px;
  font-family: 'Tahoma', 'SimSun', 'Microsoft YaHei', sans-serif;
`;

const DropdownItem = styled.div<{ $disabled?: boolean }>`
  padding: 3px 24px 3px 24px;
  cursor: ${p => (p.$disabled ? 'default' : 'pointer')};
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: ${p => (p.$disabled ? '#A0A0A0' : '#000')};
  position: relative;
  white-space: nowrap;

  &:hover {
    background: ${p => (p.$disabled ? 'transparent' : '#316AC5')};
    color: ${p => (p.$disabled ? '#A0A0A0' : 'white')};
  }

  .shortcut {
    margin-left: 24px;
    font-size: 11px;
    color: inherit;
    opacity: 0.8;
  }
`;

const DropdownSeparator = styled.div`
  height: 1px;
  background: #808080;
  margin: 3px 2px;
`;

const Toolbar = styled.div`
  display: flex;
  gap: 4px;
  margin-bottom: 6px;
  padding: 4px;
  background: #ece9d8;
  border: 1px solid;
  border-color: #ffffff #808080 #808080 #ffffff;
  overflow: hidden;
  box-sizing: border-box;
`;

const ToolBtn = styled.button`
  width: 28px;
  height: 28px;
  flex: 0 0 28px;
  cursor: pointer;
  font-size: 12px;
  font-family: inherit;
  border: 1px solid;
  border-color: #ffffff #808080 #808080 #ffffff;
  outline: none;
  background: #ece9d8;
  display: flex;
  align-items: center;
  justify-content: center;

  &:active {
    border-color: #808080 #ffffff #ffffff #808080;
    padding-top: 1px;
    padding-left: 1px;
  }

  &.active {
    background: #0a2463;
    color: #ffffff;
  }
`;

const ColorPicker = styled.div`
  display: flex;
  gap: 2px;
  margin-left: auto;
  align-items: center;
  justify-content: flex-end;
  min-width: 0;
  overflow: hidden;
`;

const ColorSwatch = styled.div<{ $color: string; $active: boolean }>`
  width: 24px;
  height: 24px;
  flex: 0 0 24px;
  box-sizing: border-box;
  border: 2px solid ${p => (p.$active ? '#ff0000' : '#808080')};
  background: ${p => p.$color};
  cursor: pointer;
`;

const CanvasWrapper = styled.div`
  flex: 1;
  background: #ffffff;
  border: 2px inset #808080;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
`;

const Canvas = styled.canvas`
  cursor: crosshair;
  background: #ffffff;
`;

type MenuKey = 'file' | 'edit' | 'view' | 'help' | null;

type PaintMenuItem =
  | { type: 'separator' }
  | {
      type?: undefined;
      label: string;
      action: () => void | Promise<void>;
      shortcut?: string;
      disabled?: boolean;
    };

interface MicrosoftPaintProps {
  windowId?: string;
  src?: string;
  fileName?: string;
  filePath?: string[];
}

const DEFAULT_SAVE_DIR = ['我的文档', '我的图片'];

const MicrosoftPaint = ({
  windowId,
  src,
  fileName: initialFileName,
  filePath: initialFilePath,
}: MicrosoftPaintProps) => {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingSnapshotRef = useRef<ImageData | null>(null);
  const api = useApp(windowId);
  const { getFile, updateFile, createFile } = useFileSystem();
  const menuRef = useRef<HTMLDivElement>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [currentTool, setCurrentTool] = useState('brush');
  const [currentColor, setCurrentColor] = useState('#000000');
  const [lineWidth] = useState(2);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [isModified, setIsModified] = useState(false);
  const [currentFilePath, setCurrentFilePath] = useState<string[] | undefined>(initialFilePath);
  const [currentFileName, setCurrentFileName] = useState<string | undefined>(initialFileName);
  const [openMenu, setOpenMenu] = useState<MenuKey>(null);

  const colors = [
    '#000000',
    '#808080',
    '#c0c0c0',
    '#ffffff',
    '#800000',
    '#ff0000',
    '#808000',
    '#ffff00',
    '#008000',
    '#00ff00',
    '#008080',
    '#00ffff',
    '#000080',
    '#0000ff',
    '#800080',
    '#ff00ff',
  ];

  const keyboardHandlersRef = useRef<{
    handleNew: () => void;
    handleOpen: () => void;
    handleSave: () => Promise<void>;
    handleSaveAs: () => Promise<void>;
  } | null>(null);

  // Update window title when file changes
  useEffect(() => {
    if (currentFileName) {
      const title = isModified
        ? `${currentFileName} * - ${t('apps.paint')}`
        : `${currentFileName} - ${t('apps.paint')}`;
      api.window.setTitle(title);
    } else {
      const title = isModified
        ? `${t('paint.untitled')} * - ${t('apps.paint')}`
        : `${t('paint.untitled')} - ${t('apps.paint')}`;
      api.window.setTitle(title);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFileName, isModified]);

  // Load image from props when available
  useEffect(() => {
    if (src) {
      loadImage(src);
    }
  }, [src]);

  // Initialize canvas with white background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const loadImage = (imageSrc: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const img = new Image();
    img.onload = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      setIsModified(false);
    };
    img.onerror = () => {
      api.dialog.alert({
        title: t('apps.paint'),
        message: t('paint.dialogs.loadFailed'),
        type: 'error',
      });
    };
    img.src = imageSrc;
  };

  const getCanvasDataUrl = () => {
    const canvas = canvasRef.current;
    if (!canvas) return '';
    return canvas.toDataURL('image/png');
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    setStartPos({ x, y });

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (currentTool === 'brush') {
      drawingSnapshotRef.current = null;
      ctx.beginPath();
      ctx.moveTo(x, y);
    } else {
      drawingSnapshotRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = currentColor;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (currentTool === 'brush') {
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (currentTool === 'line') {
      if (drawingSnapshotRef.current) {
        ctx.putImageData(drawingSnapshotRef.current, 0, 0);
      }
      ctx.beginPath();
      ctx.moveTo(startPos.x, startPos.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (currentTool === 'rectangle') {
      if (drawingSnapshotRef.current) {
        ctx.putImageData(drawingSnapshotRef.current, 0, 0);
      }
      ctx.strokeRect(startPos.x, startPos.y, x - startPos.x, y - startPos.y);
    } else if (currentTool === 'circle') {
      if (drawingSnapshotRef.current) {
        ctx.putImageData(drawingSnapshotRef.current, 0, 0);
      }
      const radius = Math.sqrt(Math.pow(x - startPos.x, 2) + Math.pow(y - startPos.y, 2));
      ctx.beginPath();
      ctx.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsModified(true);
    }
    drawingSnapshotRef.current = null;
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setIsModified(true);
  };

  const resetCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setCurrentFilePath(undefined);
    setCurrentFileName(undefined);
    setIsModified(false);
  };

  // File Operations
  const handleNew = () => {
    if (isModified) {
      api.dialog
        .confirm({
          title: t('apps.paint'),
          message: t('paint.dialogs.unsavedChanges'),
          type: 'question',
        })
        .then(confirmed => {
          if (confirmed) {
            handleSave().then(() => {
              resetCanvas();
            });
          } else {
            resetCanvas();
          }
        });
    } else {
      resetCanvas();
    }
  };

  const handleOpen = () => {
    if (isModified) {
      api.dialog
        .confirm({
          title: t('apps.paint'),
          message: t('paint.dialogs.unsavedChanges'),
          type: 'question',
        })
        .then(confirmed => {
          if (confirmed) {
            handleSave().then(() => {
              showOpenDialog();
            });
          } else {
            showOpenDialog();
          }
        });
    } else {
      showOpenDialog();
    }
  };

  const showOpenDialog = () => {
    const defaultPath = DEFAULT_SAVE_DIR.join('\\');
    api.dialog
      .prompt({
        title: t('paint.dialogs.openTitle'),
        message: t('paint.dialogs.openPrompt'),
        defaultValue: defaultPath ? `${defaultPath}\\` : '',
      })
      .then(filePathStr => {
        if (!filePathStr) return;
        openFileAtPath(filePathStr);
      });
  };

  const openFileAtPath = async (filePathStr: string) => {
    const parts = filePathStr.split('\\').filter(Boolean);
    if (parts.length === 0) return;

    const fileName = parts[parts.length - 1];
    const parentPath = parts.slice(0, -1);

    const node = getFile(parts);
    if (!node) {
      await api.dialog.alert({
        title: t('paint.dialogs.openTitle'),
        message: t('paint.dialogs.fileNotFound'),
        type: 'error',
      });
      return;
    }

    if (node.type !== 'file') {
      await api.dialog.alert({
        title: t('paint.dialogs.openTitle'),
        message: t('paint.dialogs.cannotOpenFolder'),
        type: 'error',
      });
      return;
    }

    if (!isFileContentNode(node) || !node.content) {
      await api.dialog.alert({
        title: t('paint.dialogs.openTitle'),
        message: t('paint.dialogs.unsupportedType'),
        type: 'error',
      });
      return;
    }

    loadImage(node.content);
    setCurrentFilePath(parentPath);
    setCurrentFileName(fileName);
  };

  const handleSave = async (): Promise<void> => {
    if (currentFilePath && currentFileName) {
      const fullPath = [...currentFilePath, currentFileName];
      const node = getFile(fullPath);

      if (node && isFileContentNode(node)) {
        if (node.readOnly) {
          await api.dialog.alert({
            title: t('paint.dialogs.saveTitle'),
            message: t('paint.dialogs.readOnly'),
            type: 'error',
          });
          return;
        }

        updateFile(fullPath, { content: getCanvasDataUrl() });
        setIsModified(false);
      }
    } else {
      await handleSaveAs();
    }
  };

  const handleSaveAs = async (): Promise<void> => {
    const defaultPath = currentFileName
      ? [...DEFAULT_SAVE_DIR, currentFileName].join('\\')
      : [...DEFAULT_SAVE_DIR, t('paint.untitledFile')].join('\\');

    const filePathStr = await api.dialog.prompt({
      title: t('paint.dialogs.saveAsTitle'),
      message: t('paint.dialogs.saveAsPrompt'),
      defaultValue: defaultPath,
    });

    if (!filePathStr) return;

    const parts = filePathStr.split('\\').filter(Boolean);
    if (parts.length === 0) return;

    const newFileName = parts[parts.length - 1];
    const parentPath = parts.slice(0, -1);

    const parent = getFile(parentPath);
    if (!parent) {
      await api.dialog.alert({
        title: t('paint.dialogs.saveAsTitle'),
        message: t('paint.dialogs.pathNotFound'),
        type: 'error',
      });
      return;
    }

    if (!isContainerNode(parent)) {
      await api.dialog.alert({
        title: t('paint.dialogs.saveAsTitle'),
        message: t('paint.dialogs.invalidPath'),
        type: 'error',
      });
      return;
    }

    const content = getCanvasDataUrl();
    const existingFile = getFile(parts);
    if (existingFile) {
      const overwrite = await api.dialog.confirm({
        title: t('paint.dialogs.saveAsTitle'),
        message: t('paint.dialogs.fileExists', { name: newFileName }),
        type: 'warning',
      });
      if (!overwrite) return;

      updateFile(parts, { content, app: 'MicrosoftPaint', icon: 'image' });
    } else {
      createFile(parentPath, newFileName, 'file', {
        content,
        app: 'MicrosoftPaint',
        icon: 'image',
      });
    }

    setCurrentFilePath(parentPath);
    setCurrentFileName(newFileName);
    setIsModified(false);
  };

  const handleExit = () => {
    if (isModified) {
      api.dialog
        .confirm({
          title: t('apps.paint'),
          message: t('paint.dialogs.unsavedChanges'),
          type: 'question',
        })
        .then(confirmed => {
          if (confirmed) {
            handleSave().then(() => {
              api.window.close();
            });
          } else {
            api.window.close();
          }
        });
    } else {
      api.window.close();
    }
  };

  // Populate the ref after all handlers are initialized
  keyboardHandlersRef.current = { handleNew, handleOpen, handleSave, handleSaveAs };

  // Click outside to close menu
  useEffect(() => {
    if (!openMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMenu]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const handlers = keyboardHandlersRef.current;
      if (!handlers) return;
      if (e.ctrlKey) {
        switch (e.key.toLowerCase()) {
          case 'n':
            e.preventDefault();
            handlers.handleNew();
            break;
          case 'o':
            e.preventDefault();
            handlers.handleOpen();
            break;
          case 's':
            e.preventDefault();
            if (e.shiftKey) {
              handlers.handleSaveAs();
            } else {
              handlers.handleSave();
            }
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleMenu = (key: Exclude<MenuKey, null>) => {
    setOpenMenu(prev => (prev === key ? null : key));
  };

  const renderDropdown = (key: Exclude<MenuKey, null>) => {
    if (openMenu !== key) return null;

    const fileMenuItems: PaintMenuItem[] = [
      { label: t('paint.menuitems.new'), shortcut: 'Ctrl+N', action: handleNew },
      { label: t('paint.menuitems.open'), shortcut: 'Ctrl+O', action: handleOpen },
      { label: t('paint.menuitems.save'), shortcut: 'Ctrl+S', action: handleSave },
      { label: t('paint.menuitems.saveAs'), action: handleSaveAs },
      { type: 'separator' as const },
      { label: t('paint.menuitems.exit'), action: handleExit },
    ];

    const editMenuItems: PaintMenuItem[] = [
      {
        label: t('paint.menuitems.undo'),
        shortcut: 'Ctrl+Z',
        action: () => undefined,
        disabled: true,
      },
      { type: 'separator' as const },
      {
        label: t('paint.menuitems.cut'),
        shortcut: 'Ctrl+X',
        action: () => undefined,
        disabled: true,
      },
      {
        label: t('paint.menuitems.copy'),
        shortcut: 'Ctrl+C',
        action: () => undefined,
        disabled: true,
      },
      {
        label: t('paint.menuitems.paste'),
        shortcut: 'Ctrl+V',
        action: () => undefined,
        disabled: true,
      },
      {
        label: t('paint.menuitems.delete'),
        shortcut: 'Del',
        action: () => undefined,
        disabled: true,
      },
      { type: 'separator' as const },
      {
        label: t('paint.menuitems.selectAll'),
        shortcut: 'Ctrl+A',
        action: () => undefined,
        disabled: true,
      },
    ];

    const viewMenuItems: PaintMenuItem[] = [
      { label: t('paint.menuitems.toolbox'), action: () => undefined, disabled: true },
      { label: t('paint.menuitems.colorBox'), action: () => undefined, disabled: true },
      { label: t('paint.menuitems.statusBar'), action: () => undefined, disabled: true },
    ];

    const helpMenuItems: PaintMenuItem[] = [
      { label: t('paint.menuitems.helpTopics'), action: () => undefined, disabled: true },
      { type: 'separator' as const },
      { label: t('paint.menuitems.about'), action: () => undefined, disabled: true },
    ];

    const menuMap: Record<string, PaintMenuItem[]> = {
      file: fileMenuItems,
      edit: editMenuItems,
      view: viewMenuItems,
      help: helpMenuItems,
    };

    const items = menuMap[key] || [];

    return (
      <DropdownMenu>
        {items.map((item, i) =>
          item.type === 'separator' ? (
            <DropdownSeparator key={i} />
          ) : (
            <DropdownItem
              key={i}
              $disabled={item.disabled}
              onClick={() => {
                if (!item.disabled && item.action) {
                  item.action();
                }
                setOpenMenu(null);
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

  const tools = [
    { id: 'brush', label: 'brush' },
    { id: 'line', label: 'line' },
    { id: 'rectangle', label: 'rectangle' },
    { id: 'circle', label: 'circle' },
  ];

  return (
    <Wrap ref={menuRef}>
      <MenuBar>
        <MenuItemWrapper>
          <MenuItem $active={openMenu === 'file'} onClick={() => toggleMenu('file')}>
            {t('paint.menu.file')}
          </MenuItem>
          {renderDropdown('file')}
        </MenuItemWrapper>
        <MenuItemWrapper>
          <MenuItem $active={openMenu === 'edit'} onClick={() => toggleMenu('edit')}>
            {t('paint.menu.edit')}
          </MenuItem>
          {renderDropdown('edit')}
        </MenuItemWrapper>
        <MenuItemWrapper>
          <MenuItem $active={openMenu === 'view'} onClick={() => toggleMenu('view')}>
            {t('paint.menu.view')}
          </MenuItem>
          {renderDropdown('view')}
        </MenuItemWrapper>
        <MenuItemWrapper>
          <MenuItem $active={openMenu === 'help'} onClick={() => toggleMenu('help')}>
            {t('paint.menu.help')}
          </MenuItem>
          {renderDropdown('help')}
        </MenuItemWrapper>
      </MenuBar>
      <Toolbar>
        {tools.map(tool => (
          <ToolBtn
            key={tool.id}
            className={currentTool === tool.id ? 'active' : ''}
            onClick={() => setCurrentTool(tool.id)}
            title={tool.id}
          >
            {tool.id === 'brush' && (
              <svg width="16" height="16" viewBox="0 0 16 16">
                <path
                  d="M2 14c0-2 1.5-4 3-5.5L10 3.5l2.5 2.5-5 5.5C6 13 4 14 2 14z"
                  fill="currentColor"
                />
                <path
                  d="M10.5 2.5L13 5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            )}
            {tool.id === 'line' && (
              <svg width="16" height="16" viewBox="0 0 16 16">
                <line x1="2" y1="14" x2="14" y2="2" stroke="currentColor" strokeWidth="2" />
              </svg>
            )}
            {tool.id === 'rectangle' && (
              <svg width="16" height="16" viewBox="0 0 16 16">
                <rect
                  x="2"
                  y="3"
                  width="12"
                  height="10"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  fill="none"
                />
              </svg>
            )}
            {tool.id === 'circle' && (
              <svg width="16" height="16" viewBox="0 0 16 16">
                <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" fill="none" />
              </svg>
            )}
          </ToolBtn>
        ))}
        <ToolBtn onClick={clearCanvas} title={t('paint.clear')}>
          <svg width="16" height="16" viewBox="0 0 16 16">
            <rect
              x="2"
              y="4"
              width="12"
              height="10"
              rx="1"
              stroke="currentColor"
              strokeWidth="1.2"
              fill="none"
            />
            <line x1="5" y1="2" x2="11" y2="2" stroke="currentColor" strokeWidth="1.2" />
            <line x1="6" y1="7" x2="6" y2="11" stroke="currentColor" strokeWidth="1.2" />
            <line x1="10" y1="7" x2="10" y2="11" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </ToolBtn>
        <ColorPicker>
          {colors.map(color => (
            <ColorSwatch
              key={color}
              $color={color}
              $active={currentColor === color}
              onClick={() => setCurrentColor(color)}
            />
          ))}
        </ColorPicker>
      </Toolbar>
      <CanvasWrapper>
        <Canvas
          ref={canvasRef}
          width={600}
          height={400}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
        />
      </CanvasWrapper>
    </Wrap>
  );
};

export default MicrosoftPaint;
