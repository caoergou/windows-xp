// @ts-nocheck: temporary suppression of pre-existing type errors during incremental migration
import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { useApp } from '../hooks/useApp';
import { useFileSystem } from '../context/FileSystemContext';
import { isContainerNode, isFileContentNode } from '../types';

const Wrap = styled.div`
  width: 100%;
  height: 100%;
  background: #d4d0c8;
  display: flex;
  flex-direction: column;
  padding: 6px;
  box-sizing: border-box;
  font-family: 'Microsoft YaHei', Tahoma, sans-serif;
  font-size: 12px;
  user-select: none;
`;

const MenuBar = styled.div`
  height: 20px;
  background: linear-gradient(to bottom, #f0f0f0 0%, #e0e0e0 100%);
  border-bottom: 1px solid #808080;
  display: flex;
  align-items: center;
  padding: 0 2px;
  font-size: 11px;
  font-family: Tahoma, sans-serif;
  flex-shrink: 0;
  margin: -6px -6px 6px -6px;
`;

const MenuItemWrapper = styled.div`
  position: relative;
`;

const MenuItem = styled.div<{ $active?: boolean }>`
  padding: 2px 8px;
  cursor: pointer;
  background: ${p => p.$active ? '#316AC5' : 'transparent'};
  color: ${p => p.$active ? 'white' : 'inherit'};

  &:hover {
    background: #316AC5;
    color: white;
  }
`;

const DropdownMenu = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  min-width: 160px;
  background: #F0F0F0;
  border: 1px solid #000;
  box-shadow: 2px 2px 0px #808080;
  padding: 2px 0;
  z-index: 9999;
  font-size: 12px;
  font-family: Tahoma, sans-serif;
`;

const DropdownItem = styled.div<{ $disabled?: boolean }>`
  padding: 3px 24px 3px 24px;
  cursor: ${p => p.$disabled ? 'default' : 'pointer'};
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: ${p => p.$disabled ? '#A0A0A0' : '#000'};
  position: relative;
  white-space: nowrap;

  &:hover {
    background: ${p => p.$disabled ? 'transparent' : '#316AC5'};
    color: ${p => p.$disabled ? '#A0A0A0' : 'white'};
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
  background: #d4d0c8;
  border: 1px solid;
  border-color: #ffffff #808080 #808080 #ffffff;
`;

const ToolBtn = styled.button`
  width: 28px;
  height: 28px;
  cursor: pointer;
  font-size: 12px;
  font-family: inherit;
  border: 1px solid;
  border-color: #ffffff #808080 #808080 #ffffff;
  outline: none;
  background: #d4d0c8;
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
  gap: 4px;
  margin-left: auto;
  align-items: center;
`;

const ColorSwatch = styled.div<{ $color: string; $active: boolean }>`
  width: 24px;
  height: 24px;
  border: 2px solid ${p => p.$active ? '#ff0000' : '#808080'};
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

interface MicrosoftPaintProps {
  windowId?: string;
  src?: string;
  fileName?: string;
  filePath?: string[];
}

const DEFAULT_SAVE_DIR = ['我的文档', '我的图片'];

const MicrosoftPaint = ({ windowId, src, fileName: initialFileName, filePath: initialFilePath }: MicrosoftPaintProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
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
    '#000000', '#808080', '#c0c0c0', '#ffffff',
    '#800000', '#ff0000', '#808000', '#ffff00',
    '#008000', '#00ff00', '#008080', '#00ffff',
    '#000080', '#0000ff', '#800080', '#ff00ff'
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
      const title = isModified ? `${currentFileName} * - 画图` : `${currentFileName} - 画图`;
      api.window.setTitle(title);
    } else {
      const title = isModified ? '无标题 * - 画图' : '无标题 - 画图';
      api.window.setTitle(title);
    }
  }, [currentFileName, isModified, api.window]);

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
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const loadImage = (imageSrc: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const img = new Image();
    img.onload = () => {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      setIsModified(false);
    };
    img.onerror = () => {
      api.dialog.alert({ title: '画图', message: '无法加载图片。', type: 'error' });
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
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (currentTool === 'brush') {
      ctx.beginPath();
      ctx.moveTo(x, y);
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

    if (currentTool === 'brush') {
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (currentTool === 'line') {
      // 保存当前画布状态
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      // 清除画布
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // 恢复之前的画布状态
      ctx.putImageData(imageData, 0, 0);
      // 绘制临时线条
      ctx.beginPath();
      ctx.moveTo(startPos.x, startPos.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (currentTool === 'rectangle') {
      // 保存当前画布状态
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      // 清除画布
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // 恢复之前的画布状态
      ctx.putImageData(imageData, 0, 0);
      // 绘制临时矩形
      ctx.strokeRect(startPos.x, startPos.y, x - startPos.x, y - startPos.y);
    } else if (currentTool === 'circle') {
      // 保存当前画布状态
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      // 清除画布
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // 恢复之前的画布状态
      ctx.putImageData(imageData, 0, 0);
      // 绘制临时圆形
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
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setIsModified(true);
  };

  const resetCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setCurrentFilePath(undefined);
    setCurrentFileName(undefined);
    setIsModified(false);
  };

  // File Operations
  const handleNew = () => {
    if (isModified) {
      api.dialog.confirm({
        title: '画图',
        message: '文件已修改，是否保存更改？',
        type: 'question'
      }).then(confirmed => {
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
      api.dialog.confirm({
        title: '画图',
        message: '文件已修改，是否保存更改？',
        type: 'question'
      }).then(confirmed => {
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
    api.dialog.prompt({
      title: '打开',
      message: '请输入文件路径（例如：我的文档\\我的图片\\image.png）：',
      defaultValue: defaultPath ? `${defaultPath}\\` : ''
    }).then(filePathStr => {
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
      await api.dialog.alert({ title: '打开', message: '找不到文件。', type: 'error' });
      return;
    }

    if (node.type !== 'file') {
      await api.dialog.alert({ title: '打开', message: '无法打开文件夹。', type: 'error' });
      return;
    }

    if (!isFileContentNode(node) || !node.content) {
      await api.dialog.alert({ title: '打开', message: '无法读取此文件类型。', type: 'error' });
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
          await api.dialog.alert({ title: '保存', message: '文件是只读的。', type: 'error' });
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
      : [...DEFAULT_SAVE_DIR, '未命名.png'].join('\\');

    const filePathStr = await api.dialog.prompt({
      title: '另存为',
      message: '请输入文件名和路径：',
      defaultValue: defaultPath
    });

    if (!filePathStr) return;

    const parts = filePathStr.split('\\').filter(Boolean);
    if (parts.length === 0) return;

    const newFileName = parts[parts.length - 1];
    const parentPath = parts.slice(0, -1);

    const parent = getFile(parentPath);
    if (!parent) {
      await api.dialog.alert({ title: '另存为', message: '路径不存在。', type: 'error' });
      return;
    }

    if (!isContainerNode(parent)) {
      await api.dialog.alert({ title: '另存为', message: '无效的路径。', type: 'error' });
      return;
    }

    const content = getCanvasDataUrl();
    const existingFile = getFile(parts);
    if (existingFile) {
      const overwrite = await api.dialog.confirm({
        title: '另存为',
        message: `文件 "${newFileName}" 已存在。是否覆盖？`,
        type: 'warning'
      });
      if (!overwrite) return;

      updateFile(parts, { content, app: 'MicrosoftPaint', icon: 'image' });
    } else {
      createFile(parentPath, newFileName, 'file', {
        content,
        app: 'MicrosoftPaint',
        icon: 'image'
      });
    }

    setCurrentFilePath(parentPath);
    setCurrentFileName(newFileName);
    setIsModified(false);
  };

  const handleExit = () => {
    if (isModified) {
      api.dialog.confirm({
        title: '画图',
        message: '文件已修改，是否保存更改？',
        type: 'question'
      }).then(confirmed => {
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
    setOpenMenu(prev => prev === key ? null : key);
  };

  const renderDropdown = (key: Exclude<MenuKey, null>) => {
    if (openMenu !== key) return null;

    const fileMenuItems = [
      { label: '新建(N)', shortcut: 'Ctrl+N', action: handleNew },
      { label: '打开(O)...', shortcut: 'Ctrl+O', action: handleOpen },
      { label: '保存(S)', shortcut: 'Ctrl+S', action: handleSave },
      { label: '另存为(A)...', action: handleSaveAs },
      { type: 'separator' as const },
      { label: '退出(X)', action: handleExit },
    ];

    const editMenuItems = [
      { label: '撤销(U)', shortcut: 'Ctrl+Z', action: () => undefined, disabled: true },
      { type: 'separator' as const },
      { label: '剪切(T)', shortcut: 'Ctrl+X', action: () => undefined, disabled: true },
      { label: '复制(C)', shortcut: 'Ctrl+C', action: () => undefined, disabled: true },
      { label: '粘贴(P)', shortcut: 'Ctrl+V', action: () => undefined, disabled: true },
      { label: '删除(L)', shortcut: 'Del', action: () => undefined, disabled: true },
      { type: 'separator' as const },
      { label: '全选(A)', shortcut: 'Ctrl+A', action: () => undefined, disabled: true },
    ];

    const viewMenuItems = [
      { label: '工具箱(T)', action: () => undefined, disabled: true },
      { label: '颜料盒(C)', action: () => undefined, disabled: true },
      { label: '状态栏(S)', action: () => undefined, disabled: true },
    ];

    const helpMenuItems = [
      { label: '帮助主题(H)', action: () => undefined, disabled: true },
      { type: 'separator' as const },
      { label: '关于画图(A)', action: () => undefined, disabled: true },
    ];

    const menuMap: Record<string, typeof fileMenuItems> = {
      file: fileMenuItems,
      edit: editMenuItems,
      view: viewMenuItems,
      help: helpMenuItems,
    };

    const items = menuMap[key] || [];

    return (
      <DropdownMenu>
        {items.map((item, i) =>
          item.type === 'separator'
            ? <DropdownSeparator key={i} />
            : (
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
    { id: 'brush', label: '🖌️' },
    { id: 'line', label: '📏' },
    { id: 'rectangle', label: '⬜' },
    { id: 'circle', label: '⭕' }
  ];

  return (
    <Wrap ref={menuRef}>
      <MenuBar>
        <MenuItemWrapper>
          <MenuItem $active={openMenu === 'file'} onClick={() => toggleMenu('file')}>
            文件(F)
          </MenuItem>
          {renderDropdown('file')}
        </MenuItemWrapper>
        <MenuItemWrapper>
          <MenuItem $active={openMenu === 'edit'} onClick={() => toggleMenu('edit')}>
            编辑(E)
          </MenuItem>
          {renderDropdown('edit')}
        </MenuItemWrapper>
        <MenuItemWrapper>
          <MenuItem $active={openMenu === 'view'} onClick={() => toggleMenu('view')}>
            查看(V)
          </MenuItem>
          {renderDropdown('view')}
        </MenuItemWrapper>
        <MenuItemWrapper>
          <MenuItem $active={openMenu === 'help'} onClick={() => toggleMenu('help')}>
            帮助(H)
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
            {tool.label}
          </ToolBtn>
        ))}
        <ToolBtn onClick={clearCanvas} title="清空">
          🗑️
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
