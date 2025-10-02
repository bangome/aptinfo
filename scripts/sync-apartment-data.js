// 아파트 데이터 동기화 스크립트
const { createClient } = require('@supabase/supabase-js');
const { XMLParser } = require('fast-xml-parser');
require('dotenv').config({ path: '.env.local' });

// 설정
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DATA_GO_KR_SERVICE_KEY = process.env.NEXT_PUBLIC_DATA_GO_KR_SERVICE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// 서울 구별 코드
const SEOUL_REGIONS = {
  '11110': '종로구',
  '11140': '중구', 
  '11170': '용산구',
  '11200': '성동구',
  '11215': '광진구',
  '11230': '동대문구',
  '11260': '중랑구',
  '11290': '성북구',
  '11305': '강북구',
  '11320': '도봉구',
  '11350': '노원구',
  '11380': '은평구',
  '11410': '서대문구',
  '11440': '마포구',
  '11470': '양천구',
  '11500': '강서구',
  '11530': '구로구',
  '11545': '금천구',
  '11560': '영등포구',
  '11590': '동작구',
  '11620': '관악구',
  '11650': '서초구',
  '11680': '강남구',
  '11710': '송파구',
  '11740': '강동구'
};

class ApartmentDataSyncer {
  constructor() {
    this.parser = new XMLParser({
      ignoreAttributes: false,
      parseAttributeValue: true,
      trimValues: true,
    });
  }

  /**
   * 전체 서울 아파트 데이터 동기화
   */
  async syncAllSeoulApartments() {
    console.log('🏢 서울 전체 아파트 데이터 동기화 시작...');
    
    const syncLogId = await this.createSyncLog('full', null, '서울특별시 전체');
    
    try {
      let totalProcessed = 0;
      let totalInserted = 0;
      let totalUpdated = 0;
      let totalErrors = 0;

      for (const [regionCode, regionName] of Object.entries(SEOUL_REGIONS)) {
        console.log(`\n📍 ${regionName} (${regionCode}) 동기화 중...`);
        
        try {
          // 1. 단지목록 조회
          const apartmentList = await this.fetchApartmentList(regionCode);
          console.log(`   조회된 단지 수: ${apartmentList.length}개`);
          
          if (apartmentList.length === 0) {
            console.warn(`   ⚠️ ${regionName}에 조회된 아파트가 없습니다.`);
            continue;
          }

          // 2. 각 단지별 상세정보 조회 및 저장
          for (let i = 0; i < apartmentList.length; i++) {
            const apartment = apartmentList[i];
            totalProcessed++;
            
            try {
              console.log(`   처리 중: ${apartment.kaptName} (${i + 1}/${apartmentList.length})`);
              
              // 기본정보와 상세정보 조회
              const [basicInfo, detailInfo] = await Promise.all([
                this.fetchApartmentBasicInfo(apartment.kaptCode),
                this.fetchApartmentDetailInfo(apartment.kaptCode)
              ]);

              // DB에 저장
              const result = await this.saveApartmentToDb(apartment, basicInfo, detailInfo);
              
              if (result.inserted) {
                totalInserted++;
                console.log(`     ✅ 새로 추가됨`);
              } else if (result.updated) {
                totalUpdated++;
                console.log(`     🔄 업데이트됨`);
              } else {
                console.log(`     ⏭️ 변경사항 없음`);
              }

              // API 호출 제한을 위한 대기
              await this.sleep(100);

            } catch (error) {
              totalErrors++;
              console.error(`     ❌ 오류: ${apartment.kaptName} - ${error.message}`);
            }
          }

        } catch (error) {
          console.error(`❌ ${regionName} 동기화 실패:`, error.message);
          totalErrors++;
        }
      }

      // 동기화 완료
      await this.completeSyncLog(syncLogId, {
        totalProcessed,
        totalInserted, 
        totalUpdated,
        totalErrors,
        status: 'completed'
      });

      console.log('\n📊 동기화 완료 결과:');
      console.log(`   처리된 총 단지: ${totalProcessed}개`);
      console.log(`   새로 추가: ${totalInserted}개`);
      console.log(`   업데이트: ${totalUpdated}개`);
      console.log(`   오류 발생: ${totalErrors}개`);

    } catch (error) {
      await this.completeSyncLog(syncLogId, {
        status: 'failed',
        errorMessage: error.message
      });
      throw error;
    }
  }

  /**
   * 특정 지역 아파트 목록 조회
   */
  async fetchApartmentList(sigunguCode) {
    const searchParams = new URLSearchParams({
      serviceKey: DATA_GO_KR_SERVICE_KEY,
      sigunguCode: sigunguCode,
      pageNo: '1',
      numOfRows: '1000',
    });

    const url = `https://apis.data.go.kr/1613000/AptListService3/getSigunguAptList3?${searchParams.toString()}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`단지목록 API 호출 실패: ${response.status}`);
    }

    const responseText = await response.text();
    
    // JSON 응답 처리
    if (responseText.startsWith('{')) {
      const jsonData = JSON.parse(responseText);
      return jsonData.response?.body?.items || [];
    } else {
      // XML 응답 처리
      const jsonData = this.parser.parse(responseText);
      const items = jsonData.response?.body?.items || [];
      return Array.isArray(items) ? items : [items];
    }
  }

  /**
   * 아파트 기본정보 조회
   */
  async fetchApartmentBasicInfo(kaptCode) {
    const searchParams = new URLSearchParams({
      serviceKey: DATA_GO_KR_SERVICE_KEY,
      kaptCode: kaptCode,
    });

    const url = `https://apis.data.go.kr/1613000/AptBasisInfoServiceV4/getAphusBassInfoV4?${searchParams.toString()}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`기본정보 API 호출 실패: ${response.status}`);
    }

    const responseText = await response.text();
    
    if (responseText.startsWith('{')) {
      const jsonData = JSON.parse(responseText);
      return jsonData.response?.body?.item || null;
    } else {
      const jsonData = this.parser.parse(responseText);
      return jsonData.response?.body?.item || null;
    }
  }

  /**
   * 아파트 상세정보 조회
   */
  async fetchApartmentDetailInfo(kaptCode) {
    const searchParams = new URLSearchParams({
      serviceKey: DATA_GO_KR_SERVICE_KEY,
      kaptCode: kaptCode,
    });

    const url = `https://apis.data.go.kr/1613000/AptBasisInfoServiceV4/getAphusDtlInfoV4?${searchParams.toString()}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`상세정보 API 호출 실패: ${response.status}`);
    }

    const responseText = await response.text();
    
    if (responseText.startsWith('{')) {
      const jsonData = JSON.parse(responseText);
      return jsonData.response?.body?.item || null;
    } else {
      const jsonData = this.parser.parse(responseText);
      return jsonData.response?.body?.item || null;
    }
  }

  /**
   * 아파트 정보를 DB에 저장
   */
  async saveApartmentToDb(listInfo, basicInfo, detailInfo) {
    // 기존 데이터 확인
    const { data: existing } = await supabase
      .from('apartments')
      .select('id, last_updated_at')
      .eq('kapt_code', listInfo.kaptCode)
      .single();

    // 아파트 데이터 구성
    const apartmentData = {
      kapt_code: listInfo.kaptCode,
      name: listInfo.kaptName,
      sido: listInfo.as1 || '서울특별시',
      sigungu: listInfo.as2,
      eupmyeondong: listInfo.as3,
      ri: listInfo.as4,
      bjd_code: listInfo.bjdCode,
      road_address: listInfo.doroJuso,
      last_updated_at: new Date().toISOString()
    };

    // 기본정보 추가
    if (basicInfo) {
      Object.assign(apartmentData, {
        zipcode: basicInfo.zipcode,
        jibun_address: basicInfo.kaptAddr,
        total_area: this.parseNumber(basicInfo.kaptTarea),
        total_dong_count: this.parseNumber(basicInfo.kaptDongCnt),
        total_household_count: this.parseNumber(basicInfo.kaptdaCnt),
        construction_company: basicInfo.kaptBcompany,
        architecture_company: basicInfo.kaptAcompany,
        management_office_tel: basicInfo.kaptTel,
        management_office_fax: basicInfo.kaptFax,
        website_url: basicInfo.kaptUrl,
        management_type: basicInfo.codeMgrNm,
        heating_type: basicInfo.codeHeatNm,
        hall_type: basicInfo.codeHallNm,
        apartment_type: basicInfo.codeAptNm,
        use_approval_date: this.parseDate(basicInfo.kaptUsedate),
        building_area: this.parseNumber(basicInfo.kaptMarea)
      });
    }

    // 상세정보 추가
    if (detailInfo) {
      Object.assign(apartmentData, {
        elevator_count: this.parseNumber(detailInfo.kaptdEcnt),
        total_parking_count: this.parseNumber(detailInfo.kaptdPcnt),
        surface_parking_count: this.parseNumber(detailInfo.kaptdPcntu),
        cctv_count: this.parseNumber(detailInfo.kaptdCccnt),
        welfare_facilities: detailInfo.welfareFacility,
        convenient_facilities: detailInfo.convenientFacility,
        education_facilities: detailInfo.educationFacility,
        bus_station_distance: detailInfo.kaptdWtimebus,
        subway_line: detailInfo.subwayLine,
        subway_station: detailInfo.subwayStation,
        subway_distance: detailInfo.kaptdWtimesub,
        surface_ev_charger_count: this.parseNumber(detailInfo.groundElChargerCnt),
        underground_ev_charger_count: this.parseNumber(detailInfo.undergroundElChargerCnt)
      });
    }

    if (existing) {
      // 업데이트
      const { error } = await supabase
        .from('apartments')
        .update(apartmentData)
        .eq('kapt_code', listInfo.kaptCode);

      if (error) throw error;
      return { updated: true };
    } else {
      // 새로 삽입
      const { error } = await supabase
        .from('apartments')
        .insert(apartmentData);

      if (error) throw error;
      return { inserted: true };
    }
  }

  /**
   * 동기화 로그 생성
   */
  async createSyncLog(syncType, regionCode, regionName) {
    const { data, error } = await supabase
      .from('apartment_sync_logs')
      .insert({
        sync_type: syncType,
        region_code: regionCode,
        region_name: regionName,
        started_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  }

  /**
   * 동기화 로그 완료
   */
  async completeSyncLog(syncLogId, results) {
    const now = new Date();
    const { error } = await supabase
      .from('apartment_sync_logs')
      .update({
        ...results,
        completed_at: now.toISOString(),
        duration_seconds: Math.floor((now - new Date()) / 1000)
      })
      .eq('id', syncLogId);

    if (error) throw error;
  }

  /**
   * 유틸리티 함수들
   */
  parseNumber(value) {
    if (!value) return null;
    const num = parseInt(value.toString().replace(/,/g, ''));
    return isNaN(num) ? null : num;
  }

  parseDate(dateString) {
    if (!dateString) return null;
    
    // YYYYMMDD 형식을 YYYY-MM-DD로 변환
    if (dateString.length === 8) {
      const year = dateString.substring(0, 4);
      const month = dateString.substring(4, 6);
      const day = dateString.substring(6, 8);
      return `${year}-${month}-${day}`;
    }
    
    return null;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 스크립트 실행
async function main() {
  const syncer = new ApartmentDataSyncer();
  
  try {
    await syncer.syncAllSeoulApartments();
    console.log('🎉 동기화가 성공적으로 완료되었습니다!');
    process.exit(0);
  } catch (error) {
    console.error('💥 동기화 중 오류 발생:', error);
    process.exit(1);
  }
}

// 명령줄에서 직접 실행된 경우
if (require.main === module) {
  main();
}

module.exports = { ApartmentDataSyncer };