import React, { useState, useEffect, useCallback } from 'react';
import { useWindowManager } from '../../context/WindowManagerContext';
import { useTranslation } from 'react-i18next';
import IEToolbar from '../../components/Explorer/IEToolbar';
import IEAddressBar from '../../components/Explorer/IEAddressBar';
import HelpAndSupport from '../HelpAndSupport';
import { BROWSER_BLACKLIST, defaultPlugin } from '../BrowserPlugins';
import { InternetExplorerProps } from './types';
import { getBrowserCultureProfile } from '../../data/culture';
import { useBrowserHistory } from './hooks/useBrowserHistory';
import { useBrowsingHistory } from './hooks/useBrowsingHistory';
import { useFavorites } from './hooks/useFavorites';
import BrowserChrome from './components/BrowserChrome';
import HistoryPanel from './components/HistoryPanel';
import FavoritesPanel from './components/FavoritesPanel';
import ContentView from './components/ContentView';
import StatusBar from './components/StatusBar';
import AddFavoriteModal from './components/AddFavoriteModal';

const InternetExplorer: React.FC<InternetExplorerProps> = ({
  url: initialUrl,
  html: initialHtml,
  plugin = defaultPlugin,
}) => {
  const { openWindow } = useWindowManager();
  const { t, i18n } = useTranslation();
  const homepage = getBrowserCultureProfile(i18n.language).homepage;

  const openNewIE = useCallback(
    (newUrl: string) => {
      openWindow(
        'InternetExplorer',
        newUrl,
        React.createElement(InternetExplorer, { url: newUrl, plugin }),
        'ie',
        { isMaximized: true }
      );
    },
    [openWindow, plugin]
  );

  const {
    history,
    currentIndex,
    currentEntry,
    navigateTo: rawNavigateTo,
    goBack,
    goForward,
    pushErrorEntry,
  } = useBrowserHistory({
    initialUrl: initialUrl || homepage,
    initialHtml: initialHtml || null,
  });

  const { browsingHistory, addToHistory, clearHistory } = useBrowsingHistory();
  const { filteredFavorites, addFavorite, deleteFavorite } = useFavorites();

  const [inputUrl, setInputUrl] = useState(initialUrl || homepage);
  const [showHistory, setShowHistory] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showAddFavorite, setShowAddFavorite] = useState(false);
  const [favoriteName, setFavoriteName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusText, setStatusText] = useState(t('internetExplorer.status.done'));

  const navigateTo = useCallback(
    (newUrl: string, newHtml?: string) => {
      const blocked = BROWSER_BLACKLIST.find(entry => entry.match(newUrl));
      if (blocked) {
        pushErrorEntry(newUrl);
        setIsLoading(false);
        setStatusText(t('internetExplorer.status.cannotDisplay'));
        return;
      }
      rawNavigateTo(newUrl, newHtml ?? null);
      addToHistory(newUrl);
      setIsLoading(true);
      const shortUrl = newUrl
        .replace(/^https?:\/\//, '')
        .replace(/^web\.archive\.org\/web\/\d+[a-z_]*\//, '');
      setStatusText(`${t('internetExplorer.status.opening')} ${shortUrl}...`);
    },
    [pushErrorEntry, rawNavigateTo, addToHistory, t]
  );

  useEffect(() => {
    if (initialUrl && initialUrl !== 'about:blank') {
      addToHistory(initialUrl);
    }
  }, [initialUrl, addToHistory]);

  useEffect(() => {
    if (currentEntry) {
      setInputUrl(currentEntry.url);
    }
  }, [currentEntry]);

  const handleGo = useCallback(() => {
    navigateTo(inputUrl);
  }, [navigateTo, inputUrl]);

  const handleRefresh = useCallback(() => {
    const iframe = document.getElementById('ie-frame') as HTMLIFrameElement | null;
    if (iframe) {
      iframe.contentWindow?.location.reload();
    }
  }, []);

  const handleHome = useCallback(() => {
    navigateTo(homepage);
  }, [homepage, navigateTo]);

  const handleHelp = useCallback(() => {
    openWindow(
      'HelpAndSupport',
      t('helpAndSupport.title'),
      React.createElement(HelpAndSupport),
      'help',
      { width: 600, height: 400 }
    );
  }, [openWindow, t]);

  const handleFavorites = useCallback(() => {
    setShowFavorites(prev => !prev);
    setShowHistory(false);
  }, []);

  const handleHistory = useCallback(() => {
    setShowHistory(prev => !prev);
    setShowFavorites(false);
  }, []);

  const handleAddFavorite = useCallback(() => {
    setFavoriteName(currentEntry?.url || '');
    setShowAddFavorite(true);
  }, [currentEntry]);

  const handleSaveFavorite = useCallback(() => {
    if (favoriteName && currentEntry?.url) {
      addFavorite(favoriteName, currentEntry.url);
      setShowAddFavorite(false);
    }
  }, [favoriteName, currentEntry, addFavorite]);

  const handleClearCache = useCallback(() => {
    clearHistory();
    navigateTo(homepage);
  }, [clearHistory, homepage, navigateTo]);

  const handleContentLoad = useCallback(() => {
    setIsLoading(false);
    setStatusText(t('internetExplorer.status.done'));
  }, [t]);

  const handleContentError = useCallback(() => {
    setIsLoading(false);
    setStatusText(t('internetExplorer.status.cannotDisplay'));
    if (currentEntry?.url) {
      pushErrorEntry(currentEntry.url);
    }
  }, [currentEntry, pushErrorEntry, t]);

  return (
    <>
      <IEToolbar
        onBack={goBack}
        onForward={goForward}
        onRefresh={handleRefresh}
        onStop={() => undefined}
        onHome={handleHome}
        onSearch={() => undefined}
        onFavorites={handleFavorites}
        onHistory={handleHistory}
        onPrint={() => window.print()}
        onHelp={handleHelp}
        canBack={history.length > 0 && currentIndex > 0}
        canForward={currentIndex < history.length - 1}
        showFavorites={showFavorites}
        showHistory={showHistory}
        isLoading={isLoading}
      />
      <IEAddressBar value={inputUrl} onChange={e => setInputUrl(e.target.value)} onGo={handleGo} />
      <BrowserChrome statusBar={<StatusBar isLoading={isLoading} statusText={statusText} />}>
        {showHistory && (
          <HistoryPanel
            history={browsingHistory}
            onNavigate={navigateTo}
            onClose={() => setShowHistory(false)}
          />
        )}
        {showFavorites && (
          <FavoritesPanel
            favorites={filteredFavorites}
            onNavigate={navigateTo}
            onAdd={handleAddFavorite}
            onClear={handleClearCache}
            onDelete={deleteFavorite}
            onClose={() => setShowFavorites(false)}
          />
        )}
        <ContentView
          currentEntry={currentEntry}
          plugin={plugin}
          onNavigate={navigateTo}
          onOpenNewIE={openNewIE}
          onLoad={handleContentLoad}
          onError={handleContentError}
          onOpenHelp={handleHelp}
        />
      </BrowserChrome>
      {showAddFavorite && (
        <AddFavoriteModal
          name={favoriteName}
          onNameChange={setFavoriteName}
          onSave={handleSaveFavorite}
          onCancel={() => setShowAddFavorite(false)}
        />
      )}
    </>
  );
};

export default InternetExplorer;
