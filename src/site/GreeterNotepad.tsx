import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

/**
 * GreeterNotepad (#160, Act 1) — a Notepad-styled custom app the landing page
 * injects into the real engine via the `apps` prop. On mount it types its
 * message keystroke-by-keystroke, proving the desktop is a live, scriptable
 * stage (not a screenshot). Respects `prefers-reduced-motion` (renders the full
 * text instantly) and any pointer interaction cancels the remaining animation.
 */
const Root = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
  overflow: hidden;
`;

const MenuBar = styled.div`
  display: flex;
  gap: 2px;
  padding: 1px 2px;
  background: #ece9d8;
  border-bottom: 1px solid #aca899;
  font-family: Tahoma, sans-serif;
  font-size: 11px;
  flex-shrink: 0;
  span {
    padding: 2px 6px;
    cursor: default;
  }
  span:hover {
    background: #316ac5;
    color: #fff;
  }
`;

const Paper = styled.pre`
  flex: 1;
  margin: 0;
  padding: 6px 8px;
  overflow: auto;
  background: #fff;
  color: #000;
  font-family: 'Lucida Console', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
`;

const Caret = styled.span`
  display: inline-block;
  width: 7px;
  margin-left: 1px;
  border-bottom: 2px solid #000;
  animation: greeter-caret 1s steps(1) infinite;
  @keyframes greeter-caret {
    50% {
      opacity: 0;
    }
  }
`;

interface GreeterNotepadProps {
  body?: string;
  reduced?: boolean;
  windowId?: string;
}

const TYPE_MS = 42;

const GreeterNotepad: React.FC<GreeterNotepadProps> = ({ body = '', reduced = false }) => {
  const [count, setCount] = useState(reduced ? body.length : 0);
  const done = count >= body.length;
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (reduced) {
      setCount(body.length);
      return;
    }
    setCount(0);
    let i = 0;
    timer.current = setInterval(() => {
      i += 1;
      setCount(i);
      if (i >= body.length && timer.current) {
        clearInterval(timer.current);
        timer.current = null;
      }
    }, TYPE_MS);

    // Any interaction from the visitor skips to the end (they're in control).
    const finish = () => {
      if (timer.current) {
        clearInterval(timer.current);
        timer.current = null;
      }
      setCount(body.length);
    };
    window.addEventListener('pointerdown', finish, { once: true });

    return () => {
      if (timer.current) clearInterval(timer.current);
      window.removeEventListener('pointerdown', finish);
    };
  }, [body, reduced]);

  return (
    <Root data-testid="greeter-notepad">
      <MenuBar>
        <span>File</span>
        <span>Edit</span>
        <span>Format</span>
        <span>View</span>
        <span>Help</span>
      </MenuBar>
      <Paper>
        {body.slice(0, count)}
        {!done && !reduced && <Caret />}
      </Paper>
    </Root>
  );
};

export default GreeterNotepad;
