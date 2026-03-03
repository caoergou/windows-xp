import React, { useState } from 'react';
import styled from 'styled-components';
import XPIcon from '../components/XPIcon';
import { useTranslation } from 'react-i18next';

const Container = styled.div`
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    background: #f0f0f0;
    font-family: Tahoma, "Microsoft YaHei", sans-serif;
`;

const Header = styled.div`
    background: linear-gradient(to right, #6ba3e5, #3f78bd);
    color: white;
    padding: 8px 12px;
    font-weight: bold;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 8px;
`;

const Content = styled.div`
    flex: 1;
    display: flex;
    overflow: hidden;
`;

const Sidebar = styled.div`
    width: 200px;
    background: #fff;
    border-right: 1px solid #999;
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
`;

const SidebarItem = styled.div`
    padding: 10px 15px;
    cursor: pointer;
    font-size: 12px;
    border-bottom: 1px solid #eee;
    display: flex;
    align-items: center;
    gap: 8px;

    &:hover {
        background: #f0f0f0;
    }

    &.active {
        background: #316ac5;
        color: white;
    }
`;

const MainContent = styled.div`
    flex: 1;
    background: white;
    padding: 20px;
    overflow-y: auto;
    font-size: 12px;
    line-height: 1.5;
`;

const TopicTitle = styled.h2`
    margin: 0 0 15px 0;
    font-size: 16px;
    color: #333;
`;

const TopicContent = styled.div`
    color: #666;
`;

interface Topic {
  id: string;
  name: string;
  icon: string;
}

interface TopicContent {
  title: string;
  content: string;
}

const HelpAndSupport = () => {
    const { t } = useTranslation();
    const [selectedTopic, setSelectedTopic] = useState<string>('welcome');

    const topics: Topic[] = [
        { id: 'welcome', name: '欢迎使用', icon: 'help' },
        { id: 'getting-started', name: '入门指南', icon: 'folder' },
        { id: 'desktop', name: '桌面介绍', icon: 'desktop' },
        { id: 'explorer', name: '文件资源管理器', icon: 'folder' },
        { id: 'internet', name: 'Internet Explorer', icon: 'ie' },
        { id: 'applications', name: '应用程序', icon: 'programs' },
        { id: 'settings', name: '系统设置', icon: 'settings' },
    ];

    const topicContent: Record<string, TopicContent> = {
        welcome: {
            title: '欢迎使用 Windows XP 帮助和支持中心',
            content: '欢迎使用 Windows XP 模拟器！这是一个完全在浏览器中运行的经典 Windows XP 桌面环境。\n\n您可以体验到真实 Windows XP 的大部分功能，包括文件系统、互联网浏览、应用程序运行等。'
        },
        'getting-started': {
            title: '入门指南',
            content: '要开始使用 Windows XP 模拟器，请尝试以下操作：\n\n1. 点击桌面上的图标打开应用程序\n2. 使用开始菜单访问所有功能\n3. 拖动窗口标题栏移动窗口\n4. 调整窗口大小\n5. 使用任务栏管理打开的窗口'
        },
        desktop: {
            title: '桌面介绍',
            content: 'Windows XP 桌面包含以下元素：\n\n- 图标：代表应用程序、文件夹或文件\n- 任务栏：显示打开的窗口和系统托盘\n- 开始菜单：访问所有程序和系统功能\n- 桌面背景：自定义的桌面图片'
        },
        explorer: {
            title: '文件资源管理器',
            content: '文件资源管理器是 Windows XP 中用于管理文件和文件夹的工具。\n\n您可以：\n- 浏览文件系统\n- 创建新文件夹\n- 重命名文件\n- 删除文件到回收站\n- 查看文件属性'
        },
        internet: {
            title: 'Internet Explorer',
            content: 'Internet Explorer 是 Windows XP 内置的网页浏览器。\n\n特点：\n- 使用 Wayback Machine 存档服务查看 2006 年的网页\n- 支持浏览历史记录\n- 地址栏导航\n- 工具栏按钮（前进、后退、刷新、主页）'
        },
        applications: {
            title: '应用程序',
            content: 'Windows XP 模拟器包含以下应用程序：\n\n- 记事本：用于查看和编辑文本文件\n- 图片查看器：用于查看图片文件\n- 计算器：简单的计算工具\n- QQ：聊天应用程序\n- Internet Explorer：网页浏览器\n- 文件资源管理器：管理文件和文件夹'
        },
        settings: {
            title: '系统设置',
            content: '您可以通过开始菜单访问系统设置。虽然这是一个模拟器，但您可以体验到经典的 Windows XP 设置界面。\n\n注意：某些设置功能可能无法完全实现，但视觉效果会保持一致。'
        },
    };

    return (
        <Container>
            <Header>
                <XPIcon name="help" size={16} />
                {t('helpAndSupport.title')}
            </Header>
            <Content>
                <Sidebar>
                    {topics.map(topic => (
                        <SidebarItem
                            key={topic.id}
                            className={selectedTopic === topic.id ? 'active' : ''}
                            onClick={() => setSelectedTopic(topic.id)}
                        >
                            <XPIcon name={topic.icon} size={16} />
                            {t(`helpAndSupport.topics.${topic.id}`)}
                        </SidebarItem>
                    ))}
                </Sidebar>
                <MainContent>
                    <TopicTitle>{topicContent[selectedTopic].title}</TopicTitle>
                    <TopicContent>
                        {topicContent[selectedTopic].content.split('\n').map((paragraph, index) => (
                            <p key={index} style={{ margin: '0 0 10px 0' }}>
                                {paragraph}
                            </p>
                        ))}
                    </TopicContent>
                </MainContent>
            </Content>
        </Container>
    );
};

export default HelpAndSupport;
