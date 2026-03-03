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
    height: 36px;
    background: linear-gradient(to right, #edede5 0%, #ede8cd 100%);
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    padding: 1px 3px 0;
    gap: 0;
`;

/* 后退/前进按钮（直接显示绿色图标） */
const NavBtn = styled.button<{ $disabled?: boolean }>`
    display: flex;
    align-items: center;
    gap: 2px;
    height: 100%;
    padding: 0 4px 0 2px;
    font-size: 11px;
    font-family: Tahoma, sans-serif;
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
    height: 100%;
    padding: 0 6px;
    font-size: 11px;
    font-family: Tahoma, sans-serif;
    background: transparent;
    border: 1px solid rgba(0, 0, 0, 0);
    border-radius: 3px;
    cursor: ${p => p.$disabled ? 'default' : 'pointer'};
    opacity: ${p => p.$disabled ? 0.7 : 1};
    filter: ${p => p.$disabled ? 'grayscale(1)' : 'none'};
    color: #000;
    white-space: nowrap;

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

const Separator = styled.div`
    width: 1px;
    height: 90%;
    background-color: rgba(0, 0, 0, 0.2);
    margin: 0 2px;
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
                    <XPIcon name="folder_open_toolbar" size={22} />
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
