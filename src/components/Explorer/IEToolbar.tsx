import React from 'react';
import styled from 'styled-components';

const ToolbarContainer = styled.div`
    height: 30px;
    background: linear-gradient(to bottom, #f0f0f0 0%, #e0e0e0 100%);
    border-bottom: 1px solid #d0d0d0;
    display: flex;
    align-items: center;
    padding: 0 8px;
    gap: 4px;
`;

const ToolbarButton = styled.button`
    height: 24px;
    padding: 0 12px;
    font-size: 12px;
    font-family: inherit;
    background: linear-gradient(to bottom, #ffffff 0%, #f0f0f0 100%);
    border: 1px solid #d0d0d0;
    border-radius: 3px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 4px;

    &:hover {
        background: linear-gradient(to bottom, #f0f0f0 0%, #e0e0e0 100%);
    }

    &:active {
        background: linear-gradient(to bottom, #e0e0e0 0%, #d0d0d0 100%);
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
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
        <ToolbarContainer>
            <ToolbarButton onClick={onBack} disabled={!canGoBack} title="后退">
                ←
            </ToolbarButton>
            <ToolbarButton onClick={onForward} disabled={!canGoForward} title="前进">
                →
            </ToolbarButton>
            <ToolbarButton onClick={isLoading ? onStop : onRefresh} title={isLoading ? "停止" : "刷新"}>
                {isLoading ? "停止" : "刷新"}
            </ToolbarButton>
            <ToolbarButton onClick={onHome} title="主页">
                主页
            </ToolbarButton>
            <ToolbarButton onClick={onSearch} title="搜索">
                搜索
            </ToolbarButton>
        </ToolbarContainer>
    );
};

export default IEToolbar;
