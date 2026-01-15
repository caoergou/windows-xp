import React, { useState, useEffect } from 'react';
import timeInfo from '../data/time_info.json';

const SystemClock = () => {
    const [dateTime, setDateTime] = useState('');

    useEffect(() => {
        const updateDateTime = () => {
            const now = new Date();

            // Format time
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const formattedTime = `${hours}:${minutes}`;

            // Use custom date from config if exists
            const formattedDate = timeInfo.custom_date ||
                `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`;

            // Combine date and time
            setDateTime(`${formattedDate}${timeInfo.separator || ' '}${formattedTime}`);
        };

        updateDateTime();
        const interval = setInterval(updateDateTime, 1000);
        return () => clearInterval(interval);
    }, []);

    return <span>{dateTime}</span>;
};

export default SystemClock;
