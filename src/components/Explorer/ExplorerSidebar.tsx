import React, { useState } from 'react';
import styled from 'styled-components';
import XPIcon from '../XPIcon';

const SidebarContainer = styled.div`
    width: 180px;
    min-width: 180px;
    background: linear-gradient(to bottom, #748aff 0%, #4057d3 100%);
    overflow: auto;
    padding: 10px;
`;

const Panel = styled.div`
    border-top-left-radius: 3px;
    border-top-right-radius: 3px;
    width: 100%;
    overflow: hidden;

    &:not(:last-child) {
        margin-bottom: 12px;
    }
`;

const PanelHeader = styled.div`
    display: flex;
    align-items: center;
    height: 23px;
    padding-left: 11px;
    padding-right: 2px;
    cursor: pointer;
    background: linear-gradient(
        to right,
        rgb(240, 240, 255) 0,
        rgb(240, 240, 255) 30%,
        rgb(168, 188, 255) 100%
    );

    &:hover .panel-title {
        color: #1c68ff;
    }
`;

const PanelTitle = styled.div`
    font-weight: 700;
    color: #0c327d;
    flex: 1;
    font-size: 11px;
    font-family: Tahoma, sans-serif;
`;

const CollapseBtn = styled.img`
    width: 18px;
    height: 18px;
    filter: drop-shadow(1px 1px 3px rgba(0, 0, 0, 0.3));
`;

const PanelBody = styled.div<{ $collapsed: boolean }>`
    padding: ${p => p.$collapsed ? '0' : '5px 10px'};
    max-height: ${p => p.$collapsed ? '0' : '500px'};
    overflow: hidden;
    background: linear-gradient(
        to right,
        rgb(180, 200, 251) 0%,
        rgb(164, 185, 251) 50%,
        rgb(180, 200, 251) 100%
    );
    background-color: rgba(198, 211, 255, 0.87);
`;

const LinkItem = styled.div<{ $active?: boolean }>`
    display: flex;
    margin-bottom: 2px;
    cursor: pointer;
    font-size: 10px;
    line-height: 14px;
    color: #0c327d;
    font-family: Tahoma, sans-serif;

    &:hover {
        cursor: pointer;
        color: #2b72ff;
        text-decoration: underline;
    }

    .link-icon {
        width: 14px;
        height: 14px;
        margin-right: 5px;
        flex-shrink: 0;
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
            <Panel>
                <PanelHeader onClick={() => toggle('task')}>
                    <PanelTitle className="panel-title">系统任务</PanelTitle>
                    <CollapseBtn
                        src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18'%3E%3Ccircle cx='9' cy='9' r='8' fill='%2370b0ff'/%3E%3Cpath d='M5 9h8M9 5v8' stroke='white' stroke-width='2'/%3E%3C/svg%3E"
                        alt={collapsed.task ? '展开' : '收起'}
                    />
                </PanelHeader>
                <PanelBody $collapsed={collapsed.task}>
                    <LinkItem>
                        <XPIcon name="view_info" size={14} className="link-icon" />
                        <span>查看系统信息</span>
                    </LinkItem>
                    <LinkItem>
                        <XPIcon name="remove" size={14} className="link-icon" />
                        <span>添加/删除程序</span>
                    </LinkItem>
                    <LinkItem>
                        <XPIcon name="control" size={14} className="link-icon" />
                        <span>更改设置</span>
                    </LinkItem>
                </PanelBody>
            </Panel>

            <Panel>
                <PanelHeader onClick={() => toggle('places')}>
                    <PanelTitle className="panel-title">其他位置</PanelTitle>
                    <CollapseBtn
                        src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18'%3E%3Ccircle cx='9' cy='9' r='8' fill='%2370b0ff'/%3E%3Cpath d='M5 9h8M9 5v8' stroke='white' stroke-width='2'/%3E%3C/svg%3E"
                        alt={collapsed.places ? '展开' : '收起'}
                    />
                </PanelHeader>
                <PanelBody $collapsed={collapsed.places}>
                    <LinkItem $active={isActive([])} onClick={() => onNavigate([])}>
                        <XPIcon name="computer" size={14} className="link-icon" />
                        <span>我的电脑</span>
                    </LinkItem>
                    <LinkItem $active={isActive(['我的文档'])} onClick={() => onNavigate(['我的文档'])}>
                        <XPIcon name="documents" size={14} className="link-icon" />
                        <span>我的文档</span>
                    </LinkItem>
                    <LinkItem $active={isActive(['网上邻居'])} onClick={() => onNavigate(['网上邻居'])}>
                        <XPIcon name="network" size={14} className="link-icon" />
                        <span>网上邻居</span>
                    </LinkItem>
                    <LinkItem $active={isActive(['回收站'])} onClick={() => onNavigate(['回收站'])}>
                        <XPIcon name="recycle_bin" size={14} className="link-icon" />
                        <span>回收站</span>
                    </LinkItem>
                </PanelBody>
            </Panel>

            <Panel>
                <PanelHeader onClick={() => toggle('detail')}>
                    <PanelTitle className="panel-title">详细信息</PanelTitle>
                    <CollapseBtn
                        src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18'%3E%3Ccircle cx='9' cy='9' r='8' fill='%2370b0ff'/%3E%3Cpath d='M5 9h8M9 5v8' stroke='white' stroke-width='2'/%3E%3C/svg%3E"
                        alt={collapsed.detail ? '展开' : '收起'}
                    />
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
