import React, { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';

const ClockContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  height: 100%;
  cursor: default;
  user-select: none;
`;

const TimeLabel = styled.span`
  color: white;
  font-size: 12px;
`;

const CalendarTooltip = styled.div`
  position: absolute;
  bottom: calc(100% + 4px);
  right: 0;
  width: 180px;
  background: #fffef0;
  border: 1px solid #003c74;
  box-shadow: 2px -2px 5px rgba(0, 0, 0, 0.3);
  padding: 6px;
  font-family: Tahoma, Arial, sans-serif;
  font-size: 11px;
  color: #000;
  z-index: 30000;
  display: none;

  ${ClockContainer}:hover &, ${ClockContainer}:active &, ${ClockContainer}:focus-within & {
    display: block;
  }
`;

const CalendarHeader = styled.div`
  text-align: center;
  font-weight: bold;
  margin-bottom: 6px;
  padding-bottom: 4px;
  border-bottom: 1px solid #d4d0c8;
`;

const WeekdayRow = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  font-weight: bold;
  color: #003c74;
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
    background: #316ac5;
    color: white;
    border: 1px solid #003c74;
  `}
`;

const SystemClock = () => {
  const [time, setTime] = useState<string>('');
  const [now, setNow] = useState<Date>(new Date());

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

  const monthLabel = now.toLocaleString(undefined, { year: 'numeric', month: 'long' });
  const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return (
    <ClockContainer data-testid="system-clock">
      <TimeLabel>{time}</TimeLabel>
      <CalendarTooltip data-testid="calendar-tooltip">
        <CalendarHeader>{monthLabel}</CalendarHeader>
        <WeekdayRow>
          {weekdays.map(d => (
            <div key={d}>{d}</div>
          ))}
        </WeekdayRow>
        <DayGrid>
          {calendar.weeks.flat().map((day, idx) => (
            <DayCell key={idx} $today={day === calendar.today}>
              {day ?? ''}
            </DayCell>
          ))}
        </DayGrid>
      </CalendarTooltip>
    </ClockContainer>
  );
};

export default SystemClock;
