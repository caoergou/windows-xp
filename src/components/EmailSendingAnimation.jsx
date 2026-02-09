import React from 'react';
import styled, { keyframes } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';

const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

const progress = keyframes`
  0% {
    width: 0%;
  }
  100% {
    width: 100%;
  }
`;

const Overlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  animation: ${fadeIn} 0.2s ease-in;
`;

const Dialog = styled.div`
  background: linear-gradient(180deg, #fff 0%, #ece9d8 100%);
  border: 2px solid #0054e3;
  border-radius: 3px;
  padding: 20px;
  min-width: 300px;
  box-shadow: 4px 4px 8px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
`;

const Title = styled.div`
  font-family: 'Tahoma', 'SimSun', sans-serif;
  font-size: 12px;
  font-weight: bold;
  color: #0054e3;
`;

const Message = styled.div`
  font-family: 'Tahoma', 'SimSun', sans-serif;
  font-size: 11px;
  color: #333;
  text-align: center;
`;

const ProgressBarContainer = styled.div`
  width: 100%;
  height: 20px;
  background: #fff;
  border: 1px solid #808080;
  border-radius: 2px;
  overflow: hidden;
  position: relative;
`;

const ProgressBarFill = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #0054e3 0%, #3080ff 50%, #0054e3 100%);
  animation: ${progress} ${props => props.duration || 1000}ms ease-out forwards;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(90deg,
      transparent 0%,
      rgba(255, 255, 255, 0.3) 50%,
      transparent 100%
    );
    animation: shimmer 1s infinite;
  }

  @keyframes shimmer {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(100%);
    }
  }
`;

const IconContainer = styled.div`
  width: 48px;
  height: 48px;
  display: flex;
  justify-content: center;
  align-items: center;

  svg {
    width: 100%;
    height: 100%;
  }
`;

const EmailIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <motion.path
      d="M6 12L24 26L42 12"
      stroke="#0054e3"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
    />
    <motion.rect
      x="4"
      y="10"
      width="40"
      height="28"
      rx="2"
      stroke="#0054e3"
      strokeWidth="2"
      fill="none"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
    />
    <motion.path
      d="M4 14L24 26L44 14"
      stroke="#0054e3"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.3, ease: "easeInOut" }}
    />
  </svg>
);

export const EmailSendingAnimation = ({ show, message = "正在发送邮件...", duration = 1000 }) => {
  return (
    <AnimatePresence>
      {show && (
        <Overlay
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Dialog>
            <IconContainer>
              <EmailIcon />
            </IconContainer>
            <Title>发送邮件</Title>
            <Message>{message}</Message>
            <ProgressBarContainer>
              <ProgressBarFill duration={duration} />
            </ProgressBarContainer>
          </Dialog>
        </Overlay>
      )}
    </AnimatePresence>
  );
};

export const EmailReceivedAnimation = ({ show, fromName = "陈默", duration = 1000 }) => {
  return (
    <AnimatePresence>
      {show && (
        <Overlay
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Dialog>
            <IconContainer>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 260,
                  damping: 20,
                  delay: 0.2
                }}
              >
                <EmailIcon />
              </motion.div>
            </IconContainer>
            <Title>新邮件</Title>
            <Message>您收到了来自 {fromName} 的邮件</Message>
          </Dialog>
        </Overlay>
      )}
    </AnimatePresence>
  );
};
