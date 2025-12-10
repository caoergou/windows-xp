import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

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

const HTMLContent = styled.div`
    padding: 20px;
    height: 100%;
    overflow: auto;
`;

const InternetExplorer = ({ url: initialUrl, html: initialHtml, plugin }) => {
    const [url, setUrl] = useState(initialUrl || 'about:blank');
    const [inputUrl, setInputUrl] = useState(initialUrl || '');
    const [currentHtml, setCurrentHtml] = useState(initialHtml || null);

    // Sync inputUrl if external url changes (e.g. if we want to support back/forward later, or initial prop changes)
    useEffect(() => {
        if (initialUrl && initialUrl !== 'about:blank') {
            setUrl(initialUrl);
            setInputUrl(initialUrl);
        }
    }, [initialUrl]);

    // Handle internal link clicks in HTML mode
    const handleHtmlClick = (e) => {
        const anchor = e.target.closest('a');
        if (anchor && anchor.href) {
            e.preventDefault();
            const href = anchor.href;

            // Check if it's an external link or one we should handle
            // For simplicity, we treat all links in About.html as navigation requests within IE
            setUrl(href);
            setInputUrl(href);
            setCurrentHtml(null); // Switch to URL mode
        }
    };

    const handleGo = () => {
        setUrl(inputUrl);
        setCurrentHtml(null);
    };

    const renderContent = () => {
        if (currentHtml) {
            return (
                <HTMLContent
                    dangerouslySetInnerHTML={{ __html: currentHtml }}
                    onClick={handleHtmlClick}
                />
            );
        }

        // Try the plugin first if provided
        if (plugin) {
            const pluginContent = plugin(url);
            if (pluginContent) return pluginContent;
        }

        // Fallback to iframe
        return <iframe src={url} title="Browser" sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation" />;
    };

    return (
        <Container>
            <Toolbar>
                <span>地址:</span>
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
