import React from 'react';
import styled from 'styled-components';
import XPIcon from '../XPIcon';

const Container = styled.div`
    background: #ECE9D8;
    border-bottom: 1px solid #D0D0D0;
    display: flex;
    flex-direction: column;
`;

const MenuBar = styled.div`
    display: flex;
    padding: 2px 5px;
    background: #ECE9D8;
    border-bottom: 1px solid #D0D0D0;
`;

const MenuItem = styled.div`
    padding: 2px 8px;
    cursor: default;
    font-size: 11px;

    &:hover {
        background-color: #316AC5;
        color: white;
    }
`;

const Toolbar = styled.div`
    display: flex;
    align-items: center;
    padding: 5px;
    background: #ECE9D8;
    border-bottom: 1px solid #D0D0D0;
    gap: 5px;
`;

const ToolButton = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 3px;
    padding: 2px 5px;
    border: 1px solid transparent;
    border-radius: 3px;
    cursor: pointer;
    font-size: 11px;

    &:hover {
        border-color: #dadada;
        background: #f1f1f1;
        box-shadow: 0 1px 2px rgba(0,0,0,0.1);
    }

    &:active {
        background: #e0e0e0;
        box-shadow: inset 0 1px 2px rgba(0,0,0,0.1);
    }

    ${props => props.disabled && `
        opacity: 0.5;
        pointer-events: none;
    `}
`;

const Separator = styled.div`
    width: 1px;
    height: 24px;
    background: #aca899;
    margin: 0 2px;
`;

const IconLabel = styled.span`
    margin-left: 2px;
`;

const ExplorerToolbar = ({ onBack, onForward, onUp, canBack, canForward }) => {
    return (
        <Container>
            <MenuBar>
                <MenuItem>文件(F)</MenuItem>
                <MenuItem>编辑(E)</MenuItem>
                <MenuItem>查看(V)</MenuItem>
                <MenuItem>收藏(A)</MenuItem>
                <MenuItem>工具(T)</MenuItem>
                <MenuItem>帮助(H)</MenuItem>
            </MenuBar>
            <Toolbar>
                <ToolButton onClick={onBack} disabled={!canBack}>
                    <XPIcon name="back" size={20} color={canBack ? "#4CAF50" : "#999"} />
                    <IconLabel>后退</IconLabel>
                    <XPIcon name="chevron_down" size={10} color="#000" />
                </ToolButton>
                <ToolButton onClick={onForward} disabled={!canForward}>
                    <XPIcon name="forward" size={20} color={canForward ? "#4CAF50" : "#999"} />
                    <XPIcon name="chevron_down" size={10} color="#000" />
                </ToolButton>
                <ToolButton onClick={onUp}>
                    <XPIcon name="up" size={20} color="#DAA520" />
                </ToolButton>
                <Separator />
                <ToolButton>
                    <XPIcon name="search" size={20} color="#2c72c2" />
                    <IconLabel>搜索</IconLabel>
                </ToolButton>
                <ToolButton>
                    <XPIcon name="folder" size={20} color="#fbbd08" />
                    <IconLabel>文件夹</IconLabel>
                </ToolButton>
                <Separator />
                <ToolButton>
                    <XPIcon name="views" size={20} color="#000" />
                    <XPIcon name="chevron_down" size={10} color="#000" />
                </ToolButton>
            </Toolbar>
        </Container>
    );
};

export default ExplorerToolbar;
