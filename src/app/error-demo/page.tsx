'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorMessage, SimpleErrorMessage, PageError } from '@/components/ui/error-message';
import { ErrorBoundary, useErrorBoundary } from '@/components/ErrorBoundary';
import { useApiErrorHandler } from '@/hooks/use-error-handler';
import { ErrorSeverity, ErrorCategory } from '@/types/error';
import { normalizeError } from '@/lib/error-handling';

/**
 * 에러를 강제로 발생시키는 컴포넌트
 */
function ErrorTrigger() {
  const [shouldError, setShouldError] = React.useState(false);
  
  if (shouldError) {
    throw new Error('의도적으로 발생시킨 에러입니다!');
  }
  
  return (
    <Button onClick={() => setShouldError(true)} variant="destructive">
      React Error Boundary 테스트
    </Button>
  );
}

/**
 * API 에러 테스트 컴포넌트
 */
function ApiErrorTest() {
  const { handleError, currentError, clearError, createRetryHandler } = useApiErrorHandler();
  const [loading, setLoading] = React.useState(false);

  const testApiError = async (errorType: string) => {
    setLoading(true);
    clearError();
    
    try {
      const response = await fetch(`/api/test-error-handling?type=${errorType}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw { 
          status: response.status, 
          message: errorData.error?.message || 'API 요청 실패',
          details: errorData.error?.details 
        };
      }
      
      const data = await response.json();
      console.log('API 성공:', data);
    } catch (error) {
      handleError(error, { apiCall: 'test-error-handling', errorType });
    } finally {
      setLoading(false);
    }
  };

  const retryHandler = createRetryHandler(() => testApiError('server-error'));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Button 
          onClick={() => testApiError('bad-request')} 
          variant="outline" 
          size="sm"
          disabled={loading}
        >
          400 에러
        </Button>
        <Button 
          onClick={() => testApiError('unauthorized')} 
          variant="outline" 
          size="sm"
          disabled={loading}
        >
          401 에러
        </Button>
        <Button 
          onClick={() => testApiError('not-found')} 
          variant="outline" 
          size="sm"
          disabled={loading}
        >
          404 에러
        </Button>
        <Button 
          onClick={() => testApiError('server-error')} 
          variant="outline" 
          size="sm"
          disabled={loading}
        >
          500 에러
        </Button>
        <Button 
          onClick={() => testApiError('gov-api-invalid-key')} 
          variant="outline" 
          size="sm"
          disabled={loading}
        >
          정부API 키 에러
        </Button>
        <Button 
          onClick={() => testApiError('gov-api-no-data')} 
          variant="outline" 
          size="sm"
          disabled={loading}
        >
          데이터 없음
        </Button>
        <Button 
          onClick={() => testApiError('rate-limit')} 
          variant="outline" 
          size="sm"
          disabled={loading}
        >
          Rate Limit
        </Button>
        <Button 
          onClick={() => testApiError('success')} 
          variant="outline" 
          size="sm"
          disabled={loading}
        >
          성공 테스트
        </Button>
      </div>
      
      {currentError && (
        <ErrorMessage
          error={currentError}
          variant="card"
          dismissible
          showRetry={currentError.retryable}
          onDismiss={clearError}
          onRetry={retryHandler}
        />
      )}
      
      {loading && (
        <div className="text-center text-muted-foreground">
          API 요청 중...
        </div>
      )}
    </div>
  );
}

/**
 * 에러 메시지 컴포넌트 데모
 */
function ErrorMessageDemo() {
  const sampleErrors = [
    {
      title: 'Low Severity Error',
      error: normalizeError(new Error('낮은 심각도 에러'))
    },
    {
      title: 'Network Error',
      error: normalizeError(new TypeError('Failed to fetch'))
    },
    {
      title: 'Server Error',
      error: normalizeError({ status: 500, message: 'Internal Server Error' })
    }
  ];

  // Critical error 샘플 생성
  const criticalError = normalizeError({ status: 500, message: 'Critical system failure' });
  criticalError.severity = ErrorSeverity.CRITICAL;

  return (
    <div className="space-y-4">
      {sampleErrors.map((sample, index) => (
        <ErrorMessage
          key={index}
          error={sample.error}
          variant="card"
          showRetry={sample.error.retryable}
          onRetry={() => console.log(`Retrying ${sample.title}`)}
        />
      ))}
      
      <SimpleErrorMessage 
        message="간단한 검증 에러 메시지" 
        severity={ErrorSeverity.MEDIUM}
      />
      
      <PageError
        error={criticalError}
        onRetry={() => console.log('Page retry')}
        onGoHome={() => console.log('Go home')}
      />
    </div>
  );
}

/**
 * 에러 처리 데모 페이지
 */
export default function ErrorDemoPage() {
  const { captureError } = useErrorBoundary();

  const triggerManualError = () => {
    captureError(new Error('수동으로 트리거된 에러'));
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">에러 처리 시스템 데모</h1>
        <p className="text-muted-foreground">
          다양한 에러 시나리오와 처리 방법을 확인할 수 있습니다.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>React Error Boundary</CardTitle>
          <CardDescription>
            React 컴포넌트에서 발생하는 에러를 잡아서 사용자에게 친화적인 메시지로 표시합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ErrorBoundary>
            <ErrorTrigger />
          </ErrorBoundary>
          
          <Button onClick={triggerManualError} variant="outline">
            useErrorBoundary 훅 테스트
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API 에러 처리</CardTitle>
          <CardDescription>
            다양한 HTTP 상태 코드와 정부 API 에러를 시뮬레이션합니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ApiErrorTest />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>에러 메시지 컴포넌트</CardTitle>
          <CardDescription>
            다양한 심각도와 스타일의 에러 메시지를 표시합니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ErrorMessageDemo />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>네트워크 에러 시뮬레이션</CardTitle>
          <CardDescription>
            네트워크 연결 문제를 시뮬레이션합니다. (개발자 도구에서 오프라인 모드 활성화)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => fetch('/api/non-existent-endpoint')}
            variant="outline"
          >
            존재하지 않는 엔드포인트 호출
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}