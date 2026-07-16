import React from 'react';
import Draggable from 'react-draggable';
import { ResizableBox, ResizeCallbackData } from 'react-resizable';
import 'react-resizable/css/styles.css';
import { useViewportScaleValue } from '../../context/ViewportScaleContext';

interface ResizableWrapperProps {
  id: string;
  left: number;
  top: number;
  width: number;
  height: number;
  minWidth: number;
  minHeight: number;
  zIndex: number;
  isResizable: boolean;
  /** Minimize-to-tray: keep the window mounted (state/tray survive) but not shown. */
  hidden?: boolean;
  onFocus: () => void;
  onMove: (id: string, left: number, top: number) => void;
  onResize: (id: string, width: number, height: number) => void;
  children: React.ReactNode;
}

const ResizableWrapper: React.FC<ResizableWrapperProps> = ({
  id,
  left,
  top,
  width,
  height,
  minWidth,
  minHeight,
  zIndex,
  isResizable,
  hidden,
  onFocus,
  onMove,
  onResize,
  children,
}) => {
  const nodeRef = React.useRef<HTMLDivElement>(null);
  const [position, setPosition] = React.useState({ x: left, y: top });
  const resizeOriginRef = React.useRef({ x: left, y: top, width, height });
  // Under a scaled stage (#215) pointer deltas are in screen px but positions
  // are in stage px — react-draggable's `scale` reconciles the two so a window
  // tracks the finger 1:1. It's 1 (a no-op) when the shell renders natively.
  const scale = useViewportScaleValue();

  React.useEffect(() => {
    setPosition({ x: left, y: top });
  }, [left, top]);

  const updateResizePosition = React.useCallback((data: ResizeCallbackData) => {
    const origin = resizeOriginRef.current;
    const next = {
      x: data.handle.includes('w') ? origin.x + origin.width - data.size.width : origin.x,
      y: data.handle.includes('n') ? origin.y + origin.height - data.size.height : origin.y,
    };
    setPosition(next);
    return next;
  }, []);

  return (
    <Draggable
      handle=".title-bar"
      nodeRef={nodeRef}
      disabled={false}
      scale={scale}
      position={position}
      onDrag={(_e, data) => setPosition({ x: data.x, y: data.y })}
      onMouseDown={e => {
        e.stopPropagation();
        onFocus();
      }}
      onStop={(_e, data) => {
        setPosition({ x: data.x, y: data.y });
        onMove(id, data.x, data.y);
      }}
    >
      <div
        ref={nodeRef}
        className="xp-window"
        data-window-id={id}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex,
          width,
          height,
          display: hidden ? 'none' : undefined,
        }}
        onMouseDown={e => e.stopPropagation()}
      >
        <ResizableBox
          width={width}
          height={height}
          minConstraints={[minWidth, minHeight]}
          maxConstraints={[2000, 2000]}
          onResizeStart={e => {
            e.stopPropagation();
            resizeOriginRef.current = { x: position.x, y: position.y, width, height };
          }}
          onResize={(_e, data) => updateResizePosition(data)}
          onResizeStop={(_e, data) => {
            const nextPosition = updateResizePosition(data);
            onMove(id, nextPosition.x, nextPosition.y);
            const { size } = data;
            onResize(id, size.width, size.height);
          }}
          axis={isResizable ? 'both' : 'none'}
          resizeHandles={isResizable ? ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'] : []}
        >
          {children}
        </ResizableBox>
      </div>
    </Draggable>
  );
};

export default ResizableWrapper;
