/**
 * API 스키마 유효성 검사 테스트
 */

import {
  validateApartmentTradeResponse,
  validateApartmentRentResponse,
  validateApartmentBasicResponse,
  validateApartmentDetailResponse,
  validateApartmentTradeParams,
  validateApartmentRentParams,
  validateApartmentBasicParams,
  validateApartmentDetailParams,
  safeValidateApartmentTradeResponse,
  safeValidateApartmentRentResponse,
  ApartmentTradeDataSchema,
  ApartmentRentDataSchema,
  ApartmentBasicDataSchema,
  ApartmentDetailDataSchema,
} from './schemas';

describe('API 응답 스키마 검증', () => {
  describe('아파트 매매 실거래가 응답 검증', () => {
    const validTradeResponse = {
      header: {
        resultCode: '000',
        resultMsg: 'OK'
      },
      body: {
        items: [
          {
            aptNm: '테스트아파트',
            sggCd: '11110',
            umdNm: '종로1가동',
            dealAmount: '50000',
            dealYear: '2024',
            dealMonth: '07',
            dealDay: '15',
            excluUseAr: '84.97',
            floor: '10',
            buildYear: '2010'
          }
        ],
        numOfRows: 1,
        pageNo: 1,
        totalCount: 1
      }
    };

    it('유효한 응답 검증 성공', () => {
      expect(() => validateApartmentTradeResponse(validTradeResponse)).not.toThrow();
      
      const result = validateApartmentTradeResponse(validTradeResponse);
      expect(result.body.items[0].aptNm).toBe('테스트아파트');
    });

    it('필수 필드 누락 시 에러', () => {
      const invalidResponse = {
        ...validTradeResponse,
        body: {
          ...validTradeResponse.body,
          items: [
            {
              // aptNm 누락
              sggCd: '11110',
              umdNm: '종로1가동',
              dealAmount: '50000',
              dealYear: '2024',
              dealMonth: '07',
              dealDay: '15'
            }
          ]
        }
      };

      expect(() => validateApartmentTradeResponse(invalidResponse)).toThrow();
    });

    it('안전한 검증 - 성공 케이스', () => {
      const result = safeValidateApartmentTradeResponse(validTradeResponse);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body.items[0].aptNm).toBe('테스트아파트');
      }
    });

    it('안전한 검증 - 실패 케이스', () => {
      const invalidResponse = { invalid: 'data' };
      const result = safeValidateApartmentTradeResponse(invalidResponse);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });
  });

  describe('아파트 전월세 실거래가 응답 검증', () => {
    const validRentResponse = {
      header: {
        resultCode: '000',
        resultMsg: 'OK'
      },
      body: {
        items: [
          {
            aptNm: '테스트아파트',
            sggCd: '11110',
            umdNm: '종로1가동',
            deposit: '30000',
            monthlyRent: '50',
            dealYear: '2024',
            dealMonth: '07',
            dealDay: '15'
          }
        ],
        numOfRows: 1,
        pageNo: 1,
        totalCount: 1
      }
    };

    it('유효한 전월세 응답 검증 성공', () => {
      expect(() => validateApartmentRentResponse(validRentResponse)).not.toThrow();
      
      const result = validateApartmentRentResponse(validRentResponse);
      expect(result.body.items[0].deposit).toBe('30000');
      expect(result.body.items[0].monthlyRent).toBe('50');
    });

    it('안전한 검증', () => {
      const result = safeValidateApartmentRentResponse(validRentResponse);
      expect(result.success).toBe(true);
    });
  });

  describe('공동주택 기본 정보 응답 검증', () => {
    const validBasicResponse = {
      header: {
        resultCode: '00',
        resultMsg: 'NORMAL SERVICE'
      },
      body: {
        items: [
          {
            kaptCode: 'A10027875',
            kaptName: '테스트아파트',
            kaptAddr: '서울특별시 종로구',
            kaptDongCnt: '3',
            kaptdaCnt: '182'
          }
        ],
        numOfRows: 1,
        pageNo: 1,
        totalCount: 1
      }
    };

    it('유효한 기본 정보 응답 검증 성공', () => {
      expect(() => validateApartmentBasicResponse(validBasicResponse)).not.toThrow();
      
      const result = validateApartmentBasicResponse(validBasicResponse);
      expect(result.body.items[0].kaptCode).toBe('A10027875');
    });
  });

  describe('공동주택 상세 정보 응답 검증', () => {
    const validDetailResponse = {
      header: {
        resultCode: '00',
        resultMsg: 'NORMAL SERVICE'
      },
      body: {
        items: [
          {
            kaptCode: 'A15876402',
            kaptName: '테스트아파트',
            codeMgr: '위탁관리',
            kaptMgrCnt: '3.5',
            kaptdPcnt: '35',
            kaptdPcntu: '142'
          }
        ],
        numOfRows: 1,
        pageNo: 1,
        totalCount: 1
      }
    };

    it('유효한 상세 정보 응답 검증 성공', () => {
      expect(() => validateApartmentDetailResponse(validDetailResponse)).not.toThrow();
      
      const result = validateApartmentDetailResponse(validDetailResponse);
      expect(result.body.items[0].kaptCode).toBe('A15876402');
    });
  });
});

describe('API 파라미터 스키마 검증', () => {
  describe('매매 실거래가 파라미터 검증', () => {
    it('유효한 파라미터', () => {
      const validParams = {
        LAWD_CD: '11110',
        DEAL_YMD: '202407',
        pageNo: 1,
        numOfRows: 100
      };

      expect(() => validateApartmentTradeParams(validParams)).not.toThrow();
    });

    it('지역코드 길이 검증', () => {
      const invalidParams = {
        LAWD_CD: '111', // 5자리가 아님
        DEAL_YMD: '202407'
      };

      expect(() => validateApartmentTradeParams(invalidParams)).toThrow('지역코드는 5자리여야 합니다');
    });

    it('계약년월 길이 검증', () => {
      const invalidParams = {
        LAWD_CD: '11110',
        DEAL_YMD: '2024' // 6자리가 아님
      };

      expect(() => validateApartmentTradeParams(invalidParams)).toThrow('계약년월은 6자리(YYYYMM)여야 합니다');
    });

    it('페이지 번호 최소값 검증', () => {
      const invalidParams = {
        LAWD_CD: '11110',
        DEAL_YMD: '202407',
        pageNo: 0
      };

      expect(() => validateApartmentTradeParams(invalidParams)).toThrow();
    });

    it('결과 수 범위 검증', () => {
      const invalidParams = {
        LAWD_CD: '11110',
        DEAL_YMD: '202407',
        numOfRows: 1500 // 최대 1000
      };

      expect(() => validateApartmentTradeParams(invalidParams)).toThrow();
    });
  });

  describe('전월세 실거래가 파라미터 검증', () => {
    it('유효한 파라미터', () => {
      const validParams = {
        LAWD_CD: '11110',
        DEAL_YMD: '202407'
      };

      expect(() => validateApartmentRentParams(validParams)).not.toThrow();
    });
  });

  describe('기본 정보 파라미터 검증', () => {
    it('유효한 단지코드', () => {
      const validParams = {
        kaptCode: 'A10027875'
      };

      expect(() => validateApartmentBasicParams(validParams)).not.toThrow();
    });

    it('단지코드 길이 검증', () => {
      const invalidParams = {
        kaptCode: 'A1002787' // 9자리가 아님
      };

      expect(() => validateApartmentBasicParams(invalidParams)).toThrow('단지코드는 9자리여야 합니다');
    });
  });

  describe('상세 정보 파라미터 검증', () => {
    it('유효한 단지코드', () => {
      const validParams = {
        kaptCode: 'A15876402'
      };

      expect(() => validateApartmentDetailParams(validParams)).not.toThrow();
    });
  });
});

describe('개별 데이터 스키마 검증', () => {
  describe('ApartmentTradeDataSchema', () => {
    it('필수 필드만 있는 데이터', () => {
      const minimalData = {
        aptNm: '테스트아파트',
        sggCd: '11110',
        umdNm: '종로1가동',
        dealAmount: '50000',
        dealYear: '2024',
        dealMonth: '07',
        dealDay: '15'
      };

      expect(() => ApartmentTradeDataSchema.parse(minimalData)).not.toThrow();
    });

    it('선택적 필드가 포함된 데이터', () => {
      const fullData = {
        aptNm: '테스트아파트',
        sggCd: '11110',
        umdNm: '종로1가동',
        dealAmount: '50000',
        dealYear: '2024',
        dealMonth: '07',
        dealDay: '15',
        jibun: '123-4',
        excluUseAr: '84.97',
        floor: '10',
        buildYear: '2010',
        dealingGbn: '중개거래'
      };

      expect(() => ApartmentTradeDataSchema.parse(fullData)).not.toThrow();
    });
  });

  describe('ApartmentRentDataSchema', () => {
    it('전월세 데이터 검증', () => {
      const rentData = {
        aptNm: '테스트아파트',
        sggCd: '11110',
        umdNm: '종로1가동',
        deposit: '30000',
        monthlyRent: '50',
        dealYear: '2024',
        dealMonth: '07',
        dealDay: '15'
      };

      expect(() => ApartmentRentDataSchema.parse(rentData)).not.toThrow();
    });
  });

  describe('ApartmentBasicDataSchema', () => {
    it('기본 정보 데이터 검증', () => {
      const basicData = {
        kaptCode: 'A10027875',
        kaptName: '테스트아파트',
        kaptAddr: '서울특별시 종로구'
      };

      expect(() => ApartmentBasicDataSchema.parse(basicData)).not.toThrow();
    });
  });

  describe('ApartmentDetailDataSchema', () => {
    it('상세 정보 데이터 검증', () => {
      const detailData = {
        kaptCode: 'A15876402',
        kaptName: '테스트아파트'
      };

      expect(() => ApartmentDetailDataSchema.parse(detailData)).not.toThrow();
    });
  });
});