/**
 * 정부 API 클라이언트
 * 재시도 로직, 에러 처리, 타임아웃 설정 포함
 */

import ky, { HTTPError, TimeoutError } from 'ky';
import type {
  ApiResponse,
  ApiV3Response,
  ApiV4SingleResponse,
  ApartmentTradeParams,
  ApartmentTradeData,
  ApartmentRentParams,
  ApartmentRentData,
  ApartmentBasicV4Params,
  ApartmentBasicV4Data,
  ApartmentDetailV4Params,
  ApartmentDetailV4Data,
  ApartmentListSidoV3Params,
  ApartmentListSigunguV3Params,
  ApartmentListTotalV3Params,
  ApartmentListLegaldongV3Params,
  ApartmentListRoadnameV3Params,
  ApartmentListV3Data,
  ApartmentListRoadnameV3Data,
  ApiErrorCode
} from '@/types/government-api';
import { GovernmentApiError } from '@/types/government-api';
import { API_ENDPOINTS } from '@/types/government-api';

// XML 파싱을 위한 간단한 유틸리티 (기본 API 응답용)
function parseXmlResponse<T>(xmlString: string): ApiResponse<T> {
  // 간단한 XML 파싱 - 실제 프로덕션에서는 더 견고한 XML 파서 사용 권장
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
  
  // 에러 체크
  const parserError = xmlDoc.querySelector('parsererror');
  if (parserError) {
    throw new Error('XML 파싱 실패');
  }
  
  // 결과 코드 확인
  const resultCode = xmlDoc.querySelector('resultCode')?.textContent || '';
  const resultMsg = xmlDoc.querySelector('resultMsg')?.textContent || '';
  
  if (resultCode !== '00' && resultCode !== '000') {
    throw new GovernmentApiError(
      resultCode as ApiErrorCode,
      resultMsg,
      { xmlString }
    );
  }
  
  // 아이템 파싱
  const items = Array.from(xmlDoc.querySelectorAll('item')).map(item => {
    const obj: any = {};
    Array.from(item.children).forEach(child => {
      obj[child.tagName] = child.textContent || '';
    });
    return obj as T;
  });
  
  // 페이징 정보 파싱
  const numOfRows = parseInt(xmlDoc.querySelector('numOfRows')?.textContent || '0');
  const pageNo = parseInt(xmlDoc.querySelector('pageNo')?.textContent || '1');
  const totalCount = parseInt(xmlDoc.querySelector('totalCount')?.textContent || '0');
  
  return {
    header: {
      resultCode,
      resultMsg
    },
    body: {
      items,
      numOfRows,
      pageNo,
      totalCount
    }
  };
}

// V3 API 응답 파싱
function parseXmlV3Response<T>(xmlString: string): ApiV3Response<T> {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
  
  const parserError = xmlDoc.querySelector('parsererror');
  if (parserError) {
    throw new Error('XML 파싱 실패');
  }
  
  const resultCode = xmlDoc.querySelector('resultCode')?.textContent || '';
  const resultMsg = xmlDoc.querySelector('resultMsg')?.textContent || '';
  
  if (resultCode !== '00' && resultCode !== '000') {
    throw new GovernmentApiError(
      resultCode as ApiErrorCode,
      resultMsg,
      { xmlString }
    );
  }
  
  const items = Array.from(xmlDoc.querySelectorAll('item')).map(item => {
    const obj: any = {};
    Array.from(item.children).forEach(child => {
      obj[child.tagName] = child.textContent || '';
    });
    return obj as T;
  });
  
  return {
    header: {
      resultCode,
      resultMsg
    },
    body: {
      items,
      numOfRows: xmlDoc.querySelector('numOfRows')?.textContent || '0',
      pageNo: xmlDoc.querySelector('pageNo')?.textContent || '1',
      totalCount: xmlDoc.querySelector('totalCount')?.textContent || '0'
    }
  };
}

// V4 단일 아이템 응답 파싱
function parseXmlV4SingleResponse<T>(xmlString: string): ApiV4SingleResponse<T> {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
  
  const parserError = xmlDoc.querySelector('parsererror');
  if (parserError) {
    throw new Error('XML 파싱 실패');
  }
  
  const resultCode = xmlDoc.querySelector('resultCode')?.textContent || '';
  const resultMsg = xmlDoc.querySelector('resultMsg')?.textContent || '';
  
  if (resultCode !== '00' && resultCode !== '000') {
    throw new GovernmentApiError(
      resultCode as ApiErrorCode,
      resultMsg,
      { xmlString }
    );
  }
  
  // 단일 아이템 파싱
  const itemElement = xmlDoc.querySelector('item');
  const item: any = {};
  
  if (itemElement) {
    Array.from(itemElement.children).forEach(child => {
      item[child.tagName] = child.textContent || '';
    });
  }
  
  return {
    header: {
      resultCode,
      resultMsg
    },
    body: {
      item: item as T
    }
  };
}

export class GovernmentApiClient {
  private client: typeof ky;
  private serviceKey: string;
  
  constructor(serviceKey?: string) {
    this.serviceKey = serviceKey || process.env.NEXT_PUBLIC_DATA_GO_KR_SERVICE_KEY || '';
    
    if (!this.serviceKey) {
      throw new Error('API 서비스 키가 설정되지 않았습니다.');
    }
    
    // ky 인스턴스 생성
    this.client = ky.create({
      timeout: 30000, // 30초 타임아웃
      retry: {
        limit: 3,
        methods: ['get'],
        statusCodes: [408, 413, 429, 500, 502, 503, 504],
        backoffLimit: 3000,
        delay: (attemptCount) => 0.3 * (2 ** (attemptCount - 1)) * 1000, // 지수 백오프
      },
      hooks: {
        beforeRequest: [
          (request) => {
            console.log(`🌐 API 요청: ${request.url}`);
          }
        ],
        afterResponse: [
          async (request, options, response) => {
            console.log(`✅ API 응답: ${response.status} ${request.url}`);
            
            // 응답이 성공이 아닌 경우
            if (!response.ok) {
              const text = await response.text();
              console.error(`❌ API 에러 응답:`, text);
            }
            
            return response;
          }
        ],
        beforeError: [
          (error) => {
            const { request } = error;
            console.error(`❌ API 요청 실패: ${request?.url}`, error);
            return error;
          }
        ]
      }
    });
  }
  
  /**
   * 공통 API 요청 메서드
   */
  private async request<T>(
    url: string, 
    params: Record<string, string | number>
  ): Promise<ApiResponse<T>> {
    try {
      // URL 인코딩된 서비스 키 추가
      const searchParams = new URLSearchParams({
        serviceKey: encodeURIComponent(this.serviceKey),
        ...Object.entries(params).reduce((acc, [key, value]) => {
          acc[key] = String(value);
          return acc;
        }, {} as Record<string, string>)
      });
      
      const response = await this.client.get(url, {
        searchParams,
        headers: {
          'Accept': 'application/xml, text/xml, */*',
          'User-Agent': 'ApartmentInfo/1.0 (Next.js Application)',
        }
      });
      
      const xmlText = await response.text();
      return parseXmlResponse<T>(xmlText);
      
    } catch (error) {
      console.error('API 요청 중 에러 발생:', error);
      
      if (error instanceof HTTPError) {
        const errorText = await error.response.text();
        throw new GovernmentApiError(
          '04' as ApiErrorCode,
          `HTTP 에러: ${error.response.status} ${error.response.statusText}`,
          { error, response: errorText }
        );
      }
      
      if (error instanceof TimeoutError) {
        throw new GovernmentApiError(
          '05' as ApiErrorCode,
          '요청 시간 초과',
          error
        );
      }
      
      if (error instanceof GovernmentApiError) {
        throw error;
      }
      
      throw new GovernmentApiError(
        '01' as ApiErrorCode,
        error instanceof Error ? error.message : 'Unknown error',
        error
      );
    }
  }
  
  /**
   * 아파트 매매 실거래가 조회
   */
  async getApartmentTradeData(params: Omit<ApartmentTradeParams, 'serviceKey'>) {
    return this.request<ApartmentTradeData>(
      API_ENDPOINTS.APARTMENT_TRADE, 
      {
        LAWD_CD: params.LAWD_CD,
        DEAL_YMD: params.DEAL_YMD,
        pageNo: params.pageNo || 1,
        numOfRows: params.numOfRows || 100
      }
    );
  }
  
  /**
   * 아파트 전월세 실거래가 조회
   */
  async getApartmentRentData(params: Omit<ApartmentRentParams, 'serviceKey'>) {
    return this.request<ApartmentRentData>(
      API_ENDPOINTS.APARTMENT_RENT,
      {
        LAWD_CD: params.LAWD_CD,
        DEAL_YMD: params.DEAL_YMD,
        pageNo: params.pageNo || 1,
        numOfRows: params.numOfRows || 100
      }
    );
  }
  
  /**
   * 공동주택 기본 정보 조회 (V4)
   */
  async getApartmentBasicInfoV4(params: Omit<ApartmentBasicV4Params, 'serviceKey'>): Promise<ApiV4SingleResponse<ApartmentBasicV4Data>> {
    try {
      const searchParams = new URLSearchParams({
        serviceKey: encodeURIComponent(this.serviceKey),
        kaptCode: params.kaptCode
      });
      
      const response = await this.client.get(API_ENDPOINTS.APARTMENT_BASIC_V4, {
        searchParams,
        headers: {
          'Accept': 'application/xml, text/xml, */*',
          'User-Agent': 'ApartmentInfo/1.0 (Next.js Application)',
        }
      });
      
      const xmlText = await response.text();
      return parseXmlV4SingleResponse<ApartmentBasicV4Data>(xmlText);
      
    } catch (error) {
      console.error('V4 기본 정보 API 요청 중 에러 발생:', error);
      
      if (error instanceof HTTPError) {
        const errorText = await error.response.text();
        throw new GovernmentApiError(
          '04' as ApiErrorCode,
          `HTTP 에러: ${error.response.status} ${error.response.statusText}`,
          { error, response: errorText }
        );
      }
      
      if (error instanceof TimeoutError) {
        throw new GovernmentApiError(
          '05' as ApiErrorCode,
          '요청 시간 초과',
          error
        );
      }
      
      throw error;
    }
  }
  
  /**
   * 공동주택 상세 정보 조회 (V4)
   */
  async getApartmentDetailInfoV4(params: Omit<ApartmentDetailV4Params, 'serviceKey'>): Promise<ApiV4SingleResponse<ApartmentDetailV4Data>> {
    try {
      const searchParams = new URLSearchParams({
        serviceKey: encodeURIComponent(this.serviceKey),
        kaptCode: params.kaptCode
      });
      
      const response = await this.client.get(API_ENDPOINTS.APARTMENT_DETAIL_V4, {
        searchParams,
        headers: {
          'Accept': 'application/xml, text/xml, */*',
          'User-Agent': 'ApartmentInfo/1.0 (Next.js Application)',
        }
      });
      
      const xmlText = await response.text();
      return parseXmlV4SingleResponse<ApartmentDetailV4Data>(xmlText);
      
    } catch (error) {
      console.error('V4 상세 정보 API 요청 중 에러 발생:', error);
      
      if (error instanceof HTTPError) {
        const errorText = await error.response.text();
        throw new GovernmentApiError(
          '04' as ApiErrorCode,
          `HTTP 에러: ${error.response.status} ${error.response.statusText}`,
          { error, response: errorText }
        );
      }
      
      if (error instanceof TimeoutError) {
        throw new GovernmentApiError(
          '05' as ApiErrorCode,
          '요청 시간 초과',
          error
        );
      }
      
      throw error;
    }
  }

  /**
   * 시도 아파트 목록 조회 (V3)
   */
  async getApartmentListSidoV3(params: Omit<ApartmentListSidoV3Params, 'serviceKey'>): Promise<ApiV3Response<ApartmentListV3Data>> {
    try {
      const searchParams = new URLSearchParams({
        serviceKey: encodeURIComponent(this.serviceKey),
        sidoCode: params.sidoCode,
        ...(params.pageNo && { pageNo: params.pageNo }),
        ...(params.numOfRows && { numOfRows: params.numOfRows })
      });
      
      const response = await this.client.get(API_ENDPOINTS.APARTMENT_LIST_SIDO_V3, {
        searchParams,
        headers: {
          'Accept': 'application/xml, text/xml, */*',
          'User-Agent': 'ApartmentInfo/1.0 (Next.js Application)',
        }
      });
      
      const xmlText = await response.text();
      return parseXmlV3Response<ApartmentListV3Data>(xmlText);
      
    } catch (error) {
      console.error('V3 시도 아파트 목록 API 요청 중 에러 발생:', error);
      throw error;
    }
  }

  /**
   * 시군구 아파트 목록 조회 (V3)
   */
  async getApartmentListSigunguV3(params: Omit<ApartmentListSigunguV3Params, 'serviceKey'>): Promise<ApiV3Response<ApartmentListV3Data>> {
    try {
      const searchParams = new URLSearchParams({
        serviceKey: encodeURIComponent(this.serviceKey),
        sigunguCode: params.sigunguCode,
        ...(params.pageNo && { pageNo: params.pageNo }),
        ...(params.numOfRows && { numOfRows: params.numOfRows })
      });
      
      const response = await this.client.get(API_ENDPOINTS.APARTMENT_LIST_SIGUNGU_V3, {
        searchParams,
        headers: {
          'Accept': 'application/xml, text/xml, */*',
          'User-Agent': 'ApartmentInfo/1.0 (Next.js Application)',
        }
      });
      
      const xmlText = await response.text();
      return parseXmlV3Response<ApartmentListV3Data>(xmlText);
      
    } catch (error) {
      console.error('V3 시군구 아파트 목록 API 요청 중 에러 발생:', error);
      throw error;
    }
  }

  /**
   * 레거시 지원: 공동주택 기본 정보 조회 (V1 호환)
   */
  async getApartmentBasicInfo(params: { kaptCode: string }) {
    // V4 API를 사용하되 V1 형식으로 반환
    const v4Response = await this.getApartmentBasicInfoV4(params);
    return {
      header: v4Response.header,
      body: {
        items: [v4Response.body.item],
        numOfRows: 1,
        pageNo: 1,
        totalCount: 1
      }
    };
  }
  
  /**
   * 레거시 지원: 공동주택 상세 정보 조회 (V1 호환)
   */
  async getApartmentDetailInfo(params: { kaptCode: string }) {
    // V4 API를 사용하되 V1 형식으로 반환
    const v4Response = await this.getApartmentDetailInfoV4(params);
    return {
      header: v4Response.header,
      body: {
        items: [v4Response.body.item],
        numOfRows: 1,
        pageNo: 1,
        totalCount: 1
      }
    };
  }
  
  /**
   * 서비스 키 업데이트
   */
  updateServiceKey(newServiceKey: string) {
    this.serviceKey = newServiceKey;
  }
  
  /**
   * API 연결 테스트
   */
  async testConnection(): Promise<boolean> {
    try {
      // 서울 종로구(11110) 2024년 7월 데이터로 테스트
      const result = await this.getApartmentTradeData({
        LAWD_CD: '11110',
        DEAL_YMD: '202407',
        pageNo: 1,
        numOfRows: 1
      });
      
      return result.header.resultCode === '000' || result.header.resultCode === '00';
    } catch (error) {
      console.error('API 연결 테스트 실패:', error);
      return false;
    }
  }
}

// 싱글톤 인스턴스 생성
let apiClientInstance: GovernmentApiClient | null = null;

/**
 * 정부 API 클라이언트 인스턴스 가져오기
 */
export function getGovernmentApiClient(serviceKey?: string): GovernmentApiClient {
  if (!apiClientInstance || serviceKey) {
    apiClientInstance = new GovernmentApiClient(serviceKey);
  }
  return apiClientInstance;
}

// 편의 함수들
export const governmentApi = {
  /**
   * 아파트 매매 실거래가 조회
   */
  getTradeData: (params: Omit<ApartmentTradeParams, 'serviceKey'>) =>
    getGovernmentApiClient().getApartmentTradeData(params),
    
  /**
   * 아파트 전월세 실거래가 조회
   */
  getRentData: (params: Omit<ApartmentRentParams, 'serviceKey'>) =>
    getGovernmentApiClient().getApartmentRentData(params),
    
  /**
   * 공동주택 기본 정보 조회 (V4)
   */
  getBasicInfoV4: (params: Omit<ApartmentBasicV4Params, 'serviceKey'>) =>
    getGovernmentApiClient().getApartmentBasicInfoV4(params),
    
  /**
   * 공동주택 상세 정보 조회 (V4)
   */
  getDetailInfoV4: (params: Omit<ApartmentDetailV4Params, 'serviceKey'>) =>
    getGovernmentApiClient().getApartmentDetailInfoV4(params),

  /**
   * 시도 아파트 목록 조회 (V3)
   */
  getApartmentListSidoV3: (params: Omit<ApartmentListSidoV3Params, 'serviceKey'>) =>
    getGovernmentApiClient().getApartmentListSidoV3(params),

  /**
   * 시군구 아파트 목록 조회 (V3)
   */
  getApartmentListSigunguV3: (params: Omit<ApartmentListSigunguV3Params, 'serviceKey'>) =>
    getGovernmentApiClient().getApartmentListSigunguV3(params),
    
  /**
   * 공동주택 기본 정보 조회 (레거시 호환)
   */
  getBasicInfo: (params: { kaptCode: string }) =>
    getGovernmentApiClient().getApartmentBasicInfo(params),
    
  /**
   * 공동주택 상세 정보 조회 (레거시 호환)
   */
  getDetailInfo: (params: { kaptCode: string }) =>
    getGovernmentApiClient().getApartmentDetailInfo(params),
    
  /**
   * API 연결 테스트
   */
  testConnection: () =>
    getGovernmentApiClient().testConnection(),
};