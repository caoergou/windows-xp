import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { X } from 'lucide-react';
import IEToolbar from '../components/Explorer/IEToolbar';
import IEAddressBar from '../components/Explorer/IEAddressBar';
import { useWindowManager } from '../context/WindowManagerContext';
import QQMail from './QQMail';
import { useFileSystem } from '../context/FileSystemContext';

const Container = styled.div`
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    background: #f0f0f0;
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

const InternetExplorer = ({ url: initialUrl, html: initialHtml, plugin }) => {
    const { openWindow } = useWindowManager();
    const { getFile } = useFileSystem();

    // History is an array of objects: { url: string, html: string|null }
    const [history, setHistory] = useState([
        { url: initialUrl || 'about:blank', html: initialHtml || null }
    ]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [inputUrl, setInputUrl] = useState(initialUrl || '');
    const [showHistory, setShowHistory] = useState(false);
    const [browsingHistory, setBrowsingHistory] = useState([]);

    const currentEntry = history[currentIndex];

    const addToHistory = (url) => {
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

    // Load history from localStorage on mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem('xp_ie_history');
            if (saved) {
                setBrowsingHistory(JSON.parse(saved));
            }
        } catch (e) {
            console.error("Failed to load history", e);
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

    const navigateTo = (newUrl, newHtml = null) => {
        // Block Google access
        if (newUrl && newUrl.includes('google.com')) {
            const blockedEntry = { url: newUrl, html: '<div style="padding:40px;text-align:center;font-family:sans-serif;"><h2>无法访问此网站</h2><p>无法连接到 www.google.com</p><p style="color:#666;">ERR_CONNECTION_TIMED_OUT</p></div>' };
            const newHistory = history.slice(0, currentIndex + 1);
            newHistory.push(blockedEntry);
            setHistory(newHistory);
            setCurrentIndex(newHistory.length - 1);
            return;
        }

        const newEntry = { url: newUrl, html: newHtml };

        // Truncate history if we are in the middle
        const newHistory = history.slice(0, currentIndex + 1);
        newHistory.push(newEntry);

        setHistory(newHistory);
        setCurrentIndex(newHistory.length - 1);
        addToHistory(newUrl);
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
        const iframe = document.getElementById('ie-frame');
        if (iframe) {
            iframe.contentWindow.location.reload();
        }
    };

    const handleHome = () => {
        const aboutFile = getFile(['About.html']);
        if (aboutFile && aboutFile.content) {
            navigateTo('About.html', aboutFile.content);
        } else {
            navigateTo('About.html');
        }
    };

    const handleMail = () => {
         openWindow('QQMail', 'QQ邮箱', <QQMail />, 'email', { width: 900, height: 650 });
    };

    // Handle messages from iframe (for HTML content navigation)
    useEffect(() => {
        const handleMessage = (event) => {
            if (event.data && event.data.type === 'NAVIGATE') {
                const href = event.data.href;
                navigateTo(href, null);
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [currentIndex, history]); // Re-bind if history changes? No, just once or dep on navigateTo logic

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
                />
            );
        }

        // Try the plugin first if provided
        if (plugin) {
            const pluginContent = plugin(currentEntry.url, navigateTo);
            if (pluginContent) return pluginContent;
        }

        // Fallback to iframe
        return (
            <iframe
                id="ie-frame"
                src={currentEntry.url}
                title="Browser"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation"
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
                onFavorites={() => {}}
                onHistory={() => setShowHistory(!showHistory)}
                onMail={handleMail}
                onPrint={() => window.print()}
                canBack={currentIndex > 0}
                canForward={currentIndex < history.length - 1}
                showHistory={showHistory}
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
                            <span>History</span>
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
                                <div style={{padding: 10, color: '#888', fontSize: 12}}>No history</div>
                            )}
                        </HistoryList>
                    </Sidebar>
                )}
                <Content>
                    {renderContent()}
                </Content>
            </MainArea>
        </Container>
    );
};

export default InternetExplorer;
