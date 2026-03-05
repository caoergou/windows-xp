import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';

// ─── 样式 ─────────────────────────────────────────────────────────────────────

const Wrap = styled.div`
  width: 100%;
  height: 100%;
  background: #d4d0c8;
  display: flex;
  flex-direction: column;
  padding: 6px;
  box-sizing: border-box;
  font-family: 'Microsoft YaHei', Tahoma, sans-serif;
  font-size: 12px;
  user-select: none;
`;

const Display = styled.div`
  background: #ffffff;
  border: 2px inset #808080;
  height: 36px;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 6px;
  font-size: 22px;
  font-family: 'Courier New', monospace;
  overflow: hidden;
  color: #000;
  letter-spacing: 1px;
`;

const Row = styled.div<{ $hasTall?: boolean }>`
  display: flex;
  gap: 4px;
  margin-bottom: 4px;
  ${p => p.$hasTall ? 'min-height: 60px;' : ''}
`;

const ButtonGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
`;

const Buttons4Col = styled.div`
  display: flex;
  flex: 4;
  gap: 4px;
`;

const ButtonCol = styled.div`
  display: flex;
  flex: 1;
  gap: 4px;
`;

const Btn = styled.button<{
  $wide?: boolean;
  $op?: boolean;
  $mem?: boolean;
  $eq?: boolean;
  $red?: boolean;
  $blue?: boolean;
}>`
  flex: ${p => p.$wide ? 2 : 1};
  height: 28px;
  cursor: pointer;
  font-size: 12px;
  font-family: inherit;
  border: 1px solid;
  border-color: #ffffff #808080 #808080 #ffffff;
  outline: none;

  background: ${p =>
    p.$op    ? '#d4d0c8' :
    p.$mem   ? '#d4d0c8' :
    p.$eq    ? '#d4d0c8' :
    '#d4d0c8'
  };

  color: ${p =>
    p.$red   ? '#c00000' :
    p.$blue  ? '#000080' :
               '#000000'
  };

  &:active {
    border-color: #808080 #ffffff #ffffff #808080;
    padding-top: 1px;
    padding-left: 1px;
  }

  &:focus { outline: none; }
`;

// ─── 计算器逻辑 ───────────────────────────────────────────────────────────────

const MAX_DIGITS = 12;

interface CalculatorProps {
  windowId?: string;
}

const Calculator = ({ windowId }: CalculatorProps) => {
  const [display, setDisplay]     = useState<string>('0');
  const [operand, setOperand]     = useState<number | null>(null);   // 等待计算的第一个操作数
  const [operator, setOperator]   = useState<string | null>(null);   // 当前运算符
  const [waitNext, setWaitNext]   = useState<boolean>(false);  // 下次按数字是否新开
  const [memory, setMemory]       = useState<number>(0);
  const [hasMemory, setHasMemory] = useState<boolean>(false);

  const currentVal = () => parseFloat(display);

  // 输入数字
  const inputDigit = useCallback((d: number) => {
    setDisplay(prev => {
      if (waitNext) { setWaitNext(false); return String(d); }
      if (prev === '0') return String(d);
      if (prev.replace('-', '').replace('.', '').length >= MAX_DIGITS) return prev;
      return prev + d;
    });
  }, [waitNext]);

  // 小数点
  const inputDot = useCallback(() => {
    setDisplay(prev => {
      if (waitNext) { setWaitNext(false); return '0.'; }
      if (prev.includes('.')) return prev;
      return prev + '.';
    });
  }, [waitNext]);

  // 退格
  const backspace = useCallback(() => {
    setDisplay(prev => {
      if (waitNext) return prev;
      if (prev.length <= 1 || prev === '-0') return '0';
      return prev.slice(0, -1) || '0';
    });
  }, [waitNext]);

  // 全清
  const clearAll = useCallback(() => {
    setDisplay('0');
    setOperand(null);
    setOperator(null);
    setWaitNext(false);
  }, []);

  // 清当前入口（CE）
  const clearEntry = useCallback(() => {
    setDisplay('0');
    setWaitNext(false);
  }, []);

  // 执行运算
  const compute = useCallback((a: number, op: string, b: number) => {
    switch (op) {
      case '+': return a + b;
      case '-': return a - b;
      case '*': return a * b;
      case '/': return b === 0 ? 'Infinity' : a / b;
      default:  return b;
    }
  }, []);

  const formatResult = (n: number | string): string => {
    if (n === 'Infinity' || !isFinite(Number(n))) return 'Infinity';
    const s = parseFloat(Number(n).toPrecision(10)).toString();
    return s.length > MAX_DIGITS ? parseFloat(Number(n).toPrecision(8)).toString() : s;
  };

  // 按下运算符
  const pressOperator = useCallback((op: string) => {
    const val = currentVal();
    if (operator && !waitNext) {
      const result = compute(operand!, operator, val);
      const formatted = formatResult(result);
      setDisplay(formatted);
      setOperand(parseFloat(formatted));
    } else {
      setOperand(val);
    }
    setOperator(op);
    setWaitNext(true);
  }, [display, operand, operator, waitNext, compute]);

  // 等号
  const pressEquals = useCallback(() => {
    if (operator === null) return;
    const val = currentVal();
    const result = compute(operand!, operator, val);
    setDisplay(formatResult(result));
    setOperand(null);
    setOperator(null);
    setWaitNext(true);
  }, [display, operand, operator, compute]);

  // 正负切换
  const toggleSign = useCallback(() => {
    setDisplay(prev => prev.startsWith('-') ? prev.slice(1) : '-' + prev);
  }, []);

  // 百分比
  const percent = useCallback(() => {
    setDisplay(formatResult(currentVal() / 100));
  }, [display]);

  // 倒数
  const reciprocal = useCallback(() => {
    const v = currentVal();
    if (v === 0) { setDisplay('除数不能为零'); setWaitNext(true); return; }
    setDisplay(formatResult(1 / v));
    setWaitNext(true);
  }, [display]);

  // 平方根
  const sqrt = useCallback(() => {
    const v = currentVal();
    if (v < 0) { setDisplay('输入无效'); setWaitNext(true); return; }
    setDisplay(formatResult(Math.sqrt(v)));
    setWaitNext(true);
  }, [display]);

  // 内存操作
  const memClear = () => { setMemory(0); setHasMemory(false); };
  const memRecall = () => { setDisplay(formatResult(memory)); setWaitNext(true); };
  const memStore = () => { setMemory(currentVal()); setHasMemory(true); };
  const memAdd   = () => { const m = memory + currentVal(); setMemory(m); setHasMemory(m !== 0); };

  // 键盘支持
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const k = e.key;
      if (k >= '0' && k <= '9') inputDigit(parseInt(k));
      else if (k === '.') inputDot();
      else if (k === 'Backspace') backspace();
      else if (k === 'Delete') clearEntry();
      else if (k === 'Escape') clearAll();
      else if (k === '+') pressOperator('+');
      else if (k === '-') pressOperator('-');
      else if (k === '*') pressOperator('*');
      else if (k === '/') { e.preventDefault(); pressOperator('/'); }
      else if (k === 'Enter' || k === '=') pressEquals();
      else if (k === '%') percent();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [inputDigit, inputDot, backspace, clearEntry, clearAll, pressOperator, pressEquals, percent]);

  return (
    <Wrap>
      <Display title={display}>{display}</Display>

      {/* 内存行 */}
      <Row>
        <Btn $mem onClick={memClear}   title="清除内存">{hasMemory ? 'MC' : 'MC'}</Btn>
        <Btn $mem onClick={memRecall}  title="调用内存">MR</Btn>
        <Btn $mem onClick={memStore}   title="存入内存">MS</Btn>
        <Btn $mem onClick={memAdd}     title="加到内存">M+</Btn>
      </Row>

      {/* 数字行1 */}
      <Row>
        <Btn $red onClick={backspace}>←</Btn>
        <Btn $red onClick={clearEntry}>CE</Btn>
        <Btn $red onClick={clearAll}>C</Btn>
        <Btn $blue onClick={toggleSign}>±</Btn>
        <Btn $blue onClick={sqrt}>√</Btn>
      </Row>

      {/* 数字行2 */}
      <Row>
        <Btn onClick={() => inputDigit(7)}>7</Btn>
        <Btn onClick={() => inputDigit(8)}>8</Btn>
        <Btn onClick={() => inputDigit(9)}>9</Btn>
        <Btn $op $blue onClick={() => pressOperator('/')}>÷</Btn>
        <Btn $blue onClick={percent}>%</Btn>
      </Row>

      {/* 数字行3 */}
      <Row>
        <Btn onClick={() => inputDigit(4)}>4</Btn>
        <Btn onClick={() => inputDigit(5)}>5</Btn>
        <Btn onClick={() => inputDigit(6)}>6</Btn>
        <Btn $op $blue onClick={() => pressOperator('*')}>×</Btn>
        <Btn $blue onClick={reciprocal}>1/x</Btn>
      </Row>

      {/* 数字行4-5 - 等号按钮跨两行 */}
      <Row $hasTall>
        <ButtonGroup style={{ flex: 4 }}>
          <Row style={{ marginBottom: 0 }}>
            <Btn onClick={() => inputDigit(1)}>1</Btn>
            <Btn onClick={() => inputDigit(2)}>2</Btn>
            <Btn onClick={() => inputDigit(3)}>3</Btn>
            <Btn $op $blue onClick={() => pressOperator('-')}>−</Btn>
          </Row>
          <Row style={{ marginBottom: 0 }}>
            <Btn $wide onClick={() => inputDigit(0)}>0</Btn>
            <Btn onClick={inputDot}>.</Btn>
            <Btn $op $blue onClick={() => pressOperator('+')}>+</Btn>
          </Row>
        </ButtonGroup>
        <Btn $eq style={{ height: '60px', flex: 1 }} onClick={pressEquals}>=</Btn>
      </Row>
    </Wrap>
  );
};

export default Calculator;
