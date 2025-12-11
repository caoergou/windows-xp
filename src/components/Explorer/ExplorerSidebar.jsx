import React, { useState } from 'react';
import styled from 'styled-components';
import XPIcon from '../XPIcon';

const SidebarContainer = styled.div`
    width: 200px;
    background: linear-gradient(to bottom, #7ba2e7 0%, #6375d6 100%);
    padding: 10px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    overflow-y: auto;
    flex-shrink: 0;
`;

const Section = styled.div`
    background: white;
    border-radius: 3px;
    overflow: hidden;
`;

const Header = styled.div`
    background: linear-gradient(to right, #fff 0%, #c6d3f7 100%);
    padding: 5px 10px;
    font-weight: bold;
    font-size: 11px;
    color: #215dc6;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top-left-radius: 3px;
    border-top-right-radius: 3px;

    &:hover {
        background: linear-gradient(to right, #fff 0%, #dce4fc 100%);
    }
`;

const Content = styled.div`
    padding: 5px 10px;
    background: #d6dff7;
    display: ${props => props.collapsed ? 'none' : 'flex'};
    flex-direction: column;
    gap: 5px;
`;

const SidebarLink = styled.div`
    display: flex;
    align-items: center;
    gap: 5px;
    cursor: pointer;
    color: #003399;
    font-size: 11px;

    &:hover {
        text-decoration: underline;
        color: #0000FF;
    }
`;

const DetailsBox = styled.div`
    font-size: 10px;
    color: #000;
`;

const ExplorerSidebar = ({ currentPath, currentItem, onNavigate }) => {
    const [sections, setSections] = useState({
        systemTasks: false,
        otherPlaces: false,
        details: false
    });

    const toggleSection = (section) => {
        setSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    return (
        <SidebarContainer>
            <Section>
                <Header onClick={() => toggleSection('systemTasks')}>
                    系统任务
                    <XPIcon name={sections.systemTasks ? "chevron_down" : "up"} size={12} color="#215dc6" />
                </Header>
                <Content collapsed={sections.systemTasks}>
                    <SidebarLink>
                        <XPIcon name="windows" size={16} />
                        查看系统信息
                    </SidebarLink>
                    <SidebarLink>
                        <XPIcon name="properties" size={16} />
                        添加/删除程序
                    </SidebarLink>
                    <SidebarLink>
                        <XPIcon name="settings" size={16} />
                        更改设置
                    </SidebarLink>
                </Content>
            </Section>

            <Section>
                <Header onClick={() => toggleSection('otherPlaces')}>
                    其他位置
                    <XPIcon name={sections.otherPlaces ? "chevron_down" : "up"} size={12} color="#215dc6" />
                </Header>
                <Content collapsed={sections.otherPlaces}>
                    <SidebarLink onClick={() => onNavigate && onNavigate([])}>
                        <XPIcon name="computer" size={16} />
                        我的电脑
                    </SidebarLink>
                    <SidebarLink onClick={() => onNavigate && onNavigate(['My Documents'])}>
                        <XPIcon name="documents" size={16} />
                        我的文档
                    </SidebarLink>
                    <SidebarLink>
                        <XPIcon name="network" size={16} />
                        网上邻居
                    </SidebarLink>
                    <SidebarLink onClick={() => onNavigate && onNavigate(['Recycle Bin'])}>
                        <XPIcon name="recycle_bin" size={16} />
                        回收站
                    </SidebarLink>
                </Content>
            </Section>

            <Section>
                <Header onClick={() => toggleSection('details')}>
                    详细信息
                    <XPIcon name={sections.details ? "chevron_down" : "up"} size={12} color="#215dc6" />
                </Header>
                <Content collapsed={sections.details}>
                    {currentItem ? (
                         <DetailsBox>
                             <b>{currentItem.name}</b><br/>
                             {currentItem.type === 'folder' ? '文件夹' : '文件'}<br/>
                             修改日期: {new Date().toLocaleDateString()}
                         </DetailsBox>
                    ) : (
                         <DetailsBox>
                             <b>{currentPath.length === 0 ? '我的电脑' : currentPath[currentPath.length - 1]}</b><br/>
                             系统文件夹
                         </DetailsBox>
                    )}
                </Content>
            </Section>
        </SidebarContainer>
    );
};

export default ExplorerSidebar;
