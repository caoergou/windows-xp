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
  font-family: 'Tahoma', 'SimSun', 'Microsoft YaHei', sans-serif;
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
    { id: 'welcome', icon: 'help' },
    { id: 'getting-started', icon: 'folder' },
    { id: 'desktop', icon: 'desktop' },
    { id: 'explorer', icon: 'folder' },
    { id: 'internet', icon: 'ie' },
    { id: 'applications', icon: 'programs' },
    { id: 'settings', icon: 'settings' },
  ];

  const topicContent: Record<string, TopicContent> = {
    welcome: {
      title: t('helpAndSupport.content.welcome.title'),
      content: t('helpAndSupport.content.welcome.body'),
    },
    'getting-started': {
      title: t('helpAndSupport.content.gettingStarted.title'),
      content: t('helpAndSupport.content.gettingStarted.body'),
    },
    desktop: {
      title: t('helpAndSupport.content.desktop.title'),
      content: t('helpAndSupport.content.desktop.body'),
    },
    explorer: {
      title: t('helpAndSupport.content.explorer.title'),
      content: t('helpAndSupport.content.explorer.body'),
    },
    internet: {
      title: t('helpAndSupport.content.internet.title'),
      content: t('helpAndSupport.content.internet.body'),
    },
    applications: {
      title: t('helpAndSupport.content.applications.title'),
      content: t('helpAndSupport.content.applications.body'),
    },
    settings: {
      title: t('helpAndSupport.content.settings.title'),
      content: t('helpAndSupport.content.settings.body'),
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
