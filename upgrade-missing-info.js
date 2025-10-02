/**
 * 누락된 층수, 건설회사 등 중요 정보 추가 업그레이드
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

/**
 * 누락된 중요 정보들 수집
 */
async function collectMissingInfo(kaptCode, apartmentName) {
  const missingFields = {};
  
  try {
    console.log(`📡 ${apartmentName} (${kaptCode}) 누락정보 수집 중...`);
    
    const basicInfo = await getBasicInfo(kaptCode);
    if (basicInfo) {
      // 층수 정보
      missingFields.kapt_base_floor = parseInt(basicInfo.kaptBaseFloor) || null;
      missingFields.kapt_top_floor = parseInt(basicInfo.kaptTopFloor) || null;
      
      // 회사 정보
      missingFields.kapt_bcompany = basicInfo.kaptBcompany || null;  // 시공업체
      missingFields.kapt_acompany = basicInfo.kaptAcompany || null;  // 관리업체
      
      // 연락처 정보
      missingFields.kapt_tel = basicInfo.kaptTel || null;
      missingFields.kapt_fax = basicInfo.kaptFax || null;
      missingFields.kapt_url = basicInfo.kaptUrl || null;
      
      // 면적 정보  
      missingFields.kapt_tarea = parseFloat(basicInfo.kaptTarea) || null;
      missingFields.kapt_marea = parseFloat(basicInfo.kaptMarea) || null;
      missingFields.priv_area = parseFloat(basicInfo.privArea) || null;
      
      // 기타 정보
      missingFields.zipcode = basicInfo.zipcode || null;
      missingFields.bjd_code = basicInfo.bjdCode || null;
      missingFields.ho_cnt = parseInt(basicInfo.hoCnt) || null;
      
      console.log(`  ✅ 층수: 지하 ${missingFields.kapt_base_floor}층 ~ 지상 ${missingFields.kapt_top_floor}층`);
      console.log(`  ✅ 시공업체: ${missingFields.kapt_bcompany || '정보없음'}`);
      console.log(`  ✅ 관리업체: ${missingFields.kapt_acompany || '정보없음'}`);
      console.log(`  ✅ 관리사무소: ${missingFields.kapt_tel || '정보없음'}`);
      console.log(`  ✅ 홈페이지: ${missingFields.kapt_url || '정보없음'}`);
      console.log(`  ✅ 대지면적: ${missingFields.kapt_tarea || '정보없음'}㎡`);
      
      missingFields.updated_at = new Date().toISOString();
      
      return missingFields;
    } else {
      console.log(`❌ ${apartmentName} 기본정보 수집 실패`);
      return null;
    }
    
  } catch (error) {
    console.log(`❌ ${apartmentName} 누락정보 수집 오류: ${error.message}`);
    return null;
  }
}

async function updateMissingInfo(kaptCode, missingFields) {
  try {
    const { data, error } = await supabase
      .from('apartment_complexes')
      .update(missingFields)
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

async function upgradeMissingInfo() {
  const apartments = [
    { code: 'A10026207', name: '서울숲리버뷰자이아파트' },
    { code: 'A13307001', name: '행당두산' },
    { code: 'A13307002', name: '서울숲행당푸르지오' }
  ];
  
  console.log(`🚀 ${apartments.length}개 아파트 누락정보 업그레이드 시작\n`);
  
  for (const apartment of apartments) {
    console.log(`📍 ${apartment.name} 처리 중...`);
    
    const missingFields = await collectMissingInfo(apartment.code, apartment.name);
    
    if (missingFields) {
      const success = await updateMissingInfo(apartment.code, missingFields);
      
      if (success) {
        console.log(`✅ ${apartment.name} 누락정보 업그레이드 완료!\n`);
      } else {
        console.log(`❌ ${apartment.name} 업데이트 실패\n`);
      }
    } else {
      console.log(`❌ ${apartment.name} 정보 수집 실패\n`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('🎉 모든 아파트 누락정보 업그레이드 완료!');
  console.log('📋 이제 웹사이트에서 층수 정보, 건설회사, 연락처, 면적 정보가 모두 표시됩니다!');
}

upgradeMissingInfo().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('❌ 오류:', error);
  process.exit(1);
});