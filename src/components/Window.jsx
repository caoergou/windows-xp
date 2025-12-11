import React from 'react';
import styled from 'styled-components';
import Draggable from 'react-draggable';
import { ResizableBox } from 'react-resizable';
import { useWindowManager } from '../context/WindowManagerContext';
import XPIcon from './XPIcon';
import 'react-resizable/css/styles.css';

const WindowContainer = styled.div`
    position: absolute;
    display: flex;
    flex-direction: column;
    min-height: 200px;
    min-width: 300px;
    background: #ECE9D8;
    border-radius: 3px 3px 0 0;
    box-shadow: 2px 2px 10px rgba(0,0,0,0.5);
    padding: 3px;
    border: 1px solid #0055EA; /* XP Blue Border */

    /* Ensure handle is visible */
    .react-resizable-handle {
        z-index: 1000;
        cursor: se-resize;
    }
`;

const TitleBar = styled.div`
    height: 30px;
    background: linear-gradient(to bottom, #0058EE 0%, #3593FF 4%, #288EFF 18%, #127DFF 20%, #0369FC 39%, #0262EE 41%, #0057E5 100%);
    border-radius: 3px 3px 0 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 5px;
    cursor: default;
    user-select: none;
`;

const TitleText = styled.div`
    color: white;
    font-weight: bold;
    font-size: 13px;
    text-shadow: 1px 1px 1px black;
    display: flex;
    align-items: center;
    
    .title-icon {
        margin-right: 5px;
        filter: drop-shadow(1px 1px 1px rgba(0,0,0,0.3));
    }
`;

const TitleControls = styled.div`
    display: flex;
    gap: 2px;
`;

const BaseButton = styled.button`
    width: 21px;
    height: 21px;
    border: 1px solid #fff;
    border-radius: 3px;
    margin-left: 2px;
    padding: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    outline: none;
    cursor: default;
    
    box-shadow: inset 0 -1px 2px rgba(0,0,0,0.1),
              0 1px 2px rgba(0,0,0,0.1);

    &:hover {
        filter: brightness(1.1);
    }

    &:active {
        filter: brightness(0.9);
        box-shadow: inset 0 1px 2px rgba(0,0,0,0.2);
    }
`;

const MinimizeBtn = styled(BaseButton)`
    background: linear-gradient(180deg, #78ACF3 0%, #76ABF3 5%, #72A7F2 10%, #6EA3F1 15%, #6A9EEF 20%, #659AED 25%, #6195EB 30%, #5C90E9 35%, #578BE7 40%, #5286E5 45%, #4C81E3 50%, #3F75DD 50%, #396ED9 55%, #3267D4 60%, #2B60CF 65%, #2358CA 70%, #1B51C5 75%, #134AC0 80%, #0B43BB 85%, #023BB6 90%, #0036B3 95%, #0033B3 100%);

    &::before {
        content: "";
        width: 8px;
        height: 2px;
        background-color: white;
        align-self: flex-end;
        margin-bottom: 4px;
        box-shadow: 0 1px 0 rgba(0,0,0,0.3);
    }
`;

const MaximizeBtn = styled(BaseButton)`
    background: linear-gradient(180deg, #78ACF3 0%, #76ABF3 5%, #72A7F2 10%, #6EA3F1 15%, #6A9EEF 20%, #659AED 25%, #6195EB 30%, #5C90E9 35%, #578BE7 40%, #5286E5 45%, #4C81E3 50%, #3F75DD 50%, #396ED9 55%, #3267D4 60%, #2B60CF 65%, #2358CA 70%, #1B51C5 75%, #134AC0 80%, #0B43BB 85%, #023BB6 90%, #0036B3 95%, #0033B3 100%);

    &::before {
        content: "";
        width: 10px;
        height: 8px;
        border: 1px solid white;
        border-top-width: 2px;
        box-shadow: 0 1px 0 rgba(0,0,0,0.3);
    }
`;

const RestoreBtn = styled(BaseButton)`
    background: linear-gradient(180deg, #78ACF3 0%, #76ABF3 5%, #72A7F2 10%, #6EA3F1 15%, #6A9EEF 20%, #659AED 25%, #6195EB 30%, #5C90E9 35%, #578BE7 40%, #5286E5 45%, #4C81E3 50%, #3F75DD 50%, #396ED9 55%, #3267D4 60%, #2B60CF 65%, #2358CA 70%, #1B51C5 75%, #134AC0 80%, #0B43BB 85%, #023BB6 90%, #0036B3 95%, #0033B3 100%);

    position: relative;

    &::before {
        content: "";
        position: absolute;
        width: 8px;
        height: 6px;
        border: 1px solid white;
        border-top-width: 2px;
        box-shadow: 0 1px 0 rgba(0,0,0,0.3);
        bottom: 4px;
        left: 4px;
        background-color: inherit; /* mask the behind square */
        z-index: 1;
    }

    &::after {
        content: "";
        position: absolute;
        width: 8px;
        height: 6px;
        border: 1px solid white;
        border-top-width: 2px;
        box-shadow: 0 1px 0 rgba(0,0,0,0.3);
        top: 4px;
        right: 4px;
        z-index: 0;
    }
`;

const CloseBtn = styled(BaseButton)`
    background: linear-gradient(180deg, #E89178 0%, #E68E76 5%, #E58B74 10%, #E38872 15%, #E18570 20%, #E0826E 25%, #DE7F6C 30%, #DC7C6A 35%, #DA7967 40%, #D97565 45%, #D77263 50%, #CB5F4F 50%, #C85B4C 55%, #C55748 60%, #C25345 65%, #BF5041 70%, #BC4C3E 75%, #B9483B 80%, #B64437 85%, #B34134 90%, #B03D31 95%, #AD392E 100%);

    &::before {
        content: "✕";
        color: white;
        font-weight: bold;
        font-size: 11px;
        text-shadow: 0 1px 0 rgba(0,0,0,0.3);
        font-family: sans-serif;
    }
`;

const WindowBody = styled.div`
    flex: 1;
    background: white;
    border: 1px solid #999;
    margin-top: 2px;
    overflow: auto;
    position: relative;
`;

const Window = ({ windowState }) => {
    const { closeWindow, minimizeWindow, maximizeWindow, resizeWindow, focusWindow } = useWindowManager();
    const { id, title, component, icon, zIndex, isMinimized, isMaximized, width, height, left, top, props: windowProps } = windowState;

    if (isMinimized) return null;

    const isResizable = windowProps?.resizable !== false;

    // Default dimensions if not set
    const currentWidth = width || 600;
    const currentHeight = height || 400;

    const style = {
        zIndex,
        display: isMinimized ? 'none' : 'flex',
        // If maximized, we rely on styled-components logic below for width/height (100%)
        // If not maximized, ResizableBox handles width/height, but Draggable handles position
        top: isMaximized ? 0 : (top ? `${top}px` : '100px'),
        left: isMaximized ? 0 : (left ? `${left}px` : '100px'),
        width: isMaximized ? '100%' : 'auto',
        height: isMaximized ? 'calc(100% - 30px)' : 'auto',
    };

    const nodeRef = React.useRef(null);

    const content = (
        <WindowContainer ref={nodeRef} style={isMaximized ? style : { ...style, width: '100%', height: '100%' }} onClick={() => focusWindow(id)}>
            <TitleBar className="title-bar">
                <TitleText>
                    <XPIcon name={icon} size={16} className="title-icon" color="white" />
                    {title}
                </TitleText>
                <TitleControls>
                    <MinimizeBtn onClick={(e) => { e.stopPropagation(); minimizeWindow(id); }} aria-label="Minimize" />
                    {isResizable && (isMaximized ? (
                        <RestoreBtn onClick={(e) => { e.stopPropagation(); maximizeWindow(id); }} aria-label="Restore" />
                    ) : (
                        <MaximizeBtn onClick={(e) => { e.stopPropagation(); maximizeWindow(id); }} aria-label="Maximize" />
                    ))}
                    <CloseBtn onClick={(e) => { e.stopPropagation(); closeWindow(id); }} aria-label="Close" />
                </TitleControls>
            </TitleBar>
            <WindowBody>
                {component}
            </WindowBody>
        </WindowContainer>
    );

    if (isMaximized) {
        return (
             <div style={style}>
                 {content}
             </div>
        );
    }

    return (
        <Draggable 
            handle=".title-bar" 
            nodeRef={nodeRef} 
            disabled={isMaximized}
            onMouseDown={() => focusWindow(id)}
            // Since we are using ResizableBox inside Draggable, we need to ensure Draggable doesn't interfere
            // with resizing handles. But Draggable is applied to the wrapper.
            // ResizableBox should be the child of Draggable? No, ResizableBox wraps the content.
        >
            <div ref={nodeRef} style={{ position: 'absolute', left: style.left, top: style.top, zIndex: style.zIndex, width: currentWidth, height: currentHeight }}>
                <ResizableBox
                    width={currentWidth}
                    height={currentHeight}
                    minConstraints={[300, 200]}
                    maxConstraints={[2000, 2000]}
                    onResizeStop={(e, { size }) => {
                        resizeWindow(id, size.width, size.height);
                    }}
                    handleSize={[20, 20]} // Larger handle area
                    axis={isResizable ? 'both' : 'none'}
                    resizeHandles={isResizable ? ['se'] : []}
                >
                   {/* Remove left/top/zIndex from WindowContainer style since the wrapper div handles it */}
                   <WindowContainer style={{ width: '100%', height: '100%' }} onClick={() => focusWindow(id)}>
                        <TitleBar className="title-bar">
                            <TitleText>
                                <XPIcon name={icon} size={16} className="title-icon" color="white" />
                                {title}
                            </TitleText>
                            <TitleControls>
                                <MinimizeBtn onClick={(e) => { e.stopPropagation(); minimizeWindow(id); }} aria-label="Minimize" />
                                {isResizable && (
                                    <MaximizeBtn onClick={(e) => { e.stopPropagation(); maximizeWindow(id); }} aria-label="Maximize" />
                                )}
                                <CloseBtn onClick={(e) => { e.stopPropagation(); closeWindow(id); }} aria-label="Close" />
                            </TitleControls>
                        </TitleBar>
                        <WindowBody>
                            {component}
                        </WindowBody>
                    </WindowContainer>
                </ResizableBox>
            </div>
        </Draggable>
    );
};

export default Window;
