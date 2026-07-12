import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../hooks/useApp';
import { useFileSystem } from '../../context/FileSystemContext';
import { useShortcut } from '../../context/KeymapContext';
import { isContainerNode, isFileContentNode } from '../../types';
import {
  Wrap,
  MenuBar,
  MenuItemWrapper,
  MenuItem,
  DropdownMenu,
  DropdownItem,
  DropdownSeparator,
  Toolbar,
  ToolBtn,
  ColorPicker,
  ColorSwatch,
  CanvasWrapper,
  Canvas,
} from './styled';
import { DEFAULT_SAVE_DIR, PALETTE_COLORS, TOOLS } from './constants';
import type { MenuKey, PaintMenuItem, MicrosoftPaintProps } from './types';

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

  // App-scoped shortcuts via the keymap (#132) — fire only when Paint is
  // focused (was a global listener). `Ctrl+N` is intentionally dropped: it opens
  // a new *browser window* (browser-reserved, uncancelable), so "New" lives only
  // on the menu now (see docs/KEYMAP.md). Ctrl↔Cmd via `Mod`.
  const paintApp = { scope: 'app' as const, appId: 'MicrosoftPaint' };
  useShortcut({ id: 'paint.open', combo: 'Mod+O', ...paintApp, label: 'Open' }, () =>
    keyboardHandlersRef.current?.handleOpen()
  );
  useShortcut({ id: 'paint.save', combo: 'Mod+S', ...paintApp, label: 'Save' }, () =>
    keyboardHandlersRef.current?.handleSave()
  );
  useShortcut({ id: 'paint.saveAs', combo: 'Mod+Shift+S', ...paintApp, label: 'Save As' }, () =>
    keyboardHandlersRef.current?.handleSaveAs()
  );

  const toggleMenu = (key: Exclude<MenuKey, null>) => {
    setOpenMenu(prev => (prev === key ? null : key));
  };

  const renderDropdown = (key: Exclude<MenuKey, null>) => {
    if (openMenu !== key) return null;

    const fileMenuItems: PaintMenuItem[] = [
      { label: t('paint.menuitems.new'), action: handleNew },
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
        {TOOLS.map(tool => (
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
          {PALETTE_COLORS.map(color => (
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
