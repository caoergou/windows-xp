import React, { useState } from 'react';
import styled from 'styled-components';
import XPIcon from '../XPIcon';

/* ── 侧边栏容器 ── */
const SidebarContainer = styled.div`
    width: 190px;
    min-width: 190px;
    background: linear-gradient(180deg, #98C0E8 0%, #5E99D4 30%, #3978C0 100%);
    border-right: 1px solid #6A9FD4;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 6px 5px;
    gap: 5px;
`;

/* ── 折叠面板 ── */
const Panel = styled.div``;

/* 面板标题（深蓝圆角渐变） */
const PanelHeader = styled.div`
    background: linear-gradient(180deg, #2462B8 0%, #1A4FA0 60%, #1440A0 100%);
    color: white;
    font-size: 11px;
    font-weight: bold;
    font-family: Tahoma, sans-serif;
    padding: 0 6px 0 4px;
    border-radius: 4px 4px 0 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 23px;
    cursor: default;
    user-select: none;
    text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
`;

const PanelTitle = styled.div`
    display: flex;
    align-items: center;
    gap: 5px;
`;

/* 绿色折叠按钮 */
const CollapseBtn = styled.div<{ $collapsed: boolean }>`
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: radial-gradient(circle at 40% 35%, #8CE87A, #3AAA28 60%, #1E7A10);
    border: 1px solid #1A6010;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 9px;
    font-weight: bold;
    color: white;
    text-shadow: 0 1px 0 rgba(0,0,0,0.4);
    cursor: pointer;
    flex-shrink: 0;
    transform: ${p => p.$collapsed ? 'none' : 'none'};
`;

/* 面板内容 */
const PanelBody = styled.div<{ $collapsed: boolean }>`
    background: linear-gradient(180deg, #FFFFFF 0%, #EEF5FD 100%);
    border: 1px solid #5A8BBB;
    border-top: none;
    border-radius: 0 0 4px 4px;
    padding: ${p => p.$collapsed ? '0' : '5px 0 6px 0'};
    max-height: ${p => p.$collapsed ? '0' : '500px'};
    overflow: hidden;
    transition: max-height 0.15s ease, padding 0.15s ease;
`;

/* 链接项 */
const LinkItem = styled.div<{ $active?: boolean }>`
    display: flex;
    align-items: flex-start;
    gap: 7px;
    padding: 3px 8px 3px 12px;
    cursor: pointer;
    font-size: 11px;
    font-family: Tahoma, sans-serif;
    color: ${p => p.$active ? '#000066' : '#003EAF'};
    font-weight: ${p => p.$active ? 'bold' : 'normal'};
    text-decoration: underline;
    line-height: 1.45;

    &:hover {
        color: #CC4400;
    }

    .link-icon {
        flex-shrink: 0;
        margin-top: 1px;
    }
`;

/* 详细信息文本 */
const DetailText = styled.div`
    padding: 3px 10px 2px 12px;
    font-size: 11px;
    font-family: Tahoma, sans-serif;
    color: #333;
    line-height: 1.5;
`;

const DetailName = styled.div`
    font-weight: bold;
    font-size: 11px;
    color: #000;
    margin-bottom: 1px;
`;

const DetailType = styled.div`
    font-size: 10px;
    color: #666;
`;

interface ExplorerSidebarProps {
    currentPath: string[];
    currentItem: { name: string; type: string } | null;
    onNavigate: (path: string[]) => void;
}

const ExplorerSidebar: React.FC<ExplorerSidebarProps> = ({ currentPath, currentItem, onNavigate }) => {
    const [collapsed, setCollapsed] = useState({ task: false, places: false, detail: false });

    const isActive = (path: string[]) => {
        if (path.length === 0) return currentPath.length === 0;
        return currentPath.length === path.length && path.every((p, i) => currentPath[i] === p);
    };

    const toggle = (key: 'task' | 'places' | 'detail') =>
        setCollapsed(prev => ({ ...prev, [key]: !prev[key] }));

    const currentName = currentPath.length === 0
        ? '我的电脑'
        : currentPath[currentPath.length - 1];

    return (
        <SidebarContainer>
            {/* 系统任务 */}
            <Panel>
                <PanelHeader>
                    <PanelTitle>
                        <XPIcon name="computer" size={14} color="white" />
                        系统任务
                    </PanelTitle>
                    <CollapseBtn $collapsed={collapsed.task} onClick={() => toggle('task')}>
                        {collapsed.task ? '▸' : '▾'}
                    </CollapseBtn>
                </PanelHeader>
                <PanelBody $collapsed={collapsed.task}>
                    <LinkItem>
                        <XPIcon name="computer" size={16} className="link-icon" />
                        <span>查看系统信息</span>
                    </LinkItem>
                    <LinkItem>
                        <XPIcon name="control_panel" size={16} className="link-icon" />
                        <span>添加/删除程序</span>
                    </LinkItem>
                    <LinkItem>
                        <XPIcon name="control_panel" size={16} className="link-icon" />
                        <span>更改设置</span>
                    </LinkItem>
                </PanelBody>
            </Panel>

            {/* 其他位置 */}
            <Panel>
                <PanelHeader>
                    <PanelTitle>
                        <XPIcon name="folder" size={14} color="white" />
                        其他位置
                    </PanelTitle>
                    <CollapseBtn $collapsed={collapsed.places} onClick={() => toggle('places')}>
                        {collapsed.places ? '▸' : '▾'}
                    </CollapseBtn>
                </PanelHeader>
                <PanelBody $collapsed={collapsed.places}>
                    <LinkItem $active={isActive([])} onClick={() => onNavigate([])}>
                        <XPIcon name="computer" size={16} className="link-icon" />
                        <span>我的电脑</span>
                    </LinkItem>
                    <LinkItem $active={isActive(['我的文档'])} onClick={() => onNavigate(['我的文档'])}>
                        <XPIcon name="documents" size={16} className="link-icon" />
                        <span>我的文档</span>
                    </LinkItem>
                    <LinkItem $active={isActive(['网上邻居'])} onClick={() => onNavigate(['网上邻居'])}>
                        <XPIcon name="network" size={16} className="link-icon" />
                        <span>网上邻居</span>
                    </LinkItem>
                    <LinkItem $active={isActive(['回收站'])} onClick={() => onNavigate(['回收站'])}>
                        <XPIcon name="recycle_bin" size={16} className="link-icon" />
                        <span>回收站</span>
                    </LinkItem>
                </PanelBody>
            </Panel>

            {/* 详细信息 */}
            <Panel>
                <PanelHeader>
                    <PanelTitle>
                        <XPIcon name="properties" size={14} color="white" />
                        详细信息
                    </PanelTitle>
                    <CollapseBtn $collapsed={collapsed.detail} onClick={() => toggle('detail')}>
                        {collapsed.detail ? '▸' : '▾'}
                    </CollapseBtn>
                </PanelHeader>
                <PanelBody $collapsed={collapsed.detail}>
                    <DetailText>
                        <DetailName>{currentItem ? currentItem.name : currentName}</DetailName>
                        <DetailType>
                            {currentItem
                                ? (currentItem.type === 'folder' ? '文件夹' : currentItem.type === 'drive' ? '本地磁盘' : '文件')
                                : '系统文件夹'}
                        </DetailType>
                    </DetailText>
                </PanelBody>
            </Panel>
        </SidebarContainer>
    );
};

export default ExplorerSidebar;
