import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useUserProgress } from '../context/UserProgressContext';

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: fadeIn 0.5s ease-in;

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

const DialogBox = styled.div`
  background: #ECE9D8;
  border: 2px solid #0054E3;
  border-radius: 8px;
  box-shadow: 4px 4px 10px rgba(0, 0, 0, 0.5);
  width: 500px;
  max-width: 90%;
  animation: slideIn 0.5s ease-out;

  @keyframes slideIn {
    from {
      transform: translateY(-50px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
`;

const TitleBar = styled.div`
  background: linear-gradient(to bottom, #0997FF, #0053EE);
  color: white;
  padding: 4px 8px;
  font-weight: bold;
  font-size: 13px;
  display: flex;
  align-items: center;
  border-top-left-radius: 6px;
  border-top-right-radius: 6px;

  &::before {
    content: '';
    width: 16px;
    height: 16px;
    background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><rect fill="%23fff" x="2" y="2" width="12" height="12"/><rect fill="%230054E3" x="4" y="4" width="8" height="8"/></svg>');
    margin-right: 6px;
  }
`;

const Content = styled.div`
  padding: 20px;
  font-family: 'Microsoft YaHei', 'Tahoma', sans-serif;
`;

const Message = styled.div`
  font-size: 14px;
  line-height: 1.8;
  color: #000;
  margin-bottom: 20px;
  white-space: pre-wrap;
`;

const Highlight = styled.span`
  background-color: #FFEB3B;
  padding: 2px 4px;
  font-weight: bold;
  border-radius: 2px;
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
`;

const Button = styled.button`
  background: linear-gradient(to bottom, #FFFFFF, #ECE9D8);
  border: 1px solid #003C74;
  padding: 6px 20px;
  font-size: 13px;
  cursor: pointer;
  border-radius: 3px;
  box-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
  font-family: 'Microsoft YaHei', 'Tahoma', sans-serif;

  &:hover {
    background: linear-gradient(to bottom, #F0F0F0, #D8D5C8);
  }

  &:active {
    background: linear-gradient(to bottom, #D8D5C8, #C0BDB0);
    box-shadow: inset 1px 1px 2px rgba(0, 0, 0, 0.2);
  }

  &:focus {
    outline: 1px dotted #000;
    outline-offset: -4px;
  }
`;

const FirstLoginGuide = () => {
  const { progress, markStickyNoteRead } = useUserProgress();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 延迟1秒显示，让桌面先加载完成
    if (progress.firstLogin && !progress.stickyNoteRead) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [progress.firstLogin, progress.stickyNoteRead]);

  const handleClose = () => {
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <Overlay onClick={handleClose}>
      <DialogBox onClick={(e) => e.stopPropagation()}>
        <TitleBar>欢迎</TitleBar>
        <Content>
          <Message>
            你好，夏灯。

            这是父亲留给你的电脑。

            桌面右下角有一张<Highlight>便签</Highlight>，那是父亲留给你的最后一封信。

            点击便签，开始你的调查。

            密码是<Highlight>你的生日</Highlight>（格式：YYYYMMDD）。
          </Message>
          <ButtonContainer>
            <Button onClick={handleClose}>我知道了</Button>
          </ButtonContainer>
        </Content>
      </DialogBox>
    </Overlay>
  );
};

export default FirstLoginGuide;
