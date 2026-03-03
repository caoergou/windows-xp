import React from 'react';
import styled from 'styled-components';
import XPIcon from '../XPIcon';

const Container = styled.div`
    display: flex;
    flex-direction: column;
    background: linear-gradient(to right, #edede5 0%, #ede8cd 100%);
`;

const MenuBar = styled.div`
    height: 20px;
    background: transparent;
    display: flex;
    align-items: center;
    padding: 0 2px;
    font-size: 11px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
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
    height: 36px;
    background: transparent;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    padding: 1px 3px 0;
    gap: 0;
`;

const NavButton = styled.button<{ $disabled?: boolean }>`
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    width: auto;
    padding: 0 4px;
    background: transparent;
    border: 1px solid rgba(0, 0, 0, 0);
    border-radius: 3px;
    cursor: ${p => p.$disabled ? 'default' : 'pointer'};
    opacity: ${p => p.$disabled ? 0.7 : 1};
    filter: ${p => p.$disabled ? 'grayscale(1)' : 'none'};

    &:hover {
        border: ${p => p.$disabled ? '1px solid rgba(0, 0, 0, 0)' : '1px solid rgba(0, 0, 0, 0.1)'};
        box-shadow: ${p => p.$disabled ? 'none' : 'inset 0 -1px 1px rgba(0, 0, 0, 0.1)'};
    }

    &:active {
        border: ${p => p.$disabled ? '1px solid rgba(0, 0, 0, 0)' : '1px solid rgb(185, 185, 185)'};
        background-color: ${p => p.$disabled ? 'transparent' : '#dedede'};
        box-shadow: ${p => p.$disabled ? 'none' : 'inset 0 -1px 1px rgba(255, 255, 255, 0.7)'};

        & > * {
            transform: ${p => p.$disabled ? 'none' : 'translate(1px, 1px)'};
        }
    }
`;

const ToolbarButton = styled.button`
    display: flex;
    align-items: center;
    gap: 3px;
    height: 100%;
    padding: 0 6px;
    font-size: 11px;
    font-family: Tahoma, sans-serif;
    background: transparent;
    border: 1px solid rgba(0, 0, 0, 0);
    border-radius: 3px;
    cursor: pointer;

    &:hover {
        border: 1px solid rgba(0, 0, 0, 0.1);
        box-shadow: inset 0 -1px 1px rgba(0, 0, 0, 0.1);
    }

    &:active {
        border: 1px solid rgb(185, 185, 185);
        background-color: #dedede;
        box-shadow: inset 0 -1px 1px rgba(255, 255, 255, 0.7);

        & > * {
            transform: translate(1px, 1px);
        }
    }
`;

const Separator = styled.div`
    width: 1px;
    height: 90%;
    background-color: rgba(0, 0, 0, 0.2);
    margin: 0 2px;
`;

interface IEToolbarProps {
    onBack?: () => void;
    onForward?: () => void;
    onStop?: () => void;
    onRefresh?: () => void;
    onHome?: () => void;
    onSearch?: () => void;
    onFavorites?: () => void;
    onHistory?: () => void;
    onPrint?: () => void;
    onHelp?: () => void;
    canBack?: boolean;
    canForward?: boolean;
    showFavorites?: boolean;
    showHistory?: boolean;
    isLoading?: boolean;
}

const IEToolbar: React.FC<IEToolbarProps> = ({
    onBack,
    onForward,
    onStop,
    onRefresh,
    onHome,
    onSearch,
    onFavorites,
    onHistory,
    onPrint,
    onHelp,
    canBack = false,
    canForward = false,
    showFavorites = false,
    showHistory = false,
    isLoading = false
}) => {
    return (
        <Container>
            <MenuBar>
                <MenuItem>文件(F)</MenuItem>
                <MenuItem>编辑(E)</MenuItem>
                <MenuItem>查看(V)</MenuItem>
                <MenuItem onClick={onFavorites}>收藏(A)</MenuItem>
                <MenuItem>工具(T)</MenuItem>
                <MenuItem onClick={onHelp}>帮助(H)</MenuItem>
            </MenuBar>
            <ToolbarContainer>
                <NavButton onClick={onBack} disabled={!canBack} $disabled={!canBack} title="后退">
                    <XPIcon name="back" size={24} />
                </NavButton>
                <NavButton onClick={onForward} disabled={!canForward} $disabled={!canForward} title="前进">
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
                <ToolbarButton onClick={onFavorites} title="收藏夹">
                    <XPIcon name="favorites" size={16} />
                    收藏夹
                </ToolbarButton>
                <ToolbarButton onClick={onHistory} title="历史记录">
                    <XPIcon name="history" size={16} />
                    历史
                </ToolbarButton>
            </ToolbarContainer>
        </Container>
    );
};

export default IEToolbar;
