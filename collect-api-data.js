/**
 * 국토교통부 공동주택 API에서 데이터를 수집하여 Supabase에 저장하는 스크립트
 */

const axios = require('axios');
const { XMLParser } = require('fast-xml-parser');
const { createClient } = require('@supabase/supabase-js');

// 설정
const SERVICE_KEY = 'CWGMQNiuaQZu2+bHyXHBkB5/LGNPKEqGXYRJHNWHvk6z1f3xyQqvGkJ2h8VQ7JGq1DfXXj4Nqe0Eivnt3Ub6GA=='; // 실제 서비스 키로 교체 필요
const API_BASE_URL = 'https://apis.data.go.kr/1613000';

const supabaseUrl = 'https://mswmryeypbbotogxdozq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zd21yeWV5cGJib3RvZ3hkb3pxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY4MzMzNDAsImV4cCI6MjA1MjQwOTM0MH0.Jp_LW2JjOaOYU2iVe4yWtWWJCOsY_w4x1AplpvbTKNw';

const supabase = createClient(supabaseUrl, supabaseKey);

// XML 파서 설정
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text'
});

// API 엔드포인트
const ENDPOINTS = {
  BASIS_INFO: '/AptBasisInfoServiceV4/getAphusBassInfoV4', // 기본정보
  DETAIL_INFO: '/AptBasisInfoServiceV4/getAphusDtlInfoV4', // 상세정보
  LIST_TOTAL: '/AptListService3/getTotalAptList3' // 전체 단지 목록
};

// 서울 시군구 코드 (예시 - 더 많은 지역 추가 가능)
const SEOUL_CODES = [
  '11110', // 종로구
  '11140', // 중구
  '11170', // 용산구
  '11200', // 성동구
  '11215', // 광진구
  '11230', // 동대문구
  '11260', // 중랑구
  '11290', // 성북구
  '11305', // 강북구
  '11320', // 도봉구
  '11350', // 노원구
  '11380', // 은평구
  '11410', // 서대문구
  '11440', // 마포구
  '11470', // 양천구
  '11500', // 강서구
  '11530', // 구로구
  '11545', // 금천구
  '11560', // 영등포구
  '11590', // 동작구
  '11620', // 관악구
  '11650', // 서초구
  '11680', // 강남구
  '11710', // 송파구
  '11740'  // 강동구
];

/**
 * API 호출 공통 함수
 */
async function callAPI(endpoint, params) {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await axios.get(url, {
      params: {
        serviceKey: SERVICE_KEY,
        ...params
      },
      timeout: 30000
    });

    const xmlData = response.data;
    const jsonData = parser.parse(xmlData);
    
    return jsonData.response?.body?.items?.item || [];
  } catch (error) {
    console.error(`API 호출 오류 (${endpoint}):`, error.message);
    return [];
  }
}

/**
 * 단지 목록 가져오기
 */
async function getApartmentList() {
  console.log('단지 목록을 가져오는 중...');
  
  const allApartments = [];
  
  for (const sigunguCd of SEOUL_CODES) {
    try {
      console.log(`시군구 코드 ${sigunguCd} 처리 중...`);
      
      const apartments = await callAPI(ENDPOINTS.LIST_TOTAL, {
        sigunguCd: sigunguCd,
        numOfRows: 1000
      });
      
      if (Array.isArray(apartments)) {
        allApartments.push(...apartments);
      } else if (apartments) {
        allApartments.push(apartments);
      }
      
      // API 호출 제한 방지를 위한 딜레이
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error(`시군구 코드 ${sigunguCd} 처리 중 오류:`, error);
    }
  }
  
  console.log(`총 ${allApartments.length}개의 단지를 찾았습니다.`);
  return allApartments;
}

/**
 * 단지 기본정보 가져오기
 */
async function getApartmentBasisInfo(kaptCode) {
  try {
    const data = await callAPI(ENDPOINTS.BASIS_INFO, {
      kaptCode: kaptCode
    });
    
    return Array.isArray(data) ? data[0] : data;
  } catch (error) {
    console.error(`기본정보 조회 오류 (${kaptCode}):`, error);
    return null;
  }
}

/**
 * 단지 상세정보 가져오기
 */
async function getApartmentDetailInfo(kaptCode) {
  try {
    const data = await callAPI(ENDPOINTS.DETAIL_INFO, {
      kaptCode: kaptCode
    });
    
    return Array.isArray(data) ? data[0] : data;
  } catch (error) {
    console.error(`상세정보 조회 오류 (${kaptCode}):`, error);
    return null;
  }
}

/**
 * 데이터를 Supabase에 저장
 */
async function saveToSupabase(apartmentData) {
  try {
    const { data, error } = await supabase
      .from('apartments')
      .upsert({
        kapt_code: apartmentData.kaptCode,
        name: apartmentData.kaptName,
        sido: apartmentData.as1,
        sigungu: apartmentData.as2,
        eupmyeondong: apartmentData.as3,
        ri: apartmentData.as4,
        bjd_code: apartmentData.bjdCode,
        zipcode: apartmentData.zipcode,
        jibun_address: apartmentData.kaptAddr,
        road_address: apartmentData.doroJuso,
        
        // 면적 정보
        total_area: apartmentData.kaptTarea,
        building_area: apartmentData.kaptMarea,
        priv_area: apartmentData.privArea,
        
        // 건물 정보
        total_dong_count: apartmentData.kaptDongCnt,
        total_household_count: parseInt(apartmentData.kaptdaCnt) || null,
        ho_cnt: apartmentData.hoCnt,
        use_approval_date: apartmentData.kaptUsedate,
        
        // 주차 정보
        surface_parking_count: apartmentData.kaptdPcnt,
        underground_parking_count: apartmentData.kaptdPcntu,
        total_parking_count: (apartmentData.kaptdPcnt || 0) + (apartmentData.kaptdPcntu || 0) || null,
        
        // 승강기 및 CCTV
        elevator_count: apartmentData.kaptdEcnt,
        cctv_count: apartmentData.kaptdCccnt,
        
        // 시설 정보
        welfare_facilities: apartmentData.welfareFacility,
        convenient_facilities: apartmentData.convenientFacility,
        education_facilities: apartmentData.educationFacility,
        
        // 교통 정보
        bus_station_distance: apartmentData.kaptdWtimebus,
        subway_line: apartmentData.subwayLine,
        subway_station: apartmentData.subwayStation,
        subway_distance: apartmentData.kaptdWtimesub,
        
        // 전기충전기
        surface_ev_charger_count: apartmentData.groundElChargerCnt,
        underground_ev_charger_count: apartmentData.undergroundElChargerCnt,
        
        // 업체 정보
        construction_company: apartmentData.kaptBcompany,
        architecture_company: apartmentData.kaptAcompany,
        
        // 연락처
        management_office_tel: apartmentData.kaptTel,
        management_office_fax: apartmentData.kaptFax,
        website_url: apartmentData.kaptUrl,
        
        // 층수 정보 (새 컬럼들)
        kapt_top_floor: apartmentData.kaptTopFloor,
        ktown_flr_no: apartmentData.ktownFlrNo,
        kapt_base_floor: apartmentData.kaptBaseFloor,
        
        // 면적별 세대현황 (새 컬럼들)
        kapt_mparea60: apartmentData.kaptMparea60,
        kapt_mparea85: apartmentData.kaptMparea85,
        kapt_mparea135: apartmentData.kaptMparea135,
        kapt_mparea136: apartmentData.kaptMparea136,
        
        // 기타 정보
        use_yn: apartmentData.useYn,
        is_active: true,
        data_source: 'government_api',
        last_updated_at: new Date().toISOString()
      }, {
        onConflict: 'kapt_code'
      });

    if (error) {
      console.error('Supabase 저장 오류:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('데이터 저장 중 오류:', error);
    return false;
  }
}

/**
 * 메인 수집 함수
 */
async function collectApartmentData() {
  console.log('🏠 아파트 데이터 수집을 시작합니다...');
  
  try {
    // 1. 단지 목록 가져오기
    const apartmentList = await getApartmentList();
    
    if (apartmentList.length === 0) {
      console.log('❌ 수집할 단지 목록이 없습니다.');
      return;
    }
    
    let successCount = 0;
    let errorCount = 0;
    
    // 2. 각 단지의 상세 정보 수집 및 저장
    for (let i = 0; i < apartmentList.length; i++) {
      const apartment = apartmentList[i];
      const kaptCode = apartment.kaptCode;
      
      if (!kaptCode) {
        console.log(`❌ 단지코드가 없습니다: ${apartment.kaptName}`);
        errorCount++;
        continue;
      }
      
      console.log(`📋 [${i + 1}/${apartmentList.length}] ${apartment.kaptName} (${kaptCode}) 처리 중...`);
      
      try {
        // 기본정보와 상세정보 동시 수집
        const [basisInfo, detailInfo] = await Promise.all([
          getApartmentBasisInfo(kaptCode),
          getApartmentDetailInfo(kaptCode)
        ]);
        
        // 데이터 병합
        const mergedData = {
          ...apartment,
          ...basisInfo,
          ...detailInfo
        };
        
        // Supabase에 저장
        const saved = await saveToSupabase(mergedData);
        
        if (saved) {
          successCount++;
          console.log(`✅ ${apartment.kaptName} 저장 완료`);
        } else {
          errorCount++;
          console.log(`❌ ${apartment.kaptName} 저장 실패`);
        }
        
        // API 호출 제한 방지
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.error(`❌ ${apartment.kaptName} 처리 중 오류:`, error);
        errorCount++;
      }
    }
    
    console.log(`\n🎉 데이터 수집 완료!`);
    console.log(`✅ 성공: ${successCount}개`);
    console.log(`❌ 실패: ${errorCount}개`);
    
  } catch (error) {
    console.error('❌ 데이터 수집 중 전체 오류:', error);
  }
}

// 스크립트 실행
if (require.main === module) {
  collectApartmentData()
    .then(() => {
      console.log('스크립트 실행 완료');
      process.exit(0);
    })
    .catch((error) => {
      console.error('스크립트 실행 오류:', error);
      process.exit(1);
    });
}

module.exports = {
  collectApartmentData,
  getApartmentList,
  getApartmentBasisInfo,
  getApartmentDetailInfo
};