import React from 'react';
import styled from 'styled-components';
import XPIcon from '../XPIcon';

const Container = styled.div`
    display: flex;
    flex-direction: column;
    background: #ECE9D8;
`;

const MenuBar = styled.div`
    height: 20px;
    background: #ECE9D8;
    display: flex;
    align-items: center;
    padding: 0 2px;
    font-size: 11px;
    border-bottom: 1px solid #d4d0c8;
`;

const MenuItem = styled.div`
    padding: 2px 8px;
    cursor: pointer;

    &:hover {
        background: #316AC5;
        color: white;
    }
`;

const ToolbarContainer = styled.div`
    height: 32px;
    background: #ECE9D8;
    border-bottom: 1px solid #d4d0c8;
    display: flex;
    align-items: center;
    padding: 0 8px;
    gap: 2px;
`;

const NavButton = styled.button<{ $disabled?: boolean }>`
    width: 32px;
    height: 32px;
    padding: 0;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 3px;
    cursor: ${p => p.$disabled ? 'not-allowed' : 'pointer'};
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: ${p => p.$disabled ? 0.5 : 1};

    &:hover:not(:disabled) {
        background: #C1D2EE;
        border-color: #7DA2CE;
    }

    &:active:not(:disabled) {
        background: #A8C0E8;
    }
`;

const ToolbarButton = styled.button`
    height: 24px;
    padding: 0 8px;
    font-size: 11px;
    font-family: inherit;
    background: transparent;
    border: 1px solid transparent;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 4px;

    &:hover {
        border: 1px solid #0a246a;
        background: linear-gradient(to bottom, #ffffff 0%, #d8e9f8 100%);
    }

    &:active {
        background: linear-gradient(to bottom, #c1d2ee 0%, #b0c4de 100%);
    }
`;

const Separator = styled.div`
    width: 1px;
    height: 20px;
    background: #d4d0c8;
    margin: 0 2px;
`;

interface IEToolbarProps {
    onBack?: () => void;
    onForward?: () => void;
    onStop?: () => void;
    onRefresh?: () => void;
    onHome?: () => void;
    onSearch?: () => void;
    canGoBack?: boolean;
    canGoForward?: boolean;
    isLoading?: boolean;
}

const IEToolbar: React.FC<IEToolbarProps> = ({
    onBack,
    onForward,
    onStop,
    onRefresh,
    onHome,
    onSearch,
    canGoBack = false,
    canGoForward = false,
    isLoading = false
}) => {
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
            <ToolbarContainer>
                <NavButton onClick={onBack} disabled={!canGoBack} $disabled={!canGoBack} title="后退">
                    <XPIcon name="back" size={24} />
                </NavButton>
                <NavButton onClick={onForward} disabled={!canGoForward} $disabled={!canGoForward} title="前进">
                    <XPIcon name="forward" size={24} />
                </NavButton>
                <Separator />
                <ToolbarButton onClick={isLoading ? onStop : onRefresh} title={isLoading ? "停止" : "刷新"}>
                    <XPIcon name={isLoading ? "stop" : "refresh"} size={16} />
                    {isLoading ? "停止" : "刷新"}
                </ToolbarButton>
                <ToolbarButton onClick={onHome} title="主页">
                    <XPIcon name="home" size={16} />
                    主页
                </ToolbarButton>
                <Separator />
                <ToolbarButton onClick={onSearch} title="搜索">
                    <XPIcon name="search" size={16} />
                    搜索
                </ToolbarButton>
            </ToolbarContainer>
        </Container>
    );
};

export default IEToolbar;
