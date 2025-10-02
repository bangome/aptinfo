/**
 * DataSyncService 테스트
 */

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.NEXT_PUBLIC_DATA_GO_KR_SERVICE_KEY = 'test-data-go-kr-key';

import { DataSyncService } from './dataSyncService';

// Mock supabase
const mockSupabase = {
  rpc: jest.fn(),
  from: jest.fn(() => ({
    upsert: jest.fn(() => ({
      select: jest.fn().mockResolvedValue({
        data: [{ kapt_code: 'A10027875' }],
        error: null
      })
    }))
  }))
};

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabase)
}));

// Mock government API service responses
const mockApiResponse = {
  header: { resultCode: '00', resultMsg: 'NORMAL SERVICE' },
  body: {
    items: [
      {
        aptNm: '테스트아파트',
        sggCd: '11110',
        umdNm: '종로1가',
        dealAmount: '100000',
        dealYear: '2024',
        dealMonth: '01',
        dealDay: '15',
        jibun: '123',
        excluUseAr: '85.5',
        floor: '10',
        buildYear: '2020',
        dealingGbn: '직거래'
      }
    ],
    numOfRows: 1,
    pageNo: 1,
    totalCount: 1
  }
};

// V4 API Mock responses
const mockV4BasicResponse = {
  header: { resultCode: '00', resultMsg: 'NORMAL SERVICE' },
  body: {
    item: {
      zipcode: '03058',
      kaptCode: 'A10027875',
      kaptName: '테스트아파트',
      kaptAddr: '서울시 종로구 종로1가',
      doroJuso: '서울시 종로구 종로 123',
      bjdCode: '1111010100',
      codeSaleNm: '분양',
      codeHeatNm: '지역난방',
      kaptTarea: 12345.67,
      kaptDongCnt: 5,
      kaptdaCnt: '100',
      hoCnt: 100,
      kaptBcompany: '테스트건설',
      kaptAcompany: '테스트개발',
      kaptTel: '02-1234-5678',
      kaptFax: '02-1234-5679',
      kaptUrl: 'http://test.com',
      codeAptNm: '아파트',
      codeMgrNm: '위탁관리',
      codeHallNm: '복도식',
      kaptUsedate: '20200101',
      kaptMarea: 8000.0,
      kaptMparea60: 30,
      kaptMparea85: 50,
      kaptMparea135: 20,
      kaptMparea136: 0,
      privArea: 7500.0,
      kaptTopFloor: 15,
      ktownFlrNo: 15,
      kaptBaseFloor: 2,
      kaptdEcntp: 1000
    }
  }
};

const mockV4DetailResponse = {
  header: { resultCode: '00', resultMsg: 'NORMAL SERVICE' },
  body: {
    item: {
      kaptCode: 'A10027875',
      kaptName: '테스트아파트',
      codeMgr: '위탁관리',
      kaptMgrCnt: 3,
      kaptCcompany: '테스트관리업체',
      codeSec: '위탁경비',
      kaptdScnt: 5,
      kaptdSecCom: '테스트경비업체',
      codeClean: '위탁청소',
      kaptdClcnt: 2,
      codeDisinf: '연4회',
      kaptdDcnt: 4,
      disposalType: '분무',
      codeGarbage: '음식물쓰레기처리기',
      codeStr: '철근콘크리트',
      kaptdEcapa: 500,
      codeEcon: '고압',
      codeEmgr: 'Y',
      codeFalarm: 'P형',
      codeWsupply: '직결급수',
      codeElev: '자체관리',
      kaptdEcnt: 2,
      kaptdPcnt: 80,
      kaptdPcntu: 120,
      codeNet: 'Y',
      kaptdCccnt: 20,
      welfareFacility: '커뮤니티센터, 피트니스센터',
      convenientFacility: '상가',
      educationFacility: '어린이집',
      kaptdWtimebus: '도보 5분',
      subwayLine: '1호선',
      subwayStation: '종로5가역',
      kaptdWtimesub: '도보 10분',
      undergroundElChargerCnt: 5,
      groundElChargerCnt: 3,
      useYn: 'Y'
    }
  }
};

jest.mock('@/lib/api/government-api-client', () => ({
  getGovernmentApiClient: jest.fn(() => ({
    getApartmentTradeData: jest.fn().mockResolvedValue(mockApiResponse),
    getApartmentRentData: jest.fn().mockResolvedValue(mockApiResponse),
    getApartmentBasicInfoV4: jest.fn().mockResolvedValue(mockV4BasicResponse),
    getApartmentDetailInfoV4: jest.fn().mockResolvedValue(mockV4DetailResponse),
    // 레거시 지원
    getApartmentBasicInfo: jest.fn().mockResolvedValue({
      header: mockV4BasicResponse.header,
      body: {
        items: [mockV4BasicResponse.body.item],
        numOfRows: 1,
        pageNo: 1,
        totalCount: 1
      }
    }),
    getApartmentDetailInfo: jest.fn().mockResolvedValue({
      header: mockV4DetailResponse.header,
      body: {
        items: [mockV4DetailResponse.body.item],
        numOfRows: 1,
        pageNo: 1,
        totalCount: 1
      }
    })
  }))
}));

describe('DataSyncService', () => {
  let dataSyncService: DataSyncService;

  beforeEach(() => {
    dataSyncService = new DataSyncService();
    jest.clearAllMocks();
  });

  describe('syncApartmentTradeData', () => {
    it('아파트 매매 데이터를 성공적으로 동기화해야 합니다', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: [{ inserted_count: 1, updated_count: 0 }],
        error: null
      });

      const result = await dataSyncService.syncApartmentTradeData('11110', '202401');

      expect(result.success).toBe(true);
      expect(result.totalProcessed).toBe(1);
      expect(result.totalInserted).toBe(1);
      expect(result.totalUpdated).toBe(0);
      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        'upsert_apartment_trade_batch',
        expect.any(Object)
      );
    });

    it('API 에러 발생 시 적절히 처리해야 합니다', async () => {
      const errorResponse = {
        header: { resultCode: '10', resultMsg: '잘못된 요청 파라미터' },
        body: {
          items: [],
          numOfRows: 0,
          pageNo: 1,
          totalCount: 0
        }
      };

      const mockApiService = require('@/lib/api/government-api-client').getGovernmentApiClient();
      mockApiService.getApartmentTradeData.mockRejectedValue(new Error('잘못된 요청 파라미터'));

      await expect(dataSyncService.syncApartmentTradeData('invalid', 'invalid')).rejects.toThrow('매매 실거래가 동기화 실패');
    });

    it('데이터베이스 에러 발생 시 적절히 처리해야 합니다', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      });

      await expect(dataSyncService.syncApartmentTradeData('11110', '202401')).rejects.toThrow('매매 실거래가 동기화 실패');
    });

    it('데이터가 없는 경우를 올바르게 처리해야 합니다', async () => {
      const emptyResponse = {
        header: { resultCode: '00', resultMsg: 'NORMAL SERVICE' },
        body: { 
          items: [], 
          numOfRows: 0,
          pageNo: 1,
          totalCount: 0 
        }
      };

      const mockApiService = require('@/lib/api/government-api-client').getGovernmentApiClient();
      mockApiService.getApartmentTradeData.mockResolvedValue(emptyResponse);

      const result = await dataSyncService.syncApartmentTradeData('11110', '202401');

      expect(result.totalProcessed).toBe(0);
      expect(result.totalInserted).toBe(0);
      expect(result.totalUpdated).toBe(0);
    });
  });

  describe('syncApartmentRentData', () => {
    it('아파트 전월세 데이터를 성공적으로 동기화해야 합니다', async () => {
      const rentResponse = {
        header: { resultCode: '00', resultMsg: 'NORMAL SERVICE' },
        body: {
          items: [
            {
              aptNm: '테스트아파트',
              sggCd: '11110',
              umdNm: '종로1가',
              deposit: '50000',
              monthlyRent: '200',
              dealYear: '2024',
              dealMonth: '01',
              dealDay: '15',
              jibun: '123',
              excluUseAr: '85.5',
              floor: '10',
              buildYear: '2020'
            }
          ],
          numOfRows: 1,
          pageNo: 1,
          totalCount: 1
        }
      };

      const mockApiService = require('@/lib/api/government-api-client').getGovernmentApiClient();
      mockApiService.getApartmentRentData.mockResolvedValue(rentResponse);

      mockSupabase.rpc.mockResolvedValue({
        data: { inserted_count: 1, updated_count: 0 },
        error: null
      });

      const result = await dataSyncService.syncApartmentRentData('11110', '202401');

      expect(result.totalProcessed).toBe(1);
      expect(result.totalInserted).toBe(1);
      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        'upsert_apartment_rent_batch',
        expect.any(Object)
      );
    });
  });

  describe('syncApartmentComplexes', () => {
    it('아파트 단지 정보를 성공적으로 동기화해야 합니다 (V4 API)', async () => {
      const mockApiService = require('@/lib/api/government-api-client').getGovernmentApiClient();
      mockApiService.getApartmentBasicInfoV4.mockResolvedValue(mockV4BasicResponse);
      mockApiService.getApartmentDetailInfoV4.mockResolvedValue(mockV4DetailResponse);

      mockSupabase.from = jest.fn(() => ({
        upsert: jest.fn(() => ({
          select: jest.fn().mockResolvedValue({
            data: [{ kapt_code: 'A10027875' }],
            error: null
          })
        }))
      }));

      const result = await dataSyncService.syncApartmentComplexes(['A10027875']);

      expect(result.totalProcessed).toBe(1);
      expect(result.totalUpdated).toBe(1);
      expect(mockApiService.getApartmentBasicInfoV4).toHaveBeenCalledWith({ kaptCode: 'A10027875' });
      expect(mockApiService.getApartmentDetailInfoV4).toHaveBeenCalledWith({ kaptCode: 'A10027875' });
    });

    it('V4 상세 정보 조회 실패 시 기본 정보만으로 처리해야 합니다', async () => {
      const mockApiService = require('@/lib/api/government-api-client').getGovernmentApiClient();
      mockApiService.getApartmentBasicInfoV4.mockResolvedValue(mockV4BasicResponse);
      mockApiService.getApartmentDetailInfoV4.mockRejectedValue(new Error('상세 정보 없음'));

      mockSupabase.from = jest.fn(() => ({
        upsert: jest.fn(() => ({
          select: jest.fn().mockResolvedValue({
            data: [{ kapt_code: 'A10027875' }],
            error: null
          })
        }))
      }));

      const result = await dataSyncService.syncApartmentComplexes(['A10027875']);

      expect(result.totalProcessed).toBe(1);
      expect(result.totalUpdated).toBe(1);
      expect(mockApiService.getApartmentBasicInfoV4).toHaveBeenCalled();
    });

    it('빈 단지 목록에 대해 적절히 처리해야 합니다', async () => {
      const result = await dataSyncService.syncApartmentComplexes([]);

      expect(result.totalProcessed).toBe(0);
      expect(result.totalInserted).toBe(0);
      expect(result.totalUpdated).toBe(0);
    });

    it('V4 기본 정보가 없는 경우 건너뛰어야 합니다', async () => {
      const emptyV4Response = {
        header: { resultCode: '00', resultMsg: 'NORMAL SERVICE' },
        body: { item: null }
      };

      const mockApiService = require('@/lib/api/government-api-client').getGovernmentApiClient();
      mockApiService.getApartmentBasicInfoV4.mockResolvedValue(emptyV4Response);

      const result = await dataSyncService.syncApartmentComplexes(['A10027875']);

      expect(result.totalProcessed).toBe(0);
      expect(result.totalSkipped).toBe(1);
    });
  });

  describe('runFullSync', () => {
    it('전체 동기화를 성공적으로 실행해야 합니다', async () => {
      // Mock successful responses for all sync operations
      mockSupabase.rpc.mockResolvedValue({
        data: { inserted_count: 1, updated_count: 0 },
        error: null
      });

      const result = await dataSyncService.runFullSync();

      expect(result.success).toBe(true);
      expect(result.stats.length).toBeGreaterThan(0);
    });

    it('부분적 실패가 있어도 전체 동기화를 계속 진행해야 합니다', async () => {
      // Mock one failing sync operation
      const mockApiService = require('@/lib/api/government-api-client').getGovernmentApiClient();
      mockApiService.getApartmentTradeData
        .mockRejectedValueOnce(new Error('API 에러'))
        .mockResolvedValue(mockApiResponse);

      const result = await dataSyncService.runFullSync();

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.stats.length).toBeGreaterThan(0);
    });
  });

  describe('rate limiting', () => {
    it('API 호출 간 적절한 지연시간을 가져야 합니다', async () => {
      const startTime = Date.now();
      
      // 여러 번 호출하여 rate limiting 확인
      await dataSyncService.syncApartmentTradeData('11110', '202401');
      await dataSyncService.syncApartmentTradeData('11110', '202402');
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // 최소 지연시간이 적용되었는지 확인 (2번 호출이므로 최소 1번의 지연)
      expect(duration).toBeGreaterThan(500); // 500ms 지연시간 가정
    });
  });

  describe('data transformation', () => {
    it('API 데이터를 데이터베이스 형식으로 올바르게 변환해야 합니다', async () => {
      mockSupabase.rpc.mockImplementation((functionName, params) => {
        // 파라미터로 전달된 데이터 구조 검증
        const data = params.trade_data;
        expect(Array.isArray(data)).toBe(true);
        expect(data[0]).toHaveProperty('apt_nm');
        expect(data[0]).toHaveProperty('sgg_cd');
        expect(data[0]).toHaveProperty('deal_date');
        
        return Promise.resolve({
          data: { inserted_count: 1, updated_count: 0 },
          error: null
        });
      });

      await dataSyncService.syncApartmentTradeData('11110', '202401');

      expect(mockSupabase.rpc).toHaveBeenCalled();
    });

    it('V4 API 데이터를 올바르게 변환해야 합니다', async () => {
      const mockApiService = require('@/lib/api/government-api-client').getGovernmentApiClient();
      mockApiService.getApartmentBasicInfoV4.mockResolvedValue(mockV4BasicResponse);
      mockApiService.getApartmentDetailInfoV4.mockResolvedValue(mockV4DetailResponse);

      let capturedData: any = null;
      mockSupabase.from = jest.fn(() => ({
        upsert: jest.fn((data) => {
          capturedData = data;
          return {
            select: jest.fn().mockResolvedValue({
              data: [{ kapt_code: 'A10027875' }],
              error: null
            })
          };
        })
      }));

      await dataSyncService.syncApartmentComplexes(['A10027875']);

      // V4 필드가 올바르게 매핑되었는지 확인
      expect(capturedData).toHaveProperty('kapt_code', 'A10027875');
      expect(capturedData).toHaveProperty('kapt_name', '테스트아파트');
      expect(capturedData).toHaveProperty('doro_juso', '서울시 종로구 종로 123');
      expect(capturedData).toHaveProperty('kapt_top_floor', 15);
      expect(capturedData).toHaveProperty('underground_el_charger_cnt', 5);
      expect(capturedData).toHaveProperty('ground_el_charger_cnt', 3);
    });
  });
});