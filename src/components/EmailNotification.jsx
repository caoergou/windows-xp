import React, { useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';

const NotificationContainer = styled(motion.div)`
  position: fixed;
  bottom: 40px;
  right: 20px;
  background: linear-gradient(180deg, #fff 0%, #ece9d8 100%);
  border: 2px solid #0054e3;
  border-radius: 2px;
  padding: 12px;
  min-width: 250px;
  max-width: 300px;
  box-shadow: 4px 4px 8px rgba(0, 0, 0, 0.3);
  cursor: pointer;
  z-index: 10000;

  display: flex;
  align-items: center;
  gap: 10px;
`;

const NotificationIcon = styled.div`
  width: 32px;
  height: 32px;
  background: url('/icons/email.png') no-repeat center;
  background-size: contain;
  flex-shrink: 0;
`;

const NotificationContent = styled.div`
  flex: 1;

  .title {
    font-weight: bold;
    font-size: 12px;
    margin-bottom: 4px;
    font-family: 'Tahoma', 'SimSun', sans-serif;
  }

  .message {
    font-size: 11px;
    color: #333;
    font-family: 'Tahoma', 'SimSun', sans-serif;
  }
`;

export const EmailNotification = ({ email, onClose, onClick }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000); // 5秒后自动关闭
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <AnimatePresence>
      <NotificationContainer
        initial={{ x: 400, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 400, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        onClick={onClick}
      >
        <NotificationIcon />
        <NotificationContent>
          <div className="title">新邮件</div>
          <div className="message">
            来自 {email.fromName}: {email.subject}
          </div>
        </NotificationContent>
      </NotificationContainer>
    </AnimatePresence>
  );
};
