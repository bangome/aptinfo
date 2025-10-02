/**
 * 정부 API 클라이언트 단위 테스트
 */

import { GovernmentApiClient, getGovernmentApiClient, governmentApi } from './government-api-client';
import { GovernmentApiError, API_ERROR_CODES } from '@/types/government-api';
import { HTTPError, TimeoutError } from 'ky';

// ky 모킹
jest.mock('ky', () => {
  // HTTPError와 TimeoutError 모킹
  class MockHTTPError extends Error {
    constructor(public response: any) {
      super('HTTP Error');
      this.name = 'HTTPError';
    }
  }

  class MockTimeoutError extends Error {
    constructor() {
      super('Timeout Error');
      this.name = 'TimeoutError';
    }
  }

  const mockKy = {
    create: jest.fn(),
    get: jest.fn(),
  };
  
  // create 메서드가 mockKy 자체를 반환하도록 설정
  mockKy.create.mockReturnValue(mockKy);
  
  return {
    default: mockKy,
    HTTPError: MockHTTPError,
    TimeoutError: MockTimeoutError,
  };
});

import ky from 'ky';

describe('GovernmentApiClient', () => {
  let client: GovernmentApiClient;
  let mockKy: any;
  const testServiceKey = 'test-service-key';

  beforeEach(() => {
    jest.clearAllMocks();
    
    // 모킹된 ky 인스턴스에 접근
    mockKy = require('ky').default;
    
    // mockKy.create가 mockKy 자체를 반환하도록 설정
    mockKy.create.mockReturnValue(mockKy);
    
    // 환경변수 모킹
    process.env.NEXT_PUBLIC_DATA_GO_KR_SERVICE_KEY = testServiceKey;
    
    client = new GovernmentApiClient(testServiceKey);
    
    // console.log 모킹 (테스트 출력 정리)
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('생성자', () => {
    it('서비스 키 없이 생성 시 에러 발생', () => {
      delete process.env.NEXT_PUBLIC_DATA_GO_KR_SERVICE_KEY;
      
      expect(() => new GovernmentApiClient()).toThrow('API 서비스 키가 설정되지 않았습니다.');
    });

    it('서비스 키가 있으면 정상 생성', () => {
      expect(() => new GovernmentApiClient(testServiceKey)).not.toThrow();
    });
  });

  describe('아파트 매매 실거래가 조회', () => {
    const mockSuccessResponse = `
      <response>
        <header>
          <resultCode>000</resultCode>
          <resultMsg>OK</resultMsg>
        </header>
        <body>
          <items>
            <item>
              <aptNm>테스트아파트</aptNm>
              <sggCd>11110</sggCd>
              <umdNm>종로1가동</umdNm>
              <dealAmount>50000</dealAmount>
              <dealYear>2024</dealYear>
              <dealMonth>07</dealMonth>
              <dealDay>15</dealDay>
              <excluUseAr>84.97</excluUseAr>
              <floor>10</floor>
              <buildYear>2010</buildYear>
            </item>
          </items>
          <numOfRows>1</numOfRows>
          <pageNo>1</pageNo>
          <totalCount>1</totalCount>
        </body>
      </response>
    `;

    it('성공적인 API 호출', async () => {
      const mockResponse = {
        ok: true,
        text: jest.fn().mockResolvedValue(mockSuccessResponse),
      };
      
      mockKy.get.mockResolvedValue(mockResponse as any);

      const result = await client.getApartmentTradeData({
        LAWD_CD: '11110',
        DEAL_YMD: '202407'
      });

      expect(result.header.resultCode).toBe('000');
      expect(result.header.resultMsg).toBe('OK');
      expect(result.body.items).toHaveLength(1);
      expect(result.body.items[0].aptNm).toBe('테스트아파트');
      expect(result.body.totalCount).toBe(1);
    });

    it('에러 응답 처리', async () => {
      const mockErrorResponse = `
        <response>
          <header>
            <resultCode>10</resultCode>
            <resultMsg>잘못된 요청 파라미터</resultMsg>
          </header>
        </response>
      `;

      const mockResponse = {
        ok: true,
        text: jest.fn().mockResolvedValue(mockErrorResponse),
      };
      
      mockKy.get.mockResolvedValue(mockResponse as any);

      await expect(client.getApartmentTradeData({
        LAWD_CD: '11110',
        DEAL_YMD: '202407'
      })).rejects.toThrow('잘못된 요청 파라미터 에러');
    });

    it('네트워크 에러 처리', async () => {
      const networkError = new Error('Network Error');
      mockKy.get.mockRejectedValue(networkError);

      await expect(client.getApartmentTradeData({
        LAWD_CD: '11110',
        DEAL_YMD: '202407'
      })).rejects.toThrow('네트워크 요청 중 오류가 발생했습니다');
    });
  });

  describe('아파트 전월세 실거래가 조회', () => {
    const mockRentResponse = `
      <response>
        <header>
          <resultCode>000</resultCode>
          <resultMsg>OK</resultMsg>
        </header>
        <body>
          <items>
            <item>
              <aptNm>테스트아파트</aptNm>
              <sggCd>11110</sggCd>
              <umdNm>종로1가동</umdNm>
              <deposit>30000</deposit>
              <monthlyRent>50</monthlyRent>
              <dealYear>2024</dealYear>
              <dealMonth>07</dealMonth>
              <dealDay>15</dealDay>
            </item>
          </items>
          <numOfRows>1</numOfRows>
          <pageNo>1</pageNo>
          <totalCount>1</totalCount>
        </body>
      </response>
    `;

    it('성공적인 전월세 API 호출', async () => {
      const mockResponse = {
        ok: true,
        text: jest.fn().mockResolvedValue(mockRentResponse),
      };
      
      mockKy.get.mockResolvedValue(mockResponse as any);

      const result = await client.getApartmentRentData({
        LAWD_CD: '11110',
        DEAL_YMD: '202407'
      });

      expect(result.header.resultCode).toBe('000');
      expect(result.body.items[0].deposit).toBe('30000');
      expect(result.body.items[0].monthlyRent).toBe('50');
    });
  });

  describe('공동주택 기본 정보 조회', () => {
    const mockBasicInfoResponse = `
      <response>
        <header>
          <resultCode>00</resultCode>
          <resultMsg>NORMAL SERVICE</resultMsg>
        </header>
        <body>
          <item>
            <kaptCode>A10027875</kaptCode>
            <kaptName>테스트아파트</kaptName>
            <kaptAddr>서울특별시 종로구 종로1가</kaptAddr>
            <kaptDongCnt>3</kaptDongCnt>
            <kaptdaCnt>182</kaptdaCnt>
          </item>
        </body>
      </response>
    `;

    it('성공적인 기본 정보 API 호출', async () => {
      const mockResponse = {
        ok: true,
        text: jest.fn().mockResolvedValue(mockBasicInfoResponse),
      };
      
      mockKy.get.mockResolvedValue(mockResponse as any);

      const result = await client.getApartmentBasicInfo({
        kaptCode: 'A10027875'
      });

      expect(result.header.resultCode).toBe('00');
      expect(result.body.items[0].kaptName).toBe('테스트아파트');
    });
  });

  describe('API 연결 테스트', () => {
    it('연결 성공', async () => {
      const mockResponse = {
        ok: true,
        text: jest.fn().mockResolvedValue(`
          <response>
            <header>
              <resultCode>000</resultCode>
              <resultMsg>OK</resultMsg>
            </header>
            <body>
              <items></items>
              <numOfRows>0</numOfRows>
              <pageNo>1</pageNo>
              <totalCount>0</totalCount>
            </body>
          </response>
        `),
      };
      
      mockKy.get.mockResolvedValue(mockResponse as any);

      const result = await client.testConnection();
      expect(result).toBe(true);
    });

    it('연결 실패', async () => {
      mockKy.get.mockRejectedValue(new Error('Network Error'));

      const result = await client.testConnection();
      expect(result).toBe(false);
    });
  });

  describe('서비스 키 관리', () => {
    it('서비스 키 업데이트', () => {
      const newKey = 'new-service-key';
      
      expect(() => client.updateServiceKey(newKey)).not.toThrow();
    });
  });
});

describe('싱글톤 인스턴스', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_DATA_GO_KR_SERVICE_KEY = 'test-key';
  });

  it('같은 인스턴스 반환', () => {
    const instance1 = getGovernmentApiClient();
    const instance2 = getGovernmentApiClient();
    
    expect(instance1).toBe(instance2);
  });

  it('새 서비스 키로 새 인스턴스 생성', () => {
    const instance1 = getGovernmentApiClient();
    const instance2 = getGovernmentApiClient('new-key');
    
    expect(instance1).not.toBe(instance2);
  });
});

describe('편의 함수들', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_DATA_GO_KR_SERVICE_KEY = 'test-key';
  });

  it('governmentApi.getTradeData 호출', async () => {
    const mockResponse = {
      ok: true,
      text: jest.fn().mockResolvedValue(`
        <response>
          <header><resultCode>000</resultCode><resultMsg>OK</resultMsg></header>
          <body><items></items><numOfRows>0</numOfRows><pageNo>1</pageNo><totalCount>0</totalCount></body>
        </response>
      `),
    };
    
    const kyMock = require('ky').default;
    kyMock.get.mockResolvedValue(mockResponse as any);

    const result = await governmentApi.getTradeData({
      LAWD_CD: '11110',
      DEAL_YMD: '202407'
    });

    expect(result.header.resultCode).toBe('000');
  });

  it('governmentApi.testConnection 호출', async () => {
    const mockResponse = {
      ok: true,
      text: jest.fn().mockResolvedValue(`
        <response>
          <header><resultCode>000</resultCode><resultMsg>OK</resultMsg></header>
          <body><items></items><numOfRows>0</numOfRows><pageNo>1</pageNo><totalCount>0</totalCount></body>
        </response>
      `),
    };
    
    const kyMock = require('ky').default;
    kyMock.get.mockResolvedValue(mockResponse as any);

    const result = await governmentApi.testConnection();
    expect(result).toBe(true);
  });
});

describe('GovernmentApiError', () => {
  it('에러 메시지 형식화', () => {
    const error = new GovernmentApiError('10', '테스트 에러');
    
    expect(error.code).toBe('10');
    expect(error.description).toBe('테스트 에러');
    expect(error.message).toContain('잘못된 요청 파라미터 에러');
    expect(error.name).toBe('GovernmentApiError');
  });

  it('알 수 없는 에러 코드 처리', () => {
    const error = new GovernmentApiError('99' as any, '알 수 없는 에러');
    
    expect(error.message).toContain('Unknown Error');
  });
});