import React from 'react';
import Tieba from './Tieba';
import QZone from './QZone';
import QQMail from './QQMail';

export const tiebaPlugin = (url, navigateTo) => {
    if (!url) return null;

    // Handle tieba.com and tieba.baidu.com
    if (url.includes('tieba.com') || url.includes('tieba.baidu.com')) {
         // URL parsing: http://tieba.com/[tieba_name] or http://tieba.com/[tieba_name]/p/[thread_id]
         // Remove protocol
         const cleanUrl = url.replace(/^https?:\/\//, '');
         const parts = cleanUrl.split('/').filter(p => p && p !== '');

         // parts[0] is domain
         // parts[1] is tiebaId
         // parts[2] is 'p' (optional)
         // parts[3] is threadId (optional)

         let tiebaId = parts[1];
         let threadId = null;

         if (parts[2] === 'p' && parts[3]) {
             threadId = parseInt(parts[3], 10);
         }

         if (!tiebaId || tiebaId === 'tieba.com' || tiebaId === 'tieba.baidu.com') {
             // No specific tieba selected
             return <div style={{padding: 20}}>欢迎来到百度贴吧。请输入具体的贴吧地址。</div>;
         }

         return <Tieba tiebaId={tiebaId} threadId={threadId} currentUrl={url} navigateTo={navigateTo} />;
    }
    return null;
};

export const qzonePlugin = (url, navigateTo) => {
    if (!url) return null;

    // Match http://qzone.qq.com/[id] or qzone://[id]
    if (url.includes('qzone.qq.com') || url.startsWith('qzone://')) {
        let userId = null;
        if (url.startsWith('qzone://')) {
            userId = url.replace('qzone://', '').split('/')[0];
        } else {
            // http://qzone.qq.com/1847592036
            const parts = url.replace(/^https?:\/\//, '').split('/');
            // parts[0] is domain, parts[1] is id
            if (parts[1]) userId = parts[1];
        }

        if (userId) {
            return <QZone userId={userId} navigateTo={navigateTo} />;
        }
    }
    return null;
};

export const qqmailPlugin = (url, navigateTo) => {
    if (!url) return null;

    // Match http://mail.qq.com or https://mail.qq.com
    if (url.includes('mail.qq.com')) {
        return <QQMail />;
    }
    return null;
};

export const hao123Plugin = (url, navigateTo) => {
    if (!url) return null;

    if (url.includes('hao123.com')) {
        return (
            <iframe
                src="/src/data/web/hao123.html"
                title="hao123"
                style={{ width: '100%', height: '100%', border: 'none' }}
            />
        );
    }
    return null;
};

export const defaultPlugin = (url, navigateTo) => {
    const t = tiebaPlugin(url, navigateTo);
    if (t) return t;
    const q = qzonePlugin(url, navigateTo);
    if (q) return q;
    const m = qqmailPlugin(url, navigateTo);
    if (m) return m;
    const h = hao123Plugin(url, navigateTo);
    if (h) return h;
    return null;
};
