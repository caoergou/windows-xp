import React, { useState, useEffect, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';
import { sounds } from '../utils/soundManager';

const slideIn = keyframes`
  from { transform: translateX(120%); opacity: 0; }
  to   { transform: translateX(0);    opacity: 1; }
`;

const PopupWrap = styled.div`
  position: fixed;
  bottom: 38px;
  right: 6px;
  width: 260px;
  background: #fff;
  border: 1px solid #aaa;
  box-shadow: 2px 2px 8px rgba(0,0,0,0.35);
  z-index: 2147483640;
  animation: ${slideIn} 0.3s ease-out;
  font-family: 'Microsoft YaHei', '微软雅黑', Tahoma, sans-serif;
`;

const Header = styled.div`
  background: linear-gradient(to bottom, #2e8b00 0%, #1e6400 100%);
  color: white;
  padding: 5px 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  font-weight: bold;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
`;

const ShieldIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M8 1L2 3.5V8c0 3.3 2.4 5.8 6 7 3.6-1.2 6-3.7 6-7V3.5L8 1z"
      fill="#00cc44" stroke="#fff" strokeWidth="0.8"/>
    <path d="M5.5 8l1.8 1.8 3.2-3.6" stroke="white" strokeWidth="1.5"
      strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CloseBtn = styled.button`
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  padding: 0 2px;
  opacity: 0.8;
  &:hover { opacity: 1; }
`;

const Body = styled.div`
  padding: 8px 10px;
`;

const StatusRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
  font-size: 11px;
  color: ${p => p.$warn ? '#cc4400' : '#333'};
`;

const StatusDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${p => p.$color || '#00cc44'};
  flex-shrink: 0;
`;

const ProgressBar = styled.div`
  height: 4px;
  background: #e8e8e8;
  border-radius: 2px;
  margin: 4px 0 8px;
  overflow: hidden;

  &::after {
    content: '';
    display: block;
    height: 100%;
    width: ${p => p.$pct || 100}%;
    background: linear-gradient(to right, #00aa33, #00dd55);
    border-radius: 2px;
  }
`;

const Message = styled.div`
  background: ${p => p.$warn ? '#fff8e8' : '#f0fff0'};
  border: 1px solid ${p => p.$warn ? '#ffcc66' : '#99dd99'};
  border-radius: 2px;
  padding: 5px 8px;
  font-size: 11px;
  color: #333;
  margin-bottom: 8px;
  line-height: 1.5;
`;

const ButtonRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 6px;
`;

const ActionBtn = styled.button`
  padding: 3px 12px;
  font-size: 11px;
  border-radius: 2px;
  cursor: pointer;
  border: 1px solid;

  background: ${p => p.$primary ? '#2e8b00' : '#f0f0f0'};
  color: ${p => p.$primary ? 'white' : '#333'};
  border-color: ${p => p.$primary ? '#1e6400' : '#aaa'};

  &:hover {
    filter: brightness(1.08);
  }
  &:active {
    filter: brightness(0.9);
  }
`;

// Pool of realistic 360-style messages
const MESSAGES = [
  {
    warn: true,
    title: '安全提示',
    body: msg => `您的电脑已 ${msg.days} 天未进行全盘扫描，存在安全风险，建议立即扫描。`,
    action: '立即扫描',
    dismiss: '稍后提醒',
    vars: () => ({ days: Math.floor(Math.random() * 14) + 3 }),
  },
  {
    warn: false,
    title: '实时拦截',
    body: msg => `360已为您拦截 ${msg.count.toLocaleString()} 次病毒/木马攻击，电脑安全有保障。`,
    action: '查看详情',
    dismiss: '关闭',
    vars: () => ({ count: Math.floor(Math.random() * 5000) + 800 }),
  },
  {
    warn: true,
    title: '垃圾清理',
    body: msg => `检测到系统垃圾文件占用 ${msg.mb} MB，清理后可释放磁盘空间并提升电脑速度。`,
    action: '一键清理',
    dismiss: '忽略',
    vars: () => ({ mb: Math.floor(Math.random() * 500) + 80 }),
  },
  {
    warn: true,
    title: '插件提醒',
    body: msg => `发现 ${msg.n} 个可疑广告插件，可能导致浏览器弹出广告，建议清理。`,
    action: '立即清理',
    dismiss: '不再提示',
    vars: () => ({ n: Math.floor(Math.random() * 6) + 1 }),
  },
  {
    warn: false,
    title: '安全报告',
    body: () => '360防火墙已开启，正在实时监控网络连接，您的上网环境安全。',
    action: '查看报告',
    dismiss: '关闭',
    vars: () => ({}),
  },
  {
    warn: true,
    title: '系统修复',
    body: msg => `检测到 ${msg.n} 个系统漏洞尚未修复，可能被黑客利用，建议立即修复。`,
    action: '立即修复',
    dismiss: '稍后',
    vars: () => ({ n: Math.floor(Math.random() * 8) + 2 }),
  },
];

// Show first popup after 45s, then every 90–150s
const FIRST_DELAY = 45_000;
const MIN_INTERVAL = 90_000;
const MAX_INTERVAL = 150_000;

const AntivirusPopup = () => {
  const [popup, setPopup] = useState(null);
  const [msgIdx, setMsgIdx] = useState(0);

  const dismiss = useCallback(() => setPopup(null), []);

  const show = useCallback(() => {
    const template = MESSAGES[msgIdx % MESSAGES.length];
    const vars = template.vars();
    setPopup({ template, vars });
    setMsgIdx(i => i + 1);
    sounds.notify();
  }, [msgIdx]);

  useEffect(() => {
    let timer = setTimeout(() => {
      show();

      const schedule = () => {
        const delay = MIN_INTERVAL + Math.random() * (MAX_INTERVAL - MIN_INTERVAL);
        timer = setTimeout(() => {
          show();
          schedule();
        }, delay);
      };
      schedule();
    }, FIRST_DELAY);

    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!popup) return null;

  const { template, vars } = popup;

  return (
    <PopupWrap>
      <Header>
        <HeaderLeft>
          <ShieldIcon />
          360安全卫士 — {template.title}
        </HeaderLeft>
        <CloseBtn onClick={dismiss}>✕</CloseBtn>
      </Header>
      <Body>
        <StatusRow>
          <StatusDot $color="#00cc44" />
          实时防护已开启
        </StatusRow>
        <ProgressBar $pct={100} />

        <StatusRow $warn={template.warn}>
          <StatusDot $color={template.warn ? '#ff8800' : '#0077cc'} />
          {template.warn ? '⚠ 安全警告' : 'ℹ 安全通知'}
        </StatusRow>

        <Message $warn={template.warn}>
          {template.body(vars)}
        </Message>

        <ButtonRow>
          <ActionBtn onClick={dismiss}>{template.dismiss}</ActionBtn>
          <ActionBtn $primary onClick={dismiss}>{template.action}</ActionBtn>
        </ButtonRow>
      </Body>
    </PopupWrap>
  );
};

export default AntivirusPopup;
