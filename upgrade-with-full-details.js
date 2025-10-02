/**
 * 풍부한 상세정보까지 포함한 완전 업그레이드
 */

const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SERVICE_KEY = 'EAl5DDYH6Ixz5ZpCY40/DTEDqkFXTG2Utgr5YJQkusuQyugyb80K+qVwRG2ZpceMiCIXqwFWmGpJRHeu7s8JUA==';
const API_BASE_URL = 'https://apis.data.go.kr/1613000';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function getBasicInfo(kaptCode) {
  try {
    const response = await axios.get(`${API_BASE_URL}/AptBasisInfoServiceV4/getAphusBassInfoV4`, {
      params: {
        serviceKey: SERVICE_KEY,
        kaptCode: kaptCode
      },
      timeout: 10000
    });
    
    const jsonData = response.data;
    
    if (jsonData.response?.header?.resultCode === '00') {
      return jsonData.response?.body?.item || null;
    }
    
  } catch (error) {
    console.log(`⚠️ 기본정보 오류 (${kaptCode}): ${error.message}`);
  }
  
  return null;
}

async function getDetailInfo(kaptCode) {
  try {
    const response = await axios.get(`${API_BASE_URL}/AptBasisInfoServiceV4/getAphusDtlInfoV4`, {
      params: {
        serviceKey: SERVICE_KEY,
        kaptCode: kaptCode
      },
      timeout: 10000
    });
    
    const jsonData = response.data;
    
    if (jsonData.response?.header?.resultCode === '00') {
      return jsonData.response?.body?.item || null;
    }
    
  } catch (error) {
    console.log(`⚠️ 상세정보 오류 (${kaptCode}): ${error.message}`);
  }
  
  return null;
}

/**
 * 모든 상세정보 수집 (편의시설, 교통정보, 안전시설, 인프라 포함)
 */
async function collectFullDetails(kaptCode) {
  const enhancedFields = {};
  
  try {
    console.log(`📡 ${kaptCode} 기본정보 API 호출 중...`);
    const basicInfo = await getBasicInfo(kaptCode);
    if (basicInfo) {
      // 기본 정보
      enhancedFields.kapt_addr = basicInfo.kaptAddr || null;
      enhancedFields.bjd_code = basicInfo.bjdCode || null;
      enhancedFields.zipcode = basicInfo.zipcode || null;
      enhancedFields.kapt_tarea = parseFloat(basicInfo.kaptTarea) || null;
      enhancedFields.kapt_marea = parseFloat(basicInfo.kaptMarea) || null;
      enhancedFields.priv_area = parseFloat(basicInfo.privArea) || null;
      enhancedFields.kapt_dong_cnt = parseInt(basicInfo.kaptDongCnt) || null;
      enhancedFields.kapt_da_cnt = parseInt(basicInfo.kaptdaCnt) || null;
      enhancedFields.ho_cnt = parseInt(basicInfo.hoCnt) || null;
      enhancedFields.kapt_usedate = basicInfo.kaptUsedate || null;
      
      console.log(`  ✅ 기본정보: 세대수 ${enhancedFields.kapt_da_cnt}, 동수 ${enhancedFields.kapt_dong_cnt}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 400));
    
    console.log(`📡 ${kaptCode} 상세정보 API 호출 중...`);
    const detailInfo = await getDetailInfo(kaptCode);
    if (detailInfo) {
      // 주차 및 기본 시설
      enhancedFields.kaptd_ecnt = parseInt(detailInfo.kaptdEcnt) || null;
      enhancedFields.kaptd_pcnt = parseInt(detailInfo.kaptdPcnt) || null;
      enhancedFields.kaptd_pcntu = parseInt(detailInfo.kaptdPcntu) || null;
      enhancedFields.kaptd_cccnt = parseInt(detailInfo.kaptdCccnt) || null;
      
      // 편의시설 정보 (풍부한 텍스트 정보!)
      enhancedFields.welfare_facility = detailInfo.welfareFacility || null;
      enhancedFields.convenient_facility = detailInfo.convenientFacility || null;
      enhancedFields.education_facility = detailInfo.educationFacility || null;
      
      // 교통정보
      enhancedFields.kaptd_wtimebus = detailInfo.kaptdWtimebus || null;
      enhancedFields.subway_line = detailInfo.subwayLine || null;
      enhancedFields.subway_station = detailInfo.subwayStation || null;
      enhancedFields.kaptd_wtimesub = detailInfo.kaptdWtimesub || null;
      
      // 안전시설 & 관리정보
      enhancedFields.code_sec = detailInfo.codeSec || null;
      enhancedFields.kaptd_scnt = parseInt(detailInfo.kaptdScnt) || null;
      enhancedFields.kaptd_sec_com = detailInfo.kaptdSecCom || null;
      enhancedFields.code_falarm = detailInfo.codeFalarm || null;
      
      // 인프라 정보
      enhancedFields.code_wsupply = detailInfo.codeWsupply || null;
      enhancedFields.code_net = detailInfo.codeNet || null;
      enhancedFields.code_elev = detailInfo.codeElev || null;
      enhancedFields.kaptd_ecapa = parseInt(detailInfo.kaptdEcapa) || null;
      
      // 전기차 충전시설
      enhancedFields.ground_el_charger_cnt = parseInt(detailInfo.groundElChargerCnt) || null;
      enhancedFields.underground_el_charger_cnt = parseInt(detailInfo.undergroundElChargerCnt) || null;
      
      // 기타 관리시설
      enhancedFields.kapt_mgr_cnt = parseInt(detailInfo.kaptMgrCnt) || null;
      enhancedFields.code_clean = detailInfo.codeClean || null;
      enhancedFields.code_disinf = detailInfo.codeDisinf || null;
      
      console.log(`  ✅ 상세정보: 주차 ${enhancedFields.kaptd_pcnt}+${enhancedFields.kaptd_pcntu}대, CCTV ${enhancedFields.kaptd_cccnt}대`);
      console.log(`  ✅ 편의시설: ${enhancedFields.welfare_facility ? '있음' : '없음'}`);
      console.log(`  ✅ 교통정보: ${enhancedFields.subway_station || '정보없음'}`);
    }
    
    enhancedFields.data_source = 'government_api_complete_enhanced';
    enhancedFields.updated_at = new Date().toISOString();
    
    return enhancedFields;
    
  } catch (error) {
    console.log(`❌ 데이터 수집 오류 (${kaptCode}): ${error.message}`);
    return null;
  }
}

async function updateWithFullDetails(kaptCode, enhancedFields) {
  try {
    const { data, error } = await supabase
      .from('apartment_complexes')
      .update(enhancedFields)
      .eq('kapt_code', kaptCode);
    
    if (error) {
      console.error(`❌ DB 업데이트 오류 (${kaptCode}):`, error.message);
      return false;
    }
    
    return true;
    
  } catch (error) {
    console.error(`❌ DB 업데이트 중 오류 (${kaptCode}):`, error.message);
    return false;
  }
}

async function upgradeWithFullDetails() {
  const apartments = [
    { code: 'A10026207', name: '서울숲리버뷰자이아파트' },
    { code: 'A13307001', name: '행당두산' },
    { code: 'A13307002', name: '서울숲행당푸르지오' }
  ];
  
  console.log(`🚀 ${apartments.length}개 아파트 완전 상세정보 업그레이드 시작\n`);
  
  for (const apartment of apartments) {
    console.log(`📍 ${apartment.name} (${apartment.code}) 처리 중...`);
    
    const enhancedFields = await collectFullDetails(apartment.code);
    
    if (enhancedFields) {
      const success = await updateWithFullDetails(apartment.code, enhancedFields);
      
      if (success) {
        console.log(`✅ ${apartment.name} 완전 업그레이드 완료!`);
        
        // 주요 정보 요약
        console.log(`📋 주요 정보:`);
        console.log(`  - 편의시설: ${enhancedFields.welfare_facility ? '상세정보 있음' : '정보없음'}`);
        console.log(`  - 교통정보: ${enhancedFields.subway_station || '정보없음'} (${enhancedFields.subway_line || '노선정보없음'})`);
        console.log(`  - 안전시설: CCTV ${enhancedFields.kaptd_cccnt}대, 경비원 ${enhancedFields.kaptd_scnt}명`);
        console.log(`  - 인프라: 급수방식 ${enhancedFields.code_wsupply || '정보없음'}, 통신 ${enhancedFields.code_net || '정보없음'}`);
        console.log(`  - 전기차충전: 지하 ${enhancedFields.underground_el_charger_cnt || 0}대\n`);
      } else {
        console.log(`❌ ${apartment.name} 업데이트 실패\n`);
      }
    } else {
      console.log(`❌ ${apartment.name} 데이터 수집 실패\n`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('🎉 모든 아파트 완전 상세정보 업그레이드 완료!');
  console.log('📋 이제 웹사이트에서 편의시설, 교통정보, 안전시설, 인프라 정보가 모두 표시됩니다!');
}

upgradeWithFullDetails().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('❌ 오류:', error);
  process.exit(1);
});