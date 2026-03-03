import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
  padding: 16px;
  font-family: Tahoma, Arial, sans-serif;
  font-size: 12px;
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const Title = styled.h3`
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: bold;
`;

const ConnectionList = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
`;

const ConnectionItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  background: linear-gradient(to bottom, #ffffff, #ece9d8);
  border: 1px solid #7f9db9;
  border-radius: 2px;
  cursor: pointer;

  &:hover {
    background: linear-gradient(to bottom, #f0f0f0, #dcd9c9);
  }
`;

const ConnectionIcon = styled.div`
  font-size: 24px;
`;

const ConnectionInfo = styled.div`
  flex: 1;
`;

const ConnectionName = styled.div`
  font-weight: bold;
  margin-bottom: 4px;
`;

const ConnectionStatus = styled.div`
  font-size: 11px;
  color: #666666;
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
`;

const Button = styled.button`
  padding: 4px 12px;
  font-size: 12px;
  background: linear-gradient(to bottom, #ffffff, #ece9d8);
  border: 1px solid #7f9db9;
  border-radius: 2px;
  cursor: pointer;

  &:hover {
    background: linear-gradient(to bottom, #f0f0f0, #dcd9c9);
  }

  &:active {
    background: linear-gradient(to bottom, #ece9d8, #ffffff);
  }
`;

interface Connection {
  name: string;
  status: string;
  icon: string;
  type: string;
}

interface NetworkConnectionsProps {
  onClose?: () => void;
}

const NetworkConnections = ({ onClose }: NetworkConnectionsProps) => {
  const connections: Connection[] = [
    {
      name: '本地连接',
      status: '已连接',
      icon: '🖧',
      type: '本地',
    },
    {
      name: '无线网络连接',
      status: '未连接',
      icon: '📶',
      type: '无线',
    },
  ];

  return (
    <Container>
      <Title>网络连接</Title>
      <ConnectionList>
        {connections.map((conn, index) => (
          <ConnectionItem key={index}>
            <ConnectionIcon>{conn.icon}</ConnectionIcon>
            <ConnectionInfo>
              <ConnectionName>{conn.name}</ConnectionName>
              <ConnectionStatus>{conn.status} - {conn.type}</ConnectionStatus>
            </ConnectionInfo>
          </ConnectionItem>
        ))}
      </ConnectionList>
      <ButtonContainer>
        <Button onClick={onClose}>关闭</Button>
      </ButtonContainer>
    </Container>
  );
};

export default NetworkConnections;
