import { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import XPIcon from '../components/XPIcon';
import { XPButton } from '../components/XPButton';
import { COLORS } from '../constants';

const UI_FONT = "'Tahoma', 'SimSun', 'Microsoft YaHei', sans-serif";

const Container = styled.div`
  font-family: ${UI_FONT};
  font-size: 11px;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: ${COLORS.SURFACE};
`;

/* ---------- List (Network Connections folder) view ---------- */

const ListArea = styled.div`
  flex: 1;
  background: ${COLORS.BUTTON_HIGHLIGHT};
  overflow-y: auto;
  padding: 4px 0 0;
`;

const GroupHeading = styled.div`
  font-weight: bold;
  padding: 3px 10px 4px;
  border-bottom: 1px solid ${COLORS.DIVIDER_GREY};
  margin: 0 8px 6px;
`;

const ConnectionGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 0 8px 8px;
`;

const ConnectionItem = styled.div<{ $selected: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 6px;
  width: 100%;
  box-sizing: border-box;
  background: ${({ $selected }) => ($selected ? COLORS.MENU_HIGHLIGHT : 'transparent')};
  color: ${({ $selected }) => ($selected ? COLORS.BUTTON_HIGHLIGHT : 'inherit')};
  cursor: pointer;

  &:hover {
    background: ${({ $selected }) =>
      $selected ? COLORS.MENU_HIGHLIGHT : COLORS.BORDER_GREY_HILIGHT};
  }
`;

const ConnectionInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const ConnectionName = styled.div`
  font-weight: bold;
`;

const ConnectionStatus = styled.div`
  font-size: 11px;
`;

/* ---------- Status dialog ---------- */

const Dialog = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 10px 10px 8px;
  min-height: 0;
`;

const Tabs = styled.div`
  display: flex;
  padding: 0 0 0 2px;
`;

const Tab = styled.div<{ $active?: boolean }>`
  padding: 3px 12px;
  border: 1px solid ${COLORS.BORDER_GREY};
  border-bottom-color: ${({ $active }) => ($active ? COLORS.SURFACE : COLORS.BORDER_GREY)};
  background: ${({ $active }) => ($active ? COLORS.SURFACE : COLORS.BORDER_GREY_HILIGHT)};
  border-radius: 3px 3px 0 0;
  position: relative;
  z-index: ${({ $active }) => ($active ? 2 : 1)};
  margin-right: 2px;
  cursor: default;
`;

const TabPane = styled.div`
  margin-top: -1px;
  border: 1px solid ${COLORS.BORDER_GREY};
  background: ${COLORS.SURFACE};
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const GroupBox = styled.fieldset`
  border: 1px solid ${COLORS.DIVIDER_GREY};
  border-radius: 0;
  margin: 0;
  padding: 10px 12px 12px;
  min-width: 0;

  legend {
    padding: 0 4px;
    font-weight: normal;
    color: ${COLORS.WINDOW_FRAME};
  }
`;

const FieldRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 2px 0;
  gap: 12px;
`;

const FieldValue = styled.span`
  font-weight: bold;
`;

/* Activity: Sent — [computers] — Received */

const ActivityTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding: 2px 0 8px;
`;

const ActivityLabel = styled.div`
  min-width: 70px;
  text-align: center;
`;

const ActivityIcons = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  color: ${COLORS.BORDER_GREY};
  font-weight: bold;
`;

const Etched = styled.div`
  height: 0;
  border-top: 1px solid ${COLORS.DIVIDER_GREY};
  border-bottom: 1px solid ${COLORS.BUTTON_HIGHLIGHT};
  margin: 2px 0 6px;
`;

const DataRow = styled.div`
  display: grid;
  grid-template-columns: auto 1fr 1fr;
  align-items: baseline;
  padding: 1px 0;

  > span:nth-child(2),
  > span:nth-child(3) {
    text-align: center;
  }
`;

const RepairResult = styled.div`
  padding: 4px 0 0;
`;

const ButtonRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
`;

interface Connection {
  key: string;
  nameKey: string;
  statusKey: string;
  icon: string;
  typeKey: string;
  connected: boolean;
}

const formatDuration = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const formatNumber = (n: number): string => n.toLocaleString();

type StatusTab = 'general' | 'support';
type RepairState = 'idle' | 'repairing' | 'done';

const CONNECTIONS: Connection[] = [
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

const NetworkConnections = () => {
  const { t } = useTranslation();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(0);
  const [detailConnection, setDetailConnection] = useState<Connection | null>(null);
  const [activeTab, setActiveTab] = useState<StatusTab>('general');
  const [duration, setDuration] = useState<number>(0);
  const [sentBytes, setSentBytes] = useState<number>(0);
  const [receivedBytes, setReceivedBytes] = useState<number>(0);
  const [sentPackets, setSentPackets] = useState<number>(0);
  const [receivedPackets, setReceivedPackets] = useState<number>(0);
  const [repairState, setRepairState] = useState<RepairState>('idle');

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const repairTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (repairTimeoutRef.current) clearTimeout(repairTimeoutRef.current);
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
      setSentPackets(0);
      setReceivedPackets(0);

      intervalRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
        setSentBytes(prev => prev + Math.floor(Math.random() * 1024) + 128);
        setReceivedBytes(prev => prev + Math.floor(Math.random() * 2048) + 256);
        setSentPackets(prev => prev + Math.floor(Math.random() * 6) + 1);
        setReceivedPackets(prev => prev + Math.floor(Math.random() * 9) + 1);
      }, 1000);
    }
  }, [detailConnection]);

  const openStatus = (index: number) => {
    setActiveTab('general');
    setRepairState('idle');
    setDetailConnection(CONNECTIONS[index]);
  };

  const handleCloseDetail = () => {
    setDetailConnection(null);
  };

  const handleRepair = () => {
    if (repairState === 'repairing') return;
    setRepairState('repairing');
    if (repairTimeoutRef.current) clearTimeout(repairTimeoutRef.current);
    repairTimeoutRef.current = setTimeout(() => {
      setRepairState('done');
    }, 1000);
  };

  if (detailConnection) {
    return (
      <Container data-testid="netconn-status-dialog">
        <Dialog>
          <Tabs>
            <Tab
              data-testid="netconn-tab-general"
              $active={activeTab === 'general'}
              onClick={() => setActiveTab('general')}
            >
              {t('networkConnections.generalTab')}
            </Tab>
            <Tab
              data-testid="netconn-tab-support"
              $active={activeTab === 'support'}
              onClick={() => setActiveTab('support')}
            >
              {t('networkConnections.supportTab')}
            </Tab>
          </Tabs>

          {activeTab === 'general' ? (
            <TabPane>
              <GroupBox>
                <legend>{t('networkConnections.connectionGroup')}</legend>
                <FieldRow>
                  <span>{t('networkConnections.status')}:</span>
                  <FieldValue>{t(detailConnection.statusKey)}</FieldValue>
                </FieldRow>
                <FieldRow>
                  <span>{t('networkConnections.duration')}:</span>
                  <FieldValue data-testid="netconn-duration">{formatDuration(duration)}</FieldValue>
                </FieldRow>
                <FieldRow>
                  <span>{t('networkConnections.speed')}:</span>
                  <FieldValue>{t('networkConnections.speedValue')}</FieldValue>
                </FieldRow>
              </GroupBox>

              <GroupBox>
                <legend>{t('networkConnections.activityGroup')}</legend>
                <ActivityTop>
                  <ActivityLabel>{t('networkConnections.sent')}</ActivityLabel>
                  <ActivityIcons>
                    <XPIcon name="computer" size={22} />
                    <span>&raquo;&laquo;</span>
                    <XPIcon name="computer" size={22} />
                  </ActivityIcons>
                  <ActivityLabel>{t('networkConnections.received')}</ActivityLabel>
                </ActivityTop>
                <Etched />
                <DataRow>
                  <span>{t('networkConnections.packets')}:</span>
                  <span data-testid="netconn-sent">{formatNumber(sentPackets)}</span>
                  <span data-testid="netconn-received">{formatNumber(receivedPackets)}</span>
                </DataRow>
                <DataRow>
                  <span>{t('networkConnections.bytesLabel')}:</span>
                  <span>{formatNumber(sentBytes)}</span>
                  <span>{formatNumber(receivedBytes)}</span>
                </DataRow>
              </GroupBox>

              <ButtonRow>
                <XPButton disabled>{t('networkConnections.properties')}</XPButton>
                <XPButton disabled>{t('networkConnections.disable')}</XPButton>
                <XPButton onClick={handleCloseDetail}>{t('networkConnections.close')}</XPButton>
              </ButtonRow>
            </TabPane>
          ) : (
            <TabPane>
              <GroupBox>
                <legend>{t('networkConnections.connectionStatusGroup')}</legend>
                <FieldRow>
                  <span>{t('networkConnections.addressType')}:</span>
                  <FieldValue>{t('networkConnections.assignedByDhcp')}</FieldValue>
                </FieldRow>
                <FieldRow>
                  <span>{t('networkConnections.ipAddress')}:</span>
                  <FieldValue>192.168.1.101</FieldValue>
                </FieldRow>
                <FieldRow>
                  <span>{t('networkConnections.subnetMask')}:</span>
                  <FieldValue>255.255.255.0</FieldValue>
                </FieldRow>
                <FieldRow>
                  <span>{t('networkConnections.defaultGateway')}:</span>
                  <FieldValue>192.168.1.1</FieldValue>
                </FieldRow>
              </GroupBox>

              <ButtonRow>
                <XPButton disabled>{t('networkConnections.details')}</XPButton>
                <XPButton
                  data-testid="netconn-repair"
                  disabled={repairState === 'repairing'}
                  onClick={handleRepair}
                >
                  {repairState === 'repairing'
                    ? t('networkConnections.repairing')
                    : t('networkConnections.repair')}
                </XPButton>
              </ButtonRow>
              {repairState === 'done' && (
                <RepairResult>{t('networkConnections.repairSuccess')}</RepairResult>
              )}

              <ButtonRow>
                <XPButton onClick={handleCloseDetail}>{t('networkConnections.close')}</XPButton>
              </ButtonRow>
            </TabPane>
          )}
        </Dialog>
      </Container>
    );
  }

  return (
    <Container>
      <ListArea>
        <GroupHeading>{t('networkConnections.lanGroup')}</GroupHeading>
        <ConnectionGrid>
          {CONNECTIONS.map((conn, index) => (
            <ConnectionItem
              key={conn.key}
              data-testid={`netconn-item-${conn.key}`}
              $selected={selectedIndex === index}
              onClick={() => setSelectedIndex(index)}
              onDoubleClick={() => openStatus(index)}
            >
              <XPIcon name={conn.icon} size={32} />
              <ConnectionInfo>
                <ConnectionName>{t(conn.nameKey)}</ConnectionName>
                <ConnectionStatus>
                  {t(conn.statusKey)} - {t(conn.typeKey)}
                </ConnectionStatus>
              </ConnectionInfo>
            </ConnectionItem>
          ))}
        </ConnectionGrid>
      </ListArea>
    </Container>
  );
};

export default NetworkConnections;
