import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const PopupContainer = styled.div`
  position: fixed;
  bottom: 35px;
  right: 10px;
  background: white;
  border: 1px solid #0055ea;
  border-radius: 3px;
  box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.3);
  padding: 10px;
  z-index: 1000;
  font-family: 'Tahoma', sans-serif;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  transform: translateY(${props => props.$visible ? '0' : '100%'});
  opacity: ${props => props.$visible ? '1' : '0'};
  transition: transform 0.3s ease, opacity 0.3s ease;
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
`;

const Description = styled.div`
  font-size: 11px;
  color: #666;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 14px;
  cursor: pointer;
  color: #666;

  &:hover {
    color: #000;
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
      <Icon>🛡️</Icon>
      <Message>
        <Title>360安全卫士提醒</Title>
        <Description>您的电脑安全状态良好</Description>
      </Message>
      <CloseButton onClick={handleClose}>×</CloseButton>
    </PopupContainer>
  );
};

export default AntivirusPopup;
