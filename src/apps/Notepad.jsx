import React from 'react';
import styled from 'styled-components';

const TextArea = styled.textarea`
    width: 100%;
    height: 100%;
    border: none;
    resize: none;
    font-family: 'Lucida Console', monospace;
    font-size: 14px;
    padding: 5px;
    outline: none;
`;

const Notepad = ({ content }) => {
    return (
        <TextArea defaultValue={content} />
    );
};

export default Notepad;
