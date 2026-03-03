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
    padding: 0 8px;
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

interface ExplorerToolbarProps {
    onBack?: () => void;
    onForward?: () => void;
    onUp?: () => void;
    onRefresh?: () => void;
    canGoBack?: boolean;
    canGoForward?: boolean;
    canGoUp?: boolean;
}

const ExplorerToolbar: React.FC<ExplorerToolbarProps> = ({
    onBack,
    onForward,
    onUp,
    onRefresh,
    canGoBack = false,
    canGoForward = false,
    canGoUp = false
}) => {
    return (
        <ToolbarContainer>
            <ToolbarButton onClick={onBack} disabled={!canGoBack} title="后退">
                ←
            </ToolbarButton>
            <ToolbarButton onClick={onForward} disabled={!canGoForward} title="前进">
                →
            </ToolbarButton>
            <ToolbarButton onClick={onUp} disabled={!canGoUp} title="向上">
                ↑
            </ToolbarButton>
            <ToolbarButton onClick={onRefresh} title="刷新">
                刷新
            </ToolbarButton>
        </ToolbarContainer>
    );
};

export default ExplorerToolbar;
