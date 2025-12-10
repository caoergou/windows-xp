import React from 'react';
import InternetExplorer from './InternetExplorer';
import Tieba from './Tieba';

export const tiebaPlugin = (url) => {
    if (!url) return null;

    // Handle tieba.com and tieba.baidu.com
    if (url.includes('tieba.com') || url.includes('tieba.baidu.com')) {
         // Basic parsing: http://tieba.com/[tieba_name]
         const parts = url.split('/');
         // Filter out empty parts in case of trailing slash or double slash
         const validParts = parts.filter(p => p !== '' && p !== 'http:' && p !== 'https:');

         let tiebaId = validParts[validParts.length - 1];
         if (tiebaId === 'tieba.com' || tiebaId === 'tieba.baidu.com') {
             // No specific tieba selected
             return <div style={{padding: 20}}>欢迎来到百度贴吧。请输入具体的贴吧地址。</div>;
         }

         return <Tieba tiebaId={tiebaId} />;
    }
    return null;
};

const TiebaApp = ({ initialUrl }) => {
    return <InternetExplorer url={initialUrl} plugin={tiebaPlugin} />;
}

export default TiebaApp;
