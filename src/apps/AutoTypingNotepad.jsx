import { useEffect, useRef, useState } from "react";
import styled from "styled-components";

const TextArea = styled.textarea`
  width: 100%;
  height: 100%;
  border: none;
  resize: none;
  font-family: "Lucida Console", monospace;
  font-size: 14px;
  padding: 5px;
  outline: none;
  background-color: white;
  color: black;
`;

const AutoTypingNotepad = ({ content, typingSpeed = 50, onTypingComplete }) => {
  const [displayedContent, setDisplayedContent] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const textAreaRef = useRef(null);
  const currentIndexRef = useRef(0);

  useEffect(() => {
    if (!content || currentIndexRef.current >= content.length) {
      setIsTyping(false);
      if (onTypingComplete) {
        onTypingComplete(content);
      }
      return;
    }

    const timer = setTimeout(() => {
      currentIndexRef.current += 1;
      setDisplayedContent(content.substring(0, currentIndexRef.current));

      // Auto-scroll to bottom
      if (textAreaRef.current) {
        textAreaRef.current.scrollTop = textAreaRef.current.scrollHeight;
      }
    }, typingSpeed);

    return () => clearTimeout(timer);
  }, [displayedContent, content, typingSpeed, onTypingComplete]);

  return <TextArea ref={textAreaRef} value={displayedContent} readOnly />;
};

export default AutoTypingNotepad;
