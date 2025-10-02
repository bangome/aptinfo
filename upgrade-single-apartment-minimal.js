/**
 * 특정 아파트 핵심 필드만 업그레이드 (실제 DB 스키마에 존재하는 필드들만)
 */

const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// 설정
const SERVICE_KEY = 'EAl5DDYH6Ixz5ZpCY40/DTEDqkFXTG2Utgr5YJQkusuQyugyb80K+qVwRG2ZpceMiCIXqwFWmGpJRHeu7s8JUA==';
const API_BASE_URL = 'https://apis.data.go.kr/1613000';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/**
 * 기본정보 조회
 */
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
    } else {
      console.log(`⚠️ 기본정보 없음 (${kaptCode}): ${jsonData.response?.header?.resultMsg}`);
      return null;
    }
    
  } catch (error) {
    console.log(`⚠️ 기본정보 오류 (${kaptCode}): ${error.message}`);
    return null;
  }
}

/**
 * 상세정보 조회
 */
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
    } else {
      console.log(`⚠️ 상세정보 없음 (${kaptCode}): ${jsonData.response?.header?.resultMsg}`);
      return null;
    }
    
  } catch (error) {
    console.log(`⚠️ 상세정보 오류 (${kaptCode}): ${error.message}`);
    return null;
  }
}

/**
 * 핵심 필드 데이터 수집 (실제 DB에 존재하는 필드만)
 */
async function collectMinimalFields(kaptCode) {
  const enhancedFields = {};
  
  try {
    console.log(`📡 기본정보 API 호출 중... (${kaptCode})`);
    const basicInfo = await getBasicInfo(kaptCode);
    if (basicInfo) {
      console.log('✅ 기본정보 수집 성공:', Object.keys(basicInfo).length, '개 필드');
      
      // 핵심 필드만 (실제 DB에 존재하는 것들)
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
      
      console.log(`  세대수: ${enhancedFields.kapt_da_cnt}, 동수: ${enhancedFields.kapt_dong_cnt}, 사용승인일: ${enhancedFields.kapt_usedate}`);
    } else {
      console.log('❌ 기본정보 수집 실패');
    }
    
    // API 호출 간격
    await new Promise(resolve => setTimeout(resolve, 400));
    
    console.log(`📡 상세정보 API 호출 중... (${kaptCode})`);
    const detailInfo = await getDetailInfo(kaptCode);
    if (detailInfo) {
      console.log('✅ 상세정보 수집 성공:', Object.keys(detailInfo).length, '개 필드');
      
      // 핵심 필드만 (실제 DB에 존재하는 것들)
      enhancedFields.kaptd_ecnt = parseInt(detailInfo.kaptdEcnt) || null;
      enhancedFields.kaptd_pcnt = parseInt(detailInfo.kaptdPcnt) || null;
      enhancedFields.kaptd_pcntu = parseInt(detailInfo.kaptdPcntu) || null;
      enhancedFields.kaptd_cccnt = parseInt(detailInfo.kaptdCccnt) || null;
      
      console.log(`  주차: 지상 ${enhancedFields.kaptd_pcnt}대, 지하 ${enhancedFields.kaptd_pcntu}대, 승강기: ${enhancedFields.kaptd_ecnt}대, CCTV: ${enhancedFields.kaptd_cccnt}대`);
    } else {
      console.log('❌ 상세정보 수집 실패');
    }
    
    // 데이터 소스 업데이트
    enhancedFields.data_source = 'government_api_complete_enhanced';
    enhancedFields.updated_at = new Date().toISOString();
    
    return enhancedFields;
    
  } catch (error) {
    console.log(`❌ 필드 수집 오류 (${kaptCode}): ${error.message}`);
    return null;
  }
}

/**
 * 데이터베이스 업데이트
 */
async function updateApartmentData(kaptCode, enhancedFields) {
  try {
    const { data, error } = await supabase
      .from('apartment_complexes')
      .update(enhancedFields)
      .eq('kapt_code', kaptCode);
    
    if (error) {
      console.error(`❌ DB 업데이트 오류 (${kaptCode}):`, error.message);
      return false;
    }
    
    console.log(`✅ DB 업데이트 성공 (${kaptCode})`);
    return true;
    
  } catch (error) {
    console.error(`❌ DB 업데이트 중 오류 (${kaptCode}):`, error.message);
    return false;
  }
}

/**
 * 단일 아파트 업그레이드
 */
async function upgradeSingleApartment(kaptCode) {
  console.log(`🚀 ${kaptCode} 아파트 핵심 필드 업그레이드 시작`);
  
  try {
    // 핵심 필드 수집
    const enhancedFields = await collectMinimalFields(kaptCode);
    
    if (enhancedFields) {
      // 데이터베이스 업데이트
      const updateSuccess = await updateApartmentData(kaptCode, enhancedFields);
      
      if (updateSuccess) {
        console.log(`🎉 ${kaptCode} 업그레이드 완료!`);
        console.log('📋 업그레이드된 핵심 필드:');
        console.log(`  - 세대수: ${enhancedFields.kapt_da_cnt}`);
        console.log(`  - 동수: ${enhancedFields.kapt_dong_cnt}`);
        console.log(`  - 사용승인일: ${enhancedFields.kapt_usedate}`);
        console.log(`  - 지상주차: ${enhancedFields.kaptd_pcnt}대`);
        console.log(`  - 지하주차: ${enhancedFields.kaptd_pcntu}대`);
        console.log(`  - 승강기: ${enhancedFields.kaptd_ecnt}대`);
        console.log(`  - CCTV: ${enhancedFields.kaptd_cccnt}대`);
        console.log(`  - 데이터소스: ${enhancedFields.data_source}`);
        return true;
      } else {
        console.log(`❌ DB 업데이트 실패`);
        return false;
      }
    } else {
      console.log(`❌ API 데이터 수집 실패`);
      return false;
    }
    
  } catch (error) {
    console.log(`❌ 업그레이드 오류: ${error.message}`);
    return false;
  }
}

// 실행 - 여러 아파트 업그레이드
const KAPT_CODES = [
  { code: 'A13307001', name: '행당두산' },
  { code: 'A13307002', name: '서울숲행당푸르지오' }
];

async function upgradeMultipleApartments() {
  console.log(`🚀 ${KAPT_CODES.length}개 아파트 업그레이드 시작\n`);
  
  let successCount = 0;
  let failCount = 0;
  
  for (const apartment of KAPT_CODES) {
    console.log(`📍 ${apartment.name} (${apartment.code}) 처리 중...`);
    
    const success = await upgradeSingleApartment(apartment.code);
    
    if (success) {
      console.log(`✅ ${apartment.name} 업그레이드 완료\n`);
      successCount++;
    } else {
      console.log(`❌ ${apartment.name} 업그레이드 실패\n`);
      failCount++;
    }
    
    // API 호출 제한 준수
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log(`🎉 전체 업그레이드 완료!`);
  console.log(`✅ 성공: ${successCount}개`);
  console.log(`❌ 실패: ${failCount}개`);
}

upgradeMultipleApartments().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('❌ 스크립트 오류:', error);
  process.exit(1);
});