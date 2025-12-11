import React from 'react';
import styled from 'styled-components';
import XPIcon from '../XPIcon';

const Container = styled.div`
    display: flex;
    align-items: center;
    padding: 2px 5px 5px 5px;
    background: #ECE9D8;
    border-bottom: 1px solid #D0D0D0;
    gap: 5px;
    font-size: 11px;
`;

const Label = styled.span`
    color: #444;
`;

const InputWrapper = styled.div`
    flex: 1;
    display: flex;
    align-items: center;
    background: white;
    border: 1px solid #7F9DB9;
    height: 22px;
    padding: 0 2px;
`;

const IconWrapper = styled.div`
    padding: 0 2px;
`;

const Input = styled.input`
    flex: 1;
    border: none;
    outline: none;
    font-size: 11px;
    font-family: Tahoma, sans-serif;
`;

const GoButton = styled.div`
    display: flex;
    align-items: center;
    background: #ECE9D8;
    border: 1px solid #fff;
    border-right-color: #716F64;
    border-bottom-color: #716F64;
    padding: 2px 5px;
    cursor: pointer;
    gap: 3px;

    &:active {
        border: 1px solid #716F64;
        border-right-color: #fff;
        border-bottom-color: #fff;
        padding: 3px 4px 1px 6px; /* Shift content slightly */
    }
`;

const IEAddressBar = ({ value, onChange, onGo }) => {
    return (
        <Container>
            <Label>地址(D)</Label>
            <InputWrapper>
                <IconWrapper>
                    <XPIcon name="ie" size={16} />
                </IconWrapper>
                <Input
                    value={value}
                    onChange={onChange}
                    onKeyDown={(e) => e.key === 'Enter' && onGo()}
                />
                <XPIcon name="chevron_down" size={12} color="#000" />
            </InputWrapper>
            <GoButton onClick={onGo}>
                <XPIcon name="forward" size={16} color="#4CAF50" />
                <span>转到</span>
            </GoButton>
        </Container>
    );
};

export default IEAddressBar;
