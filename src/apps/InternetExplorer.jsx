import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { ArrowLeft, ArrowRight, RotateCw } from 'lucide-react';
import XPIcon from '../components/XPIcon';

const Container = styled.div`
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    background: #f0f0f0;
`;

const Toolbar = styled.div`
    padding: 5px;
    background: #ECE9D8;
    border-bottom: 1px solid #999;
    display: flex;
    gap: 5px;
    align-items: center;
`;

const ToolbarButton = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2px 5px;
    background: transparent;
    border: none;
    cursor: pointer;
    border: 1px solid transparent;
    border-radius: 3px;

    &:hover {
        border: 1px solid #999;
        background-color: #f5f5f5;
        box-shadow: inset 0 0 2px rgba(0,0,0,0.1);
    }

    &:active {
        box-shadow: inset 0 1px 3px rgba(0,0,0,0.2);
    }

    &:disabled {
        opacity: 0.5;
        cursor: default;
        border: 1px solid transparent;
        background: transparent;
    }
`;

const AddressBar = styled.input`
    flex: 1;
    padding: 2px;
`;

const Content = styled.div`
    flex: 1;
    background: white;
    position: relative;
    
    iframe {
        width: 100%;
        height: 100%;
        border: none;
    }
`;

const InternetExplorer = ({ url: initialUrl, html: initialHtml, plugin }) => {
    // History is an array of objects: { url: string, html: string|null }
    const [history, setHistory] = useState([
        { url: initialUrl || 'about:blank', html: initialHtml || null }
    ]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [inputUrl, setInputUrl] = useState(initialUrl || '');

    const currentEntry = history[currentIndex];

    // Sync inputUrl when currentEntry changes
    useEffect(() => {
        if (currentEntry) {
            setInputUrl(currentEntry.url);
        }
    }, [currentEntry]);

    const navigateTo = (newUrl, newHtml = null) => {
        const newEntry = { url: newUrl, html: newHtml };

        // Truncate history if we are in the middle
        const newHistory = history.slice(0, currentIndex + 1);
        newHistory.push(newEntry);

        setHistory(newHistory);
        setCurrentIndex(newHistory.length - 1);
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
            const pluginContent = plugin(currentEntry.url);
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
            <Toolbar>
                <ToolbarButton onClick={goBack} disabled={currentIndex === 0} title="Back">
                    <ArrowLeft size={16} />
                </ToolbarButton>
                <ToolbarButton onClick={goForward} disabled={currentIndex === history.length - 1} title="Forward">
                    <ArrowRight size={16} />
                </ToolbarButton>
                <ToolbarButton onClick={handleRefresh} title="Refresh">
                    <RotateCw size={16} />
                </ToolbarButton>

                <span style={{ marginLeft: '5px' }}>地址:</span>
                <AddressBar 
                    value={inputUrl} 
                    onChange={(e) => setInputUrl(e.target.value)} 
                    onKeyPress={(e) => e.key === 'Enter' && handleGo()}
                />
                <button onClick={handleGo}>转到</button>
            </Toolbar>
            <Content>
                {renderContent()}
            </Content>
        </Container>
    );
};

export default InternetExplorer;
