/**
 * 데이터 동기화 서비스
 * 정부 API로부터 주기적으로 데이터를 가져와서 데이터베이스에 저장
 */

import { createClient } from '@supabase/supabase-js';
import { getGovernmentApiClient } from '@/lib/api/government-api-client';
import { normalizeError, logError, gatherErrorContext } from '@/lib/error-handling';
import { ErrorSeverity, ErrorCategory } from '@/types/error';
import type { Database } from '@/lib/supabase/database.types';

export interface SyncJobConfig {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  schedule: string; // Cron expression
  lastRun?: Date;
  nextRun?: Date;
  status: 'idle' | 'running' | 'success' | 'error';
  errorMessage?: string;
  retryCount: number;
  maxRetries: number;
}

export interface SyncStats {
  totalProcessed: number;
  totalInserted: number;
  totalUpdated: number;
  totalSkipped: number;
  totalErrors: number;
  startTime: Date;
  endTime?: Date;
  duration?: number;
}

export class DataSyncService {
  private supabase: ReturnType<typeof createClient<Database>>;
  private apiClient: ReturnType<typeof getGovernmentApiClient>;
  private isRunning = false;

  constructor() {
    this.supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    this.apiClient = getGovernmentApiClient();
  }

  /**
   * 아파트 매매 실거래가 데이터 동기화
   */
  async syncApartmentTradeData(regionCode: string, dealYmd: string): Promise<SyncStats> {
    const stats: SyncStats = {
      totalProcessed: 0,
      totalInserted: 0,
      totalUpdated: 0,
      totalSkipped: 0,
      totalErrors: 0,
      startTime: new Date()
    };

    try {
      console.log(`🔄 매매 실거래가 동기화 시작: ${regionCode} - ${dealYmd}`);
      
      let pageNo = 1;
      const numOfRows = 1000; // 한 번에 가져올 최대 건수
      let hasMoreData = true;

      while (hasMoreData) {
        try {
          const response = await this.apiClient.getApartmentTradeData({
            LAWD_CD: regionCode,
            DEAL_YMD: dealYmd,
            pageNo,
            numOfRows
          });

          if (!response.body.items || response.body.items.length === 0) {
            hasMoreData = false;
            break;
          }

          // 트랜잭션으로 배치 저장
          const { data, error } = await (this.supabase as any).rpc('upsert_apartment_trade_batch', {
            trade_data: response.body.items.map(item => ({
              apt_nm: item.aptNm,
              sgg_cd: item.sggCd,
              umd_nm: item.umdNm,
              deal_amount: parseInt(item.dealAmount.replace(/,/g, '')),
              deal_year: parseInt(item.dealYear),
              deal_month: parseInt(item.dealMonth),
              deal_day: parseInt(item.dealDay),
              jibun: item.jibun || null,
              exclu_use_ar: item.excluUseAr ? parseFloat(item.excluUseAr) : null,
              floor: item.floor ? parseInt(item.floor) : null,
              build_year: item.buildYear ? parseInt(item.buildYear) : null,
              dealing_gbn: item.dealingGbn || null,
              region_code: regionCode,
              deal_date: `${item.dealYear}-${item.dealMonth.padStart(2, '0')}-${item.dealDay.padStart(2, '0')}`
            }))
          });

          if (error) {
            throw error;
          }

          stats.totalProcessed += response.body.items.length;
          stats.totalInserted += data?.inserted_count || 0;
          stats.totalUpdated += data?.updated_count || 0;

          console.log(`📄 페이지 ${pageNo} 처리 완료: ${response.body.items.length}건`);

          // 다음 페이지 확인
          if (response.body.items.length < numOfRows) {
            hasMoreData = false;
          } else {
            pageNo++;
          }

          // API 호출 간격 조절 (Rate Limiting 방지)
          await new Promise(resolve => setTimeout(resolve, 100));

        } catch (error) {
          const errorDetails = normalizeError(error);
          logError(errorDetails, { regionCode, dealYmd, pageNo, context: 'syncApartmentTradeData' });
          
          stats.totalErrors++;
          
          // 치명적이지 않은 에러는 건너뛰고 계속 진행
          if (errorDetails.severity !== ErrorSeverity.CRITICAL) {
            console.warn(`⚠️ 페이지 ${pageNo} 처리 중 에러 발생, 계속 진행: ${errorDetails.userMessage}`);
            pageNo++;
            continue;
          } else {
            throw error;
          }
        }
      }

      stats.endTime = new Date();
      stats.duration = stats.endTime.getTime() - stats.startTime.getTime();

      console.log(`✅ 매매 실거래가 동기화 완료: ${stats.totalProcessed}건 처리`);
      return stats;

    } catch (error) {
      stats.endTime = new Date();
      stats.duration = stats.endTime.getTime() - stats.startTime.getTime();
      
      const errorDetails = normalizeError(error);
      logError(errorDetails, { regionCode, dealYmd, stats, context: 'syncApartmentTradeData' });
      
      throw new Error(`매매 실거래가 동기화 실패: ${errorDetails.userMessage}`);
    }
  }

  /**
   * 아파트 전월세 실거래가 데이터 동기화
   */
  async syncApartmentRentData(regionCode: string, dealYmd: string): Promise<SyncStats> {
    const stats: SyncStats = {
      totalProcessed: 0,
      totalInserted: 0,
      totalUpdated: 0,
      totalSkipped: 0,
      totalErrors: 0,
      startTime: new Date()
    };

    try {
      console.log(`🔄 전월세 실거래가 동기화 시작: ${regionCode} - ${dealYmd}`);

      let pageNo = 1;
      const numOfRows = 1000;
      let hasMoreData = true;

      while (hasMoreData) {
        try {
          const response = await this.apiClient.getApartmentRentData({
            LAWD_CD: regionCode,
            DEAL_YMD: dealYmd,
            pageNo,
            numOfRows
          });

          if (!response.body.items || response.body.items.length === 0) {
            hasMoreData = false;
            break;
          }

          // 트랜잭션으로 배치 저장
          const { data, error } = await (this.supabase as any).rpc('upsert_apartment_rent_batch', {
            rent_data: response.body.items.map(item => ({
              apt_nm: item.aptNm,
              sgg_cd: item.sggCd,
              umd_nm: item.umdNm,
              deposit: parseInt(item.deposit.replace(/,/g, '')),
              monthly_rent: parseInt(item.monthlyRent.replace(/,/g, '')),
              deal_year: parseInt(item.dealYear),
              deal_month: parseInt(item.dealMonth),
              deal_day: parseInt(item.dealDay),
              jibun: item.jibun || null,
              exclu_use_ar: item.excluUseAr ? parseFloat(item.excluUseAr) : null,
              floor: item.floor ? parseInt(item.floor) : null,
              build_year: item.buildYear ? parseInt(item.buildYear) : null,
              region_code: regionCode,
              deal_date: `${item.dealYear}-${item.dealMonth.padStart(2, '0')}-${item.dealDay.padStart(2, '0')}`
            }))
          });

          if (error) {
            throw error;
          }

          stats.totalProcessed += response.body.items.length;
          stats.totalInserted += data?.inserted_count || 0;
          stats.totalUpdated += data?.updated_count || 0;

          console.log(`📄 페이지 ${pageNo} 처리 완료: ${response.body.items.length}건`);

          if (response.body.items.length < numOfRows) {
            hasMoreData = false;
          } else {
            pageNo++;
          }

          await new Promise(resolve => setTimeout(resolve, 100));

        } catch (error) {
          const errorDetails = normalizeError(error);
          logError(errorDetails, { regionCode, dealYmd, pageNo, context: 'syncApartmentRentData' });
          
          stats.totalErrors++;
          
          if (errorDetails.severity !== ErrorSeverity.CRITICAL) {
            console.warn(`⚠️ 페이지 ${pageNo} 처리 중 에러 발생, 계속 진행: ${errorDetails.userMessage}`);
            pageNo++;
            continue;
          } else {
            throw error;
          }
        }
      }

      stats.endTime = new Date();
      stats.duration = stats.endTime.getTime() - stats.startTime.getTime();

      console.log(`✅ 전월세 실거래가 동기화 완료: ${stats.totalProcessed}건 처리`);
      return stats;

    } catch (error) {
      stats.endTime = new Date();
      stats.duration = stats.endTime.getTime() - stats.startTime.getTime();
      
      const errorDetails = normalizeError(error);
      logError(errorDetails, { regionCode, dealYmd, stats, context: 'syncApartmentRentData' });
      
      throw new Error(`전월세 실거래가 동기화 실패: ${errorDetails.userMessage}`);
    }
  }

  /**
   * 아파트 단지 기본 정보 동기화 (V4 API 사용)
   */
  async syncApartmentComplexes(complexCodes: string[]): Promise<SyncStats> {
    const stats: SyncStats = {
      totalProcessed: 0,
      totalInserted: 0,
      totalUpdated: 0,
      totalSkipped: 0,
      totalErrors: 0,
      startTime: new Date()
    };

    try {
      console.log(`🔄 아파트 단지 정보 동기화 시작 (V4 API): ${complexCodes.length}개 단지`);

      for (const kaptCode of complexCodes) {
        try {
          // V4 기본 정보 가져오기
          const basicInfoResponse = await this.apiClient.getApartmentBasicInfoV4({ kaptCode });
          
          if (!basicInfoResponse.body.item) {
            stats.totalSkipped++;
            continue;
          }

          const basicData = basicInfoResponse.body.item;

          // V4 상세 정보 가져오기 (선택적)
          let detailData = null;
          try {
            const detailInfoResponse = await this.apiClient.getApartmentDetailInfoV4({ kaptCode });
            if (detailInfoResponse.body.item) {
              detailData = detailInfoResponse.body.item;
            }
          } catch (detailError) {
            console.warn(`⚠️ 단지 ${kaptCode} V4 상세 정보 조회 실패, 기본 정보만 저장`);
          }

          // 데이터베이스에 UPSERT (V4 필드 매핑)
          const { data, error } = await (this.supabase as any)
            .from('apartment_complexes')
            .upsert({
              kapt_code: kaptCode,
              kapt_name: basicData.kaptName,
              kapt_addr: basicData.kaptAddr || null,
              doro_juso: basicData.doroJuso || null,
              zipcode: basicData.zipcode || null,
              bjd_code: basicData.bjdCode || null,
              
              // V4 건물 정보
              kapt_dong_cnt: basicData.kaptDongCnt ? Number(basicData.kaptDongCnt) : null,
              kapt_da_cnt: basicData.kaptdaCnt || null,
              ho_cnt: basicData.hoCnt ? Number(basicData.hoCnt) : null,
              kapt_tarea: basicData.kaptTarea ? Number(basicData.kaptTarea) : null,
              kapt_marea: basicData.kaptMarea ? Number(basicData.kaptMarea) : null,
              priv_area: basicData.privArea ? Number(basicData.privArea) : null,
              
              // V4 세대현황
              kapt_mparea_60: basicData.kaptMparea60 ? Number(basicData.kaptMparea60) : null,
              kapt_mparea_85: basicData.kaptMparea85 ? Number(basicData.kaptMparea85) : null,
              kapt_mparea_135: basicData.kaptMparea135 ? Number(basicData.kaptMparea135) : null,
              kapt_mparea_136: basicData.kaptMparea136 ? Number(basicData.kaptMparea136) : null,
              
              // V4 업체 정보
              kapt_bcompany: basicData.kaptBcompany || null,
              kapt_acompany: basicData.kaptAcompany || null,
              
              // V4 연락처
              kapt_tel: basicData.kaptTel || null,
              kapt_fax: basicData.kaptFax || null,
              kapt_url: basicData.kaptUrl || null,
              
              // V4 분양 및 관리 정보
              code_sale_nm: basicData.codeSaleNm || null,
              code_heat_nm: basicData.codeHeatNm || null,
              code_apt_nm: basicData.codeAptNm || null,
              code_mgr_nm: basicData.codeMgrNm || null,
              code_hall_nm: basicData.codeHallNm || null,
              
              // V4 추가 정보
              kapt_use_date: basicData.kaptUsedate || null,
              kapt_top_floor: basicData.kaptTopFloor ? Number(basicData.kaptTopFloor) : null,
              ktown_flr_no: basicData.ktownFlrNo ? Number(basicData.ktownFlrNo) : null,
              kapt_base_floor: basicData.kaptBaseFloor ? Number(basicData.kaptBaseFloor) : null,
              kapt_d_ecntp: basicData.kaptdEcntp ? Number(basicData.kaptdEcntp) : null,
              
              // V4 상세 정보 (있는 경우)
              code_mgr: detailData?.codeMgr || null,
              kapt_mgr_cnt: detailData?.kaptMgrCnt ? Number(detailData.kaptMgrCnt) : null,
              kapt_ccompany: detailData?.kaptCcompany || null,
              
              // 경비 관리
              code_sec: detailData?.codeSec || null,
              kapt_d_scnt: detailData?.kaptdScnt ? Number(detailData.kaptdScnt) : null,
              kapt_d_sec_com: detailData?.kaptdSecCom || null,
              
              // 청소 관리
              code_clean: detailData?.codeClean || null,
              kapt_d_clcnt: detailData?.kaptdClcnt ? Number(detailData.kaptdClcnt) : null,
              
              // 소독 관리
              code_disinf: detailData?.codeDisinf || null,
              kapt_d_dcnt: detailData?.kaptdDcnt ? Number(detailData.kaptdDcnt) : null,
              disposal_type: detailData?.disposalType || null,
              
              // 시설 정보
              code_garbage: detailData?.codeGarbage || null,
              code_str: detailData?.codeStr || null,
              kapt_d_ecapa: detailData?.kaptdEcapa ? Number(detailData.kaptdEcapa) : null,
              code_econ: detailData?.codeEcon || null,
              code_emgr: detailData?.codeEmgr || null,
              code_falarm: detailData?.codeFalarm || null,
              code_wsupply: detailData?.codeWsupply || null,
              
              // 승강기 및 주차
              code_elev: detailData?.codeElev || null,
              kapt_d_ecnt: detailData?.kaptdEcnt ? Number(detailData.kaptdEcnt) : null,
              kapt_d_pcnt: detailData?.kaptdPcnt ? Number(detailData.kaptdPcnt) : null,
              kapt_d_pcntu: detailData?.kaptdPcntu ? Number(detailData.kaptdPcntu) : null,
              code_net: detailData?.codeNet || null,
              
              // 보안 시설
              kapt_d_cccnt: detailData?.kaptdCccnt ? Number(detailData.kaptdCccnt) : null,
              
              // 부대시설
              welfare_facility: detailData?.welfareFacility || null,
              convenient_facility: detailData?.convenientFacility || null,
              education_facility: detailData?.educationFacility || null,
              
              // 교통 정보
              kapt_d_wtimebus: detailData?.kaptdWtimebus || null,
              subway_line: detailData?.subwayLine || null,
              subway_station: detailData?.subwayStation || null,
              kapt_d_wtimesub: detailData?.kaptdWtimesub || null,
              
              // V4 추가 상세 정보
              underground_el_charger_cnt: detailData?.undergroundElChargerCnt ? Number(detailData.undergroundElChargerCnt) : null,
              ground_el_charger_cnt: detailData?.groundElChargerCnt ? Number(detailData.groundElChargerCnt) : null,
              use_yn: detailData?.useYn || null,
              
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'kapt_code'
            })
            .select();

          if (error) {
            throw error;
          }

          stats.totalProcessed++;
          if (data && data.length > 0) {
            stats.totalUpdated++;
          } else {
            stats.totalInserted++;
          }

          // API 호출 간격 조절
          await new Promise(resolve => setTimeout(resolve, 200));

        } catch (error) {
          const errorDetails = normalizeError(error);
          logError(errorDetails, { kaptCode, context: 'syncApartmentComplexesV4' });
          
          stats.totalErrors++;
          
          if (errorDetails.severity !== ErrorSeverity.CRITICAL) {
            console.warn(`⚠️ 단지 ${kaptCode} V4 처리 중 에러 발생, 계속 진행: ${errorDetails.userMessage}`);
            continue;
          } else {
            throw error;
          }
        }
      }

      stats.endTime = new Date();
      stats.duration = stats.endTime.getTime() - stats.startTime.getTime();

      console.log(`✅ 아파트 단지 정보 동기화 완료 (V4): ${stats.totalProcessed}건 처리`);
      return stats;

    } catch (error) {
      stats.endTime = new Date();
      stats.duration = stats.endTime.getTime() - stats.startTime.getTime();
      
      const errorDetails = normalizeError(error);
      logError(errorDetails, { complexCodes, stats, context: 'syncApartmentComplexesV4' });
      
      throw new Error(`아파트 단지 정보 V4 동기화 실패: ${errorDetails.userMessage}`);
    }
  }

  /**
   * 동기화 작업 상태 확인
   */
  isSyncRunning(): boolean {
    return this.isRunning;
  }

  /**
   * 동기화 작업 시작 마킹
   */
  private markRunning(): void {
    this.isRunning = true;
  }

  /**
   * 동기화 작업 완료 마킹
   */
  private markCompleted(): void {
    this.isRunning = false;
  }

  /**
   * 전체 동기화 작업 실행
   */
  async runFullSync(): Promise<{ success: boolean; stats: SyncStats[]; errors: string[] }> {
    if (this.isRunning) {
      throw new Error('동기화 작업이 이미 실행 중입니다.');
    }

    this.markRunning();
    const allStats: SyncStats[] = [];
    const errors: string[] = [];

    try {
      console.log('🚀 전체 데이터 동기화 시작');

      // 주요 지역 코드들 (서울, 경기, 인천 등)
      const regionCodes = ['11110', '11140', '11170', '41113', '28200']; // 샘플 지역들
      
      // 최근 3개월 데이터 동기화
      const currentDate = new Date();
      const months = [];
      for (let i = 0; i < 3; i++) {
        const date = new Date(currentDate);
        date.setMonth(date.getMonth() - i);
        months.push(date.getFullYear().toString() + (date.getMonth() + 1).toString().padStart(2, '0'));
      }

      // 각 지역별, 월별 데이터 동기화
      for (const regionCode of regionCodes) {
        for (const dealYmd of months) {
          try {
            // 매매 실거래가 동기화
            const tradeStats = await this.syncApartmentTradeData(regionCode, dealYmd);
            allStats.push(tradeStats);

            // 전월세 실거래가 동기화
            const rentStats = await this.syncApartmentRentData(regionCode, dealYmd);
            allStats.push(rentStats);

          } catch (error) {
            const errorMessage = `${regionCode}-${dealYmd} 동기화 실패: ${error}`;
            errors.push(errorMessage);
            console.error(`❌ ${errorMessage}`);
          }
        }
      }

      console.log('✅ 전체 데이터 동기화 완료');
      return { success: errors.length === 0, stats: allStats, errors };

    } catch (error) {
      const errorDetails = normalizeError(error);
      logError(errorDetails, { context: 'runFullSync' });
      errors.push(`전체 동기화 실패: ${errorDetails.userMessage}`);
      
      return { success: false, stats: allStats, errors };
    } finally {
      this.markCompleted();
    }
  }
}

// 싱글톤 인스턴스
let dataSyncService: DataSyncService | null = null;

export function getDataSyncService(): DataSyncService {
  if (!dataSyncService) {
    dataSyncService = new DataSyncService();
  }
  return dataSyncService;
}