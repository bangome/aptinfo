'use client';

import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { normalizeError, logError, gatherErrorContext } from '@/lib/error-handling';
import { ErrorSeverity } from '@/types/error';

interface ErrorBoundaryState {
  hasError: boolean;
  errorDetails: ReturnType<typeof normalizeError> | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorFallbackProps {
  error: Error;
  errorDetails: ReturnType<typeof normalizeError>;
  resetError: () => void;
}

/**
 * 기본 에러 폴백 컴포넌트
 */
function DefaultErrorFallback({ error, errorDetails, resetError }: ErrorFallbackProps) {
  const handleHomeRedirect = () => {
    window.location.href = '/';
  };

  const getSeverityColor = (severity: ErrorSeverity) => {
    switch (severity) {
      case ErrorSeverity.LOW:
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case ErrorSeverity.MEDIUM:
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case ErrorSeverity.HIGH:
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case ErrorSeverity.CRITICAL:
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <Card className={`w-full max-w-lg border-2 ${getSeverityColor(errorDetails.severity)}`}>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <AlertTriangle className="h-12 w-12 text-current" />
          </div>
          <CardTitle className="text-xl">
            {errorDetails.severity === ErrorSeverity.CRITICAL 
              ? '심각한 오류가 발생했습니다' 
              : '오류가 발생했습니다'
            }
          </CardTitle>
          <CardDescription className="text-base text-current">
            {errorDetails.userMessage}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* 에러 코드 (개발 환경에서만 표시) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
              <div><strong>코드:</strong> {errorDetails.code}</div>
              <div><strong>메시지:</strong> {errorDetails.message}</div>
              {errorDetails.details && (
                <div><strong>세부 정보:</strong> {JSON.stringify(errorDetails.details, null, 2)}</div>
              )}
            </div>
          )}
          
          {/* 액션 버튼들 */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {errorDetails.retryable && (
              <Button 
                onClick={resetError} 
                variant="default"
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                다시 시도
              </Button>
            )}
            
            <Button 
              onClick={handleHomeRedirect} 
              variant={errorDetails.retryable ? "outline" : "default"}
              className="flex items-center gap-2"
            >
              <Home className="h-4 w-4" />
              홈으로 가기
            </Button>
          </div>
          
          {/* 사용자 권고사항 */}
          <div className="text-sm text-center text-muted-foreground">
            {errorDetails.severity === ErrorSeverity.HIGH || errorDetails.severity === ErrorSeverity.CRITICAL
              ? '문제가 계속되면 고객센터에 문의해주세요.'
              : '잠시 후 다시 시도해주세요.'
            }
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * React Error Boundary 클래스 컴포넌트
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorDetails: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    const errorDetails = normalizeError(error);
    return {
      hasError: true,
      errorDetails
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const errorDetails = normalizeError(error);
    const context = {
      ...gatherErrorContext(),
      componentStack: errorInfo.componentStack,
      errorBoundary: true
    };
    
    // 에러 로깅
    logError(errorDetails, context);
    
    // 사용자 정의 에러 핸들러 호출
    this.props.onError?.(error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, errorDetails: null });
  };

  render() {
    if (this.state.hasError && this.state.errorDetails) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      
      return (
        <FallbackComponent
          error={new Error(this.state.errorDetails.message)}
          errorDetails={this.state.errorDetails}
          resetError={this.resetError}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * 에러 바운더리를 위한 훅
 */
export function useErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null);
  
  const resetError = React.useCallback(() => {
    setError(null);
  }, []);
  
  const captureError = React.useCallback((error: Error) => {
    setError(error);
  }, []);
  
  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);
  
  return { captureError, resetError };
}

/**
 * 에러 바운더리 HOC
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ComponentType<ErrorFallbackProps>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}