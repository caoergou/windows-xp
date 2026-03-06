import React, { Component, ReactNode } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';

const ErrorContainer = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f0f0f0;
  padding: 20px;
  font-family: Tahoma, sans-serif;
`;

const ErrorIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
`;

const ErrorTitle = styled.h2`
  color: #c00;
  margin: 0 0 8px 0;
  font-size: 14px;
`;

const ErrorMessage = styled.p`
  color: #333;
  margin: 4px 0;
  font-size: 11px;
  text-align: center;
  max-width: 300px;
`;

const ErrorDetails = styled.details`
  margin-top: 12px;
  font-size: 11px;

  summary {
    cursor: pointer;
    color: #00f;
    text-decoration: underline;
  }

  pre {
    background: #fff;
    border: 1px solid #ccc;
    padding: 8px;
    margin-top: 8px;
    overflow: auto;
    max-height: 150px;
    font-size: 10px;
  }
`;

interface ErrorBoundaryProps {
  children: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  fallback?: ReactNode;
  windowId?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * 应用错误边界组件
 * 捕获子组件中的错误，防止整个桌面崩溃
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    this.setState({ errorInfo });

    // 详细的控制台输出，方便开发调试
    const { windowId } = this.props;

    console.group('%c🚨 ErrorBoundary: 应用程序崩溃', 'color: #c00; font-size: 14px; font-weight: bold;');

    if (windowId) {
      console.log(`%c窗口 ID:`, 'color: #666; font-weight: bold;', windowId);
    }

    console.log('%c错误对象:', 'color: #0066cc; font-weight: bold;');
    console.dir(error);

    console.log('%c错误堆栈:', 'color: #0066cc; font-weight: bold;');
    console.error(error);

    if (errorInfo?.componentStack) {
      console.log('%c组件堆栈:', 'color: #0066cc; font-weight: bold;');
      console.log(errorInfo.componentStack);
    }

    console.groupEnd();

    // 调用自定义错误处理
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // 如果提供了自定义 fallback，使用它
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 否则使用默认错误界面
      return (
        <ErrorBoundaryFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onReset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

// 默认错误回退组件
const ErrorBoundaryFallback: React.FC<{
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  onReset: () => void;
}> = ({ error, errorInfo, onReset }) => {
  const { t } = useTranslation();

  return (
    <ErrorContainer>
      <ErrorIcon>⚠️</ErrorIcon>
      <ErrorTitle>{t('errorBoundary.title', '应用程序出错')}</ErrorTitle>
      <ErrorMessage>
        {t('errorBoundary.message', '此应用遇到了问题，无法继续运行。')}
      </ErrorMessage>
      {error && (
        <ErrorDetails>
          <summary>{t('errorBoundary.details', '查看详细信息')}</summary>
          <pre>
            {error.toString()}
            {errorInfo?.componentStack}
          </pre>
        </ErrorDetails>
      )}
    </ErrorContainer>
  );
};

// Hook 版本的错误边界包装器
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
): React.FC<P> {
  const WrappedComponent: React.FC<P> = (props) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );
  return WrappedComponent;
}

export default ErrorBoundary;