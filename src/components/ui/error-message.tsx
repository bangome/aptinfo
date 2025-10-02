'use client';

import React from 'react';
import { AlertTriangle, AlertCircle, Info, RefreshCw, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ErrorSeverity, ErrorDetails } from '@/types/error';

interface ErrorMessageProps {
  /** 에러 상세 정보 */
  error: ErrorDetails;
  /** 크기 */
  size?: 'sm' | 'md' | 'lg';
  /** 스타일 변형 */
  variant?: 'card' | 'inline' | 'banner';
  /** 닫기 버튼 표시 여부 */
  dismissible?: boolean;
  /** 재시도 버튼 표시 여부 */
  showRetry?: boolean;
  /** 에러 세부사항 표시 여부 (개발 환경) */
  showDetails?: boolean;
  /** 클래스명 */
  className?: string;
  /** 닫기 핸들러 */
  onDismiss?: () => void;
  /** 재시도 핸들러 */
  onRetry?: () => void;
}

/**
 * 에러 메시지 컴포넌트
 */
export function ErrorMessage({
  error,
  size = 'md',
  variant = 'card',
  dismissible = false,
  showRetry = false,
  showDetails = process.env.NODE_ENV === 'development',
  className,
  onDismiss,
  onRetry
}: ErrorMessageProps) {
  const getSeverityIcon = (severity: ErrorSeverity) => {
    switch (severity) {
      case ErrorSeverity.LOW:
        return <Info className="h-4 w-4" />;
      case ErrorSeverity.MEDIUM:
        return <AlertCircle className="h-4 w-4" />;
      case ErrorSeverity.HIGH:
      case ErrorSeverity.CRITICAL:
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getSeverityStyles = (severity: ErrorSeverity) => {
    switch (severity) {
      case ErrorSeverity.LOW:
        return 'text-blue-700 bg-blue-50 border-blue-200';
      case ErrorSeverity.MEDIUM:
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case ErrorSeverity.HIGH:
        return 'text-orange-700 bg-orange-50 border-orange-200';
      case ErrorSeverity.CRITICAL:
        return 'text-red-700 bg-red-50 border-red-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const sizeStyles = {
    sm: 'text-sm p-2',
    md: 'text-base p-4',
    lg: 'text-lg p-6'
  };

  const baseClasses = cn(
    'border rounded-lg',
    getSeverityStyles(error.severity),
    sizeStyles[size],
    className
  );

  const content = (
    <>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {getSeverityIcon(error.severity)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="font-medium">
            {error.userMessage}
          </div>
          
          {showDetails && (
            <details className="mt-2">
              <summary className="cursor-pointer text-sm opacity-75 hover:opacity-100">
                기술적 세부사항
              </summary>
              <div className="mt-2 p-3 bg-black/5 rounded text-xs font-mono">
                <div><strong>코드:</strong> {error.code}</div>
                <div><strong>메시지:</strong> {error.message}</div>
                <div><strong>시간:</strong> {error.timestamp.toLocaleString()}</div>
                {error.details && (
                  <div>
                    <strong>세부정보:</strong>
                    <pre className="mt-1 whitespace-pre-wrap">
                      {JSON.stringify(error.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </details>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {showRetry && error.retryable && onRetry && (
            <Button
              size="sm"
              variant="outline"
              onClick={onRetry}
              className="h-8 px-3"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              재시도
            </Button>
          )}
          
          {dismissible && onDismiss && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onDismiss}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </>
  );

  if (variant === 'card') {
    return (
      <Card className={baseClasses}>
        <CardContent className="p-0">
          {content}
        </CardContent>
      </Card>
    );
  }

  if (variant === 'banner') {
    return (
      <div className={cn(baseClasses, 'rounded-none border-x-0')}>
        {content}
      </div>
    );
  }

  // inline variant
  return (
    <div className={baseClasses}>
      {content}
    </div>
  );
}

/**
 * 간단한 인라인 에러 메시지
 */
interface SimpleErrorMessageProps {
  message: string;
  severity?: ErrorSeverity;
  className?: string;
}

export function SimpleErrorMessage({ 
  message, 
  severity = ErrorSeverity.MEDIUM, 
  className 
}: SimpleErrorMessageProps) {
  const error: ErrorDetails = {
    category: 'UNKNOWN' as any,
    severity,
    code: 'SIMPLE_ERROR',
    message,
    userMessage: message,
    timestamp: new Date(),
    retryable: false
  };

  return (
    <ErrorMessage
      error={error}
      variant="inline"
      size="sm"
      showDetails={false}
      className={className}
    />
  );
}

/**
 * 페이지 레벨 에러 컴포넌트
 */
interface PageErrorProps {
  error: ErrorDetails;
  onRetry?: () => void;
  onGoHome?: () => void;
}

export function PageError({ error, onRetry, onGoHome }: PageErrorProps) {
  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="mb-6">
          {getSeverityIcon(error.severity)}
        </div>
        
        <h2 className="text-2xl font-bold mb-4">
          {error.severity === ErrorSeverity.CRITICAL 
            ? '심각한 오류가 발생했습니다' 
            : '오류가 발생했습니다'
          }
        </h2>
        
        <p className="text-muted-foreground mb-6">
          {error.userMessage}
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {error.retryable && onRetry && (
            <Button onClick={onRetry} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              다시 시도
            </Button>
          )}
          
          {onGoHome && (
            <Button 
              variant={error.retryable ? "outline" : "default"}
              onClick={onGoHome}
            >
              홈으로 가기
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function getSeverityIcon(severity: ErrorSeverity) {
  const iconClass = "h-12 w-12 mx-auto";
  
  switch (severity) {
    case ErrorSeverity.LOW:
      return <Info className={cn(iconClass, "text-blue-600")} />;
    case ErrorSeverity.MEDIUM:
      return <AlertCircle className={cn(iconClass, "text-yellow-600")} />;
    case ErrorSeverity.HIGH:
      return <AlertTriangle className={cn(iconClass, "text-orange-600")} />;
    case ErrorSeverity.CRITICAL:
      return <AlertTriangle className={cn(iconClass, "text-red-600")} />;
    default:
      return <AlertCircle className={cn(iconClass, "text-gray-600")} />;
  }
}