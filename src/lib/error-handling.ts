/**
 * 에러 처리 유틸리티
 */

import { GovernmentApiError } from '@/types/government-api';
import { 
  ErrorCategory, 
  ErrorSeverity, 
  ErrorDetails, 
  HTTP_STATUS_MAPPING, 
  GOVERNMENT_API_ERROR_MAPPING 
} from '@/types/error';

/**
 * 에러를 ErrorDetails 형태로 정규화
 */
export function normalizeError(error: unknown): ErrorDetails {
  const timestamp = new Date();
  
  // GovernmentApiError 처리
  if (error instanceof GovernmentApiError) {
    const mapping = GOVERNMENT_API_ERROR_MAPPING[error.code] || {
      category: ErrorCategory.UNKNOWN,
      severity: ErrorSeverity.MEDIUM,
      userMessage: '알 수 없는 오류가 발생했습니다.'
    };
    
    return {
      category: mapping.category,
      severity: mapping.severity,
      code: `GOV_API_${error.code}`,
      message: error.message,
      userMessage: mapping.userMessage,
      details: { 
        originalError: error.description,
        context: error.originalError
      },
      timestamp,
      retryable: ['04', '05', '30', '31'].includes(error.code) // 네트워크, 서버 에러는 재시도 가능
    };
  }
  
  // HTTP 에러 처리 (fetch, axios 등)
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as any).status;
    const mapping = HTTP_STATUS_MAPPING[status] || {
      category: ErrorCategory.UNKNOWN,
      severity: ErrorSeverity.MEDIUM,
      userMessage: '요청 처리 중 오류가 발생했습니다.'
    };
    
    return {
      category: mapping.category,
      severity: mapping.severity,
      code: `HTTP_${status}`,
      message: (error as any).message || `HTTP ${status} Error`,
      userMessage: mapping.userMessage,
      details: { status, originalError: error },
      timestamp,
      retryable: status >= 500 || status === 429 // 서버 에러나 Rate Limit은 재시도 가능
    };
  }
  
  // 네트워크 에러 처리
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return {
      category: ErrorCategory.NETWORK,
      severity: ErrorSeverity.HIGH,
      code: 'NETWORK_ERROR',
      message: '네트워크 연결 오류',
      userMessage: '인터넷 연결을 확인하고 다시 시도해주세요.',
      details: { originalError: error.message },
      timestamp,
      retryable: true
    };
  }
  
  // 일반 Error 객체 처리
  if (error instanceof Error) {
    // Timeout 에러
    if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
      return {
        category: ErrorCategory.NETWORK,
        severity: ErrorSeverity.MEDIUM,
        code: 'TIMEOUT',
        message: error.message,
        userMessage: '요청 시간이 초과되었습니다. 다시 시도해주세요.',
        details: { originalError: error.message },
        timestamp,
        retryable: true
      };
    }
    
    // AbortError (사용자가 요청 취소)
    if (error.name === 'AbortError') {
      return {
        category: ErrorCategory.CLIENT_ERROR,
        severity: ErrorSeverity.LOW,
        code: 'REQUEST_CANCELLED',
        message: error.message,
        userMessage: '요청이 취소되었습니다.',
        details: { originalError: error.message },
        timestamp,
        retryable: false
      };
    }
    
    return {
      category: ErrorCategory.UNKNOWN,
      severity: ErrorSeverity.MEDIUM,
      code: 'GENERAL_ERROR',
      message: error.message,
      userMessage: '오류가 발생했습니다. 다시 시도해주세요.',
      details: { 
        name: error.name,
        stack: error.stack,
        originalError: error.message 
      },
      timestamp,
      retryable: false
    };
  }
  
  // 알 수 없는 에러
  return {
    category: ErrorCategory.UNKNOWN,
    severity: ErrorSeverity.MEDIUM,
    code: 'UNKNOWN_ERROR',
    message: String(error),
    userMessage: '알 수 없는 오류가 발생했습니다.',
    details: { originalError: error },
    timestamp,
    retryable: false
  };
}

/**
 * 에러 로깅
 */
export function logError(errorDetails: ErrorDetails, context?: Record<string, any>) {
  const logLevel = {
    [ErrorSeverity.LOW]: 'info',
    [ErrorSeverity.MEDIUM]: 'warn', 
    [ErrorSeverity.HIGH]: 'error',
    [ErrorSeverity.CRITICAL]: 'error'
  }[errorDetails.severity];
  
  const logData = {
    ...errorDetails,
    context,
    url: typeof window !== 'undefined' ? window.location.href : undefined,
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined
  };
  
  // 개발 환경에서는 콘솔에 출력
  if (process.env.NODE_ENV === 'development') {
    const logMethod = console[logLevel as keyof Console] as (...args: any[]) => void;
    logMethod('[ERROR]', logData);
  }
  
  // 프로덕션 환경에서는 외부 서비스로 전송 (추후 구현)
  if (process.env.NODE_ENV === 'production') {
    // TODO: Sentry, LogRocket 등 외부 로깅 서비스 연동
    // 예: Sentry.captureException(errorDetails, { extra: context });
  }
}

/**
 * 재시도 가능한 에러인지 확인
 */
export function isRetryableError(error: ErrorDetails): boolean {
  return error.retryable;
}

/**
 * 에러 심각도에 따른 사용자 행동 권고
 */
export function getErrorActionRecommendation(errorDetails: ErrorDetails): string {
  switch (errorDetails.severity) {
    case ErrorSeverity.LOW:
      return '문제가 지속되면 새로고침해주세요.';
    case ErrorSeverity.MEDIUM:
      return '잠시 후 다시 시도해주세요.';
    case ErrorSeverity.HIGH:
      return '문제가 계속되면 고객센터에 문의해주세요.';
    case ErrorSeverity.CRITICAL:
      return '긴급한 문제가 발생했습니다. 즉시 고객센터에 문의해주세요.';
    default:
      return '다시 시도해주세요.';
  }
}

/**
 * 에러 컨텍스트 수집
 */
export function gatherErrorContext(windowObj?: Window | null): Record<string, any> {
  // 명시적으로 null이나 undefined가 전달된 경우 서버 환경으로 처리
  const actualWindow = windowObj === undefined 
    ? (typeof window !== 'undefined' ? window : undefined)
    : windowObj;
  
  if (!actualWindow) {
    return { environment: 'server' };
  }
  
  return {
    environment: 'client',
    url: actualWindow.location.href,
    userAgent: actualWindow.navigator.userAgent,
    timestamp: new Date().toISOString(),
    viewport: {
      width: actualWindow.innerWidth,
      height: actualWindow.innerHeight
    },
    connection: (actualWindow.navigator as any).connection ? {
      effectiveType: (actualWindow.navigator as any).connection.effectiveType,
      downlink: (actualWindow.navigator as any).connection.downlink
    } : undefined
  };
}