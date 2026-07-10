import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import XPIcon from '../components/XPIcon';

const Container = styled.div`
  padding: 16px;
  font-family: 'Tahoma', 'SimSun', 'Microsoft YaHei', sans-serif;
  font-size: 12px;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #ece9d8;
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

const ConnectionItem = styled.div<{ $selected: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  background: ${({ $selected }) =>
    $selected ? '#316ac5' : 'linear-gradient(to bottom, #ffffff, #ece9d8)'};
  color: ${({ $selected }) => ($selected ? '#ffffff' : 'inherit')};
  border: 1px solid ${({ $selected }) => ($selected ? '#316ac5' : '#7f9db9')};
  border-radius: 2px;
  cursor: pointer;

  &:hover {
    background: ${({ $selected }) =>
      $selected ? '#316ac5' : 'linear-gradient(to bottom, #f0f0f0, #dcd9c9)'};
  }
`;

const ConnectionIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
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
  color: inherit;
  opacity: 0.9;
`;

const DetailContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
`;

const DetailHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  background: linear-gradient(to bottom, #ffffff, #ece9d8);
  border: 1px solid #7f9db9;
  border-radius: 2px;
`;

const DetailTitle = styled.div`
  font-weight: bold;
  font-size: 13px;
  margin-bottom: 4px;
`;

const DetailSubtitle = styled.div`
  font-size: 11px;
  color: #666666;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
`;

const StatBox = styled.div`
  padding: 12px;
  background: #ffffff;
  border: 1px solid #7f9db9;
  border-radius: 2px;
`;

const StatLabel = styled.div`
  font-size: 11px;
  color: #666666;
  margin-bottom: 6px;
`;

const StatValue = styled.div`
  font-size: 14px;
  font-weight: bold;
  font-family: 'Tahoma', 'SimSun', 'Microsoft YaHei', monospace;
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
  key: string;
  nameKey: string;
  statusKey: string;
  icon: string;
  typeKey: string;
  connected: boolean;
}

interface NetworkConnectionsProps {
  onClose?: () => void;
}

const formatDuration = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const formatBytes = (bytes: number): string => {
  return bytes.toLocaleString();
};

const NetworkConnections = ({ onClose }: NetworkConnectionsProps) => {
  const { t } = useTranslation();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [detailConnection, setDetailConnection] = useState<Connection | null>(null);
  const [duration, setDuration] = useState<number>(0);
  const [sentBytes, setSentBytes] = useState<number>(0);
  const [receivedBytes, setReceivedBytes] = useState<number>(0);

  const connections: Connection[] = [
    {
      key: 'local',
      nameKey: 'networkConnections.localConnection',
      statusKey: 'networkConnections.connected',
      icon: 'network_connections',
      typeKey: 'networkConnections.local',
      connected: true,
    },
    {
      key: 'wireless',
      nameKey: 'networkConnections.wirelessConnection',
      statusKey: 'networkConnections.disconnected',
      icon: 'wireless_network',
      typeKey: 'networkConnections.wireless',
      connected: false,
    },
  ];

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (detailConnection?.connected) {
      setDuration(0);
      setSentBytes(0);
      setReceivedBytes(0);

      intervalRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
        setSentBytes(prev => prev + Math.floor(Math.random() * 1024) + 128);
        setReceivedBytes(prev => prev + Math.floor(Math.random() * 2048) + 256);
      }, 1000);
    }
  }, [detailConnection]);

  const handleItemClick = (index: number) => {
    setSelectedIndex(index);
  };

  const handleItemDoubleClick = (index: number) => {
    setDetailConnection(connections[index]);
  };

  const handleCloseDetail = () => {
    setDetailConnection(null);
  };

  if (detailConnection) {
    return (
      <Container>
        <Title>{t('networkConnections.statusTitle')}</Title>
        <DetailContainer>
          <DetailHeader>
            <ConnectionIcon>
              <XPIcon name={detailConnection.icon} size={32} />
            </ConnectionIcon>
            <ConnectionInfo>
              <DetailTitle>{t(detailConnection.nameKey)}</DetailTitle>
              <DetailSubtitle>
                {t('networkConnections.status')}: {t(detailConnection.statusKey)}
              </DetailSubtitle>
            </ConnectionInfo>
          </DetailHeader>
          <StatsGrid>
            <StatBox>
              <StatLabel>{t('networkConnections.duration')}</StatLabel>
              <StatValue>{formatDuration(duration)}</StatValue>
            </StatBox>
            <StatBox>
              <StatLabel>{t('networkConnections.status')}</StatLabel>
              <StatValue>{t(detailConnection.statusKey)}</StatValue>
            </StatBox>
            <StatBox>
              <StatLabel>{t('networkConnections.sent')}</StatLabel>
              <StatValue>
                {t('networkConnections.bytes', { value: formatBytes(sentBytes) })}
              </StatValue>
            </StatBox>
            <StatBox>
              <StatLabel>{t('networkConnections.received')}</StatLabel>
              <StatValue>
                {t('networkConnections.bytes', { value: formatBytes(receivedBytes) })}
              </StatValue>
            </StatBox>
          </StatsGrid>
        </DetailContainer>
        <ButtonContainer>
          <Button onClick={handleCloseDetail}>{t('networkConnections.close')}</Button>
        </ButtonContainer>
      </Container>
    );
  }

  return (
    <Container>
      <Title>{t('networkConnections.title')}</Title>
      <ConnectionList>
        {connections.map((conn, index) => (
          <ConnectionItem
            key={conn.key}
            $selected={selectedIndex === index}
            onClick={() => handleItemClick(index)}
            onDoubleClick={() => handleItemDoubleClick(index)}
          >
            <ConnectionIcon>
              <XPIcon name={conn.icon} size={32} />
            </ConnectionIcon>
            <ConnectionInfo>
              <ConnectionName>{t(conn.nameKey)}</ConnectionName>
              <ConnectionStatus>
                {t(conn.statusKey)} - {t(conn.typeKey)}
              </ConnectionStatus>
            </ConnectionInfo>
          </ConnectionItem>
        ))}
      </ConnectionList>
      <ButtonContainer>
        <Button onClick={onClose}>{t('networkConnections.close')}</Button>
      </ButtonContainer>
    </Container>
  );
};

export default NetworkConnections;
