import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import XPIcon from './XPIcon';
import { useUserProgress } from '../context/UserProgressContext';
import puzzleHints from '../data/puzzle_hints.json';

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0);
  z-index: 99999;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const DialogWindow = styled.div`
  width: 400px;
  background-color: #ECE9D8;
  border: 1px solid #0055EA;
  border-radius: 3px;
  box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  font-family: 'Tahoma', sans-serif;
`;

const TitleBar = styled.div`
  height: 30px;
  background: linear-gradient(to right, #0058EE 0%, #3593FF 100%);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 5px;
  color: white;
  font-weight: bold;
  font-size: 13px;
  text-shadow: 1px 1px 1px black;
  border-radius: 2px 2px 0 0;
`;

const CloseButton = styled.button`
  width: 21px;
  height: 21px;
  background: linear-gradient(to bottom, #E79176, #DA5E42);
  border: 1px solid white;
  border-radius: 3px;
  color: white;
  font-weight: bold;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
  line-height: 1;

  &:hover {
    filter: brightness(1.1);
  }

  &:active {
    filter: brightness(0.9);
    box-shadow: inset 1px 1px 1px rgba(0,0,0,0.5);
  }
`;

const ContentArea = styled.div`
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const MessageRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 15px;
`;

const Message = styled.div`
  font-size: 12px;
  color: black;
  flex: 1;
  word-wrap: break-word;
`;

const HintText = styled.div`
  font-size: 11px;
  color: #666;
  margin-top: 5px;
  font-style: italic;
`;

const InputWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const PasswordInput = styled.input`
  width: 100%;
  height: 23px;
  padding: 2px 5px;
  border: 1px solid #7F9DB9;
  border-radius: 1px;
  font-family: 'Tahoma', sans-serif;
  font-size: 12px;
  box-shadow: inset 1px 1px 1px rgba(0,0,0,0.1);

  &:focus {
    outline: 1px solid #0055EA;
    outline-offset: -1px;
  }
`;

const ErrorText = styled.div`
  font-size: 11px;
  color: #D32F2F;
  min-height: 16px;
`;

const ButtonArea = styled.div`
  padding: 10px 20px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
`;

const Button = styled.button`
  min-width: 75px;
  height: 23px;
  background: #ECE9D8;
  border: 1px solid #003C74;
  border-radius: 2px;
  font-family: 'Tahoma', sans-serif;
  font-size: 12px;
  cursor: pointer;
  box-shadow: inset 1px 1px 0px white, 1px 1px 2px rgba(0,0,0,0.3);

  &:hover {
    box-shadow: inset 1px 1px 0px #F5F2E4, 1px 1px 2px rgba(0,0,0,0.3);
  }

  &:active {
    box-shadow: inset 1px 1px 1px rgba(0,0,0,0.2);
    padding-top: 1px;
    padding-left: 1px;
  }

  &:focus {
    outline: 1px dotted black;
    outline-offset: -4px;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const HintButton = styled(Button)`
  background: #FFF4CC;
  border-color: #FFB900;

  &:hover:not(:disabled) {
    background: #FFEB99;
  }
`;

const SkipButton = styled(Button)`
  background: #FFE0E0;
  border-color: #D32F2F;

  &:hover:not(:disabled) {
    background: #FFCCCC;
  }
`;

const HintBox = styled.div`
  background: #FFFEF0;
  border: 1px solid #FFB900;
  border-radius: 3px;
  padding: 12px;
  margin-top: 10px;
  font-size: 12px;
  line-height: 1.5;
`;

const HintTitle = styled.div`
  font-weight: bold;
  color: #D68000;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 5px;
`;

const HintContent = styled.div`
  color: #333;
`;

const AttemptCounter = styled.div`
  font-size: 11px;
  color: #999;
  text-align: right;
  margin-top: 5px;
`;

const PasswordDialog = ({
  title = "请输入密码",
  message = "此内容已加密，请输入密码访问",
  hint = "",
  correctPassword,
  onSuccess,
  onCancel,
  puzzleId = null, // 谜题ID，用于追踪尝试次数
  allowSkip = false // 是否允许跳过（辅助谜题）
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [currentHint, setCurrentHint] = useState(null);
  const inputRef = useRef(null);
  const { recordPuzzleAttempt, getPuzzleAttempts } = useUserProgress();

  const attempts = puzzleId ? getPuzzleAttempts(puzzleId) : 0;
  const puzzleConfig = puzzleId ? puzzleHints[puzzleId] : null;

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // 获取当前可用的提示
  const getAvailableHint = () => {
    if (!puzzleConfig) return null;

    // 找到最高可用的提示（尝试次数已达到阈值）
    const availableHints = puzzleConfig.hints.filter(h => attempts >= h.threshold);
    if (availableHints.length === 0) return null;

    return availableHints[availableHints.length - 1];
  };

  // 获取下一个提示的阈值
  const getNextHintThreshold = () => {
    if (!puzzleConfig) return null;

    const nextHint = puzzleConfig.hints.find(h => attempts < h.threshold);
    return nextHint ? nextHint.threshold : null;
  };

  const handleSubmit = () => {
    if (!password) {
      setError('请输入密码');
      return;
    }

    if (password === correctPassword) {
      onSuccess();
    } else {
      // 记录失败尝试
      if (puzzleId) {
        recordPuzzleAttempt(puzzleId);
      }

      setError('密码错误，请重试');
      setPassword('');
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  const handleShowHint = () => {
    const hint = getAvailableHint();
    if (hint) {
      setCurrentHint(hint);
    }
  };

  const handleSkip = () => {
    if (allowSkip && attempts >= 10) {
      onSuccess();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  const availableHint = getAvailableHint();
  const nextHintThreshold = getNextHintThreshold();
  const canSkip = allowSkip && attempts >= 10;

  return (
    <Overlay onClick={(e) => { if(e.target === e.currentTarget) { /* Do nothing */ } }}>
      <DialogWindow>
        <TitleBar>
          <span>{title}</span>
          <CloseButton onClick={onCancel}>×</CloseButton>
        </TitleBar>
        <ContentArea>
          <MessageRow>
            <XPIcon name="lock" size={32} />
            <div style={{ flex: 1 }}>
              <Message>{message}</Message>
              {hint && <HintText>{hint}</HintText>}
            </div>
          </MessageRow>
          <InputWrapper>
            <PasswordInput
              ref={inputRef}
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              onKeyDown={handleKeyDown}
              placeholder="输入密码..."
            />
            <ErrorText>{error}</ErrorText>
            {puzzleId && (
              <AttemptCounter>
                已尝试 {attempts} 次
                {nextHintThreshold && ` · 再尝试 ${nextHintThreshold - attempts} 次解锁提示`}
              </AttemptCounter>
            )}
          </InputWrapper>

          {/* 提示显示区域 */}
          {currentHint && (
            <HintBox>
              <HintTitle>
                💡 {currentHint.title}
              </HintTitle>
              <HintContent>{currentHint.content}</HintContent>
            </HintBox>
          )}
        </ContentArea>
        <ButtonArea>
          {/* 提示按钮 */}
          {puzzleId && (
            <HintButton
              onClick={handleShowHint}
              disabled={!availableHint}
              title={availableHint ? '查看提示' : nextHintThreshold ? `再尝试 ${nextHintThreshold - attempts} 次解锁提示` : '暂无提示'}
            >
              💡 提示
            </HintButton>
          )}

          {/* 跳过按钮（仅辅助谜题） */}
          {allowSkip && (
            <SkipButton
              onClick={handleSkip}
              disabled={!canSkip}
              title={canSkip ? '跳过此谜题' : '尝试10次后可跳过'}
            >
              跳过
            </SkipButton>
          )}

          <Button onClick={onCancel}>取消</Button>
          <Button onClick={handleSubmit}>确定</Button>
        </ButtonArea>
      </DialogWindow>
    </Overlay>
  );
};

export default PasswordDialog;
