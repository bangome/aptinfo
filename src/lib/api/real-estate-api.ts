/**
 * 국토교통부 실거래가 정보 OpenAPI 통합 서비스
 */

import { XMLParser } from 'fast-xml-parser';
import { ApartmentNameMatcher } from '../apartment-name-matcher';
import { apartmentMappingCache } from '../apartment-mapping-cache';
import { ApartmentDbService } from '../apartment-db-service';

// API 기본 설정
const API_BASE_URL = 'https://apis.data.go.kr/1613000';
const SERVICE_KEY = process.env.NEXT_PUBLIC_DATA_GO_KR_SERVICE_KEY;

// API 엔드포인트
const ENDPOINTS = {
  APARTMENT_TRADE: '/RTMSDataSvcAptTrade/getRTMSDataSvcAptTrade',
  APARTMENT_RENT: '/RTMSDataSvcAptRent/getRTMSDataSvcAptRent',
  APARTMENT_BASIS_INFO: '/AptBasisInfoServiceV4/getAphusBassInfoV4',
  APARTMENT_DETAIL_INFO: '/AptBasisInfoServiceV4/getAphusDtlInfoV4',
  APARTMENT_LIST: '/AptListService3/getLegaldongAptList3',
  APARTMENT_LIST_SIGUNGU: '/AptListService3/getSigunguAptList3',
  APARTMENT_LIST_SIDO: '/AptListService3/getSidoAptList3',
  APARTMENT_LIST_TOTAL: '/AptListService3/getTotalAptList3',
  APARTMENT_LIST_ROADNAME: '/AptListService3/getRoadnameAptList3',
} as const;

// 공통 인터페이스
interface BaseApiParams {
  LAWD_CD: string; // 지역코드 (5자리)
  DEAL_YMD: string; // 계약년월 (YYYYMM)
  pageNo?: number;
  numOfRows?: number;
}

interface ApiResponse<T> {
  response: {
    header: {
      resultCode: string;
      resultMsg: string;
    };
    body: {
      items: {
        item: T[];
      };
      numOfRows: number;
      pageNo: number;
      totalCount: number;
    };
  };
}

// 매매 실거래가 데이터 타입
export interface ApartmentTradeData {
  sggCd: string; // 지역코드
  umdNm: string; // 법정동
  aptNm: string; // 단지명
  jibun?: string; // 지번
  excluUseAr?: string; // 전용면적
  dealYear: string; // 계약년도
  dealMonth: string; // 계약월
  dealDay: string; // 계약일
  dealAmount: string; // 거래금액(만원)
  floor?: string; // 층
  buildYear?: string; // 건축년도
  cdealType?: string; // 해제여부
  cdealDay?: string; // 해제사유발생일
  dealingGbn?: string; // 거래유형
  estateAgentSggNm?: string; // 중개사소재지
  rgstDate?: string; // 등기일자
  aptDong?: string; // 아파트 동명
  slerGbn?: string; // 매도자 거래주체정보
  buyerGbn?: string; // 매수자 거래주체정보
  landLeaseholdGbn?: string; // 토지임대부 아파트 여부
}

// 전월세 실거래가 데이터 타입
export interface ApartmentRentData {
  sggCd: string; // 지역코드
  umdNm: string; // 법정동
  aptNm: string; // 아파트명
  jibun?: string; // 지번
  excluUseAr?: string; // 전용면적
  dealYear: string; // 계약년도
  dealMonth: string; // 계약월
  dealDay: string; // 계약일
  deposit: string; // 보증금액(만원)
  monthlyRent: string; // 월세금액(만원)
  floor?: string; // 층
  buildYear?: string; // 건축년도
  contractTerm?: string; // 계약기간
  contractType?: string; // 계약구분
  useRRRight?: string; // 갱신요구권사용
  preDeposit?: string; // 종전계약보증금
  preMonthlyRent?: string; // 종전계약월세
}

// 공동주택 기본정보 API V4 데이터 타입
export interface ApartmentBasisData {
  // 기본 정보
  zipcode?: string; // 우편번호
  kaptCode: string; // 단지코드
  kaptName: string; // 단지명
  kaptAddr: string; // 법정동주소
  doroJuso?: string; // 도로명주소
  bjdCode?: string; // 법정동코드
  
  // 분양 및 관리 정보
  codeSaleNm?: string; // 분양형태
  codeHeatNm?: string; // 난방방식
  codeAptNm?: string; // 단지분류
  codeMgrNm?: string; // 관리방식
  codeHallNm?: string; // 복도유형
  
  // 건물 정보
  kaptTarea?: number; // 연면적(㎡)
  kaptDongCnt?: number; // 동수
  kaptdaCnt?: string; // 세대수
  hoCnt?: number; // 호수
  kaptUsedate?: string; // 사용승인일
  kaptMarea?: number; // 관리비부과면적(㎡)
  privArea?: number; // 단지 전용면적합(㎡)
  
  // 세대현황 (전용면적별) - V4에서 이름 변경
  kaptMparea60?: number; // 60㎡ 이하
  kaptMparea85?: number; // 60㎡ ~ 85㎡ 이하  
  kaptMparea135?: number; // 85㎡ ~ 135㎡ 이하
  kaptMparea136?: number; // 135㎡ 초과
  
  // 업체 정보
  kaptBcompany?: string; // 시공사
  kaptAcompany?: string; // 시행사
  
  // 연락처
  kaptTel?: string; // 관리사무소연락처
  kaptFax?: string; // 관리사무소팩스
  kaptUrl?: string; // 홈페이지주소
  
  // V4 추가 정보
  kaptTopFloor?: number; // 최고층수
  ktownFlrNo?: number; // 지상층수
  kaptBaseFloor?: number; // 지하층수
  kaptdEcntp?: number; // 전기용량
}

// 공동주택 상세정보 API V4 데이터 타입
export interface ApartmentDetailData {
  // 기본 정보
  kaptCode: string; // 단지코드
  kaptName: string; // 단지명
  
  // 관리 정보
  codeMgr?: string; // 일반관리방식
  kaptMgrCnt?: number; // 일반관리인원
  kaptCcompany?: string; // 일반관리 계약업체
  
  // 경비 관리
  codeSec?: string; // 경비관리방식
  kaptdScnt?: number; // 경비관리인원
  kaptdSecCom?: string; // 경비관리 계약업체
  
  // 청소 관리
  codeClean?: string; // 청소관리방식
  kaptdClcnt?: number; // 청소관리인원
  
  // 소독 관리
  codeDisinf?: string; // 소독관리방식
  kaptdDcnt?: number; // 소독관리 연간소독횟수
  disposalType?: string; // 소독방법
  
  // 시설 정보
  codeGarbage?: string; // 음식물처리방법
  codeStr?: string; // 건물구조
  kaptdEcapa?: number; // 수전용량
  codeEcon?: string; // 세대전기계약방식
  codeEmgr?: string; // 전기안전관리자법정선임여부
  codeFalarm?: string; // 화재수신반방식
  codeWsupply?: string; // 급수방식
  
  // 승강기 및 주차
  codeElev?: string; // 승강기관리형태
  kaptdEcnt?: number; // 승강기대수
  kaptdPcnt?: number; // 주차대수(지상)
  kaptdPcntu?: number; // 주차대수(지하)
  codeNet?: string; // 주차관제.홈네트워크
  
  // 보안 시설
  kaptdCccnt?: number; // CCTV대수
  
  // 부대시설
  welfareFacility?: string; // 부대.복리시설
  convenientFacility?: string; // 편의시설
  educationFacility?: string; // 교육시설
  
  // 교통 정보
  kaptdWtimebus?: string; // 버스정류장 거리
  subwayLine?: string; // 지하철호선
  subwayStation?: string; // 지하철역명
  kaptdWtimesub?: string; // 지하철역 거리
  
  // V4 추가 정보
  undergroundElChargerCnt?: number; // 지하 전기충전기 대수
  groundElChargerCnt?: number; // 지상 전기충전기 대수
  useYn?: string; // 사용여부
}

// 단지목록 API 데이터 타입
export interface ApartmentListData {
  kaptCode: string; // 단지코드
  kaptName: string; // 단지명
  as1: string; // 시도
  as2: string; // 시군구
  as3: string; // 읍면동
  as4?: string; // 리
  bjdCode: string; // 법정동코드
  doroJuso?: string; // 도로명주소 (도로명 API 사용시)
}

// 통합된 아파트 데이터 타입
export interface IntegratedApartmentData {
  // 기본 정보
  id: string;
  name: string;
  address: string;
  region: string;
  subRegion: string;
  jibun?: string;
  kaptCode?: string; // 단지코드

  // 건물 정보
  buildYear?: number;
  floor?: number;
  totalFloors?: number;
  units?: number; // 세대수
  constructionCompany?: string; // 시공사
  buildingStructure?: string; // 건물구조

  // 면적 정보
  area: {
    exclusive?: number; // 전용면적 (㎡)
    supply?: number; // 공급면적 (㎡)
    totalPrivateArea?: number; // 단지 전용면적합
  };

  // 가격 정보
  price?: {
    sale?: number; // 매매가 (만원)
    lease?: number; // 전세 보증금 (만원)
    rent?: {
      deposit: number; // 월세 보증금 (만원)
      monthly: number; // 월세 (만원)
    };
  };

  // 거래 정보
  dealDate?: {
    year: number;
    month: number;
    day: number;
  };

  // 계약 정보 (전월세인 경우)
  contract?: {
    term?: string;
    type?: string;
    renewalRight?: string;
  };

  // 시설 및 편의사항
  facilities?: {
    parking?: {
      total?: number; // 총 주차대수
      surface?: number; // 지상 주차대수
      underground?: number; // 지하 주차대수
    };
    elevator?: number; // 승강기대수
    cctv?: number; // CCTV대수
    welfare?: string[]; // 부대복리시설
    convenient?: string[]; // 편의시설
    education?: string[]; // 교육시설
  };

  // 관리 정보
  management?: {
    type?: string; // 관리방식
    company?: string; // 관리업체
    phone?: string; // 관리사무소 연락처
    fax?: string; // 관리사무소 팩스
    website?: string; // 홈페이지
  };

  // 교통 정보
  transportation?: {
    subway?: {
      line?: string; // 지하철 호선
      station?: string; // 지하철역명
      distance?: string; // 지하철역 거리
    };
    bus?: {
      distance?: string; // 버스정류장 거리
    };
  };

  // 포맷된 준공일
  formattedApprovalDate?: string;

  // 매칭 메타데이터
  matchMetadata?: {
    confidence: 'high' | 'medium' | 'low';
    reason: string;
    kaptCode: string;
    matchedAt: string;
  };

  // 추가 정보
  dealType?: 'sale' | 'rent'; // 거래 유형
  estateAgent?: string; // 중개사 정보
  saleType?: string; // 분양형태
  heatingType?: string; // 난방방식
  corridorType?: string; // 복도유형

  // 메타데이터
  createdAt: Date;
  updatedAt: Date;
}

// API 요청 함수
class RealEstateApiService {
  private async makeRequest<T>(endpoint: string, params: BaseApiParams): Promise<ApiResponse<T>> {
    if (!SERVICE_KEY) {
      throw new Error('SERVICE_KEY가 설정되지 않았습니다. 환경변수를 확인해주세요.');
    }

    const searchParams = new URLSearchParams({
      serviceKey: SERVICE_KEY,
      LAWD_CD: params.LAWD_CD,
      DEAL_YMD: params.DEAL_YMD,
      pageNo: (params.pageNo || 1).toString(),
      numOfRows: (params.numOfRows || 100).toString(),
    });

    const url = `${API_BASE_URL}${endpoint}?${searchParams.toString()}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/xml',
        },
      });

      if (!response.ok) {
        throw new Error(`API 요청 실패: ${response.status} ${response.statusText}`);
      }

      const xmlText = await response.text();

      // XML을 JSON으로 변환 (간단한 파싱)
      const jsonData = this.parseXmlToJson<T>(xmlText);

      return jsonData;
    } catch (error) {
      console.error('API 요청 중 오류 발생:', error);
      throw error;
    }
  }

  // V4 API용 XML 파서 (body.item 구조)
  private parseXmlV4ToJson<T>(xmlText: string): { response: { header: { resultCode: string; resultMsg: string }, body: { item: T } } } {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
      removeNSPrefix: false,
      parseAttributeValue: false,
      parseTagValue: true,
      trimValues: true,
      alwaysCreateTextNode: false,
    });

    try {
      const jsonObj = parser.parse(xmlText);

      const response = jsonObj.response || jsonObj;
      const header = response.header || {};
      const body = response.body || {};

      const resultCode = header.resultCode || '000';
      const resultMsg = header.resultMsg || 'OK';

      if (resultCode !== '000') {
        throw new Error(`API 에러: ${resultCode} - ${resultMsg}`);
      }

      return {
        response: {
          header: {
            resultCode,
            resultMsg,
          },
          body: {
            item: body.item,
          },
        },
      };
    } catch (error) {
      console.error('XML 파싱 오류:', error);
      throw new Error('XML 응답을 파싱하는 중 오류가 발생했습니다.');
    }
  }

  // XML을 JSON으로 변환하는 헬퍼 함수
  private parseXmlToJson<T>(xmlText: string): ApiResponse<T> {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
      removeNSPrefix: false,
      parseAttributeValue: false,
      parseTagValue: true,
      trimValues: true,
      alwaysCreateTextNode: false,
    });

    try {
      const jsonObj = parser.parse(xmlText);

      // API 응답 구조 확인
      const response = jsonObj.response || jsonObj;
      const header = response.header || {};
      const body = response.body || {};

      // 에러 체크
      const resultCode = header.resultCode || '000';
      const resultMsg = header.resultMsg || 'OK';

      if (resultCode !== '000') {
        throw new Error(`API 에러: ${resultCode} - ${resultMsg}`);
      }

      // 아이템 데이터 추출
      let items: T[] = [];
      if (body.items && body.items.item) {
        if (Array.isArray(body.items.item)) {
          items = body.items.item;
        } else {
          items = [body.items.item];
        }
      }

      return {
        response: {
          header: {
            resultCode,
            resultMsg,
          },
          body: {
            items: {
              item: items,
            },
            numOfRows: parseInt(body.numOfRows || '0'),
            pageNo: parseInt(body.pageNo || '1'),
            totalCount: parseInt(body.totalCount || '0'),
          },
        },
      };
    } catch (error) {
      console.error('XML 파싱 오류:', error);
      throw new Error('XML 응답을 파싱하는 중 오류가 발생했습니다.');
    }
  }

  // 매매 실거래가 조회
  async getApartmentTradeData(params: BaseApiParams): Promise<ApartmentTradeData[]> {
    const response = await this.makeRequest<ApartmentTradeData>(
      ENDPOINTS.APARTMENT_TRADE,
      params
    );
    return response.response.body.items.item || [];
  }

  // 전월세 실거래가 조회
  async getApartmentRentData(params: BaseApiParams): Promise<ApartmentRentData[]> {
    const response = await this.makeRequest<ApartmentRentData>(
      ENDPOINTS.APARTMENT_RENT,
      params
    );
    return response.response.body.items.item || [];
  }

  // 공동주택 기본정보 조회 (V4)
  async getApartmentBasisInfo(kaptCode: string): Promise<ApartmentBasisData | null> {
    try {
      const searchParams = new URLSearchParams({
        serviceKey: SERVICE_KEY!,
        kaptCode: kaptCode,
      });

      const url = `${API_BASE_URL}${ENDPOINTS.APARTMENT_BASIS_INFO}?${searchParams.toString()}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`API 요청 실패: ${response.status}`);
      }

      const responseText = await response.text();
      
      // V4 API는 JSON 응답으로 제공
      if (responseText.startsWith('{')) {
        const jsonData = JSON.parse(responseText);
        
        if (jsonData.response && jsonData.response.body && jsonData.response.body.item) {
          return jsonData.response.body.item;
        }
      } else {
        // XML 응답 처리 (fallback)
        const jsonData = this.parseXmlV4ToJson<ApartmentBasisData>(responseText);
        return jsonData.response.body.item || null;
      }
      
      return null;
    } catch (error) {
      console.warn('공동주택 기본정보 조회 실패:', error);
      return null;
    }
  }

  // 공동주택 상세정보 조회 (V4)
  async getApartmentDetailInfo(kaptCode: string): Promise<ApartmentDetailData | null> {
    try {
      const searchParams = new URLSearchParams({
        serviceKey: SERVICE_KEY!,
        kaptCode: kaptCode,
      });

      const url = `${API_BASE_URL}${ENDPOINTS.APARTMENT_DETAIL_INFO}?${searchParams.toString()}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`API 요청 실패: ${response.status}`);
      }

      const responseText = await response.text();
      
      // V4 API는 JSON 응답으로 제공
      if (responseText.startsWith('{')) {
        const jsonData = JSON.parse(responseText);
        
        if (jsonData.response && jsonData.response.body && jsonData.response.body.item) {
          return jsonData.response.body.item;
        }
      } else {
        // XML 응답 처리 (fallback)
        const jsonData = this.parseXmlV4ToJson<ApartmentDetailData>(responseText);
        return jsonData.response.body.item || null;
      }
      
      return null;
    } catch (error) {
      console.warn('공동주택 상세정보 조회 실패:', error);
      return null;
    }
  }

  // V3 API용 XML 파서 (body.items 구조, 문자열 페이징 정보)
  private parseXmlV3ToJson<T>(xmlText: string): { response: { header: { resultCode: string; resultMsg: string }, body: { items: T[], numOfRows: string, pageNo: string, totalCount: string } } } {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
      removeNSPrefix: false,
      parseAttributeValue: false,
      parseTagValue: true,
      trimValues: true,
      alwaysCreateTextNode: false,
    });

    try {
      const jsonObj = parser.parse(xmlText);

      const response = jsonObj.response || jsonObj;
      const header = response.header || {};
      const body = response.body || {};

      const resultCode = header.resultCode || '000';
      const resultMsg = header.resultMsg || 'OK';

      if (resultCode !== '000') {
        throw new Error(`API 에러: ${resultCode} - ${resultMsg}`);
      }

      let items: T[] = [];
      if (body.items && body.items.item) {
        if (Array.isArray(body.items.item)) {
          items = body.items.item;
        } else {
          items = [body.items.item];
        }
      }

      return {
        response: {
          header: {
            resultCode,
            resultMsg,
          },
          body: {
            items,
            numOfRows: body.numOfRows || '0',
            pageNo: body.pageNo || '1',
            totalCount: body.totalCount || '0',
          },
        },
      };
    } catch (error) {
      console.error('XML 파싱 오류:', error);
      throw new Error('XML 응답을 파싱하는 중 오류가 발생했습니다.');
    }
  }

  // 법정동 기준 단지목록 조회 (V3)
  async getApartmentListByBjdCode(bjdCode: string, pageNo: number = 1, numOfRows: number = 100): Promise<ApartmentListData[]> {
    try {
      const searchParams = new URLSearchParams({
        serviceKey: SERVICE_KEY!,
        bjdCode: bjdCode,
        pageNo: pageNo.toString(),
        numOfRows: numOfRows.toString(),
      });

      const url = `${API_BASE_URL}${ENDPOINTS.APARTMENT_LIST}?${searchParams.toString()}`;
      console.log(`📡 단지목록 API URL: ${url.substring(0, 120)}...`);
      
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`API 요청 실패: ${response.status}`);
      }

      const xmlText = await response.text();
      console.log(`📄 단지목록 API 응답 샘플: ${xmlText.substring(0, 200)}...`);
      
      const jsonData = this.parseXmlV3ToJson<ApartmentListData>(xmlText);
      const items = jsonData.response.body.items || [];
      
      console.log(`✅ 단지목록 파싱 완료: ${items.length}개 조회됨`);
      return items;
    } catch (error) {
      console.warn('❌ 단지목록 조회 실패:', error);
      return [];
    }
  }

  // 시군구 기준 단지목록 조회 (V3)
  async getApartmentListBySigunguCode(sigunguCode: string, pageNo: number = 1, numOfRows: number = 1000): Promise<ApartmentListData[]> {
    try {
      const searchParams = new URLSearchParams({
        serviceKey: SERVICE_KEY!,
        sigunguCode: sigunguCode,
        pageNo: pageNo.toString(),
        numOfRows: numOfRows.toString(),
      });

      const url = `${API_BASE_URL}${ENDPOINTS.APARTMENT_LIST_SIGUNGU}?${searchParams.toString()}`;
      console.log(`📡 시군구 단지목록 API URL: ${url.substring(0, 120)}...`);
      
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`API 요청 실패: ${response.status}`);
      }

      const responseText = await response.text();
      console.log(`📄 시군구 API 응답 샘플: ${responseText.substring(0, 200)}...`);
      
      // V3 API는 JSON으로 응답할 수도 있음
      let items = [];
      if (responseText.startsWith('{')) {
        const jsonData = JSON.parse(responseText);
        items = jsonData.response?.body?.items || [];
      } else {
        const jsonData = this.parseXmlV3ToJson<ApartmentListData>(responseText);
        items = jsonData.response.body.items || [];
      }
      
      console.log(`✅ 시군구 단지목록 파싱 완료: ${items.length}개 조회됨`);
      return Array.isArray(items) ? items : [items];
    } catch (error) {
      console.warn('❌ 시군구 단지목록 조회 실패:', error);
      return [];
    }
  }

  // 통합 아파트 데이터 조회 (데이터베이스 기반 - 성능 최적화)
  async getIntegratedApartmentDataWithDb(params: BaseApiParams): Promise<IntegratedApartmentData[]> {
    try {
      console.log('🚀 데이터베이스 기반 통합 아파트 데이터 조회 시작...');
      
      // 1단계: 매매와 전월세 데이터를 병렬로 조회
      const [tradeData, rentData] = await Promise.all([
        this.getApartmentTradeData(params).catch(() => []),
        this.getApartmentRentData(params).catch(() => []),
      ]);

      console.log(`📊 조회된 실거래 데이터: 매매 ${tradeData.length}개, 전월세 ${rentData.length}개`);

      // 데이터 통합
      const integratedData = new Map<string, IntegratedApartmentData>();

      // 매매 데이터 처리
      tradeData.forEach(item => {
        const key = `${item.aptNm}-${item.jibun || 'unknown'}`;
        const data: IntegratedApartmentData = {
          id: this.generateId(item.aptNm, item.jibun),
          name: item.aptNm,
          address: `${item.umdNm} ${item.jibun || ''}`.trim(),
          region: item.sggCd,
          subRegion: item.umdNm,
          jibun: item.jibun,
          buildYear: item.buildYear ? parseInt(item.buildYear) : undefined,
          floor: item.floor ? parseInt(item.floor) : undefined,
          area: {
            exclusive: item.excluUseAr ? parseFloat(item.excluUseAr) : undefined,
          },
          price: {
            sale: this.parseAmount(item.dealAmount),
          },
          dealDate: {
            year: parseInt(item.dealYear),
            month: parseInt(item.dealMonth),
            day: parseInt(item.dealDay),
          },
          dealType: 'sale',
          estateAgent: item.estateAgentSggNm,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        integratedData.set(key, data);
      });

      // 전월세 데이터 처리
      rentData.forEach(item => {
        const key = `${item.aptNm}-${item.jibun || 'unknown'}`;
        const existingData = integratedData.get(key);

        if (existingData) {
          // 기존 데이터에 전월세 정보 추가
          existingData.price = {
            ...existingData.price,
            lease: this.parseAmount(item.deposit),
            rent: {
              deposit: this.parseAmount(item.deposit),
              monthly: this.parseAmount(item.monthlyRent),
            },
          };
          existingData.contract = {
            term: item.contractTerm,
            type: item.contractType,
            renewalRight: item.useRRRight,
          };
        } else {
          // 새로운 전월세 데이터
          const data: IntegratedApartmentData = {
            id: this.generateId(item.aptNm, item.jibun),
            name: item.aptNm,
            address: `${item.umdNm} ${item.jibun || ''}`.trim(),
            region: item.sggCd,
            subRegion: item.umdNm,
            jibun: item.jibun,
            buildYear: item.buildYear ? parseInt(item.buildYear) : undefined,
            floor: item.floor ? parseInt(item.floor) : undefined,
            area: {
              exclusive: item.excluUseAr ? parseFloat(item.excluUseAr) : undefined,
            },
            price: {
              lease: this.parseAmount(item.deposit),
              rent: {
                deposit: this.parseAmount(item.deposit),
                monthly: this.parseAmount(item.monthlyRent),
              },
            },
            dealDate: {
              year: parseInt(item.dealYear),
              month: parseInt(item.dealMonth),
              day: parseInt(item.dealDay),
            },
            contract: {
              term: item.contractTerm,
              type: item.contractType,
              renewalRight: item.useRRRight,
            },
            dealType: this.determineDealType(item),
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          integratedData.set(key, data);
        }
      });

      console.log(`🏢 통합된 아파트 수: ${integratedData.size}개`);

      // 2단계: 데이터베이스에서 아파트 매칭 (API 대신 DB 사용)
      let totalMatched = 0;
      let totalFailed = 0;
      const bjdCode = params.LAWD_CD + '00';

      console.log('🔍 데이터베이스에서 아파트 매칭 시작...');

      const enhancementPromises = Array.from(integratedData.entries()).map(async ([key, apartment]) => {
        try {
          // 데이터베이스에서 아파트 매칭
          const matchedApartment = await ApartmentDbService.matchApartmentForTransaction(
            apartment.name,
            apartment.address,
            bjdCode
          );

          if (matchedApartment) {
            totalMatched++;
            
            // 데이터베이스 정보로 보강
            apartment.kaptCode = matchedApartment.kapt_code;
            apartment.units = matchedApartment.total_household_count || undefined;
            apartment.constructionCompany = matchedApartment.construction_company || undefined;
            apartment.heatingType = matchedApartment.heating_type || undefined;
            apartment.corridorType = matchedApartment.hall_type || undefined;

            // 관리 정보 추가
            apartment.management = {
              type: matchedApartment.management_type || undefined,
              phone: matchedApartment.management_office_tel || undefined,
              fax: matchedApartment.management_office_fax || undefined,
              website: matchedApartment.website_url || undefined,
            };

            // 시설 정보 추가
            apartment.facilities = {
              parking: {
                surface: matchedApartment.surface_parking_count || undefined,
                underground: matchedApartment.underground_parking_count || undefined,
                total: matchedApartment.total_parking_count || undefined,
              },
              elevator: matchedApartment.elevator_count || undefined,
              cctv: matchedApartment.cctv_count || undefined,
              welfare: matchedApartment.welfare_facilities ? 
                this.parseCommaList(matchedApartment.welfare_facilities) : undefined,
              convenient: matchedApartment.convenient_facilities ? 
                this.parseCommaList(matchedApartment.convenient_facilities) : undefined,
              education: matchedApartment.education_facilities ? 
                this.parseCommaList(matchedApartment.education_facilities) : undefined,
            };

            // 교통 정보 추가
            apartment.transportation = {
              subway: {
                line: matchedApartment.subway_line || undefined,
                station: matchedApartment.subway_station || undefined,
                distance: matchedApartment.subway_distance || undefined,
              },
              bus: {
                distance: matchedApartment.bus_station_distance || undefined,
              },
            };

            // 매칭 메타데이터 추가
            apartment.matchMetadata = {
              confidence: 'high',
              reason: 'DB 기반 정확한 매칭',
              kaptCode: matchedApartment.kapt_code,
              matchedAt: new Date().toISOString()
            };

          } else {
            totalFailed++;
          }

          return [key, apartment] as const;
        } catch (error) {
          console.warn(`아파트 ${apartment.name} DB 매칭 실패:`, error);
          totalFailed++;
          return [key, apartment] as const;
        }
      });

      // 모든 매칭 작업 완료 대기
      const enhancedEntries = await Promise.all(enhancementPromises);

      // 맵 업데이트
      enhancedEntries.forEach(([key, apartment]) => {
        integratedData.set(key, apartment);
      });

      // 매칭 통계 출력
      const total = totalMatched + totalFailed;
      const successRate = total > 0 ? (totalMatched / total * 100).toFixed(1) : '0';
      
      console.log('\n📊 데이터베이스 매칭 결과');
      console.log('='.repeat(40));
      console.log(`🏢 총 아파트 수: ${total}개`);
      console.log(`✅ 매칭 성공: ${totalMatched}개 (${successRate}%)`);
      console.log(`❌ 매칭 실패: ${totalFailed}개 (${(100 - parseFloat(successRate)).toFixed(1)}%)`);
      console.log(`🚀 데이터베이스 기반 고속 매칭 완료!`);
      console.log('='.repeat(40));

      return Array.from(integratedData.values());
    } catch (error) {
      console.error('데이터베이스 기반 통합 데이터 조회 중 오류:', error);
      throw error;
    }
  }

  // 통합 아파트 데이터 조회 (4개 API 통합 - 기존 버전)
  async getIntegratedApartmentData(params: BaseApiParams): Promise<IntegratedApartmentData[]> {
    try {
      // 1단계: 매매와 전월세 데이터를 병렬로 조회
      const [tradeData, rentData] = await Promise.all([
        this.getApartmentTradeData(params).catch(() => []),
        this.getApartmentRentData(params).catch(() => []),
      ]);

      // 데이터 통합
      const integratedData = new Map<string, IntegratedApartmentData>();

      // 매매 데이터 처리
      tradeData.forEach(item => {
        const key = `${item.aptNm}-${item.jibun || 'unknown'}`;
        const data: IntegratedApartmentData = {
          id: this.generateId(item.aptNm, item.jibun),
          name: item.aptNm,
          address: `${item.umdNm} ${item.jibun || ''}`.trim(),
          region: item.sggCd,
          subRegion: item.umdNm,
          jibun: item.jibun,
          buildYear: item.buildYear ? parseInt(item.buildYear) : undefined,
          floor: item.floor ? parseInt(item.floor) : undefined,
          area: {
            exclusive: item.excluUseAr ? parseFloat(item.excluUseAr) : undefined,
          },
          price: {
            sale: this.parseAmount(item.dealAmount),
          },
          dealDate: {
            year: parseInt(item.dealYear),
            month: parseInt(item.dealMonth),
            day: parseInt(item.dealDay),
          },
          dealType: 'sale',
          estateAgent: item.estateAgentSggNm,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        integratedData.set(key, data);
      });

      // 전월세 데이터 처리
      rentData.forEach(item => {
        const key = `${item.aptNm}-${item.jibun || 'unknown'}`;
        const existingData = integratedData.get(key);

        if (existingData) {
          // 기존 데이터에 전월세 정보 추가
          existingData.price = {
            ...existingData.price,
            lease: this.parseAmount(item.deposit),
            rent: {
              deposit: this.parseAmount(item.deposit),
              monthly: this.parseAmount(item.monthlyRent),
            },
          };
          existingData.contract = {
            term: item.contractTerm,
            type: item.contractType,
            renewalRight: item.useRRRight,
          };
        } else {
          // 새로운 전월세 데이터
          const data: IntegratedApartmentData = {
            id: this.generateId(item.aptNm, item.jibun),
            name: item.aptNm,
            address: `${item.umdNm} ${item.jibun || ''}`.trim(),
            region: item.sggCd,
            subRegion: item.umdNm,
            jibun: item.jibun,
            buildYear: item.buildYear ? parseInt(item.buildYear) : undefined,
            floor: item.floor ? parseInt(item.floor) : undefined,
            area: {
              exclusive: item.excluUseAr ? parseFloat(item.excluUseAr) : undefined,
            },
            price: {
              lease: this.parseAmount(item.deposit),
              rent: {
                deposit: this.parseAmount(item.deposit),
                monthly: this.parseAmount(item.monthlyRent),
              },
            },
            dealDate: {
              year: parseInt(item.dealYear),
              month: parseInt(item.dealMonth),
              day: parseInt(item.dealDay),
            },
            contract: {
              term: item.contractTerm,
              type: item.contractType,
              renewalRight: item.useRRRight,
            },
            dealType: this.determineDealType(item),
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          integratedData.set(key, data);
        }
      });

      // 2단계: 단지목록 API로 단지코드 매핑 (BJD 코드가 있는 경우)
      if (params.LAWD_CD) {
        try {
          const bjdCode = params.LAWD_CD + '00'; // LAWD_CD 5자리를 BJD 코드 10자리로 변환
          console.log(`🔍 단지목록 API 호출: LAWD_CD=${params.LAWD_CD}, BJD코드=${bjdCode}`);
          
          let apartmentList = await this.getApartmentListByBjdCode(bjdCode, 1, 1000);
          console.log(`📋 조회된 단지목록 (법정동): ${apartmentList.length}개`);
          
          // 법정동 조회가 실패한 경우 시군구 코드로 재시도
          if (apartmentList.length === 0) {
            console.warn(`⚠️ 법정동 조회 실패! 시군구 코드로 재시도합니다: ${params.LAWD_CD}`);
            apartmentList = await this.getApartmentListBySigunguCode(params.LAWD_CD, 1, 1000);
            console.log(`📋 조회된 단지목록 (시군구): ${apartmentList.length}개`);
          }
          
          if (apartmentList.length === 0) {
            console.warn(`⚠️ 단지목록이 완전히 비어있음! 해당 지역에 등록된 아파트가 없습니다.`);
            console.log(`💡 매칭 없이 실거래 데이터만 반환합니다.`);
            return Array.from(integratedData.values());
          }
          
          console.log(`📊 단지목록 샘플 (상위 3개):`, apartmentList.slice(0, 3).map(item => item.kaptName));

          // 매칭 통계 추적
          let totalApartments = 0;
          let successfulMatches = 0;
          let failedMatches = 0;
          let matchingStats = {
            exact: 0,
            partial: 0,
            keyword: 0,
            reorder: 0,
            numeric: 0,
            cached: 0,
            failed: 0
          };

          // 주소 우선 매핑 시스템 (법정동 → 단지명)
          const enhancementPromises = Array.from(integratedData.entries()).map(async ([key, apartment]) => {
            totalApartments++;
            // 1. 캐시에서 먼저 확인
            const cached = apartmentMappingCache.get(apartment.name, apartment.address, bjdCode);
            let kaptCode: string | undefined;
            let matchConfidence: 'high' | 'medium' | 'low' = 'low';
            let matchReason = '';

            if (cached && cached.confidence !== 'low') {
              kaptCode = cached.kaptCode;
              matchConfidence = cached.confidence;
              matchReason = `캐시에서 조회: ${cached.matchReason}`;
              matchingStats.cached++;
            } else {
              // 2. 주소 기반 필터링 먼저 수행
              let addressFilteredList = apartmentList;
              
              // 실거래 데이터의 읍면동 정보 추출
              const addressParts = apartment.address.split(' ').filter(part => part.length > 0);
              const dongName = addressParts.find(part => part.includes('동') || part.includes('가'));
              
              if (dongName) {
                // 같은 동에 있는 아파트들만 필터링
                addressFilteredList = apartmentList.filter(item => {
                  const itemAddress = item.doroJuso || `${item.as1} ${item.as2} ${item.as3}`.trim();
                  return itemAddress.includes(dongName) || 
                         item.as3?.includes(dongName) ||
                         item.as3?.includes(dongName.replace('동', ''));
                });
                
                console.log(`🏘️ 주소 필터링 (${dongName}): ${apartmentList.length} → ${addressFilteredList.length}개`);
              }
              
              // 주소 필터링된 리스트가 없으면 전체 리스트 사용
              if (addressFilteredList.length === 0) {
                addressFilteredList = apartmentList;
              }
              
              // 3. 매우 유연한 단지명 매칭 (주소 필터링된 리스트에서)
              
              // 3-1. 정확한 이름 매칭
              const exactMatch = addressFilteredList.find(item => 
                item.kaptName === apartment.name
              );
              
              if (exactMatch) {
                kaptCode = exactMatch.kaptCode;
                matchConfidence = 'high';
                matchReason = `정확한 이름 매칭`;
                matchingStats.exact++;
              } else {
                // 3-2. 부분 문자열 매칭 (매우 유연)
                const apartmentNameClean = apartment.name.replace(/[^\w가-힣]/g, '');
                const partialMatches = addressFilteredList.filter(item => {
                  const itemNameClean = item.kaptName.replace(/[^\w가-힣]/g, '');
                  
                  // 양방향 포함 관계 확인
                  if (itemNameClean.includes(apartmentNameClean) || apartmentNameClean.includes(itemNameClean)) {
                    return true;
                  }
                  
                  // 2글자 이상의 공통 부분 문자열 확인
                  for (let i = 0; i < apartmentNameClean.length - 1; i++) {
                    for (let j = i + 2; j <= apartmentNameClean.length; j++) {
                      const substring = apartmentNameClean.substring(i, j);
                      if (substring.length >= 2 && itemNameClean.includes(substring)) {
                        return true;
                      }
                    }
                  }
                  
                  return false;
                });
                
                if (partialMatches.length > 0) {
                  // 가장 유사한 매칭 선택 (길이가 비슷한 것 우선)
                  const bestPartialMatch = partialMatches.reduce((best, current) => {
                    const bestLengthDiff = Math.abs(best.kaptName.length - apartment.name.length);
                    const currentLengthDiff = Math.abs(current.kaptName.length - apartment.name.length);
                    return currentLengthDiff < bestLengthDiff ? current : best;
                  });
                  
                  kaptCode = bestPartialMatch.kaptCode;
                  matchConfidence = 'medium';
                  matchReason = `부분 문자열 매칭: ${apartment.name} ↔ ${bestPartialMatch.kaptName}`;
                  matchingStats.partial++;
                } else {
                  // 3-3. 강화된 키워드 분할 매칭
                  const keywords = apartment.name.split(/[^가-힣\w]+/).filter(k => k.length >= 2);
                  
                  // 3-3-1. 개별 키워드 매칭
                  for (const keyword of keywords) {
                    const keywordMatches = addressFilteredList.filter(item => 
                      item.kaptName.includes(keyword)
                    );
                    
                    if (keywordMatches.length > 0) {
                      kaptCode = keywordMatches[0].kaptCode;
                      matchConfidence = 'low';
                      matchReason = `키워드 매칭 (${keyword}): ${apartment.name} ↔ ${keywordMatches[0].kaptName}`;
                      matchingStats.keyword++;
                      break;
                    }
                  }
                  
                  // 3-3-2. 키워드 순서 바꿔서 매칭 (예: "아이파크종암동2차" → "종암아이파크")
                  if (!kaptCode && keywords.length >= 2) {
                    for (let i = 0; i < keywords.length; i++) {
                      for (let j = 0; j < keywords.length; j++) {
                        if (i === j) continue;
                        
                        const reorderedPattern = keywords[j] + keywords[i];
                        const reverseMatches = addressFilteredList.filter(item => {
                          const itemClean = item.kaptName.replace(/[^가-힣\w]/g, '');
                          return itemClean.includes(reorderedPattern) || 
                                 (itemClean.includes(keywords[j]) && itemClean.includes(keywords[i]));
                        });
                        
                        if (reverseMatches.length > 0) {
                          kaptCode = reverseMatches[0].kaptCode;
                          matchConfidence = 'low';
                          matchReason = `키워드 순서 변경 매칭 (${keywords[j]}+${keywords[i]}): ${apartment.name} ↔ ${reverseMatches[0].kaptName}`;
                          matchingStats.reorder++;
                          break;
                        }
                      }
                      if (kaptCode) break;
                    }
                  }
                  
                  // 3-3-3. 숫자/한자 변형 매칭 (예: "5단지" → "10단지", "2차" → "1차")
                  if (!kaptCode) {
                    const numericVariations = [];
                    let modifiedName = apartment.name;
                    
                    // 숫자 변형
                    modifiedName = modifiedName.replace(/\d+/g, '');
                    numericVariations.push(modifiedName);
                    
                    // 차수 변형
                    modifiedName = apartment.name.replace(/\d+차/g, '');
                    numericVariations.push(modifiedName);
                    
                    // 단지 변형  
                    modifiedName = apartment.name.replace(/\d+단지/g, '');
                    numericVariations.push(modifiedName);
                    
                    for (const variation of numericVariations) {
                      if (variation.length < 3) continue;
                      
                      const variationClean = variation.replace(/[^가-힣\w]/g, '');
                      const variationMatches = addressFilteredList.filter(item => {
                        const itemClean = item.kaptName.replace(/[^가-힣\w]/g, '');
                        return variationClean.length >= 3 && itemClean.includes(variationClean);
                      });
                      
                      if (variationMatches.length > 0) {
                        kaptCode = variationMatches[0].kaptCode;
                        matchConfidence = 'low';
                        matchReason = `숫자 변형 매칭: ${apartment.name} ↔ ${variationMatches[0].kaptName}`;
                        matchingStats.numeric++;
                        break;
                      }
                    }
                  }
                }
              }
              
              // 4. 성공한 매칭을 캐시에 저장
              if (kaptCode) {
                apartmentMappingCache.set(
                  apartment.name,
                  kaptCode,
                  matchConfidence,
                  matchReason,
                  apartment.address,
                  bjdCode
                );
              }
            }

            if (!kaptCode) {
              console.warn(`❌ 아파트 매칭 실패: ${apartment.name} (${apartment.address})`);
              matchingStats.failed++;
              failedMatches++;
              
              // 디버깅 정보 출력
              const availableNames = apartmentList.slice(0, 5).map(item => item.kaptName);
              console.log(`📋 해당 지역 아파트 샘플 (상위 5개):`, availableNames);
              
              const searchKeywords = ApartmentNameMatcher.generateSearchKeywords(apartment.name);
              console.log(`🔍 생성된 검색 키워드:`, searchKeywords.slice(0, 3));
              
              return [key, apartment] as const;
            } else {
              successfulMatches++;
            }

            try {
              // 기본정보와 상세정보를 병렬로 조회
              const [basisInfo, detailInfo] = await Promise.all([
                this.getApartmentBasisInfo(kaptCode),
                this.getApartmentDetailInfo(kaptCode),
              ]);

              // 기본정보로 데이터 보강
              if (basisInfo) {
                apartment.kaptCode = kaptCode;
                apartment.units = typeof basisInfo.kaptdaCnt === 'string' ? parseInt(basisInfo.kaptdaCnt) : basisInfo.kaptdaCnt;
                apartment.constructionCompany = basisInfo.kaptBcompany || undefined;
                apartment.saleType = basisInfo.codeSaleNm || undefined;
                apartment.heatingType = basisInfo.codeHeatNm || undefined;
                apartment.corridorType = basisInfo.codeHallNm || undefined;

                // 면적 정보 보강
                if (basisInfo.privArea) {
                  apartment.area.totalPrivateArea = basisInfo.privArea;
                }

                // 관리 정보 추가
                apartment.management = {
                  type: basisInfo.codeMgrNm || undefined,
                  phone: basisInfo.kaptTel || undefined,
                  fax: basisInfo.kaptFax || undefined,
                  website: basisInfo.kaptUrl || undefined,
                };

                // 매칭 메타데이터 추가
                apartment.matchMetadata = {
                  confidence: matchConfidence,
                  reason: matchReason,
                  kaptCode: kaptCode,
                  matchedAt: new Date().toISOString()
                };

                console.log(`✅ 아파트 매칭 성공: ${apartment.name} → ${kaptCode} (${matchConfidence}: ${matchReason})`);
              }

              // 상세정보로 데이터 보강
              if (detailInfo) {
                apartment.buildingStructure = detailInfo.codeStr || undefined;

                // 시설 정보 추가
                const surfaceParking = typeof detailInfo.kaptdPcnt === 'number' ? detailInfo.kaptdPcnt : (detailInfo.kaptdPcnt ? parseInt(detailInfo.kaptdPcnt) : 0);
                const undergroundParking = typeof detailInfo.kaptdPcntu === 'number' ? detailInfo.kaptdPcntu : (detailInfo.kaptdPcntu ? parseInt(detailInfo.kaptdPcntu) : 0);
                
                apartment.facilities = {
                  parking: {
                    surface: surfaceParking || undefined,
                    underground: undergroundParking || undefined,
                    total: (surfaceParking + undergroundParking) || undefined,
                  },
                  elevator: typeof detailInfo.kaptdEcnt === 'number' ? detailInfo.kaptdEcnt : (detailInfo.kaptdEcnt ? parseInt(detailInfo.kaptdEcnt) : undefined),
                  cctv: typeof detailInfo.kaptdCccnt === 'number' ? detailInfo.kaptdCccnt : (detailInfo.kaptdCccnt ? parseInt(detailInfo.kaptdCccnt) : undefined),
                  welfare: detailInfo.welfareFacility ? this.parseCommaList(detailInfo.welfareFacility) : undefined,
                  convenient: detailInfo.convenientFacility ? this.parseCommaList(detailInfo.convenientFacility) : undefined,
                  education: detailInfo.educationFacility ? this.parseCommaList(detailInfo.educationFacility) : undefined,
                };

                // 교통 정보 추가
                apartment.transportation = {
                  subway: {
                    line: detailInfo.subwayLine || undefined,
                    station: detailInfo.subwayStation || undefined,
                    distance: detailInfo.kaptdWtimesub || undefined,
                  },
                  bus: {
                    distance: detailInfo.kaptdWtimebus || undefined,
                  },
                };

                // 관리 정보 보강
                if (apartment.management) {
                  apartment.management.company = detailInfo.kaptCcompany || apartment.management.company;
                }
              }

              return [key, apartment] as const;
            } catch (error) {
              console.warn(`아파트 ${apartment.name} 상세정보 조회 실패:`, error);
              return [key, apartment] as const;
            }
          });

          // 모든 보강 작업 완료 대기
          const enhancedEntries = await Promise.all(enhancementPromises);

          // 맵 업데이트
          enhancedEntries.forEach(([key, apartment]) => {
            integratedData.set(key, apartment);
          });

          // 매칭 통계 출력
          const successRate = totalApartments > 0 ? (successfulMatches / totalApartments * 100).toFixed(1) : '0';
          console.log('\n📊 아파트 매칭 통계 결과');
          console.log('='.repeat(40));
          console.log(`🏢 총 아파트 수: ${totalApartments}개`);
          console.log(`✅ 매칭 성공: ${successfulMatches}개 (${successRate}%)`);
          console.log(`❌ 매칭 실패: ${failedMatches}개 (${(100 - parseFloat(successRate)).toFixed(1)}%)`);
          console.log('\n📈 매칭 방법별 상세:');
          console.log(`  🎯 정확한 매칭: ${matchingStats.exact}개`);
          console.log(`  🔍 부분 문자열: ${matchingStats.partial}개`);
          console.log(`  🔑 키워드 매칭: ${matchingStats.keyword}개`);
          console.log(`  🔄 키워드 순서변경: ${matchingStats.reorder}개`);
          console.log(`  🔢 숫자 변형: ${matchingStats.numeric}개`);
          console.log(`  💾 캐시 조회: ${matchingStats.cached}개`);
          console.log(`  ❌ 매칭 실패: ${matchingStats.failed}개`);
          console.log('='.repeat(40));

        } catch (error) {
          console.warn('단지정보 보강 실패:', error);
        }
      }

      return Array.from(integratedData.values());
    } catch (error) {
      console.error('통합 데이터 조회 중 오류:', error);
      throw error;
    }
  }

  // 헬퍼 메서드들
  private generateId(aptNm: string, jibun?: string): string {
    return `${aptNm}-${jibun || 'unknown'}-${Date.now()}`;
  }

  private determineDealType(item: ApartmentRentData): 'lease' | 'rent' | 'short-term' {
    const monthlyRent = this.parseAmount(item.monthlyRent);
    const deposit = this.parseAmount(item.deposit);
    
    // 보증금은 있지만 월세가 없거나 0이면 전세
    if (deposit > 0 && (!monthlyRent || monthlyRent === 0)) {
      return 'lease';
    }
    
    // 보증금과 월세가 모두 있으면 월세
    if (deposit > 0 && monthlyRent > 0) {
      // 계약 타입에 단기가 포함되어 있으면 단기임대
      if (item.contractType?.includes('단기') || item.contractTerm?.includes('단기')) {
        return 'short-term';
      }
      
      // 월세가 200만원 이상이면 단기임대로 분류
      if (monthlyRent > 2000000) {
        return 'short-term';
      }
      
      // 보증금 대비 월세 비율이 높으면 단기임대
      if ((monthlyRent / deposit) > 0.1) { // 월세/보증금 비율이 10% 이상
        return 'short-term';
      }
      
      return 'rent';
    }
    
    // 기본적으로 월세 (fallback)
    return 'rent';
  }

  private parseAmount(amount: string | number | undefined): number {
    // 값이 없으면 0 반환
    if (amount === undefined || amount === null) {
      return 0;
    }

    let numericAmount = 0;

    // 이미 숫자인 경우
    if (typeof amount === 'number') {
      numericAmount = amount;
    }
    // 문자열인 경우 쉼표 제거 후 숫자로 변환
    else if (typeof amount === 'string') {
      numericAmount = parseInt(amount.replace(/,/g, '')) || 0;
    }

    // 정부 API는 만원 단위이므로 10,000을 곱해서 원 단위로 변환
    return numericAmount * 10000;
  }

  private parseCommaList(text: string): string[] {
    if (!text || text.trim() === '') {
      return [];
    }

    return text
      .split(/[,\s]+/) // 쉼표 및 공백으로 분리
      .map(item => item.trim())
      .filter(item => item.length > 0)
      .filter(item => !item.match(/^\([^)]*\)$/)) // 괄호만 있는 항목 제외
      .slice(0, 10); // 최대 10개까지만
  }

  // 지역코드 유틸리티
  getRegionCodes() {
    return {
      seoul: {
        gangnam: '11680', // 강남구
        gangdong: '11740', // 강동구
        gangbuk: '11305', // 강북구
        gangseo: '11500', // 강서구
        gwanak: '11620', // 관악구
        gwangjin: '11215', // 광진구
        guro: '11530', // 구로구
        geumcheon: '11545', // 금천구
        nowon: '11350', // 노원구
        dobong: '11320', // 도봉구
        dongdaemun: '11230', // 동대문구
        dongjak: '11590', // 동작구
        mapo: '11440', // 마포구
        seodaemun: '11410', // 서대문구
        seocho: '11650', // 서초구
        seongdong: '11200', // 성동구
        seongbuk: '11290', // 성북구
        songpa: '11710', // 송파구
        yangcheon: '11470', // 양천구
        yeongdeungpo: '11560', // 영등포구
        yongsan: '11170', // 용산구
        eunpyeong: '11380', // 은평구
        jongno: '11110', // 종로구
        jung: '11140', // 중구
        jungnang: '11260', // 중랑구
      },
    };
  }

  // 현재 년월 생성 (YYYYMM 형식)
  getCurrentYearMonth(): string {
    // 정부 데이터는 보통 2-3개월 지연되므로 3개월 전 데이터 조회
    const now = new Date();
    now.setMonth(now.getMonth() - 3);
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    return `${year}${month}`;
  }

  // 이전 n개월 년월 생성
  getPreviousYearMonth(monthsAgo: number = 1): string {
    const now = new Date();
    now.setMonth(now.getMonth() - monthsAgo);
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    return `${year}${month}`;
  }

  // 캐시 관리 메서드들
  getMappingCacheStats() {
    return apartmentMappingCache.getStats();
  }

  clearMappingCache() {
    apartmentMappingCache.clear();
    console.log('🗑️ 아파트 매핑 캐시가 초기화되었습니다.');
  }

  pruneLowConfidenceCache() {
    apartmentMappingCache.pruneByConfidence('medium');
    console.log('🧹 낮은 신뢰도 캐시 항목들이 제거되었습니다.');
  }

  exportMappingCache(): string {
    return apartmentMappingCache.export();
  }

  importMappingCache(jsonData: string): void {
    apartmentMappingCache.import(jsonData);
    console.log('📥 캐시 데이터를 가져왔습니다.');
  }

  // 캐시에서 유사한 매핑 조회
  findSimilarMappings(apartmentName: string): any[] {
    return apartmentMappingCache.findSimilar(apartmentName);
  }
}

// 싱글톤 인스턴스
export const realEstateApi = new RealEstateApiService();

// 서울 구 타입 정의
type SeoulDistrict = 'gangnam' | 'gangdong' | 'gangbuk' | 'gangseo' | 'gwanak' | 'gwangjin' |
                   'guro' | 'geumcheon' | 'nowon' | 'dobong' | 'dongdaemun' | 'dongjak' |
                   'mapo' | 'seodaemun' | 'seocho' | 'seongdong' | 'seongbuk' | 'songpa' |
                   'yangcheon' | 'yeongdeungpo' | 'yongsan' | 'eunpyeong' | 'jongno' |
                   'jung' | 'jungnang';

// 편의 함수들
export async function fetchSeoulApartmentData(
  district: SeoulDistrict,
  yearMonth?: string,
  useDatabase: boolean = true
): Promise<IntegratedApartmentData[]> {
  const regionCodes = realEstateApi.getRegionCodes();
  const lawdCd = regionCodes.seoul[district];
  const dealYmd = yearMonth || realEstateApi.getCurrentYearMonth();

  // 데이터베이스 기반 (기본값) 또는 API 기반 선택
  if (useDatabase) {
    return realEstateApi.getIntegratedApartmentDataWithDb({
      LAWD_CD: lawdCd,
      DEAL_YMD: dealYmd,
      numOfRows: 1000,
    });
  } else {
    return realEstateApi.getIntegratedApartmentData({
      LAWD_CD: lawdCd,
      DEAL_YMD: dealYmd,
      numOfRows: 1000,
    });
  }
}

export async function searchApartmentsByName(
  apartmentName: string,
  district?: SeoulDistrict
): Promise<IntegratedApartmentData[]> {
  let allData: IntegratedApartmentData[] = [];

  if (district) {
    // 특정 구에서만 검색
    allData = await fetchSeoulApartmentData(district);
  } else {
    // 서울 전체에서 검색 (주요 구들만)
    const majorDistricts: SeoulDistrict[] = [
      'gangnam', 'seocho', 'songpa', 'jongno', 'jung', 'mapo'
    ];

    const promises = majorDistricts.map(d => fetchSeoulApartmentData(d));
    const results = await Promise.all(promises);
    allData = results.flat();
  }

  // 아파트명으로 필터링
  return allData.filter(apt =>
    apt.name.toLowerCase().includes(apartmentName.toLowerCase())
  );
}