/**
 * 특정 아파트(강일리버파크7단지)를 apartment_complexes 테이블로 업그레이드
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
 * apartments 테이블에서 기존 데이터 조회
 */
async function getApartmentData(apartmentId) {
  try {
    const { data, error } = await supabase
      .from('apartments')
      .select('*')
      .eq('id', apartmentId)
      .single();
    
    if (error) {
      console.error('❌ 기존 데이터 조회 오류:', error.message);
      return null;
    }
    
    return data;
    
  } catch (error) {
    console.error('❌ 기존 데이터 조회 중 오류:', error.message);
    return null;
  }
}

/**
 * apartment_complexes 테이블에 새 데이터 삽입
 */
async function insertToApartmentComplexes(apartmentData, enhancedFields) {
  try {
    // apartment_complexes 테이블의 스키마에 맞게 데이터 매핑
    const newComplexData = {
      // 기본 정보 (apartment_complexes 스키마에 맞게)
      id: apartmentData.id,
      kapt_code: apartmentData.kapt_code,
      name: apartmentData.name,
      address: apartmentData.jibun_address, // address 필드로 매핑
      road_address: apartmentData.road_address,
      region_code: apartmentData.bjd_code, // region_code 필드로 매핑
      legal_dong: apartmentData.eupmyeondong, // legal_dong 필드로 매핑
      jibun: apartmentData.ri, // jibun 필드로 매핑
      
      // 메타데이터
      data_source: 'government_api_complete_enhanced',
      created_at: apartmentData.created_at,
      updated_at: new Date().toISOString(),
      
      // 새로운 67개 API 필드들
      ...enhancedFields
    };

    const { data, error } = await supabase
      .from('apartment_complexes')
      .insert(newComplexData);
    
    if (error) {
      console.error('❌ apartment_complexes 삽입 오류:', error.message);
      return false;
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ apartment_complexes 삽입 중 오류:', error.message);
    return false;
  }
}

/**
 * 67개 필드 데이터 수집
 */
async function collectEnhancedFields(kaptCode) {
  const enhancedFields = {};
  
  try {
    // 기본정보 API - 31개 필드
    const basicInfo = await getBasicInfo(kaptCode);
    if (basicInfo) {
      // 주소 정보
      enhancedFields.kapt_addr = basicInfo.kaptAddr || null;
      enhancedFields.bjd_code = basicInfo.bjdCode || null;
      enhancedFields.zipcode = basicInfo.zipcode || null;
      
      // 단지 정보
      enhancedFields.kapt_tarea = parseFloat(basicInfo.kaptTarea) || null;
      enhancedFields.kapt_marea = parseFloat(basicInfo.kaptMarea) || null;
      enhancedFields.priv_area = parseFloat(basicInfo.privArea) || null;
      enhancedFields.kapt_dong_cnt = parseInt(basicInfo.kaptDongCnt) || null;
      enhancedFields.kapt_da_cnt = parseInt(basicInfo.kaptdaCnt) || null;
      enhancedFields.ho_cnt = parseInt(basicInfo.hoCnt) || null;
      
      // 분류 코드들
      enhancedFields.code_sale_nm = basicInfo.codeSaleNm || null;
      enhancedFields.code_heat_nm = basicInfo.codeHeatNm || null;
      enhancedFields.code_mgr_nm = basicInfo.codeMgrNm || null;
      enhancedFields.code_apt_nm = basicInfo.codeAptNm || null;
      enhancedFields.code_hall_nm = basicInfo.codeHallNm || null;
      
      // 회사 정보
      enhancedFields.kapt_bcompany = basicInfo.kaptBcompany || null;
      enhancedFields.kapt_acompany = basicInfo.kaptAcompany || null;
      
      // 연락처
      enhancedFields.kapt_tel = basicInfo.kaptTel || null;
      enhancedFields.kapt_fax = basicInfo.kaptFax || null;
      enhancedFields.kapt_url = basicInfo.kaptUrl || null;
      
      // 건물 구조
      enhancedFields.kapt_base_floor = parseInt(basicInfo.kaptBaseFloor) || null;
      enhancedFields.kapt_top_floor = parseInt(basicInfo.kaptTopFloor) || null;
      enhancedFields.ktown_flr_no = parseInt(basicInfo.ktownFlrNo) || null;
      enhancedFields.kapt_usedate = basicInfo.kaptUsedate || null;
      
      // 승강기
      enhancedFields.kaptd_ecntp = parseInt(basicInfo.kaptdEcntp) || null;
      
      // 면적별 세대수
      enhancedFields.kapt_mparea60 = parseInt(basicInfo.kaptMparea60) || null;
      enhancedFields.kapt_mparea85 = parseInt(basicInfo.kaptMparea85) || null;
      enhancedFields.kapt_mparea135 = parseInt(basicInfo.kaptMparea135) || null;
      enhancedFields.kapt_mparea136 = parseInt(basicInfo.kaptMparea136) || null;
    }
    
    // API 호출 간격
    await new Promise(resolve => setTimeout(resolve, 400));
    
    // 상세정보 API - 36개 필드
    const detailInfo = await getDetailInfo(kaptCode);
    if (detailInfo) {
      // 관리 정보
      enhancedFields.code_mgr = detailInfo.codeMgr || null;
      enhancedFields.kapt_mgr_cnt = parseInt(detailInfo.kaptMgrCnt) || null;
      enhancedFields.kapt_ccompany = detailInfo.kaptCcompany || null;
      
      // 경비관리
      enhancedFields.code_sec = detailInfo.codeSec || null;
      enhancedFields.kaptd_scnt = parseInt(detailInfo.kaptdScnt) || null;
      enhancedFields.kaptd_sec_com = detailInfo.kaptdSecCom || null;
      
      // 청소관리
      enhancedFields.code_clean = detailInfo.codeClean || null;
      enhancedFields.kaptd_clcnt = parseInt(detailInfo.kaptdClcnt) || null;
      
      // 소독관리
      enhancedFields.code_disinf = detailInfo.codeDisinf || null;
      enhancedFields.kaptd_dcnt = parseInt(detailInfo.kaptdDcnt) || null;
      enhancedFields.disposal_type = detailInfo.disposalType || null;
      
      // 기타 관리
      enhancedFields.code_garbage = detailInfo.codeGarbage || null;
      
      // 건물 구조 및 시설
      enhancedFields.code_str = detailInfo.codeStr || null;
      enhancedFields.kaptd_ecapa = parseInt(detailInfo.kaptdEcapa) || null;
      enhancedFields.code_econ = detailInfo.codeEcon || null;
      enhancedFields.code_emgr = detailInfo.codeEmgr || null;
      enhancedFields.code_falarm = detailInfo.codeFalarm || null;
      enhancedFields.code_wsupply = detailInfo.codeWsupply || null;
      enhancedFields.code_net = detailInfo.codeNet || null;
      
      // 승강기 관리
      enhancedFields.code_elev = detailInfo.codeElev || null;
      enhancedFields.kaptd_ecnt = parseInt(detailInfo.kaptdEcnt) || null;
      
      // 주차시설
      enhancedFields.kaptd_pcnt = parseInt(detailInfo.kaptdPcnt) || null;
      enhancedFields.kaptd_pcntu = parseInt(detailInfo.kaptdPcntu) || null;
      
      // 보안시설
      enhancedFields.kaptd_cccnt = parseInt(detailInfo.kaptdCccnt) || null;
      
      // 편의시설
      enhancedFields.welfare_facility = detailInfo.welfareFacility || null;
      enhancedFields.convenient_facility = detailInfo.convenientFacility || null;
      enhancedFields.education_facility = detailInfo.educationFacility || null;
      
      // 교통정보
      enhancedFields.kaptd_wtimebus = detailInfo.kaptdWtimebus || null;
      enhancedFields.subway_line = detailInfo.subwayLine || null;
      enhancedFields.subway_station = detailInfo.subwayStation || null;
      enhancedFields.kaptd_wtimesub = detailInfo.kaptdWtimesub || null;
      
      // 전기차 충전시설
      enhancedFields.ground_el_charger_cnt = parseInt(detailInfo.groundElChargerCnt) || null;
      enhancedFields.underground_el_charger_cnt = parseInt(detailInfo.undergroundElChargerCnt) || null;
      
      // 사용여부
      enhancedFields.use_yn = detailInfo.useYn || null;
    }
    
    return enhancedFields;
    
  } catch (error) {
    console.log(`❌ 67개 필드 수집 오류: ${error.message}`);
    return null;
  }
}

/**
 * 메인 업그레이드 함수
 */
async function upgradeSpecificApartment() {
  console.log('🚀 강일리버파크7단지 67개 필드로 업그레이드 시작');
  
  const apartmentId = 'c232b4d9-b33a-4bd8-81a4-0040e3e5b7d4';
  const kaptCode = 'A13410010';
  
  try {
    // 1. 기존 apartments 테이블에서 데이터 조회
    console.log('📋 기존 데이터 조회 중...');
    const apartmentData = await getApartmentData(apartmentId);
    
    if (!apartmentData) {
      console.error('❌ 기존 아파트 데이터를 찾을 수 없습니다.');
      return;
    }
    
    console.log(`✅ 기존 데이터 조회 완료: ${apartmentData.name}`);
    
    // 2. 67개 필드 데이터 수집
    console.log('🔍 67개 API 필드 데이터 수집 중...');
    const enhancedFields = await collectEnhancedFields(kaptCode);
    
    if (!enhancedFields) {
      console.error('❌ API 데이터 수집 실패');
      return;
    }
    
    console.log('✅ 67개 API 필드 데이터 수집 완료');
    console.log(`📊 수집된 필드: ${Object.keys(enhancedFields).length}개`);
    
    // 3. apartment_complexes 테이블에 삽입
    console.log('💾 apartment_complexes 테이블에 데이터 삽입 중...');
    const insertSuccess = await insertToApartmentComplexes(apartmentData, enhancedFields);
    
    if (insertSuccess) {
      console.log('✅ apartment_complexes 테이블 삽입 완료');
      console.log('🎉 강일리버파크7단지 업그레이드 성공!');
      console.log('📋 이제 67개 상세 필드를 모두 사용할 수 있습니다.');
    } else {
      console.error('❌ apartment_complexes 테이블 삽입 실패');
    }
    
  } catch (error) {
    console.error('❌ 업그레이드 중 오류:', error.message);
  }
}

// 실행
upgradeSpecificApartment().then(() => {
  console.log('✅ 업그레이드 스크립트 완료');
  process.exit(0);
}).catch(error => {
  console.error('❌ 업그레이드 스크립트 오류:', error);
  process.exit(1);
});