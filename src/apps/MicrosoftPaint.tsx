import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';

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

interface MicrosoftPaintProps {
  windowId?: string;
}

const MicrosoftPaint = ({ windowId }: MicrosoftPaintProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [currentTool, setCurrentTool] = useState<string>('brush');
  const [currentColor, setCurrentColor] = useState<string>('#000000');
  const [lineWidth, setLineWidth] = useState<number>(2);
  const [startPos, setStartPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const colors = [
    '#000000', '#808080', '#c0c0c0', '#ffffff',
    '#800000', '#ff0000', '#808000', '#ffff00',
    '#008000', '#00ff00', '#008080', '#00ffff',
    '#000080', '#0000ff', '#800080', '#ff00ff'
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

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
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const tools = [
    { id: 'brush', label: '🖌️' },
    { id: 'line', label: '📏' },
    { id: 'rectangle', label: '⬜' },
    { id: 'circle', label: '⭕' }
  ];

  return (
    <Wrap>
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
