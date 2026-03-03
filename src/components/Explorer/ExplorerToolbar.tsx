import React from 'react';
import styled from 'styled-components';
import XPIcon from '../XPIcon';

/* ── 菜单栏 ── */
const MenuBar = styled.div`
    height: 20px;
    background: #ECE9D8;
    border-bottom: 1px solid #ACA899;
    display: flex;
    align-items: center;
    padding: 0 2px;
`;

const MenuBarItem = styled.div`
    padding: 1px 6px;
    font-size: 11px;
    font-family: Tahoma, sans-serif;
    cursor: default;
    border: 1px solid transparent;

    &:hover {
        background: #316AC5;
        color: white;
        border-color: #316AC5;
    }
`;

/* ── 工具栏 ── */
const ToolbarContainer = styled.div`
    height: 38px;
    background: #ECE9D8;
    border-bottom: 1px solid #ACA899;
    display: flex;
    align-items: center;
    padding: 0 4px;
    gap: 1px;
`;

/* 后退/前进按钮（直接显示绿色图标） */
const NavBtn = styled.button<{ $disabled?: boolean }>`
    display: flex;
    align-items: center;
    gap: 2px;
    height: 30px;
    padding: 0 4px 0 2px;
    font-size: 11px;
    font-family: Tahoma, sans-serif;
    background: transparent;
    border: 1px solid transparent;
    cursor: ${p => p.$disabled ? 'default' : 'pointer'};
    opacity: ${p => p.$disabled ? 0.5 : 1};
    border-radius: 3px;

    &:hover {
        background: ${p => p.$disabled ? 'transparent' : '#C1D2EE'};
        border-color: ${p => p.$disabled ? 'transparent' : '#7DA2CE'};
    }
    &:active {
        background: ${p => p.$disabled ? 'transparent' : '#A8C0E8'};
    }
`;

const NavLabel = styled.span`
    font-size: 11px;
    font-family: Tahoma, sans-serif;
    white-space: nowrap;
`;

const NavDropArrow = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 7px;
    color: #333;
    padding-left: 2px;
`;

/* 普通工具按钮（搜索/文件夹/上） */
const ToolBtn = styled.button<{ $disabled?: boolean }>`
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 3px;
    height: 28px;
    padding: 0 6px;
    font-size: 11px;
    font-family: Tahoma, sans-serif;
    background: transparent;
    border: 1px solid transparent;
    cursor: ${p => p.$disabled ? 'default' : 'pointer'};
    opacity: ${p => p.$disabled ? 0.4 : 1};
    color: #000;
    border-radius: 2px;
    white-space: nowrap;

    &:hover {
        background: ${p => p.$disabled ? 'transparent' : '#C1D2EE'};
        border-color: ${p => p.$disabled ? 'transparent' : '#7DA2CE'};
    }
    &:active {
        background: ${p => p.$disabled ? 'transparent' : '#A8C0E8'};
    }
`;

const Separator = styled.div`
    width: 1px;
    height: 22px;
    background: linear-gradient(to bottom, #ACA899 0%, #ECE9D8 100%);
    margin: 0 3px;
`;

const MENU_ITEMS = ['文件(F)', '编辑(E)', '查看(V)', '收藏(A)', '工具(T)', '帮助(H)'];

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
    onBack, onForward, onUp, onRefresh,
    canGoBack = false, canGoForward = false, canGoUp = false
}) => {
    return (
        <>
            <MenuBar>
                {MENU_ITEMS.map(item => (
                    <MenuBarItem key={item}>{item}</MenuBarItem>
                ))}
            </MenuBar>
            <ToolbarContainer>
                {/* 后退 */}
                <NavBtn $disabled={!canGoBack} onClick={canGoBack ? onBack : undefined} title="后退">
                    <XPIcon name="back" size={24} />
                    <NavLabel>后退</NavLabel>
                    <NavDropArrow>▾</NavDropArrow>
                </NavBtn>

                {/* 前进 */}
                <NavBtn $disabled={!canGoForward} onClick={canGoForward ? onForward : undefined} title="前进">
                    <XPIcon name="forward" size={24} />
                    <NavDropArrow>▾</NavDropArrow>
                </NavBtn>

                {/* 向上 */}
                <ToolBtn $disabled={!canGoUp} onClick={canGoUp ? onUp : undefined} title="向上">
                    <XPIcon name="up" size={24} />
                </ToolBtn>

                <Separator />

                {/* 搜索 */}
                <ToolBtn title="搜索">
                    <XPIcon name="search" size={16} />
                    搜索
                </ToolBtn>

                {/* 文件夹 */}
                <ToolBtn title="文件夹">
                    <XPIcon name="folder" size={16} />
                    文件夹
                </ToolBtn>

                <Separator />

                {/* 视图 */}
                <ToolBtn title="查看">
                    <XPIcon name="views" size={16} />
                    <span style={{ fontSize: 9, marginLeft: 1 }}>▾</span>
                </ToolBtn>
            </ToolbarContainer>
        </>
    );
};

export default ExplorerToolbar;
