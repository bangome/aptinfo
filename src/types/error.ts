/**
 * 애플리케이션 에러 타입 정의
 */

export enum ErrorCategory {
  NETWORK = 'NETWORK',
  API = 'API',
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  SERVER_ERROR = 'SERVER_ERROR',
  CLIENT_ERROR = 'CLIENT_ERROR',
  UNKNOWN = 'UNKNOWN'
}

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface ErrorDetails {
  category: ErrorCategory;
  severity: ErrorSeverity;
  code: string;
  message: string;
  userMessage: string;
  details?: Record<string, any>;
  timestamp: Date;
  retryable: boolean;
  action?: {
    label: string;
    handler: () => void;
  };
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  statusCode: number;
  timestamp: string;
}

/**
 * HTTP 상태 코드 매핑
 */
export const HTTP_STATUS_MAPPING: Record<number, { category: ErrorCategory; severity: ErrorSeverity; userMessage: string }> = {
  // 400번대 클라이언트 에러
  400: {
    category: ErrorCategory.CLIENT_ERROR,
    severity: ErrorSeverity.MEDIUM,
    userMessage: '잘못된 요청입니다. 입력 정보를 확인해주세요.'
  },
  401: {
    category: ErrorCategory.AUTHENTICATION,
    severity: ErrorSeverity.HIGH,
    userMessage: '인증이 필요합니다. 다시 로그인해주세요.'
  },
  403: {
    category: ErrorCategory.AUTHORIZATION,
    severity: ErrorSeverity.HIGH,
    userMessage: '접근 권한이 없습니다.'
  },
  404: {
    category: ErrorCategory.NOT_FOUND,
    severity: ErrorSeverity.MEDIUM,
    userMessage: '요청하신 정보를 찾을 수 없습니다.'
  },
  422: {
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.MEDIUM,
    userMessage: '입력 정보가 올바르지 않습니다.'
  },
  429: {
    category: ErrorCategory.API,
    severity: ErrorSeverity.MEDIUM,
    userMessage: '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.'
  },
  
  // 500번대 서버 에러
  500: {
    category: ErrorCategory.SERVER_ERROR,
    severity: ErrorSeverity.HIGH,
    userMessage: '서버에 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
  },
  502: {
    category: ErrorCategory.NETWORK,
    severity: ErrorSeverity.HIGH,
    userMessage: '서버 연결에 문제가 있습니다. 잠시 후 다시 시도해주세요.'
  },
  503: {
    category: ErrorCategory.SERVER_ERROR,
    severity: ErrorSeverity.HIGH,
    userMessage: '서비스가 일시적으로 이용할 수 없습니다. 잠시 후 다시 시도해주세요.'
  },
  504: {
    category: ErrorCategory.NETWORK,
    severity: ErrorSeverity.HIGH,
    userMessage: '요청 시간이 초과되었습니다. 다시 시도해주세요.'
  }
};

/**
 * 정부 API 에러 코드 매핑
 */
export const GOVERNMENT_API_ERROR_MAPPING: Record<string, { category: ErrorCategory; severity: ErrorSeverity; userMessage: string }> = {
  '01': {
    category: ErrorCategory.API,
    severity: ErrorSeverity.HIGH,
    userMessage: '정부 API 서비스에 오류가 발생했습니다.'
  },
  '02': {
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.MEDIUM,
    userMessage: '요청 데이터가 잘못되었습니다.'
  },
  '03': {
    category: ErrorCategory.NOT_FOUND,
    severity: ErrorSeverity.LOW,
    userMessage: '요청하신 데이터가 없습니다.'
  },
  '04': {
    category: ErrorCategory.NETWORK,
    severity: ErrorSeverity.HIGH,
    userMessage: '정부 API 서버 연결에 실패했습니다.'
  },
  '05': {
    category: ErrorCategory.NETWORK,
    severity: ErrorSeverity.HIGH,
    userMessage: '요청 시간이 초과되었습니다.'
  },
  '10': {
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.MEDIUM,
    userMessage: '잘못된 요청 파라미터입니다.'
  },
  '11': {
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.MEDIUM,
    userMessage: '필수 파라미터가 누락되었습니다.'
  },
  '12': {
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.MEDIUM,
    userMessage: '파라미터 값이 올바르지 않습니다.'
  },
  '20': {
    category: ErrorCategory.AUTHENTICATION,
    severity: ErrorSeverity.HIGH,
    userMessage: '서비스 키가 유효하지 않습니다.'
  },
  '21': {
    category: ErrorCategory.AUTHORIZATION,
    severity: ErrorSeverity.HIGH,
    userMessage: '서비스 접근이 거부되었습니다.'
  },
  '22': {
    category: ErrorCategory.API,
    severity: ErrorSeverity.MEDIUM,
    userMessage: '서비스 이용 한도를 초과했습니다.'
  },
  '30': {
    category: ErrorCategory.SERVER_ERROR,
    severity: ErrorSeverity.HIGH,
    userMessage: '정부 API 서버 오류가 발생했습니다.'
  },
  '31': {
    category: ErrorCategory.SERVER_ERROR,
    severity: ErrorSeverity.HIGH,
    userMessage: '정부 API 서비스가 일시적으로 이용할 수 없습니다.'
  },
  '99': {
    category: ErrorCategory.UNKNOWN,
    severity: ErrorSeverity.MEDIUM,
    userMessage: '알 수 없는 오류가 발생했습니다.'
  }
};