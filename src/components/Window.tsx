import React, { useState } from 'react';
import styled from 'styled-components';
import Draggable from 'react-draggable';
import { ResizableBox } from 'react-resizable';
import { useWindowManager } from '../context/WindowManagerContext';
import XPIcon from './XPIcon';
import ContextMenu from './ContextMenu';
import 'react-resizable/css/styles.css';
import { useTranslation } from 'react-i18next';
import { WindowState } from '../types';

const WindowContainer = styled.div<{ isFocus?: boolean }>`
    box-sizing: border-box;
    position: absolute;
    display: flex;
    flex-direction: column;
    min-height: 200px;
    min-width: 300px;
    background-color: ${({ isFocus }) => (isFocus ? '#0831d9' : '#6582f5')};
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
    box-shadow: 2px 2px 10px rgba(0,0,0,0.5);
    padding: 3px;

    .react-resizable-handle {
        z-index: 1000;
        cursor: se-resize;
    }
`;

const TitleBar = styled.div<{ isFocus?: boolean }>`
    height: 25px;
    min-height: 25px;
    max-height: 25px;
    background: ${({ isFocus }) =>
        isFocus
            ? 'linear-gradient(to bottom,#0058ee 0%,#3593ff 4%,#288eff 6%,#127dff 8%,#036ffc 10%,#0262ee 14%,#0057e5 20%,#0054e3 24%,#0055eb 56%,#005bf5 66%,#026afe 76%,#0062ef 86%,#0052d6 92%,#0040ab 94%,#003092 100%)'
            : 'linear-gradient(to bottom, #7697e7 0%,#7e9ee3 3%,#94afe8 6%,#97b4e9 8%,#82a5e4 14%,#7c9fe2 17%,#7996de 25%,#7b99e1 56%,#82a9e9 81%,#80a5e7 89%,#7b96e1 94%,#7a93df 97%,#abbae3 100%)'};
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 3px 0 5px;
    cursor: default;
    user-select: none;
    position: relative;
    font-weight: 700;
    font-size: 12px;
    font-family: 'Tahoma', 'Microsoft YaHei', sans-serif;
    text-shadow: 1px 1px #000;
    color: white;
    flex-shrink: 0;

    &:before {
        content: '';
        display: block;
        position: absolute;
        left: 0;
        opacity: ${({ isFocus }) => (isFocus ? 1 : 0.3)};
        background: linear-gradient(to right, #1638e6 0%, transparent 100%);
        top: 0;
        bottom: 0;
        width: 15px;
        pointer-events: none;
        border-top-left-radius: 8px;
    }

    &:after {
        content: '';
        opacity: ${({ isFocus }) => (isFocus ? 1 : 0.4)};
        display: block;
        position: absolute;
        right: 0;
        background: linear-gradient(to left, #1638e6 0%, transparent 100%);
        top: 0;
        bottom: 0;
        width: 15px;
        pointer-events: none;
        border-top-right-radius: 8px;
    }
`;

const TitleText = styled.div`
    color: white;
    font-weight: bold;
    font-size: 12px;
    text-shadow: 1px 1px 1px black;
    display: flex;
    align-items: center;
    pointer-events: none;
    padding-right: 5px;
    letter-spacing: 0.5px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    z-index: 1;

    .title-icon {
        width: 15px;
        height: 15px;
        margin-left: 1px;
        margin-right: 3px;
        filter: drop-shadow(1px 1px 1px rgba(0,0,0,0.3));
    }
`;

const TitleControls = styled.div<{ isFocus?: boolean }>`
    opacity: ${({ isFocus }) => (isFocus ? 1 : 0.6)};
    height: 22px;
    min-height: 22px;
    max-height: 22px;
    display: flex;
    align-items: center;
    margin-top: -1px;
    margin-right: 0;
    z-index: 1;
    flex-shrink: 0;
    gap: 0;
`;

const BaseButton = styled.button`
    width: 22px;
    height: 22px;
    min-width: 22px;
    min-height: 22px;
    max-width: 22px;
    max-height: 22px;
    box-sizing: border-box;
    border: 1px solid #fff;
    border-radius: 3px;
    margin-right: 1px;
    padding: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    outline: none;
    cursor: default;
    position: relative;
    flex-shrink: 0;

    &:hover {
        filter: brightness(120%);
    }

    &:active {
        filter: brightness(90%);
    }
`;

const MinimizeBtn = styled(BaseButton)`
    box-shadow: inset 0 -1px 2px 1px #4646ff;
    background-image: radial-gradient(
        circle at 90% 90%,
        #0054e9 0%,
        #2263d5 55%,
        #4479e4 70%,
        #a3bbec 90%,
        white 100%
    );
    overflow: hidden;

    &::before {
        content: "";
        position: absolute;
        left: 4px;
        top: 13px;
        height: 3px;
        width: 8px;
        background-color: white;
        pointer-events: none;
    }
`;

const MaximizeBtn = styled(BaseButton)`
    box-shadow: inset 0 -1px 2px 1px #4646ff;
    background-image: radial-gradient(
        circle at 90% 90%,
        #0054e9 0%,
        #2263d5 55%,
        #4479e4 70%,
        #a3bbec 90%,
        white 100%
    );
    overflow: hidden;

    &::before {
        content: "";
        position: absolute;
        display: block;
        left: 4px;
        top: 4px;
        box-shadow: inset 0 3px white, inset 0 0 0 1px white;
        height: 12px;
        width: 12px;
        pointer-events: none;
    }
`;

const RestoreBtn = styled(BaseButton)`
    box-shadow: inset 0 -1px 2px 1px #4646ff;
    background-image: radial-gradient(
        circle at 90% 90%,
        #0054e9 0%,
        #2263d5 55%,
        #4479e4 70%,
        #a3bbec 90%,
        white 100%
    );
    position: relative;
    overflow: hidden;

    &::before {
        content: "";
        position: absolute;
        display: block;
        left: 7px;
        top: 4px;
        box-shadow: inset 0 2px white, inset 0 0 0 1px white;
        height: 8px;
        width: 8px;
        pointer-events: none;
    }

    &::after {
        content: "";
        position: absolute;
        display: block;
        left: 4px;
        top: 7px;
        box-shadow: inset 0 2px white, inset 0 0 0 1px white, 1px -1px #136dff;
        height: 8px;
        width: 8px;
        background-color: #136dff;
        pointer-events: none;
    }
`;

const CloseBtn = styled(BaseButton)`
    box-shadow: inset 0 -1px 2px 1px #da4600;
    background-image: radial-gradient(
        circle at 90% 90%,
        #cc4600 0%,
        #dc6527 55%,
        #cd7546 70%,
        #ffccb2 90%,
        white 100%
    );
    overflow: hidden;
    margin-right: 0;

    &::before {
        content: "";
        position: absolute;
        left: 9px;
        top: 2px;
        transform: rotate(45deg);
        height: 16px;
        width: 2px;
        background-color: white;
        pointer-events: none;
    }

    &::after {
        content: "";
        position: absolute;
        left: 9px;
        top: 2px;
        transform: rotate(-45deg);
        height: 16px;
        width: 2px;
        background-color: white;
        pointer-events: none;
    }
`;

const WindowBody = styled.div`
    flex: 1;
    background: #ECE9D8;
    overflow: hidden;
    position: relative;
    display: flex;
    flex-direction: column;
`;

interface WindowProps {
    windowState: WindowState;
}

const Window: React.FC<WindowProps> = ({ windowState }) => {
    const { closeWindow, minimizeWindow, maximizeWindow, resizeWindow, focusWindow, moveWindow } = useWindowManager();
    const { t } = useTranslation();
    const { id, title, component, icon, zIndex, isMinimized, isMaximized, width, height, left, top, props: windowProps } = windowState;
    const [sysMenu, setSysMenu] = useState<{ visible: boolean; x: number; y: number }>({ visible: false, x: 0, y: 0 });

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

    const nodeRef = React.useRef<HTMLDivElement>(null);

    // 将 windowId 注入到 App 组件，使其可通过 useApp(windowId) 访问系统 API
    const injectedComponent = React.cloneElement(component as React.ReactElement, { windowId: id });

    const content = (
        <WindowContainer isFocus={true} ref={nodeRef} style={isMaximized ? style : { ...style, width: '100%', height: '100%' }} onClick={() => focusWindow(id)}>
            <TitleBar isFocus={true} className="title-bar" onDoubleClick={() => isResizable && maximizeWindow(id)}>
                <TitleText>
                    <XPIcon name={icon} size={16} className="title-icon" color="white" />
                    {title}
                </TitleText>
                <TitleControls isFocus={true}>
                    <MinimizeBtn onClick={(e) => { e.stopPropagation(); minimizeWindow(id); }} aria-label={t('window.minimize')} />
                    {isResizable && (
                        isMaximized ? (
                            <RestoreBtn onClick={(e) => { e.stopPropagation(); maximizeWindow(id); }} aria-label={t('window.restore')} />
                        ) : (
                            <MaximizeBtn onClick={(e) => { e.stopPropagation(); maximizeWindow(id); }} aria-label={t('window.maximize')} />
                        )
                    )}
                    <CloseBtn onClick={(e) => { e.stopPropagation(); closeWindow(id); }} aria-label={t('window.close')} />
                </TitleControls>
            </TitleBar>
            <WindowBody>
                {injectedComponent}
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
            defaultPosition={{ x: left ?? 100, y: top ?? 100 }}
            onMouseDown={() => focusWindow(id)}
            onStop={(e, data) => {
                moveWindow(id, data.x, data.y);
            }}
        >
            <div ref={nodeRef} style={{ position: 'absolute', top: 0, left: 0, zIndex: style.zIndex, width: currentWidth, height: currentHeight }}>
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
                   <WindowContainer isFocus={true} style={{ width: '100%', height: '100%' }} onClick={() => focusWindow(id)}>
                        <TitleBar isFocus={true} className="title-bar" onDoubleClick={() => isResizable && maximizeWindow(id)}>
                            <TitleText>
                                <XPIcon name={icon} size={16} className="title-icon" color="white" />
                                {title}
                            </TitleText>
                            <TitleControls>
                                <MinimizeBtn onClick={(e) => { e.stopPropagation(); minimizeWindow(id); }} aria-label={t('window.minimize')} />
                                {isResizable && (
                                    isMaximized ? (
                                        <RestoreBtn onClick={(e) => { e.stopPropagation(); maximizeWindow(id); }} aria-label={t('window.restore')} />
                                    ) : (
                                        <MaximizeBtn onClick={(e) => { e.stopPropagation(); maximizeWindow(id); }} aria-label={t('window.maximize')} />
                                    )
                                )}
                                <CloseBtn onClick={(e) => { e.stopPropagation(); closeWindow(id); }} aria-label={t('window.close')} />
                            </TitleControls>
                        </TitleBar>
                        <WindowBody>
                            {injectedComponent}
                        </WindowBody>
                    </WindowContainer>
                </ResizableBox>
            </div>
        </Draggable>
    );
};

export default Window;
