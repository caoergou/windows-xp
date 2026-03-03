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

const ColorSwatch = styled.div`
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

const MicrosoftPaint = ({ windowId }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentTool, setCurrentTool] = useState('brush');
  const [currentColor, setCurrentColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(2);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

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

  const startDrawing = (e) => {
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

  const draw = (e) => {
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
      const tempCanvas = canvas.cloneNode(true);
      const tempCtx = tempCanvas.getContext('2d');
      tempCtx.drawImage(canvas, 0, 0);
      tempCtx.beginPath();
      tempCtx.moveTo(startPos.x, startPos.y);
      tempCtx.lineTo(x, y);
      tempCtx.stroke();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(tempCanvas, 0, 0);
    } else if (currentTool === 'rectangle') {
      const tempCanvas = canvas.cloneNode(true);
      const tempCtx = tempCanvas.getContext('2d');
      tempCtx.drawImage(canvas, 0, 0);
      tempCtx.strokeRect(startPos.x, startPos.y, x - startPos.x, y - startPos.y);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(tempCanvas, 0, 0);
    } else if (currentTool === 'circle') {
      const tempCanvas = canvas.cloneNode(true);
      const tempCtx = tempCanvas.getContext('2d');
      tempCtx.drawImage(canvas, 0, 0);
      const radius = Math.sqrt(Math.pow(x - startPos.x, 2) + Math.pow(y - startPos.y, 2));
      tempCtx.beginPath();
      tempCtx.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI);
      tempCtx.stroke();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(tempCanvas, 0, 0);
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
