/**
 * 에러 처리 유틸리티 테스트
 */

import { 
  normalizeError, 
  isRetryableError, 
  getErrorActionRecommendation,
  gatherErrorContext 
} from './error-handling';
import { GovernmentApiError } from '@/types/government-api';
import { ErrorCategory, ErrorSeverity } from '@/types/error';

describe('Error Handling Utilities', () => {
  describe('normalizeError', () => {
    it('정부 API 에러를 정규화해야 합니다', () => {
      const govError = new GovernmentApiError('10', '잘못된 요청 파라미터');
      const normalized = normalizeError(govError);
      
      expect(normalized.category).toBe(ErrorCategory.VALIDATION);
      expect(normalized.severity).toBe(ErrorSeverity.MEDIUM);
      expect(normalized.code).toBe('GOV_API_10');
      expect(normalized.userMessage).toBe('잘못된 요청 파라미터입니다.');
      expect(normalized.retryable).toBe(false);
    });

    it('HTTP 에러를 정규화해야 합니다', () => {
      const httpError = { status: 500, message: 'Internal Server Error' };
      const normalized = normalizeError(httpError);
      
      expect(normalized.category).toBe(ErrorCategory.SERVER_ERROR);
      expect(normalized.severity).toBe(ErrorSeverity.HIGH);
      expect(normalized.code).toBe('HTTP_500');
      expect(normalized.retryable).toBe(true);
    });

    it('네트워크 에러를 정규화해야 합니다', () => {
      const networkError = new TypeError('Failed to fetch');
      const normalized = normalizeError(networkError);
      
      expect(normalized.category).toBe(ErrorCategory.NETWORK);
      expect(normalized.severity).toBe(ErrorSeverity.HIGH);
      expect(normalized.code).toBe('NETWORK_ERROR');
      expect(normalized.retryable).toBe(true);
    });

    it('타임아웃 에러를 정규화해야 합니다', () => {
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'TimeoutError';
      const normalized = normalizeError(timeoutError);
      
      expect(normalized.category).toBe(ErrorCategory.NETWORK);
      expect(normalized.code).toBe('TIMEOUT');
      expect(normalized.retryable).toBe(true);
    });

    it('일반 에러를 정규화해야 합니다', () => {
      const generalError = new Error('Something went wrong');
      const normalized = normalizeError(generalError);
      
      expect(normalized.category).toBe(ErrorCategory.UNKNOWN);
      expect(normalized.code).toBe('GENERAL_ERROR');
      expect(normalized.message).toBe('Something went wrong');
    });

    it('알 수 없는 에러를 정규화해야 합니다', () => {
      const unknownError = 'String error';
      const normalized = normalizeError(unknownError);
      
      expect(normalized.category).toBe(ErrorCategory.UNKNOWN);
      expect(normalized.code).toBe('UNKNOWN_ERROR');
      expect(normalized.message).toBe('String error');
    });
  });

  describe('isRetryableError', () => {
    it('재시도 가능한 에러를 올바르게 식별해야 합니다', () => {
      const retryableError = normalizeError(new TypeError('Failed to fetch'));
      expect(isRetryableError(retryableError)).toBe(true);
    });

    it('재시도 불가능한 에러를 올바르게 식별해야 합니다', () => {
      const nonRetryableError = normalizeError(new Error('Validation failed'));
      expect(isRetryableError(nonRetryableError)).toBe(false);
    });
  });

  describe('getErrorActionRecommendation', () => {
    it('심각도별 적절한 권고사항을 제공해야 합니다', () => {
      const lowSeverityError = { severity: ErrorSeverity.LOW } as any;
      const criticalError = { severity: ErrorSeverity.CRITICAL } as any;
      
      expect(getErrorActionRecommendation(lowSeverityError)).toContain('새로고침');
      expect(getErrorActionRecommendation(criticalError)).toContain('고객센터');
    });
  });

  describe('gatherErrorContext', () => {
    it('클라이언트 환경에서 컨텍스트를 수집해야 합니다', () => {
      // Jest는 JSDOM 환경에서 실행되므로 window가 존재
      const context = gatherErrorContext();
      expect(context.environment).toBe('client');
      expect(context.url).toBeDefined();
      expect(context.userAgent).toBeDefined();
    });
    
    it('Window 객체가 없을 때 서버 환경으로 처리해야 합니다', () => {
      // null을 명시적으로 전달하여 서버 환경 시뮬레이션
      const context = gatherErrorContext(null as any);
      expect(context.environment).toBe('server');
    });
  });
});

describe('Error Scenarios', () => {
  describe('API Error Scenarios', () => {
    it('400 Bad Request 에러를 처리해야 합니다', () => {
      const error = { status: 400, message: 'Bad Request' };
      const normalized = normalizeError(error);
      
      expect(normalized.category).toBe(ErrorCategory.CLIENT_ERROR);
      expect(normalized.userMessage).toBe('잘못된 요청입니다. 입력 정보를 확인해주세요.');
    });

    it('401 Unauthorized 에러를 처리해야 합니다', () => {
      const error = { status: 401, message: 'Unauthorized' };
      const normalized = normalizeError(error);
      
      expect(normalized.category).toBe(ErrorCategory.AUTHENTICATION);
      expect(normalized.userMessage).toBe('인증이 필요합니다. 다시 로그인해주세요.');
    });

    it('403 Forbidden 에러를 처리해야 합니다', () => {
      const error = { status: 403, message: 'Forbidden' };
      const normalized = normalizeError(error);
      
      expect(normalized.category).toBe(ErrorCategory.AUTHORIZATION);
      expect(normalized.userMessage).toBe('접근 권한이 없습니다.');
    });

    it('404 Not Found 에러를 처리해야 합니다', () => {
      const error = { status: 404, message: 'Not Found' };
      const normalized = normalizeError(error);
      
      expect(normalized.category).toBe(ErrorCategory.NOT_FOUND);
      expect(normalized.userMessage).toBe('요청하신 정보를 찾을 수 없습니다.');
    });

    it('429 Too Many Requests 에러를 처리해야 합니다', () => {
      const error = { status: 429, message: 'Too Many Requests' };
      const normalized = normalizeError(error);
      
      expect(normalized.category).toBe(ErrorCategory.API);
      expect(normalized.userMessage).toBe('너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.');
      expect(normalized.retryable).toBe(true);
    });

    it('500 Internal Server Error를 처리해야 합니다', () => {
      const error = { status: 500, message: 'Internal Server Error' };
      const normalized = normalizeError(error);
      
      expect(normalized.category).toBe(ErrorCategory.SERVER_ERROR);
      expect(normalized.userMessage).toBe('서버에 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      expect(normalized.retryable).toBe(true);
    });

    it('502 Bad Gateway 에러를 처리해야 합니다', () => {
      const error = { status: 502, message: 'Bad Gateway' };
      const normalized = normalizeError(error);
      
      expect(normalized.category).toBe(ErrorCategory.NETWORK);
      expect(normalized.retryable).toBe(true);
    });

    it('503 Service Unavailable 에러를 처리해야 합니다', () => {
      const error = { status: 503, message: 'Service Unavailable' };
      const normalized = normalizeError(error);
      
      expect(normalized.category).toBe(ErrorCategory.SERVER_ERROR);
      expect(normalized.retryable).toBe(true);
    });

    it('504 Gateway Timeout 에러를 처리해야 합니다', () => {
      const error = { status: 504, message: 'Gateway Timeout' };
      const normalized = normalizeError(error);
      
      expect(normalized.category).toBe(ErrorCategory.NETWORK);
      expect(normalized.retryable).toBe(true);
    });
  });

  describe('Government API Error Scenarios', () => {
    it('서비스 키 관련 에러를 처리해야 합니다', () => {
      const error = new GovernmentApiError('20', '서비스 키가 유효하지 않음');
      const normalized = normalizeError(error);
      
      expect(normalized.category).toBe(ErrorCategory.AUTHENTICATION);
      expect(normalized.userMessage).toBe('서비스 키가 유효하지 않습니다.');
    });

    it('서비스 한도 초과 에러를 처리해야 합니다', () => {
      const error = new GovernmentApiError('22', '서비스 이용 한도 초과');
      const normalized = normalizeError(error);
      
      expect(normalized.category).toBe(ErrorCategory.API);
      expect(normalized.userMessage).toBe('서비스 이용 한도를 초과했습니다.');
    });

    it('데이터 없음 에러를 처리해야 합니다', () => {
      const error = new GovernmentApiError('03', '데이터 없음');
      const normalized = normalizeError(error);
      
      expect(normalized.category).toBe(ErrorCategory.NOT_FOUND);
      expect(normalized.userMessage).toBe('요청하신 데이터가 없습니다.');
      expect(normalized.severity).toBe(ErrorSeverity.LOW);
    });

    it('네트워크 관련 정부 API 에러를 처리해야 합니다', () => {
      const networkErrors = ['04', '05'];
      
      networkErrors.forEach(code => {
        const error = new GovernmentApiError(code as any, 'Network error');
        const normalized = normalizeError(error);
        
        expect(normalized.retryable).toBe(true);
        expect(normalized.category).toBe(ErrorCategory.NETWORK);
      });
    });

    it('서버 관련 정부 API 에러를 처리해야 합니다', () => {
      const serverErrors = ['30', '31'];
      
      serverErrors.forEach(code => {
        const error = new GovernmentApiError(code as any, 'Server error');
        const normalized = normalizeError(error);
        
        expect(normalized.retryable).toBe(true);
        expect(normalized.category).toBe(ErrorCategory.SERVER_ERROR);
      });
    });
  });

  describe('Network Error Scenarios', () => {
    it('연결 실패를 처리해야 합니다', () => {
      const error = new TypeError('Failed to fetch');
      const normalized = normalizeError(error);
      
      expect(normalized.category).toBe(ErrorCategory.NETWORK);
      expect(normalized.userMessage).toBe('인터넷 연결을 확인하고 다시 시도해주세요.');
      expect(normalized.retryable).toBe(true);
    });

    it('요청 취소를 처리해야 합니다', () => {
      const error = new Error('The operation was aborted');
      error.name = 'AbortError';
      const normalized = normalizeError(error);
      
      expect(normalized.category).toBe(ErrorCategory.CLIENT_ERROR);
      expect(normalized.code).toBe('REQUEST_CANCELLED');
      expect(normalized.retryable).toBe(false);
    });
  });
});