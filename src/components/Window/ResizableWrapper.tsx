import React from 'react';
import Draggable from 'react-draggable';
import { ResizableBox } from 'react-resizable';
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
  onFocus,
  onMove,
  onResize,
  children,
}) => {
  const nodeRef = React.useRef<HTMLDivElement>(null);
  // Under a scaled stage (#215) pointer deltas are in screen px but positions
  // are in stage px — react-draggable's `scale` reconciles the two so a window
  // tracks the finger 1:1. It's 1 (a no-op) when the shell renders natively.
  const scale = useViewportScaleValue();

  return (
    <Draggable
      handle=".title-bar"
      nodeRef={nodeRef}
      disabled={false}
      scale={scale}
      defaultPosition={{ x: left, y: top }}
      onMouseDown={e => {
        e.stopPropagation();
        onFocus();
      }}
      onStop={(_e, data) => {
        onMove(id, data.x, data.y);
      }}
    >
      <div
        ref={nodeRef}
        className="xp-window"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex,
          width,
          height,
        }}
        onMouseDown={e => e.stopPropagation()}
      >
        <ResizableBox
          width={width}
          height={height}
          minConstraints={[minWidth, minHeight]}
          maxConstraints={[2000, 2000]}
          onResizeStart={e => e.stopPropagation()}
          onResizeStop={(_e, { size }) => {
            onResize(id, size.width, size.height);
          }}
          axis={isResizable ? 'both' : 'none'}
          resizeHandles={isResizable ? ['se'] : []}
        >
          {children}
        </ResizableBox>
      </div>
    </Draggable>
  );
};

export default ResizableWrapper;
