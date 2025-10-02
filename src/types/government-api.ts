/**
 * 정부 API 타입 정의
 * 국토교통부 아파트 관련 오픈 API
 */

// 공통 API 응답 구조
export interface ApiResponse<T> {
  header: {
    resultCode: string;
    resultMsg: string;
  };
  body: {
    items: T[];
    numOfRows: number;
    pageNo: number;
    totalCount: number;
  };
}

// 공통 요청 파라미터
export interface BaseApiParams {
  serviceKey: string;
  pageNo?: number;
  numOfRows?: number;
}

// === 아파트 매매 실거래가 API ===
export interface ApartmentTradeParams extends BaseApiParams {
  LAWD_CD: string;    // 지역코드 (5자리)
  DEAL_YMD: string;   // 계약년월 (6자리, YYYYMM)
}

export interface ApartmentTradeData {
  // 기본 정보
  aptNm: string;           // 단지명
  sggCd: string;           // 지역코드
  umdNm: string;           // 법정동
  jibun?: string;          // 지번
  
  // 거래 정보
  dealAmount: string;      // 거래금액(만원)
  dealYear: string;        // 계약년도
  dealMonth: string;       // 계약월
  dealDay: string;         // 계약일
  
  // 아파트 정보
  excluUseAr?: string;     // 전용면적
  floor?: string;          // 층
  buildYear?: string;      // 건축년도
  
  // 거래 상세
  dealingGbn?: string;     // 거래유형 (중개거래/직거래)
  cdealType?: string;      // 해제여부
  cdealDay?: string;       // 해제사유발생일
  
  // 부가 정보
  aptDong?: string;        // 아파트 동명
  estateAgentSggNm?: string; // 중개사소재지
  rgstDate?: string;       // 등기일자
  slerGbn?: string;        // 매도자 거래주체정보
  buyerGbn?: string;       // 매수자 거래주체정보
  landLeaseholdGbn?: string; // 토지임대부 아파트 여부
}

// === 아파트 전월세 실거래가 API ===
export interface ApartmentRentParams extends BaseApiParams {
  LAWD_CD: string;    // 지역코드 (5자리)
  DEAL_YMD: string;   // 계약년월 (6자리, YYYYMM)
}

export interface ApartmentRentData {
  // 기본 정보
  aptNm: string;           // 아파트명
  sggCd: string;           // 지역코드
  umdNm: string;           // 법정동
  jibun?: string;          // 지번
  
  // 임대 정보
  deposit: string;         // 보증금액(만원)
  monthlyRent: string;     // 월세금액(만원)
  dealYear: string;        // 계약년도
  dealMonth: string;       // 계약월
  dealDay: string;         // 계약일
  
  // 아파트 정보
  excluUseAr?: string;     // 전용면적
  floor?: string;          // 층
  buildYear?: string;      // 건축년도
  
  // 계약 정보
  contractTerm?: string;   // 계약기간
  contractType?: string;   // 계약구분
  useRRRight?: string;     // 갱신요구권사용
  
  // 종전 계약 정보
  preDeposit?: string;     // 종전계약보증금
  preMonthlyRent?: string; // 종전계약월세
}

// === 공동주택 기본 정보 API V4 ===
export interface ApartmentBasicV4Params {
  serviceKey: string;     // 공공데이터포털에서 발급받은 인증키
  kaptCode: string;       // 단지코드 (9자리)
}

export interface ApartmentBasicV4Data {
  // 기본 정보
  zipcode?: string;        // 우편번호
  kaptCode: string;        // 단지코드
  kaptName: string;        // 단지명
  kaptAddr: string;        // 법정동주소
  doroJuso?: string;       // 도로명주소
  bjdCode?: string;        // 법정동코드
  
  // 분양 및 관리 정보
  codeSaleNm?: string;     // 분양형태
  codeHeatNm?: string;     // 난방방식
  codeAptNm?: string;      // 단지분류
  codeMgrNm?: string;      // 관리방식
  codeHallNm?: string;     // 복도유형
  
  // 건물 정보
  kaptTarea?: number;      // 연면적(㎡)
  kaptDongCnt?: number;    // 동수
  kaptdaCnt?: string;      // 세대수
  hoCnt?: number;          // 호수
  kaptUsedate?: string;    // 사용승인일
  kaptMarea?: number;      // 관리비부과면적(㎡)
  privArea?: number;       // 단지 전용면적합(㎡)
  
  // 세대현황 (전용면적별) - V4에서 이름 변경
  kaptMparea60?: number;   // 60㎡ 이하
  kaptMparea85?: number;   // 60㎡ ~ 85㎡ 이하  
  kaptMparea135?: number;  // 85㎡ ~ 135㎡ 이하
  kaptMparea136?: number;  // 135㎡ 초과
  
  // 업체 정보
  kaptBcompany?: string;   // 시공사
  kaptAcompany?: string;   // 시행사
  
  // 연락처
  kaptTel?: string;        // 관리사무소연락처
  kaptFax?: string;        // 관리사무소팩스
  kaptUrl?: string;        // 홈페이지주소
  
  // V4 추가 정보
  kaptTopFloor?: number;   // 최고층수
  ktownFlrNo?: number;     // 지상층수
  kaptBaseFloor?: number;  // 지하층수
  kaptdEcntp?: number;     // 전기용량
}

// === 공동주택 상세 정보 API V4 ===
export interface ApartmentDetailV4Params {
  serviceKey: string;     // 공공데이터포털에서 받은 인증키
  kaptCode: string;       // 단지코드 (9자리)
}

export interface ApartmentDetailV4Data {
  // 기본 정보
  kaptCode: string;        // 단지코드
  kaptName: string;        // 단지명
  
  // 관리 정보
  codeMgr?: string;        // 일반관리방식
  kaptMgrCnt?: number;     // 일반관리인원
  kaptCcompany?: string;   // 일반관리 계약업체
  
  // 경비 관리
  codeSec?: string;        // 경비관리방식
  kaptdScnt?: number;      // 경비관리인원
  kaptdSecCom?: string;    // 경비관리 계약업체
  
  // 청소 관리
  codeClean?: string;      // 청소관리방식
  kaptdClcnt?: number;     // 청소관리인원
  
  // 소독 관리
  codeDisinf?: string;     // 소독관리방식
  kaptdDcnt?: number;      // 소독관리 연간소독횟수
  disposalType?: string;   // 소독방법
  
  // 시설 정보
  codeGarbage?: string;    // 음식물처리방법
  codeStr?: string;        // 건물구조
  kaptdEcapa?: number;     // 수전용량
  codeEcon?: string;       // 세대전기계약방식
  codeEmgr?: string;       // 전기안전관리자법정선임여부
  codeFalarm?: string;     // 화재수신반방식
  codeWsupply?: string;    // 급수방식
  
  // 승강기 및 주차
  codeElev?: string;       // 승강기관리형태
  kaptdEcnt?: number;      // 승강기대수
  kaptdPcnt?: number;      // 주차대수(지상)
  kaptdPcntu?: number;     // 주차대수(지하)
  codeNet?: string;        // 주차관제.홈네트워크
  
  // 보안 시설
  kaptdCccnt?: number;     // CCTV대수
  
  // 부대시설
  welfareFacility?: string;     // 부대.복리시설
  convenientFacility?: string;  // 편의시설
  educationFacility?: string;   // 교육시설
  
  // 교통 정보
  kaptdWtimebus?: string;  // 버스정류장 거리
  subwayLine?: string;     // 지하철호선
  subwayStation?: string;  // 지하철역명
  kaptdWtimesub?: string;  // 지하철역 거리
  
  // V4 추가 정보
  undergroundElChargerCnt?: number; // 지하 전기충전기 대수
  groundElChargerCnt?: number;      // 지상 전기충전기 대수
  useYn?: string;                   // 사용여부
}

// === 단지목록제공서비스 V3 API ===
export interface ApartmentListV3BaseParams {
  serviceKey: string;     // 공공데이터포털에서 받은 인증키
  pageNo?: string;        // 페이지번호
  numOfRows?: string;     // 목록 건수
}

// 시도 아파트 목록
export interface ApartmentListSidoV3Params extends ApartmentListV3BaseParams {
  sidoCode: string;       // 시도코드
}

// 시군구 아파트 목록
export interface ApartmentListSigunguV3Params extends ApartmentListV3BaseParams {
  sigunguCode: string;    // 시군구코드
}

// 법정동 아파트 목록
export interface ApartmentListLegaldongV3Params extends ApartmentListV3BaseParams {
  bjdCode: string;        // 시군구코드+법정동코드
}

// 도로명 아파트 목록
export interface ApartmentListRoadnameV3Params extends ApartmentListV3BaseParams {
  roadCode: string;       // 시군구번호+도로명번호
}

// 전체 아파트 목록
export interface ApartmentListTotalV3Params extends ApartmentListV3BaseParams {
  // pageNo, numOfRows만 사용
}

// 단지목록 기본 응답 데이터
export interface ApartmentListV3Data {
  kaptCode: string;       // 단지코드
  kaptName: string;       // 단지명
  as1?: string;           // 추가정보1
  as2?: string;           // 추가정보2
  as3?: string;           // 추가정보3
  as4?: string;           // 추가정보4
  bjdCode?: string;       // 법정동코드
}

// 도로명 아파트 목록 응답 데이터 (구조가 다름)
export interface ApartmentListRoadnameV3Data {
  kaptCode: string;       // 단지코드
  kaptName: string;       // 단지명
  doroJuso?: string;      // 도로명주소
}

// V3 응답 구조 (V1과 다름)
export interface ApiV3Response<T> {
  header: {
    resultCode: string;
    resultMsg: string;
  };
  body: {
    items: T[];
    numOfRows: string;
    pageNo: string;
    totalCount: string;
  };
}

// 단일 아이템 응답 구조 (기본정보, 상세정보)
export interface ApiV4SingleResponse<T> {
  header: {
    resultCode: string;
    resultMsg: string;
  };
  body: {
    item: T;
  };
}

// === API 엔드포인트 정의 ===
export const API_ENDPOINTS = {
  // 실거래가 정보
  APARTMENT_TRADE: 'https://apis.data.go.kr/1613000/RTMSDataSvcAptTrade/getRTMSDataSvcAptTrade',
  APARTMENT_RENT: 'https://apis.data.go.kr/1613000/RTMSDataSvcAptRent/getRTMSDataSvcAptRent',
  
  // 단지 기본 정보 V4 (업데이트)
  APARTMENT_BASIC_V4: 'https://apis.data.go.kr/1613000/AptBasisInfoServiceV4/getAphusBassInfoV4',
  APARTMENT_DETAIL_V4: 'https://apis.data.go.kr/1613000/AptBasisInfoServiceV4/getAphusDtilInfoV4',
  
  // 단지목록제공서비스 V3 (신규)
  APARTMENT_LIST_SIDO_V3: 'https://apis.data.go.kr/1613000/AptListService3/getSidoAptList3',
  APARTMENT_LIST_SIGUNGU_V3: 'https://apis.data.go.kr/1613000/AptListService3/getSigunguAptList3',
  APARTMENT_LIST_TOTAL_V3: 'https://apis.data.go.kr/1613000/AptListService3/getTotalAptList3',
  APARTMENT_LIST_LEGALDONG_V3: 'https://apis.data.go.kr/1613000/AptListService3/getLegaldongAptList3',
  APARTMENT_LIST_ROADNAME_V3: 'https://apis.data.go.kr/1613000/AptListService3/getRoadnameAptList3',
  
  // 레거시 엔드포인트 (하위 호환성)
  APARTMENT_BASIC: 'https://apis.data.go.kr/1613000/AptBasisInfoService1/getAphusBassInfo',
  APARTMENT_DETAIL: 'https://apis.data.go.kr/1613000/AptBasisInfoService1/getAphusDtlInfo',
} as const;

// === 에러 코드 정의 ===
export const API_ERROR_CODES = {
  '00': '성공',
  '01': 'Application Error',
  '02': 'DB Error', 
  '03': 'No Data',
  '04': 'HTTP Error',
  '05': 'Service Time Out',
  '10': '잘못된 요청 파라미터 에러',
  '11': '필수 요청 파라미터가 없음',
  '12': '해당 오픈 API 서비스가 없거나 폐기됨',
  '20': '서비스 접근 거부',
  '22': '서비스 요청 제한 횟수 초과 에러',
  '30': '등록되지 않은 서비스키',
  '31': '기간 만료된 서비스키',
  '32': '등록되지 않은 도메인명 또는 IP 주소',
} as const;

export type ApiErrorCode = keyof typeof API_ERROR_CODES;

// === 커스텀 에러 클래스 ===
export class GovernmentApiError extends Error {
  constructor(
    public code: ApiErrorCode,
    public description: string,
    public originalError?: unknown
  ) {
    super(`[${code}] ${API_ERROR_CODES[code] || 'Unknown Error'}: ${description}`);
    this.name = 'GovernmentApiError';
  }
}

// === 유틸리티 타입 ===
export type ApartmentTradeResponse = ApiResponse<ApartmentTradeData>;
export type ApartmentRentResponse = ApiResponse<ApartmentRentData>;

// V4 API 응답 타입
export type ApartmentBasicV4Response = ApiV4SingleResponse<ApartmentBasicV4Data>;
export type ApartmentDetailV4Response = ApiV4SingleResponse<ApartmentDetailV4Data>;

// V3 API 응답 타입
export type ApartmentListSidoV3Response = ApiV3Response<ApartmentListV3Data>;
export type ApartmentListSigunguV3Response = ApiV3Response<ApartmentListV3Data>;
export type ApartmentListTotalV3Response = ApiV3Response<ApartmentListV3Data>;
export type ApartmentListLegaldongV3Response = ApiV3Response<ApartmentListV3Data>;
export type ApartmentListRoadnameV3Response = ApiV3Response<ApartmentListRoadnameV3Data>;

// 레거시 타입 (하위 호환성)
export type ApartmentBasicResponse = ApiResponse<ApartmentBasicV4Data>;
export type ApartmentDetailResponse = ApiResponse<ApartmentDetailV4Data>;