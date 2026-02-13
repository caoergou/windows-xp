import { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';

const slideIn = keyframes`
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
`;

const PopupContainer = styled.div`
    position: fixed;
    right: 20px;
    bottom: ${props => props.$bottom || '60px'};
    z-index: 9000;
    animation: ${slideIn} 0.4s ease-out;
`;

const PopupWindow = styled.div`
    width: 280px;
    background: #ECE9D8;
    border: 2px solid #0054E3;
    border-radius: 5px 5px 0 0;
    box-shadow: 3px 3px 8px rgba(0, 0, 0, 0.4);
    font-family: 'Microsoft YaHei', 'SimSun', sans-serif;
`;

const PopupTitleBar = styled.div`
    height: 24px;
    background: linear-gradient(to bottom, #0A6AF1 0%, #0054E3 50%, #0A6AF1 100%);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 4px 0 8px;
    border-radius: 3px 3px 0 0;
    cursor: default;
`;

const TitleText = styled.span`
    color: white;
    font-size: 12px;
    font-weight: bold;
    text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.3);
`;

const CloseBtn = styled.button`
    width: 18px;
    height: 18px;
    background: linear-gradient(to bottom, #E08080 0%, #C04040 100%);
    border: 1px solid #993333;
    border-radius: 3px;
    color: white;
    font-size: 11px;
    font-weight: bold;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
    padding: 0;

    &:hover {
        background: linear-gradient(to bottom, #F09090 0%, #D05050 100%);
    }
`;

const PopupBody = styled.div`
    padding: 12px;
    text-align: center;
`;

const PopupIcon = styled.div`
    font-size: 28px;
    margin-bottom: 8px;
`;

const PopupMessage = styled.p`
    font-size: 12px;
    color: #333;
    margin: 0 0 12px 0;
    line-height: 1.5;
`;

const ActionBtn = styled.button`
    background: linear-gradient(to bottom, #F0F0F0 0%, #D0D0D0 100%);
    border: 1px solid #999;
    border-radius: 3px;
    padding: 4px 20px;
    font-size: 12px;
    cursor: pointer;
    color: #333;
    font-weight: bold;

    &:hover {
        background: linear-gradient(to bottom, #FFFFFF 0%, #E0E0E0 100%);
    }

    &.primary {
        background: linear-gradient(to bottom, #68B068 0%, #4A904A 100%);
        color: white;
        border-color: #3A7A3A;

        &:hover {
            background: linear-gradient(to bottom, #78C078 0%, #5AA05A 100%);
        }
    }
`;

const IgnoreLink = styled.span`
    display: block;
    margin-top: 6px;
    font-size: 11px;
    color: #999;
    cursor: pointer;

    &:hover {
        color: #666;
        text-decoration: underline;
    }
`;

const ADS = [
    {
        title: '360安全卫士',
        icon: '🛡️',
        message: '您的电脑存在 3 个安全风险！\n建议立即修复以保护您的电脑安全。',
        button: '立即修复',
        primary: true,
    },
    {
        title: '电脑管家温馨提示',
        icon: '🚀',
        message: '您的电脑已连续运行 3652 天，\n系统垃圾较多，建议立即清理加速。',
        button: '一键加速',
        primary: true,
    },
];

const AdwarePopups = () => {
    const [visibleAds, setVisibleAds] = useState([]);

    useEffect(() => {
        // Only show once per session
        if (sessionStorage.getItem('xp_adware_shown')) return;

        // Don't show during first login guide
        const hasLoggedInBefore = localStorage.getItem('xp_has_logged_in');
        if (!hasLoggedInBefore) return;

        const delay1 = 5000 + Math.random() * 3000; // 5-8s
        const delay2 = 15000 + Math.random() * 5000; // 15-20s

        const timer1 = setTimeout(() => {
            setVisibleAds(prev => [...prev, 0]);
        }, delay1);

        const timer2 = setTimeout(() => {
            setVisibleAds(prev => [...prev, 1]);
        }, delay2);

        sessionStorage.setItem('xp_adware_shown', 'true');

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
        };
    }, []);

    const dismissAd = (index) => {
        setVisibleAds(prev => prev.filter(i => i !== index));
    };

    if (visibleAds.length === 0) return null;

    return (
        <>
            {visibleAds.map((adIndex, i) => {
                const ad = ADS[adIndex];
                return (
                    <PopupContainer key={adIndex} $bottom={`${60 + i * 200}px`}>
                        <PopupWindow>
                            <PopupTitleBar>
                                <TitleText>{ad.title}</TitleText>
                                <CloseBtn onClick={() => dismissAd(adIndex)}>✕</CloseBtn>
                            </PopupTitleBar>
                            <PopupBody>
                                <PopupIcon>{ad.icon}</PopupIcon>
                                <PopupMessage>{ad.message}</PopupMessage>
                                <ActionBtn
                                    className={ad.primary ? 'primary' : ''}
                                    onClick={() => dismissAd(adIndex)}
                                >
                                    {ad.button}
                                </ActionBtn>
                                <IgnoreLink onClick={() => dismissAd(adIndex)}>忽略</IgnoreLink>
                            </PopupBody>
                        </PopupWindow>
                    </PopupContainer>
                );
            })}
        </>
    );
};

export default AdwarePopups;
