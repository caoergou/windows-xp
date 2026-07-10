// @ts-nocheck: temporary suppression of pre-existing type errors during incremental migration
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import XPIcon from './XPIcon';

const PopupContainer = styled.div`
  position: fixed;
  bottom: 33px;
  right: 8px;
  width: 242px;
  min-height: 50px;
  box-sizing: border-box;
  background: #ffffe1;
  border: 1px solid #7f9db9;
  border-radius: 2px;
  box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.25);
  padding: 7px 24px 7px 8px;
  z-index: 1000;
  font-family: "Tahoma", "SimSun", "Microsoft YaHei", sans-serif;
  font-size: 11px;
  display: flex;
  align-items: center;
  gap: 7px;
  transform: none;
  opacity: ${props => props.$visible ? '1' : '0'};
  visibility: ${props => props.$visible ? 'visible' : 'hidden'};
  transition: opacity 0.12s linear;

  &::after {
    content: '';
    position: absolute;
    right: 29px;
    bottom: -8px;
    width: 12px;
    height: 12px;
    background: #ffffe1;
    border-right: 1px solid #7f9db9;
    border-bottom: 1px solid #7f9db9;
    transform: rotate(45deg);
  }
`;

const Icon = styled.div`
  font-size: 24px;
`;

const Message = styled.div`
  flex: 1;
  line-height: 1.4;
`;

const Title = styled.div`
  font-weight: bold;
  margin-bottom: 2px;
  color: #003399;
`;

const Description = styled.div`
  font-size: 11px;
  color: #333;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 3px;
  right: 4px;
  width: 15px;
  height: 15px;
  padding: 0;
  background: transparent;
  border: 1px solid transparent;
  font-family: Tahoma, sans-serif;
  font-size: 12px;
  line-height: 12px;
  cursor: pointer;
  color: #404040;

  &:hover {
    background: #e5e5c5;
    border-color: #aca899;
  }
`;

const AntivirusPopup = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // 模拟延迟显示
    const timer = setTimeout(() => {
      setVisible(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setVisible(false);
  };

  return (
    <PopupContainer $visible={visible}>
      <Icon><XPIcon name="security_center" size={32} /></Icon>
      <Message>
        <Title>360安全卫士提醒</Title>
        <Description>您的电脑安全状态良好</Description>
      </Message>
      <CloseButton onClick={handleClose}>×</CloseButton>
    </PopupContainer>
  );
};

export default AntivirusPopup;
