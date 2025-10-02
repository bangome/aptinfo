// 배치 처리 아파트 데이터 동기화 스크립트
const { createClient } = require('@supabase/supabase-js');
const { XMLParser } = require('fast-xml-parser');
require('dotenv').config({ path: '.env.local' });

// 설정
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DATA_GO_KR_SERVICE_KEY = process.env.NEXT_PUBLIC_DATA_GO_KR_SERVICE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// 서울 구별 코드 (남은 구들만 추가로 동기화)
const SEOUL_REGIONS = {
  '11470': '양천구',    // 부분적으로 처리됨
  '11500': '강서구',
  '11530': '구로구',
  '11545': '금천구',
  '11560': '영등포구',
  '11590': '동작구',
  '11620': '관악구',
  '11650': '서초구',
  '11680': '강남구',    // 5개만 있음
  '11710': '송파구',
  '11740': '강동구',
  '11350': '노원구',    // 2개만 있음
  '11410': '서대문구',  // 12개만 있음
  '11440': '마포구'     // 6개만 있음
};

class BatchApartmentSyncer {
  constructor() {
    this.parser = new XMLParser({
      ignoreAttributes: false,
      parseAttributeValue: true,
      trimValues: true,
    });
  }

  async syncRemainingDistricts() {
    console.log('🏢 서울 남은 구 아파트 데이터 배치 동기화 시작...');
    
    for (const [regionCode, regionName] of Object.entries(SEOUL_REGIONS)) {
      console.log(`\n📍 ${regionName} (${regionCode}) 동기화 시작...`);
      
      try {
        await this.syncSingleDistrict(regionCode, regionName);
        
        // 구별 동기화 완료 후 잠시 대기 (API 제한 방지)
        console.log(`✅ ${regionName} 동기화 완료! 5초 대기...`);
        await this.sleep(5000);
        
      } catch (error) {
        console.error(`❌ ${regionName} 동기화 실패:`, error.message);
        continue; // 다음 구로 계속 진행
      }
    }
    
    console.log('\n🎉 배치 동기화 완료!');
  }

  async syncSingleDistrict(regionCode, regionName) {
    const syncLogId = await this.createSyncLog('batch', regionCode, regionName);
    
    try {
      // 1. 단지목록 조회
      const apartmentList = await this.fetchApartmentList(regionCode);
      console.log(`   조회된 단지 수: ${apartmentList.length}개`);
      
      if (apartmentList.length === 0) {
        await this.completeSyncLog(syncLogId, {
          totalProcessed: 0,
          totalInserted: 0,
          totalUpdated: 0,
          totalErrors: 0,
          status: 'completed'
        });
        return;
      }

      let totalProcessed = 0;
      let totalInserted = 0;
      let totalUpdated = 0;
      let totalErrors = 0;

      // 배치 단위로 처리 (한 번에 10개씩)
      const batchSize = 10;
      for (let i = 0; i < apartmentList.length; i += batchSize) {
        const batch = apartmentList.slice(i, i + batchSize);
        console.log(`   배치 처리 중: ${i + 1}-${Math.min(i + batchSize, apartmentList.length)}/${apartmentList.length}`);
        
        const batchPromises = batch.map(async (apartment, index) => {
          try {
            totalProcessed++;
            
            // 기본정보와 상세정보 조회
            const [basicInfo, detailInfo] = await Promise.all([
              this.fetchApartmentBasicInfo(apartment.kaptCode),
              this.fetchApartmentDetailInfo(apartment.kaptCode)
            ]);

            // DB에 저장
            const result = await this.saveApartmentToDb(apartment, basicInfo, detailInfo);
            
            if (result.inserted) {
              totalInserted++;
              return `${apartment.kaptName}: 새로 추가`;
            } else if (result.updated) {
              totalUpdated++;
              return `${apartment.kaptName}: 업데이트`;
            } else {
              return `${apartment.kaptName}: 변경사항 없음`;
            }

          } catch (error) {
            totalErrors++;
            return `${apartment.kaptName}: 오류 - ${error.message}`;
          }
        });

        // 배치 완료 대기
        const results = await Promise.all(batchPromises);
        results.forEach(result => console.log(`     ${result}`));
        
        // API 제한 방지를 위한 대기 (배치당 2초)
        await this.sleep(2000);
      }

      // 동기화 완료
      await this.completeSyncLog(syncLogId, {
        totalProcessed,
        totalInserted,
        totalUpdated,
        totalErrors,
        status: 'completed'
      });

      console.log(`   📊 ${regionName} 결과: 처리 ${totalProcessed}, 추가 ${totalInserted}, 업데이트 ${totalUpdated}, 오류 ${totalErrors}`);

    } catch (error) {
      await this.completeSyncLog(syncLogId, {
        status: 'failed',
        errorMessage: error.message
      });
      throw error;
    }
  }

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
    
    if (responseText.startsWith('{')) {
      const jsonData = JSON.parse(responseText);
      return jsonData.response?.body?.items || [];
    } else {
      const jsonData = this.parser.parse(responseText);
      const items = jsonData.response?.body?.items || [];
      return Array.isArray(items) ? items : [items];
    }
  }

  async fetchApartmentBasicInfo(kaptCode) {
    const searchParams = new URLSearchParams({
      serviceKey: DATA_GO_KR_SERVICE_KEY,
      kaptCode: kaptCode,
    });

    const url = `https://apis.data.go.kr/1613000/AptBasisInfoServiceV4/getAphusBassInfoV4?${searchParams.toString()}`;
    
    const response = await fetch(url);
    if (!response.ok) return null;

    const responseText = await response.text();
    
    if (responseText.startsWith('{')) {
      const jsonData = JSON.parse(responseText);
      return jsonData.response?.body?.item || null;
    } else {
      const jsonData = this.parser.parse(responseText);
      return jsonData.response?.body?.item || null;
    }
  }

  async fetchApartmentDetailInfo(kaptCode) {
    const searchParams = new URLSearchParams({
      serviceKey: DATA_GO_KR_SERVICE_KEY,
      kaptCode: kaptCode,
    });

    const url = `https://apis.data.go.kr/1613000/AptBasisInfoServiceV4/getAphusDtlInfoV4?${searchParams.toString()}`;
    
    const response = await fetch(url);
    if (!response.ok) return null;

    const responseText = await response.text();
    
    if (responseText.startsWith('{')) {
      const jsonData = JSON.parse(responseText);
      return jsonData.response?.body?.item || null;
    } else {
      const jsonData = this.parser.parse(responseText);
      return jsonData.response?.body?.item || null;
    }
  }

  async saveApartmentToDb(listInfo, basicInfo, detailInfo) {
    // 기존 데이터 확인
    const { data: existing } = await supabase
      .from('apartments')
      .select('id, last_updated_at')
      .eq('kapt_code', listInfo.kaptCode)
      .single();

    // 데이터 길이 제한 함수
    const truncateString = (str, maxLength) => {
      if (!str) return null;
      return str.length > maxLength ? str.substring(0, maxLength) : str;
    };

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

    // 기본정보 추가 (길이 제한 적용)
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
        management_type: truncateString(basicInfo.codeMgrNm, 100),
        heating_type: truncateString(basicInfo.codeHeatNm, 100),
        hall_type: truncateString(basicInfo.codeHallNm, 100),
        apartment_type: truncateString(basicInfo.codeAptNm, 100),
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
      const { error } = await supabase
        .from('apartments')
        .update(apartmentData)
        .eq('kapt_code', listInfo.kaptCode);

      if (error) throw error;
      return { updated: true };
    } else {
      const { error } = await supabase
        .from('apartments')
        .insert(apartmentData);

      if (error) throw error;
      return { inserted: true };
    }
  }

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

  async completeSyncLog(syncLogId, results) {
    const now = new Date();
    const { error } = await supabase
      .from('apartment_sync_logs')
      .update({
        ...results,
        completed_at: now.toISOString()
      })
      .eq('id', syncLogId);

    if (error) throw error;
  }

  parseNumber(value) {
    if (!value) return null;
    const num = parseInt(value.toString().replace(/,/g, ''));
    return isNaN(num) ? null : num;
  }

  parseDate(dateString) {
    if (!dateString) return null;
    
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

// 특정 구만 동기화하는 함수
async function syncSpecificDistrict(districtName) {
  const syncer = new BatchApartmentSyncer();
  
  const districtCode = Object.entries(SEOUL_REGIONS).find(([code, name]) => name === districtName)?.[0];
  
  if (!districtCode) {
    console.error(`❌ "${districtName}" 구를 찾을 수 없습니다.`);
    console.log('사용 가능한 구:', Object.values(SEOUL_REGIONS).join(', '));
    return;
  }
  
  try {
    await syncer.syncSingleDistrict(districtCode, districtName);
    console.log(`🎉 ${districtName} 동기화 완료!`);
  } catch (error) {
    console.error(`💥 ${districtName} 동기화 실패:`, error);
  }
}

// 메인 실행
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length > 0) {
    // 특정 구 동기화
    await syncSpecificDistrict(args[0]);
  } else {
    // 전체 남은 구 동기화
    const syncer = new BatchApartmentSyncer();
    await syncer.syncRemainingDistricts();
  }
}

if (require.main === module) {
  main();
}

module.exports = { BatchApartmentSyncer, syncSpecificDistrict };