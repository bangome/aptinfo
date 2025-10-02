/**
 * API 응답 스키마 유효성 검사
 * Zod를 사용한 런타임 타입 검증
 */

import { z } from 'zod';

// 공통 스키마
const ApiHeaderSchema = z.object({
  resultCode: z.string(),
  resultMsg: z.string(),
});

const ApiBodySchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    numOfRows: z.number(),
    pageNo: z.number(),
    totalCount: z.number(),
  });

const ApiResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    header: ApiHeaderSchema,
    body: ApiBodySchema(itemSchema),
  });

// 아파트 매매 실거래가 데이터 스키마
export const ApartmentTradeDataSchema = z.object({
  // 기본 정보 (필수)
  aptNm: z.string(),
  sggCd: z.string(),
  umdNm: z.string(),
  dealAmount: z.string(),
  dealYear: z.string(),
  dealMonth: z.string(),
  dealDay: z.string(),
  
  // 선택적 필드
  jibun: z.string().optional(),
  excluUseAr: z.string().optional(),
  floor: z.string().optional(),
  buildYear: z.string().optional(),
  dealingGbn: z.string().optional(),
  cdealType: z.string().optional(),
  cdealDay: z.string().optional(),
  aptDong: z.string().optional(),
  estateAgentSggNm: z.string().optional(),
  rgstDate: z.string().optional(),
  slerGbn: z.string().optional(),
  buyerGbn: z.string().optional(),
  landLeaseholdGbn: z.string().optional(),
});

// 아파트 전월세 실거래가 데이터 스키마
export const ApartmentRentDataSchema = z.object({
  // 기본 정보 (필수)
  aptNm: z.string(),
  sggCd: z.string(),
  umdNm: z.string(),
  deposit: z.string(),
  monthlyRent: z.string(),
  dealYear: z.string(),
  dealMonth: z.string(),
  dealDay: z.string(),
  
  // 선택적 필드
  jibun: z.string().optional(),
  excluUseAr: z.string().optional(),
  floor: z.string().optional(),
  buildYear: z.string().optional(),
  contractTerm: z.string().optional(),
  contractType: z.string().optional(),
  useRRRight: z.string().optional(),
  preDeposit: z.string().optional(),
  preMonthlyRent: z.string().optional(),
});

// 공동주택 기본 정보 데이터 스키마
export const ApartmentBasicDataSchema = z.object({
  // 기본 정보 (필수)
  kaptCode: z.string(),
  kaptName: z.string(),
  kaptAddr: z.string(),
  
  // 선택적 필드
  doroJuso: z.string().optional(),
  bjdCode: z.string().optional(),
  codeSaleNm: z.string().optional(),
  codeHeatNm: z.string().optional(),
  codeAptNm: z.string().optional(),
  codeMgrNm: z.string().optional(),
  codeHallNm: z.string().optional(),
  kaptTarea: z.string().optional(),
  kaptDongCnt: z.string().optional(),
  kaptdaCnt: z.string().optional(),
  kaptUsedate: z.string().optional(),
  kaptMarea: z.string().optional(),
  privArea: z.string().optional(),
  kaptMparea_60: z.string().optional(),
  kaptMparea_85: z.string().optional(),
  kaptMparea_135: z.string().optional(),
  kaptMparea_136: z.string().optional(),
  kaptBcompany: z.string().optional(),
  kaptAcompany: z.string().optional(),
  kaptTel: z.string().optional(),
  kaptFax: z.string().optional(),
  kaptUrl: z.string().optional(),
  hoCnt: z.string().optional(),
});

// 공동주택 상세 정보 데이터 스키마
export const ApartmentDetailDataSchema = z.object({
  // 기본 정보 (필수)
  kaptCode: z.string(),
  kaptName: z.string(),
  
  // 선택적 필드
  codeMgr: z.string().optional(),
  kaptMgrCnt: z.string().optional(),
  kaptCcompany: z.string().optional(),
  codeSec: z.string().optional(),
  kaptdScnt: z.string().optional(),
  kaptdSecCom: z.string().optional(),
  codeClean: z.string().optional(),
  kaptdClcnt: z.string().optional(),
  codeDisinf: z.string().optional(),
  kaptdDcnt: z.string().optional(),
  disposalType: z.string().optional(),
  codeGarbage: z.string().optional(),
  codeStr: z.string().optional(),
  kaptdEcapa: z.string().optional(),
  codeEcon: z.string().optional(),
  codeEmgr: z.string().optional(),
  codeFalarm: z.string().optional(),
  codeWsupply: z.string().optional(),
  codeElev: z.string().optional(),
  kaptdEcnt: z.string().optional(),
  kaptdPcnt: z.string().optional(),
  kaptdPcntu: z.string().optional(),
  codeNet: z.string().optional(),
  kaptdCccnt: z.string().optional(),
  welfareFacility: z.string().optional(),
  convenientFacility: z.string().optional(),
  educationFacility: z.string().optional(),
  kaptdWtimebus: z.string().optional(),
  subwayLine: z.string().optional(),
  subwayStation: z.string().optional(),
  kaptdWtimesub: z.string().optional(),
});

// API 응답 스키마들
export const ApartmentTradeResponseSchema = ApiResponseSchema(ApartmentTradeDataSchema);
export const ApartmentRentResponseSchema = ApiResponseSchema(ApartmentRentDataSchema);
export const ApartmentBasicResponseSchema = ApiResponseSchema(ApartmentBasicDataSchema);
export const ApartmentDetailResponseSchema = ApiResponseSchema(ApartmentDetailDataSchema);

// 스키마 유효성 검사 함수들
export function validateApartmentTradeResponse(data: unknown) {
  return ApartmentTradeResponseSchema.parse(data);
}

export function validateApartmentRentResponse(data: unknown) {
  return ApartmentRentResponseSchema.parse(data);
}

export function validateApartmentBasicResponse(data: unknown) {
  return ApartmentBasicResponseSchema.parse(data);
}

export function validateApartmentDetailResponse(data: unknown) {
  return ApartmentDetailResponseSchema.parse(data);
}

// 안전한 파싱 함수들 (에러 대신 결과 객체 반환)
export function safeValidateApartmentTradeResponse(data: unknown) {
  return ApartmentTradeResponseSchema.safeParse(data);
}

export function safeValidateApartmentRentResponse(data: unknown) {
  return ApartmentRentResponseSchema.safeParse(data);
}

export function safeValidateApartmentBasicResponse(data: unknown) {
  return ApartmentBasicResponseSchema.safeParse(data);
}

export function safeValidateApartmentDetailResponse(data: unknown) {
  return ApartmentDetailResponseSchema.safeParse(data);
}

// 파라미터 스키마들
export const ApartmentTradeParamsSchema = z.object({
  LAWD_CD: z.string().length(5, '지역코드는 5자리여야 합니다'),
  DEAL_YMD: z.string().length(6, '계약년월은 6자리(YYYYMM)여야 합니다'),
  pageNo: z.number().min(1).optional(),
  numOfRows: z.number().min(1).max(1000).optional(),
});

export const ApartmentRentParamsSchema = z.object({
  LAWD_CD: z.string().length(5, '지역코드는 5자리여야 합니다'),
  DEAL_YMD: z.string().length(6, '계약년월은 6자리(YYYYMM)여야 합니다'),
  pageNo: z.number().min(1).optional(),
  numOfRows: z.number().min(1).max(1000).optional(),
});

export const ApartmentBasicParamsSchema = z.object({
  kaptCode: z.string().length(9, '단지코드는 9자리여야 합니다'),
});

export const ApartmentDetailParamsSchema = z.object({
  kaptCode: z.string().length(9, '단지코드는 9자리여야 합니다'),
});

// 파라미터 유효성 검사 함수들
export function validateApartmentTradeParams(params: unknown) {
  return ApartmentTradeParamsSchema.parse(params);
}

export function validateApartmentRentParams(params: unknown) {
  return ApartmentRentParamsSchema.parse(params);
}

export function validateApartmentBasicParams(params: unknown) {
  return ApartmentBasicParamsSchema.parse(params);
}

export function validateApartmentDetailParams(params: unknown) {
  return ApartmentDetailParamsSchema.parse(params);
}