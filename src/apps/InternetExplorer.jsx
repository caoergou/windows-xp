import React, { useState } from 'react';
import styled from 'styled-components';
import Tieba from './Tieba';

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
`;

const InternetExplorer = ({ url: initialUrl, html }) => {
    const [url, setUrl] = useState(initialUrl || 'about:blank');
    const [inputUrl, setInputUrl] = useState(initialUrl || '');

    const handleGo = () => {
        setUrl(inputUrl);
    };

    const isTiebaUrl = (u) => {
        return u.includes('tieba.com') || u.includes('tieba.baidu.com');
    };

    const renderContent = () => {
        if (html) {
            return <HTMLContent dangerouslySetInnerHTML={{ __html: html }} />;
        }

        if (isTiebaUrl(url)) {
            // Extract tieba name/id from url
            // Format: http://tieba.com/[tieba_name]
            const parts = url.split('/');
            const tiebaId = parts[parts.length - 1];
            return <Tieba tiebaId={tiebaId} />;
        }

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
