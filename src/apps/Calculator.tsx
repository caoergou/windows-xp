import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';

// Windows XP calc.exe standard view — 6-column layout (see calc.exe / Wikipedia reference)

const BTN_H = 23;
const GAP = 3;

const Wrap = styled.div`
  width: 100%;
  max-width: 100%;
  min-width: 0;
  height: auto;
  align-self: flex-start;
  background: #ece9d8;
  display: flex;
  flex-direction: column;
  padding: 4px;
  box-sizing: border-box;
  font-family: Tahoma, 'Microsoft YaHei', sans-serif;
  font-size: 11px;
  user-select: none;
  overflow: hidden;
`;

const Display = styled.div`
  background: #ffffff;
  border: 1px solid;
  border-color: #808080 #dfdfdf #dfdfdf #808080;
  box-shadow: inset 1px 1px 0 #404040;
  height: 24px;
  margin-bottom: ${GAP}px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 1px 4px 0;
  font-size: 14px;
  overflow: hidden;
  color: #000;
  letter-spacing: 0.5px;
  line-height: 1;
  flex-shrink: 0;
`;

const Row = styled.div<{ $cols?: number }>`
  display: grid;
  grid-template-columns: repeat(${p => p.$cols ?? 6}, minmax(0, 1fr));
  gap: ${GAP}px;
  width: 100%;
  min-width: 0;

  & + & {
    margin-top: ${GAP}px;
  }
`;

const MemIndicator = styled.div`
  height: ${BTN_H}px;
  border: 1px solid;
  border-color: #808080 #dfdfdf #dfdfdf #808080;
  box-shadow: inset 1px 1px 0 #404040;
  background: #ece9d8;
`;

const Key = styled.button<{
  $variant?: 'mem' | 'clear' | 'op' | 'fn';
  $span?: number;
  $disabled?: boolean;
}>`
  min-width: 0;
  height: ${BTN_H}px;
  padding: 0;
  margin: 0;
  cursor: ${p => (p.$disabled ? 'default' : 'pointer')};
  font-size: 11px;
  font-family: Tahoma, 'Microsoft YaHei', sans-serif;
  line-height: 1;
  outline: none;
  border: 1px solid;
  border-color: #ffffff #808080 #808080 #ffffff;
  background: #d4d0c8;
  grid-column: ${p => (p.$span ? `span ${p.$span}` : 'auto')};

  color: ${p => {
    if (p.$disabled) return '#808080';
    if (p.$variant === 'clear' || p.$variant === 'mem' || p.$variant === 'op') return '#cc0000';
    if (p.$variant === 'fn') return '#000080';
    return '#000000';
  }};

  &:active:not(:disabled) {
    border-color: #808080 #ffffff #ffffff #808080;
    background: #c0c0c0;
    box-shadow: inset 1px 1px 0 #808080;
    padding-top: 1px;
    padding-left: 1px;
  }

  &:disabled {
    background: #d4d0c8;
    text-shadow: 1px 1px 0 #ffffff;
  }
`;

const BackspaceIcon = () => (
  <svg width="13" height="9" viewBox="0 0 14 10" aria-hidden="true" style={{ display: 'block', margin: 'auto' }}>
    <path d="M13,1 L13,9 L4,9 L0,5 L4,1 Z" fill="none" stroke="currentColor" strokeWidth="1.2" />
    <path d="M5.5,3 L9.5,7 M9.5,3 L5.5,7" stroke="currentColor" strokeWidth="1.1" />
  </svg>
);

const MAX_DIGITS = 12;

interface CalculatorProps {
  windowId?: string;
}

const Calculator = ({ windowId: _windowId }: CalculatorProps) => {
  const [display, setDisplay] = useState<string>('0');
  const [operand, setOperand] = useState<number | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitNext, setWaitNext] = useState<boolean>(false);
  const [memory, setMemory] = useState<number>(0);
  const [hasMemory, setHasMemory] = useState<boolean>(false);

  const currentVal = useCallback(() => parseFloat(display), [display]);

  const inputDigit = useCallback(
    (d: number) => {
      setDisplay(prev => {
        if (waitNext) {
          setWaitNext(false);
          return String(d);
        }
        if (prev === '0') return String(d);
        if (prev.replace('-', '').replace('.', '').length >= MAX_DIGITS) return prev;
        return prev + d;
      });
    },
    [waitNext],
  );

  const inputDot = useCallback(() => {
    setDisplay(prev => {
      if (waitNext) {
        setWaitNext(false);
        return '0.';
      }
      if (prev.includes('.')) return prev;
      return `${prev}.`;
    });
  }, [waitNext]);

  const backspace = useCallback(() => {
    setDisplay(prev => {
      if (waitNext) return prev;
      if (prev.length <= 1 || prev === '-0') return '0';
      return prev.slice(0, -1) || '0';
    });
  }, [waitNext]);

  const clearAll = useCallback(() => {
    setDisplay('0');
    setOperand(null);
    setOperator(null);
    setWaitNext(false);
  }, []);

  const clearEntry = useCallback(() => {
    setDisplay('0');
    setWaitNext(false);
  }, []);

  const compute = useCallback((a: number, op: string, b: number) => {
    switch (op) {
      case '+':
        return a + b;
      case '-':
        return a - b;
      case '*':
        return a * b;
      case '/':
        return b === 0 ? 'Infinity' : a / b;
      default:
        return b;
    }
  }, []);

  const formatResult = (n: number | string): string => {
    if (n === 'Infinity' || !isFinite(Number(n))) return 'Infinity';
    const s = parseFloat(Number(n).toPrecision(10)).toString();
    return s.length > MAX_DIGITS ? parseFloat(Number(n).toPrecision(8)).toString() : s;
  };

  const pressOperator = useCallback(
    (op: string) => {
      const val = currentVal();
      if (operator && operand !== null && !waitNext) {
        const result = compute(operand, operator, val);
        const formatted = formatResult(result);
        setDisplay(formatted);
        setOperand(parseFloat(formatted));
      } else {
        setOperand(val);
      }
      setOperator(op);
      setWaitNext(true);
    },
    [currentVal, operand, operator, waitNext, compute],
  );

  const pressEquals = useCallback(() => {
    if (operator === null || operand === null) return;
    const val = currentVal();
    const result = compute(operand, operator, val);
    setDisplay(formatResult(result));
    setOperand(null);
    setOperator(null);
    setWaitNext(true);
  }, [currentVal, operand, operator, compute]);

  const toggleSign = useCallback(() => {
    setDisplay(prev => (prev.startsWith('-') ? prev.slice(1) : `-${prev}`));
  }, []);

  const sqrt = useCallback(() => {
    const val = currentVal();
    if (val < 0) return;
    setDisplay(formatResult(Math.sqrt(val)));
    setWaitNext(true);
  }, [currentVal]);

  const percent = useCallback(() => {
    setDisplay(formatResult(currentVal() / 100));
    setWaitNext(true);
  }, [currentVal]);

  const reciprocal = useCallback(() => {
    const val = currentVal();
    if (val === 0) {
      setDisplay('Infinity');
    } else {
      setDisplay(formatResult(1 / val));
    }
    setWaitNext(true);
  }, [currentVal]);

  const memClear = () => {
    setMemory(0);
    setHasMemory(false);
  };
  const memRecall = () => {
    setDisplay(formatResult(memory));
    setWaitNext(true);
  };
  const memStore = () => {
    setMemory(currentVal());
    setHasMemory(true);
  };
  const memAdd = () => {
    const m = memory + currentVal();
    setMemory(m);
    setHasMemory(m !== 0);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const k = e.key;
      if (k >= '0' && k <= '9') inputDigit(parseInt(k, 10));
      else if (k === '.') inputDot();
      else if (k === 'Backspace') backspace();
      else if (k === 'Delete') clearEntry();
      else if (k === 'Escape') clearAll();
      else if (k === '+') pressOperator('+');
      else if (k === '-') pressOperator('-');
      else if (k === '*') pressOperator('*');
      else if (k === '/') {
        e.preventDefault();
        pressOperator('/');
      } else if (k === 'Enter' || k === '=') pressEquals();
      else if (k === '%') percent();
      else if (k === '@') sqrt();
      else if (k === 'r' || k === 'R') reciprocal();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [inputDigit, inputDot, backspace, clearEntry, clearAll, pressOperator, pressEquals, percent, sqrt, reciprocal]);

  return (
    <Wrap>
      <Display title={display}>{display}</Display>

      <Row $cols={6}>
        <MemIndicator aria-hidden="true" />
        <Key $variant="clear" $span={2} onClick={backspace}>
          <BackspaceIcon />
        </Key>
        <Key $variant="clear" $span={2} onClick={clearEntry}>
          CE
        </Key>
        <Key $variant="clear" onClick={clearAll}>
          C
        </Key>
      </Row>

      <Row>
        <Key $variant="mem" $disabled={!hasMemory} disabled={!hasMemory} onClick={memClear}>
          MC
        </Key>
        <Key onClick={() => inputDigit(7)}>7</Key>
        <Key onClick={() => inputDigit(8)}>8</Key>
        <Key onClick={() => inputDigit(9)}>9</Key>
        <Key $variant="op" onClick={() => pressOperator('/')}>
          /
        </Key>
        <Key $variant="fn" onClick={sqrt}>
          sqrt
        </Key>
      </Row>

      <Row>
        <Key $variant="mem" $disabled={!hasMemory} disabled={!hasMemory} onClick={memRecall}>
          MR
        </Key>
        <Key onClick={() => inputDigit(4)}>4</Key>
        <Key onClick={() => inputDigit(5)}>5</Key>
        <Key onClick={() => inputDigit(6)}>6</Key>
        <Key $variant="op" onClick={() => pressOperator('*')}>
          *
        </Key>
        <Key $variant="fn" onClick={percent}>
          %
        </Key>
      </Row>

      <Row>
        <Key $variant="mem" onClick={memStore}>
          MS
        </Key>
        <Key onClick={() => inputDigit(1)}>1</Key>
        <Key onClick={() => inputDigit(2)}>2</Key>
        <Key onClick={() => inputDigit(3)}>3</Key>
        <Key $variant="op" onClick={() => pressOperator('-')}>
          -
        </Key>
        <Key $variant="fn" onClick={reciprocal}>
          1/x
        </Key>
      </Row>

      <Row>
        <Key $variant="mem" onClick={memAdd}>
          M+
        </Key>
        <Key onClick={() => inputDigit(0)}>0</Key>
        <Key $variant="fn" onClick={toggleSign}>
          +/-
        </Key>
        <Key onClick={inputDot}>.</Key>
        <Key $variant="op" onClick={() => pressOperator('+')}>
          +
        </Key>
        <Key $variant="op" onClick={pressEquals}>
          =
        </Key>
      </Row>
    </Wrap>
  );
};

export default Calculator;
