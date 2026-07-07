declare module 'react-resizable' {
  import * as React from 'react';

  export interface ResizeCallbackData {
    node: HTMLElement;
    size: { width: number; height: number };
    handle: string;
  }

  export interface ResizableProps {
    width: number;
    height: number;
    onResize?: (e: React.SyntheticEvent, data: ResizeCallbackData) => void;
    onResizeStop?: (e: React.SyntheticEvent, data: ResizeCallbackData) => void;
    onResizeStart?: (e: React.SyntheticEvent, data: ResizeCallbackData) => void;
    resizeHandles?: string[];
    handle?: React.ReactNode;
    children?: React.ReactNode;
    className?: string;
    draggableOpts?: Record<string, unknown>;
    minConstraints?: [number, number];
    maxConstraints?: [number, number];
    lockAspectRatio?: boolean;
    axis?: 'both' | 'x' | 'y' | 'none';
    transformScale?: number;
  }

  export class Resizable extends React.Component<ResizableProps> {}

  export interface ResizableBoxProps extends ResizableProps {
    minConstraints?: [number, number];
    maxConstraints?: [number, number];
  }

  export class ResizableBox extends React.Component<ResizableBoxProps> {}
}
