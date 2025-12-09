import React from 'react';
import styled from 'styled-components';
import Draggable from 'react-draggable';
import { useWindowManager } from '../context/WindowManagerContext';
import XPIcon from './XPIcon';

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

const ControlBtn = styled.button`
    width: 21px;
    height: 21px;
    border: 1px solid white;
    background-color: #D6D6D6; /* Simplification */
    border-radius: 3px;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 10px;
    padding: 0;
    cursor: pointer;
    
    &:hover {
        filter: brightness(1.1);
    }
`;

const CloseBtn = styled(ControlBtn)`
    background-color: #E04D3C;
    color: white;
    font-weight: bold;
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
    const { closeWindow, minimizeWindow, maximizeWindow, focusWindow } = useWindowManager();
    const { id, title, component, icon, zIndex, isMinimized, isMaximized, width, height, left, top } = windowState;

    if (isMinimized) return null;

    const style = {
        zIndex,
        display: isMinimized ? 'none' : 'flex',
        width: isMaximized ? '100%' : (width ? `${width}px` : '600px'),
        height: isMaximized ? 'calc(100% - 30px)' : (height ? `${height}px` : '400px'),
        top: isMaximized ? 0 : (top ? `${top}px` : '100px'),
        left: isMaximized ? 0 : (left ? `${left}px` : '100px'),
    };

    const nodeRef = React.useRef(null);

    return (
        <Draggable 
            handle=".title-bar" 
            nodeRef={nodeRef} 
            disabled={isMaximized}
            onMouseDown={() => focusWindow(id)}
        >
            <WindowContainer ref={nodeRef} style={style} onClick={() => focusWindow(id)}>
                <TitleBar className="title-bar">
                    <TitleText>
                        <XPIcon name={icon} size={16} className="title-icon" color="white" />
                        {title}
                    </TitleText>
                    <TitleControls>
                        <ControlBtn onClick={(e) => { e.stopPropagation(); minimizeWindow(id); }}>_</ControlBtn>
                        <ControlBtn onClick={(e) => { e.stopPropagation(); maximizeWindow(id); }}>□</ControlBtn>
                        <CloseBtn onClick={(e) => { e.stopPropagation(); closeWindow(id); }}>X</CloseBtn>
                    </TitleControls>
                </TitleBar>
                <WindowBody>
                    {component}
                </WindowBody>
            </WindowContainer>
        </Draggable>
    );
};

export default Window;
