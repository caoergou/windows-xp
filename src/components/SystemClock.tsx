import React, { useState, useEffect } from 'react';

const SystemClock: React.FC = () => {
    const [dateTime, setDateTime] = useState('');

    useEffect(() => {
        const update = () => {
            const now = new Date();
            const h = String(now.getHours()).padStart(2, '0');
            const m = String(now.getMinutes()).padStart(2, '0');
            const y = now.getFullYear();
            const mo = String(now.getMonth() + 1).padStart(2, '0');
            const d = String(now.getDate()).padStart(2, '0');
            setDateTime(`${y}/${mo}/${d} ${h}:${m}`);
        };
        update();
        const id = setInterval(update, 1000);
        return () => clearInterval(id);
    }, []);

    return <span>{dateTime}</span>;
};

export default SystemClock;
