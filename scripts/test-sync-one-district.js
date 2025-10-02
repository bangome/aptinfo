// 한 개 구만 동기화 테스트
const { createClient } = require('@supabase/supabase-js');
const { XMLParser } = require('fast-xml-parser');
require('dotenv').config({ path: '.env.local' });

// 설정
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DATA_GO_KR_SERVICE_KEY = process.env.NEXT_PUBLIC_DATA_GO_KR_SERVICE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// 강남구만 테스트 (11680)
const TEST_REGION = {
  code: '11680',
  name: '강남구'
};

class TestApartmentSyncer {
  constructor() {
    this.parser = new XMLParser({
      ignoreAttributes: false,
      parseAttributeValue: true,
      trimValues: true,
    });
  }

  async testSync() {
    console.log(`🏢 ${TEST_REGION.name} 아파트 데이터 동기화 테스트...`);
    
    try {
      // 1. 단지목록 조회
      const apartmentList = await this.fetchApartmentList(TEST_REGION.code);
      console.log(`📊 조회된 단지 수: ${apartmentList.length}개`);
      
      if (apartmentList.length === 0) {
        console.log('❌ 조회된 아파트가 없습니다.');
        return;
      }

      // 처음 5개만 테스트
      const testApartments = apartmentList.slice(0, 5);
      console.log(`🎯 테스트 대상: ${testApartments.length}개 아파트`);

      let success = 0;
      let failed = 0;

      for (let i = 0; i < testApartments.length; i++) {
        const apartment = testApartments[i];
        
        try {
          console.log(`\n[${i + 1}/${testApartments.length}] ${apartment.kaptName} 처리 중...`);
          
          // 기본정보와 상세정보 조회
          const [basicInfo, detailInfo] = await Promise.all([
            this.fetchApartmentBasicInfo(apartment.kaptCode),
            this.fetchApartmentDetailInfo(apartment.kaptCode)
          ]);

          // 데이터 길이 체크
          this.validateDataLengths(apartment, basicInfo, detailInfo);

          // DB에 저장
          const result = await this.saveApartmentToDb(apartment, basicInfo, detailInfo);
          
          if (result.inserted) {
            success++;
            console.log(`  ✅ 새로 추가됨`);
          } else if (result.updated) {
            success++;
            console.log(`  🔄 업데이트됨`);
          } else {
            console.log(`  ⏭️ 변경사항 없음`);
          }

          await this.sleep(200);

        } catch (error) {
          failed++;
          console.error(`  ❌ 오류: ${error.message}`);
        }
      }

      console.log('\n📊 테스트 결과:');
      console.log(`  성공: ${success}개`);
      console.log(`  실패: ${failed}개`);

    } catch (error) {
      console.error('💥 테스트 실패:', error);
    }
  }

  // 데이터 길이 검증
  validateDataLengths(listInfo, basicInfo, detailInfo) {
    const checks = [];
    
    if (basicInfo) {
      if (basicInfo.codeMgrNm && basicInfo.codeMgrNm.length > 100) {
        checks.push(`관리방식명 길이 초과: ${basicInfo.codeMgrNm.length}자`);
      }
      if (basicInfo.codeHeatNm && basicInfo.codeHeatNm.length > 100) {
        checks.push(`난방방식명 길이 초과: ${basicInfo.codeHeatNm.length}자`);
      }
      if (basicInfo.codeHallNm && basicInfo.codeHallNm.length > 100) {
        checks.push(`복도유형명 길이 초과: ${basicInfo.codeHallNm.length}자`);
      }
      if (basicInfo.codeAptNm && basicInfo.codeAptNm.length > 100) {
        checks.push(`아파트형태명 길이 초과: ${basicInfo.codeAptNm.length}자`);
      }
    }

    if (checks.length > 0) {
      console.warn(`  ⚠️ 길이 검증 경고:`);
      checks.forEach(check => console.warn(`    - ${check}`));
    }
  }

  async fetchApartmentList(sigunguCode) {
    const searchParams = new URLSearchParams({
      serviceKey: DATA_GO_KR_SERVICE_KEY,
      sigunguCode: sigunguCode,
      pageNo: '1',
      numOfRows: '100', // 테스트용으로 적게
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

  async saveApartmentToDb(listInfo, basicInfo, detailInfo) {
    // 기존 데이터 확인
    const { data: existing } = await supabase
      .from('apartments')
      .select('id, last_updated_at')
      .eq('kapt_code', listInfo.kaptCode)
      .single();

    // 데이터 길이 제한
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

// 테스트 실행
async function main() {
  const syncer = new TestApartmentSyncer();
  
  try {
    await syncer.testSync();
    console.log('🎉 테스트 완료!');
  } catch (error) {
    console.error('💥 테스트 실패:', error);
  }
}

if (require.main === module) {
  main();
}