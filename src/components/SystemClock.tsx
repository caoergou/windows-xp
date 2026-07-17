import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { resolveOSTheme } from '../themes/useOSTheme';

const ClockContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  height: 100%;
  cursor: pointer;
  user-select: none;
  padding: 0 4px;
`;

const TimeLabel = styled.span`
  color: white;
  font-size: 12px;
`;

const CalendarPopup = styled.div`
  position: absolute;
  bottom: calc(100% + 4px);
  right: 0;
  width: 180px;
  background: ${({ theme }) => resolveOSTheme(theme).tokens.SURFACE};
  border: 1px solid ${({ theme }) => resolveOSTheme(theme).tokens.BUTTON_BORDER};
  box-shadow: 2px 2px 0 ${({ theme }) => resolveOSTheme(theme).tokens.BUTTON_SHADOW};
  padding: 6px;
  font-family: ${({ theme }) => resolveOSTheme(theme).fonts.UI};
  font-size: 11px;
  color: ${({ theme }) => resolveOSTheme(theme).tokens.BLACK};
  z-index: 30000;
`;

const CalendarHeader = styled.div`
  text-align: center;
  font-weight: bold;
  margin-bottom: 6px;
  padding-bottom: 4px;
  border-bottom: 1px solid ${({ theme }) => resolveOSTheme(theme).tokens.SURFACE};
`;

const WeekdayRow = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  font-weight: bold;
  color: ${({ theme }) => resolveOSTheme(theme).tokens.BUTTON_BORDER};
  margin-bottom: 2px;
`;

const DayGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  gap: 1px;
`;

const DayCell = styled.div<{ $today?: boolean }>`
  padding: 2px 0;
  ${props =>
    props.$today &&
    `
    background: ${resolveOSTheme(props.theme).tokens.MENU_HIGHLIGHT};
    color: white;
    border: 1px solid ${resolveOSTheme(props.theme).tokens.BUTTON_BORDER};
  `}
`;

const SystemClock = () => {
  const { t, i18n } = useTranslation();
  const [time, setTime] = useState<string>('');
  const [now, setNow] = useState<Date>(new Date());
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const update = () => {
      const current = new Date();
      const h = String(current.getHours()).padStart(2, '0');
      const m = String(current.getMinutes()).padStart(2, '0');
      setTime(`${h}:${m}`);
      setNow(current);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  const toggleOpen = useCallback(() => setOpen(prev => !prev), []);

  useEffect(() => {
    if (!open) return undefined;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [open]);

  const calendar = useMemo(() => {
    const year = now.getFullYear();
    const month = now.getMonth();
    const today = now.getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const weeks: (number | null)[][] = [];
    let week: (number | null)[] = Array(firstDay).fill(null);

    for (let day = 1; day <= daysInMonth; day++) {
      week.push(day);
      if (week.length === 7) {
        weeks.push(week);
        week = [];
      }
    }
    if (week.length > 0) {
      while (week.length < 7) week.push(null);
      weeks.push(week);
    }

    return { year, month, today, weeks };
  }, [now]);

  const monthNames = t('calendar.monthNames', { returnObjects: true }) as string[];
  const weekdays = t('calendar.weekdays', { returnObjects: true }) as string[];

  const monthLabel = monthNames[calendar.month]
    ? `${calendar.year} ${monthNames[calendar.month]}`
    : now.toLocaleString(i18n.language, { year: 'numeric', month: 'long' });

  return (
    <ClockContainer
      ref={containerRef}
      data-testid="system-clock"
      data-xp-anchor="taskbar.clock"
      onClick={toggleOpen}
    >
      <TimeLabel>{time}</TimeLabel>
      {open && (
        <CalendarPopup data-testid="calendar-popup">
          <CalendarHeader>{monthLabel}</CalendarHeader>
          <WeekdayRow>
            {weekdays.map((d, idx) => (
              <div key={idx}>{d}</div>
            ))}
          </WeekdayRow>
          <DayGrid>
            {calendar.weeks.flat().map((day, idx) => (
              <DayCell key={idx} $today={day === calendar.today}>
                {day ?? ''}
              </DayCell>
            ))}
          </DayGrid>
        </CalendarPopup>
      )}
    </ClockContainer>
  );
};

export default SystemClock;
