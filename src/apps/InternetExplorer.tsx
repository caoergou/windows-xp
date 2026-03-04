import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { X } from 'lucide-react';
import IEToolbar from '../components/Explorer/IEToolbar';
import IEAddressBar from '../components/Explorer/IEAddressBar';
import { useWindowManager } from '../context/WindowManagerContext';
import { useTranslation } from 'react-i18next';
import { BROWSER_BLACKLIST } from './BrowserPlugins';
import HelpAndSupport from './HelpAndSupport';

const Container = styled.div`
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    font-family: Tahoma, "Microsoft YaHei", sans-serif;
`;

const MainArea = styled.div`
    flex: 1;
    display: flex;
    overflow: hidden;
    position: relative;
`;

const Sidebar = styled.div`
    width: 250px;
    background: #fff;
    border-right: 1px solid #999;
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
`;

const SidebarHeader = styled.div`
    background: linear-gradient(to right, #6ba3e5, #3f78bd);
    color: white;
    padding: 5px;
    font-weight: bold;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
`;

const HistoryList = styled.div`
    flex: 1;
    overflow-y: auto;
    padding: 0;
    background: white;
`;

const HistoryItem = styled.div`
    padding: 5px;
    cursor: pointer;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    border-bottom: 1px solid #eee;
    font-size: 12px;
    display: flex;
    flex-direction: column;

    &:hover {
        background: #f0f0f0;
    }

    .url {
        color: #0066cc;
    }

    .time {
        color: #888;
        font-size: 10px;
        margin-top: 2px;
    }
`;

const FavoritesItem = styled.div`
    padding: 5px;
    cursor: pointer;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    border-bottom: 1px solid #eee;
    font-size: 12px;
    display: flex;
    align-items: center;
    gap: 5px;

    &:hover {
        background: #f0f0f0;
    }

    .name {
        color: #0066cc;
        flex: 1;
    }

    .delete {
        color: #ff0000;
        font-size: 10px;
        opacity: 0;
        cursor: pointer;
        padding: 2px 4px;
        border-radius: 2px;

        &:hover {
            opacity: 1;
            background: #ffdddd;
        }
    }

    &:hover .delete {
        opacity: 1;
    }
`;

const FavoritesToolbar = styled.div`
    padding: 5px;
    background: #f0f0f0;
    border-bottom: 1px solid #ddd;
    display: flex;
    gap: 3px;
`;

const ToolbarButton = styled.button`
    padding: 3px 8px;
    font-size: 11px;
    cursor: pointer;
    border: 1px solid #ccc;
    background: #f8f8f8;
    border-radius: 2px;

    &:hover {
        background: #e8e8e8;
    }

    &:active {
        background: #ddd;
    }
`;

const AddFavoriteModal = styled.div`
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    padding: 20px;
    border: 2px solid #316ac5;
    border-radius: 4px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    z-index: 1000;
    min-width: 300px;
`;

const ModalTitle = styled.h3`
    margin: 0 0 15px 0;
    color: #333;
    font-size: 14px;
`;

const ModalInput = styled.input`
    width: 100%;
    padding: 5px;
    margin-bottom: 15px;
    border: 1px solid #ccc;
    border-radius: 2px;
    font-size: 12px;
`;

const ModalButtons = styled.div`
    display: flex;
    gap: 10px;
    justify-content: flex-end;
`;

const ModalButton = styled.button`
    padding: 5px 15px;
    font-size: 12px;
    cursor: pointer;
    border: 1px solid #ccc;
    background: #f8f8f8;
    border-radius: 2px;

    &:hover {
        background: #e8e8e8;
    }

    &:active {
        background: #ddd;
    }

    &.primary {
        background: #316ac5;
        color: white;
        border-color: #2a5ca8;
    }

    &.primary:hover {
        background: #2a5ca8;
    }
`;

const Content = styled.div`
    flex: 1;
    background: white;
    position: relative;
    overflow: hidden;

    iframe {
        width: 100%;
        height: 100%;
        border: none;
    }
`;

const Footer = styled.footer`
    height: 22px;
    border-top: 1px solid rgba(0, 0, 0, 0.2);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6);
    background-color: rgb(236, 233, 216);
    display: flex;
    align-items: center;
    flex-shrink: 0;
    overflow: hidden;
    position: relative;
`;

const LoadingBar = styled.div<{ $visible: boolean }>`
    position: absolute;
    bottom: 0;
    left: 0;
    height: 2px;
    background: #316AC5;
    display: ${p => p.$visible ? 'block' : 'none'};
    animation: ieLoadingBar 1.5s ease-in-out infinite;

    @keyframes ieLoadingBar {
        0%   { left: 0;   width: 0%; opacity: 1; }
        30%  { left: 0;   width: 60%; }
        60%  { left: 25%; width: 70%; }
        90%  { left: 60%; width: 40%; opacity: 1; }
        100% { left: 100%; width: 0%; opacity: 0; }
    }
`;

const FooterStatus = styled.div`
    flex: 1;
    height: 100%;
    display: flex;
    align-items: center;
    padding: 0 4px;
    font-size: 11px;
    font-family: Tahoma, sans-serif;
    gap: 4px;
    overflow: hidden;
    border-right: 1px solid rgba(0, 0, 0, 0.12);
    box-shadow: inset -1px 0 rgba(255, 255, 255, 0.5);
`;

const StatusIcon = styled.img<{ $spinning?: boolean }>`
    height: 14px;
    width: 14px;
    flex-shrink: 0;
    animation: ${p => p.$spinning ? 'ieSpin 0.8s linear infinite' : 'none'};

    @keyframes ieSpin {
        from { transform: rotate(0deg); }
        to   { transform: rotate(360deg); }
    }
`;

const StatusText = styled.span`
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    color: #333;
`;

const FooterBlock = styled.div`
    height: 85%;
    width: 22px;
    border-left: 1px solid rgba(0, 0, 0, 0.15);
    box-shadow: inset 1px 0 rgba(255, 255, 255, 0.7);
    flex-shrink: 0;
`;

const FooterRight = styled.div`
    display: flex;
    align-items: center;
    width: 150px;
    height: 100%;
    border-left: 1px solid rgba(0, 0, 0, 0.11);
    box-shadow: inset 1px 0 rgba(255, 255, 255, 0.7);
    padding-left: 5px;
    position: relative;
    font-size: 11px;
    font-family: Tahoma, sans-serif;
    gap: 4px;
    flex-shrink: 0;

    img {
        height: 14px;
        width: 14px;
    }
`;

const FooterDots = styled.div`
    position: absolute;
    right: 11px;
    bottom: -1px;
    width: 2px;
    height: 2px;
    box-shadow: 2px 0px rgba(0, 0, 0, 0.25), 5.5px 0px rgba(0, 0, 0, 0.25),
        9px 0px rgba(0, 0, 0, 0.25), 5.5px -3.5px rgba(0, 0, 0, 0.25),
        9px -3.5px rgba(0, 0, 0, 0.25), 9px -7px rgba(0, 0, 0, 0.25),
        3px 1px rgba(255, 255, 255, 1), 6.5px 1px rgba(255, 255, 255, 1),
        10px 1px rgba(255, 255, 255, 1), 10px -2.5px rgba(255, 255, 255, 1),
        10px -6px rgba(255, 255, 255, 1);
`;

// 将普通 URL 转为互联网档案馆（Wayback Machine）存档链接，
// 呈现 2006 年 Windows XP 全盛期的真实网页样貌。
// if_ 后缀使存档页面以内嵌模式呈现，不显示 Wayback 顶部工具条。
const WAYBACK_TS = '20060615120000';
const toWaybackUrl = (url: string): string => {
    if (!url || url === 'about:blank') return url;
    if (url.includes('web.archive.org')) return url;
    return `https://web.archive.org/web/${WAYBACK_TS}if_/${url}`;
};

interface HistoryEntry {
    url: string;
    html: string | null;
}

interface BrowsingHistoryItem {
    url: string;
    timestamp: number;
}

interface FavoriteItem {
    name: string;
    url: string;
}

interface InternetExplorerProps {
    url?: string;
    html?: string;
    plugin?: (url: string, navigateTo: (url: string, html?: string) => void, openNewIE: (url: string) => void) => React.ReactNode;
}

const InternetExplorer: React.FC<InternetExplorerProps> = ({ url: initialUrl, html: initialHtml, plugin }) => {
    const { openWindow } = useWindowManager();

    // 在新 IE 窗口中打开 URL（供 plugin 链接点击使用）
    const openNewIE = (newUrl: string) => {
        openWindow(
            'InternetExplorer',
            newUrl,
            React.createElement(InternetExplorer, { url: newUrl, plugin }),
            'ie',
            { isMaximized: true },
        );
    };
    const { t } = useTranslation();

    // History is an array of objects: { url: string, html: string|null }
    const [history, setHistory] = useState<HistoryEntry[]>([
        { url: initialUrl || 'https://web.archive.org/web/20060615000000/http://www.hao123.com/', html: initialHtml || null }
    ]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [inputUrl, setInputUrl] = useState<string>(initialUrl || 'https://web.archive.org/web/20060615000000/http://www.hao123.com/');
    const [showHistory, setShowHistory] = useState(false);
    const [showFavorites, setShowFavorites] = useState(false);
    const [browsingHistory, setBrowsingHistory] = useState<BrowsingHistoryItem[]>([]);
    const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
    const [showAddFavorite, setShowAddFavorite] = useState(false);
    const [favoriteName, setFavoriteName] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [statusText, setStatusText] = useState(t('internetExplorer.status.done'));

    const currentEntry = history[currentIndex];

    const addToHistory = (url: string) => {
        if (!url || url === 'about:blank') return;

        try {
            const saved = JSON.parse(localStorage.getItem('xp_ie_history') || '[]');
            const newItem = { url, timestamp: Date.now() };
            // Newest first, limit to 100
            const newHistory = [newItem, ...saved].slice(0, 100);

            localStorage.setItem('xp_ie_history', JSON.stringify(newHistory));
            setBrowsingHistory(newHistory);
        } catch (e) {
            console.error(e);
        }
    };

    // Load history and favorites from localStorage on mount
    useEffect(() => {
        try {
            const savedHistory = localStorage.getItem('xp_ie_history');
            if (savedHistory) {
                setBrowsingHistory(JSON.parse(savedHistory));
            }

            const savedFavorites = localStorage.getItem('xp_ie_favorites');
            if (savedFavorites) {
                setFavorites(JSON.parse(savedFavorites));
            } else {
                // 默认收藏夹
                const defaultFavorites = [
                    { name: '百度', url: 'http://www.baidu.com' },
                    { name: '新浪', url: 'http://www.sina.com.cn' },
                    { name: '搜狐', url: 'http://www.sohu.com' },
                    { name: '网易', url: 'http://www.163.com' },
                    { name: '腾讯', url: 'http://www.qq.com' }
                ];
                setFavorites(defaultFavorites);
                localStorage.setItem('xp_ie_favorites', JSON.stringify(defaultFavorites));
            }
        } catch (e) {
            console.error("Failed to load history or favorites", e);
        }

        if (initialUrl && initialUrl !== 'about:blank') {
             addToHistory(initialUrl);
        }
    }, []);

    // Sync inputUrl when currentEntry changes
    useEffect(() => {
        if (currentEntry) {
            setInputUrl(currentEntry.url);
        }
    }, [currentEntry]);

    const navigateTo = (newUrl: string, newHtml: string | null = null) => {
        // 黑名单检查（配置见 BrowserPlugins.tsx 的 BROWSER_BLACKLIST）
        if (newUrl) {
            const blocked = BROWSER_BLACKLIST.find(entry => entry.match(newUrl));
            if (blocked) {
                const blockedEntry: HistoryEntry = {
                    url: newUrl,
                    html: `<div style="padding:40px;text-align:center;font-family:sans-serif;">
                        <h2>无法访问此网站</h2>
                        <p>无法连接到 ${blocked.label}</p>
                        <p style="color:#666;">ERR_CONNECTION_TIMED_OUT</p>
                    </div>`,
                };
                const newHistory = history.slice(0, currentIndex + 1);
                newHistory.push(blockedEntry);
                setHistory(newHistory);
                setCurrentIndex(newHistory.length - 1);
                setIsLoading(false);
                setStatusText(t('internetExplorer.status.cannotDisplay'));
                return;
            }
        }

        const newEntry: HistoryEntry = { url: newUrl, html: newHtml };

        // Truncate history if we are in the middle
        const newHistory = history.slice(0, currentIndex + 1);
        newHistory.push(newEntry);

        setHistory(newHistory);
        setCurrentIndex(newHistory.length - 1);
        addToHistory(newUrl);

        // 开始加载
        setIsLoading(true);
        const shortUrl = newUrl.replace(/^https?:\/\//, '').replace(/^web\.archive\.org\/web\/\d+[a-z_]*\//, '');
        setStatusText(`${t('internetExplorer.status.opening')} ${shortUrl}...`);
    };

    const handleGo = () => {
        navigateTo(inputUrl, null);
    };

    const goBack = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    const goForward = () => {
        if (currentIndex < history.length - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    };

    const handleRefresh = () => {
        // Force re-render of iframe by updating key or just triggering effect?
        // Simple way: just set state to same value, but React might bail out.
        // We can use a key on the iframe.
        // Or for now, just navigate to same place which might not reload iframe fully if src didn't change.
        // A better way is to reload the iframe element.
        const iframe = document.getElementById('ie-frame') as HTMLIFrameElement | null;
        if (iframe) {
            iframe.contentWindow.location.reload();
        }
    };

    const handleHome = () => {
        navigateTo('https://web.archive.org/web/20060615000000/http://www.hao123.com/');
    };

    const handleHelp = () => {
        openWindow(
            'HelpAndSupport',
            '帮助和支持',
            React.createElement(HelpAndSupport),
            'help',
            { width: 600, height: 400 },
        );
    };

    const handleFavorites = () => {
        setShowFavorites(!showFavorites);
        if (showHistory) {
            setShowHistory(false);
        }
    };

    const handleAddFavorite = () => {
        setFavoriteName(currentEntry.url);
        setShowAddFavorite(true);
    };

    const handleSaveFavorite = () => {
        if (favoriteName && currentEntry.url) {
            const newFavorite: FavoriteItem = {
                name: favoriteName,
                url: currentEntry.url
            };
            const updatedFavorites = [...favorites, newFavorite];
            setFavorites(updatedFavorites);
            localStorage.setItem('xp_ie_favorites', JSON.stringify(updatedFavorites));
            setShowAddFavorite(false);
        }
    };

    const handleDeleteFavorite = (index: number) => {
        const updatedFavorites = [...favorites];
        updatedFavorites.splice(index, 1);
        setFavorites(updatedFavorites);
        localStorage.setItem('xp_ie_favorites', JSON.stringify(updatedFavorites));
    };

    const handleClearCache = () => {
        // 清除浏览历史
        localStorage.removeItem('xp_ie_history');
        setBrowsingHistory([]);
        // 清除临时数据
        localStorage.removeItem('xp_ie_cache');
        // 重置会话
        setHistory([{ url: 'https://web.archive.org/web/20060615000000/http://www.hao123.com/', html: null }]);
        setCurrentIndex(0);
        setInputUrl('https://web.archive.org/web/20060615000000/http://www.hao123.com/');
    };


    // Handle messages from iframe (for HTML content navigation)
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.data && event.data.type === 'NAVIGATE') {
                const href = event.data.href;
                navigateTo(href, null);
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [currentIndex, history]);

    // 监听 iframe 导航
    useEffect(() => {
        const iframe = document.getElementById('ie-frame') as HTMLIFrameElement | null;
        if (!iframe || currentEntry.html) return;

        let lastUrl = toWaybackUrl(currentEntry.url);

        const checkUrl = setInterval(() => {
            try {
                const currentIframeUrl = iframe.contentWindow?.location.href;
                if (currentIframeUrl && currentIframeUrl !== lastUrl && currentIframeUrl !== 'about:blank') {
                    lastUrl = currentIframeUrl;

                    // 提取原始 URL
                    const match = currentIframeUrl.match(/web\.archive\.org\/web\/\d+[a-z_]*\/(https?:\/\/.+)/);
                    if (match) {
                        const originalUrl = match[1];
                        // 阻止 iframe 导航，改为在我们的历史中导航
                        iframe.contentWindow?.stop();
                        navigateTo(originalUrl);
                    }
                }
            } catch (e) {
                // 跨域错误，忽略
            }
        }, 100);

        return () => clearInterval(checkUrl);
    }, [currentEntry]);

    const renderContent = () => {
        if (currentEntry.html) {
             // Inject script to capture clicks
             const script = `
                <script>
                    document.addEventListener('click', function(e) {
                        var anchor = e.target.closest('a');
                        if (anchor && anchor.href) {
                            e.preventDefault();
                            window.parent.postMessage({ type: 'NAVIGATE', href: anchor.href }, '*');
                        }
                    });
                </script>
             `;
             const srcDoc = currentEntry.html + script;

            return (
                <iframe
                    id="ie-frame"
                    srcDoc={srcDoc}
                    title="Browser Content"
                    sandbox="allow-scripts allow-same-origin"
                    onLoad={() => {
                        setIsLoading(false);
                        setStatusText(t('internetExplorer.status.done'));
                    }}
                />
            );
        }

        // Try the plugin first if provided
        if (plugin) {
            const pluginContent = plugin(currentEntry.url, navigateTo, openNewIE);
            if (pluginContent) {
                setIsLoading(false);
                setStatusText(t('internetExplorer.status.done'));
                return pluginContent;
            }
        }

        return (
            <iframe
                id="ie-frame"
                src={toWaybackUrl(currentEntry.url)}
                title="Browser"
                key={currentEntry.url}
                onLoad={() => {
                    setIsLoading(false);
                    setStatusText(t('internetExplorer.status.done'));
                }}
                onError={() => {
                    setIsLoading(false);
                    setStatusText(t('internetExplorer.status.cannotDisplay'));
                }}
            />
        );
    };

    return (
        <Container>
            <IEToolbar
                onBack={goBack}
                onForward={goForward}
                onRefresh={handleRefresh}
                onStop={() => {}}
                onHome={handleHome}
                onSearch={() => {}}
                onFavorites={handleFavorites}
                onHistory={() => setShowHistory(!showHistory)}
                onPrint={() => window.print()}
                onHelp={handleHelp}
                canBack={currentIndex > 0}
                canForward={currentIndex < history.length - 1}
                showFavorites={showFavorites}
                showHistory={showHistory}
                isLoading={isLoading}
            />
            <IEAddressBar
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                onGo={handleGo}
            />
            <MainArea>
                {showHistory && (
                    <Sidebar>
                        <SidebarHeader>
                            <span>{t('internetExplorer.history')}</span>
                            <X size={14} style={{cursor: 'pointer'}} onClick={() => setShowHistory(false)} />
                        </SidebarHeader>
                        <HistoryList>
                            {browsingHistory.map((item, index) => (
                                <HistoryItem key={index} onClick={() => navigateTo(item.url)}>
                                    <div className="url">{item.url}</div>
                                    <div className="time">{new Date(item.timestamp).toLocaleString()}</div>
                                </HistoryItem>
                            ))}
                            {browsingHistory.length === 0 && (
                                <div style={{padding: 10, color: '#888', fontSize: 12}}>{t('internetExplorer.noHistory')}</div>
                            )}
                        </HistoryList>
                    </Sidebar>
                )}
                {showFavorites && (
                    <Sidebar>
                        <SidebarHeader>
                            <span>{t('explorer.favorites')}</span>
                            <X size={14} style={{cursor: 'pointer'}} onClick={() => setShowFavorites(false)} />
                        </SidebarHeader>
                        <FavoritesToolbar>
                            <ToolbarButton onClick={handleAddFavorite}>{t('contextMenu.new')}</ToolbarButton>
                            <ToolbarButton onClick={handleClearCache}>{t('contextMenu.refresh')}</ToolbarButton>
                        </FavoritesToolbar>
                        <HistoryList>
                            {favorites.map((item, index) => (
                                <FavoritesItem key={index}>
                                    <span className="name" onClick={() => navigateTo(item.url)}>
                                        {item.name}
                                    </span>
                                    <span
                                        className="delete"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteFavorite(index);
                                        }}
                                    >
                                        ×
                                    </span>
                                </FavoritesItem>
                            ))}
                            {favorites.length === 0 && (
                                <div style={{padding: 10, color: '#888', fontSize: 12}}>{t('internetExplorer.noHistory')}</div>
                            )}
                        </HistoryList>
                    </Sidebar>
                )}
                <Content>
                    {renderContent()}
                </Content>
            </MainArea>
            <Footer>
                <LoadingBar $visible={isLoading} />
                <FooterStatus>
                    <StatusIcon
                        src="/icons/ie.png"
                        alt="IE"
                        $spinning={isLoading}
                    />
                    <StatusText>{statusText}</StatusText>
                </FooterStatus>
                <FooterBlock />
                <FooterBlock />
                <FooterBlock />
                <FooterBlock />
                <FooterRight>
                    <img src="/icons/earth.png" alt="Internet" />
                    <span>Internet</span>
                    <FooterDots />
                </FooterRight>
            </Footer>
            {showAddFavorite && (
                <AddFavoriteModal>
                    <ModalTitle>{t('internetExplorer.menuitems.addToFavorites').replace('(A)...', '')}</ModalTitle>
                    <ModalInput
                        type="text"
                        value={favoriteName}
                        onChange={(e) => setFavoriteName(e.target.value)}
                        placeholder={t('internetExplorer.menuitems.addToFavorites').replace('(A)...', '')}
                        autoFocus
                    />
                    <ModalButtons>
                        <ModalButton onClick={() => setShowAddFavorite(false)}>{t('shutdown.cancel')}</ModalButton>
                        <ModalButton className="primary" onClick={handleSaveFavorite}>{t('contextMenu.new')}</ModalButton>
                    </ModalButtons>
                </AddFavoriteModal>
            )}
        </Container>
    );
};

export default InternetExplorer;
