'use client';

import React from 'react';
import { useToast } from '@/hooks/use-toast';
import { normalizeError, logError, gatherErrorContext, isRetryableError } from '@/lib/error-handling';
import { ErrorSeverity, ErrorDetails } from '@/types/error';

interface UseErrorHandlerOptions {
  /** 에러 발생시 자동으로 토스트 메시지 표시 여부 */
  showToast?: boolean;
  /** 에러 로깅 활성화 여부 */
  enableLogging?: boolean;
  /** 재시도 가능한 에러에 대한 자동 재시도 여부 */
  autoRetry?: boolean;
  /** 자동 재시도 최대 횟수 */
  maxRetries?: number;
  /** 재시도 간격 (ms) */
  retryDelay?: number;
  /** 사용자 정의 에러 핸들러 */
  onError?: (errorDetails: ErrorDetails) => void;
}

interface UseErrorHandlerResult {
  /** 에러 핸들링 함수 */
  handleError: (error: unknown, context?: Record<string, any>) => ErrorDetails;
  /** 현재 에러 상태 */
  currentError: ErrorDetails | null;
  /** 에러 초기화 */
  clearError: () => void;
  /** 재시도 함수 생성 */
  createRetryHandler: (fn: () => Promise<any>) => () => Promise<void>;
}

/**
 * 에러 처리를 위한 훅
 */
export function useErrorHandler(options: UseErrorHandlerOptions = {}): UseErrorHandlerResult {
  const {
    showToast = true,
    enableLogging = true,
    autoRetry = false,
    maxRetries = 3,
    retryDelay = 1000,
    onError
  } = options;

  const { toast } = useToast();
  const [currentError, setCurrentError] = React.useState<ErrorDetails | null>(null);
  const retryCountRef = React.useRef<Map<string, number>>(new Map());

  const handleError = React.useCallback((error: unknown, context?: Record<string, any>): ErrorDetails => {
    const errorDetails = normalizeError(error);
    
    // 현재 에러 상태 업데이트
    setCurrentError(errorDetails);
    
    // 에러 로깅
    if (enableLogging) {
      const fullContext = {
        ...gatherErrorContext(),
        ...context
      };
      logError(errorDetails, fullContext);
    }
    
    // 토스트 메시지 표시
    if (showToast) {
      const toastVariant = {
        [ErrorSeverity.LOW]: 'default',
        [ErrorSeverity.MEDIUM]: 'default',
        [ErrorSeverity.HIGH]: 'destructive',
        [ErrorSeverity.CRITICAL]: 'destructive'
      }[errorDetails.severity] as 'default' | 'destructive';

      toast({
        variant: toastVariant,
        title: errorDetails.severity === ErrorSeverity.LOW ? '알림' : '오류',
        description: errorDetails.userMessage,
        duration: errorDetails.severity === ErrorSeverity.CRITICAL ? 0 : 5000, // Critical 에러는 수동으로 닫기
      });
    }
    
    // 사용자 정의 에러 핸들러 호출
    onError?.(errorDetails);
    
    return errorDetails;
  }, [showToast, enableLogging, onError, toast]);

  const clearError = React.useCallback(() => {
    setCurrentError(null);
  }, []);

  const createRetryHandler = React.useCallback((fn: () => Promise<any>) => {
    return async () => {
      const errorKey = fn.toString(); // 함수를 키로 사용 (간단한 방법)
      const currentRetries = retryCountRef.current.get(errorKey) || 0;
      
      if (currentRetries >= maxRetries) {
        handleError(new Error('최대 재시도 횟수를 초과했습니다.'));
        return;
      }
      
      try {
        await new Promise(resolve => setTimeout(resolve, retryDelay * (currentRetries + 1))); // 점진적 지연
        await fn();
        retryCountRef.current.delete(errorKey); // 성공시 재시도 카운트 초기화
        clearError();
      } catch (error) {
        const errorDetails = handleError(error);
        
        if (isRetryableError(errorDetails) && autoRetry) {
          retryCountRef.current.set(errorKey, currentRetries + 1);
          // 자동 재시도는 재귀적으로 실행
          setTimeout(() => createRetryHandler(fn)(), retryDelay * (currentRetries + 1));
        }
      }
    };
  }, [maxRetries, retryDelay, autoRetry, handleError, clearError]);

  return {
    handleError,
    currentError,
    clearError,
    createRetryHandler
  };
}

/**
 * API 호출을 위한 에러 처리 훅
 */
export function useApiErrorHandler() {
  return useErrorHandler({
    showToast: true,
    enableLogging: true,
    autoRetry: false, // API 에러는 수동 재시도
    maxRetries: 3
  });
}

/**
 * 폼 검증을 위한 에러 처리 훅
 */
export function useFormErrorHandler() {
  return useErrorHandler({
    showToast: true,
    enableLogging: false, // 폼 에러는 로깅하지 않음
    autoRetry: false
  });
}

/**
 * 백그라운드 작업을 위한 에러 처리 훅
 */
export function useBackgroundErrorHandler() {
  return useErrorHandler({
    showToast: false, // 백그라운드 작업은 토스트 표시하지 않음
    enableLogging: true,
    autoRetry: true,
    maxRetries: 3,
    retryDelay: 2000
  });
}