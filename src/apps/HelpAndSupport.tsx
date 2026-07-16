import React, { useState } from 'react';
import styled from 'styled-components';
import XPIcon from '../components/XPIcon';
import { useTranslation } from 'react-i18next';
import { useLesson } from '../context/LessonContext';
import { COLORS, FONTS } from '../constants';

const Container = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: ${COLORS.GREY_F0};
  font-family: ${FONTS.UI};
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
  background: ${COLORS.WHITE};
  border-right: 1px solid ${COLORS.GREY_99};
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
`;

const SidebarItem = styled.div`
  padding: 10px 15px;
  cursor: pointer;
  font-size: 12px;
  border-bottom: 1px solid ${COLORS.GREY_EE};
  display: flex;
  align-items: center;
  gap: 8px;

  &:hover {
    background: ${COLORS.GREY_F0};
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
  color: ${COLORS.GREY_33};
`;

const TopicContent = styled.div`
  color: ${COLORS.GREY_66};
`;

const LessonRow = styled.button`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  text-align: left;
  padding: 10px 12px;
  margin-bottom: 8px;
  background: ${COLORS.SURFACE};
  border: 1px solid ${COLORS.BUTTON_BORDER};
  border-radius: 3px;
  font-family: inherit;
  font-size: 12px;
  cursor: pointer;
  &:hover {
    background: ${COLORS.MENU_HIGHLIGHT};
    color: white;
  }
`;

const LessonRowText = styled.span`
  flex: 1 1 auto;
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
  const { catalog, start } = useLesson();
  const [selectedTopic, setSelectedTopic] = useState<string>('welcome');

  const topics: Topic[] = [
    { id: 'welcome', icon: 'help' },
    { id: 'getting-started', icon: 'folder' },
    { id: 'desktop', icon: 'desktop' },
    { id: 'explorer', icon: 'folder' },
    { id: 'internet', icon: 'ie' },
    { id: 'applications', icon: 'programs' },
    { id: 'settings', icon: 'settings' },
    // The diegetic lesson catalog — only when the host registered lessons (#141).
    ...(catalog.length ? [{ id: 'lessons', icon: 'help' }] : []),
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
          {selectedTopic === 'lessons' ? (
            <>
              <TopicTitle>{t('helpAndSupport.lessons.title')}</TopicTitle>
              <TopicContent>
                <p style={{ margin: '0 0 12px 0' }}>{t('helpAndSupport.lessons.intro')}</p>
                {catalog.map(lesson => (
                  <LessonRow
                    key={lesson.id}
                    data-testid={`lesson-launch-${lesson.id}`}
                    onClick={() => start(lesson.id, 'try')}
                  >
                    <XPIcon name="help" size={16} />
                    <LessonRowText>{t(lesson.title)}</LessonRowText>
                    <span aria-hidden>▶</span>
                  </LessonRow>
                ))}
              </TopicContent>
            </>
          ) : (
            <>
              <TopicTitle>{topicContent[selectedTopic].title}</TopicTitle>
              <TopicContent>
                {topicContent[selectedTopic].content.split('\n').map((paragraph, index) => (
                  <p key={index} style={{ margin: '0 0 10px 0' }}>
                    {paragraph}
                  </p>
                ))}
              </TopicContent>
            </>
          )}
        </MainContent>
      </Content>
    </Container>
  );
};

export default HelpAndSupport;
