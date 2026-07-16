import React, { Component, ReactNode } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import XPIcon from './XPIcon';
import { FONTS } from '../constants';

const ErrorContainer = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f0f0f0;
  padding: 20px;
  font-family: ${FONTS.UI};
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
 * Application error boundary component.
 * Catches errors in child components to prevent the whole desktop from crashing.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    this.setState({ errorInfo });

    // Development-only error logging
    /* eslint-disable no-console -- intentional dev-only diagnostics */
    if (import.meta.env?.DEV) {
      const { windowId } = this.props;

      console.group(
        '%c🚨 ErrorBoundary: Application crashed',
        'color: #c00; font-size: 14px; font-weight: bold;'
      );

      if (windowId) {
        console.log(`%cWindow ID:`, 'color: #666; font-weight: bold;', windowId);
      }

      console.log('%cError object:', 'color: #0066cc; font-weight: bold;');
      console.dir(error);

      console.log('%cError stack:', 'color: #0066cc; font-weight: bold;');
      console.error(error);

      if (errorInfo?.componentStack) {
        console.log('%cComponent stack:', 'color: #0066cc; font-weight: bold;');
        console.log(errorInfo.componentStack);
      }

      console.groupEnd();
    }
    /* eslint-enable no-console */

    // Call custom error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // If a custom fallback is provided, use it
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Otherwise use the default error UI
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

// Default error fallback component
const ErrorBoundaryFallback: React.FC<{
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  onReset: () => void;
}> = ({ error, errorInfo, onReset: _onReset }) => {
  const { t } = useTranslation();

  return (
    <ErrorContainer>
      <ErrorIcon>
        <XPIcon name="dialog_error" size={48} />
      </ErrorIcon>
      <ErrorTitle>{t('errorBoundary.title', 'Application Error')}</ErrorTitle>
      <ErrorMessage>
        {t(
          'errorBoundary.message',
          'This application has encountered a problem and cannot continue.'
        )}
      </ErrorMessage>
      {error && (
        <ErrorDetails>
          <summary>{t('errorBoundary.details', 'View details')}</summary>
          <pre>
            {error.toString()}
            {errorInfo?.componentStack}
          </pre>
        </ErrorDetails>
      )}
    </ErrorContainer>
  );
};

// Hook version of the error boundary wrapper
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
): React.FC<P> {
  const WrappedComponent: React.FC<P> = props => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );
  return WrappedComponent;
}

export default ErrorBoundary;
