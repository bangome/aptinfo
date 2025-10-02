/**
 * 기존 291개 아파트 데이터를 67개 필드로 업그레이드
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
 * 기존 아파트 데이터 조회 (67개 필드가 없는 것들)
 */
async function getExistingApartments(limit = 20, offset = 0) {
  try {
    const { data, error } = await supabase
      .from('apartment_complexes')
      .select('kapt_code, name')
      .neq('data_source', 'government_api_complete_enhanced')
      .range(offset, offset + limit - 1)
      .order('created_at');
    
    if (error) {
      console.error('❌ 기존 데이터 조회 오류:', error.message);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('❌ 기존 데이터 조회 중 오류:', error.message);
    return [];
  }
}

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
      
      // 기존 컬럼 업데이트
      if (basicInfo.kaptUsedate) {
        enhancedFields.use_approval_date = basicInfo.kaptUsedate;
      }
      if (basicInfo.kaptBcompany) {
        enhancedFields.construction_company = basicInfo.kaptBcompany;
      }
      if (basicInfo.kaptdaCnt) {
        enhancedFields.household_count = parseInt(basicInfo.kaptdaCnt) || null;
      }
      if (basicInfo.kaptDongCnt) {
        enhancedFields.dong_count = parseInt(basicInfo.kaptDongCnt) || null;
      }
      if (basicInfo.kaptTel) {
        enhancedFields.management_office_phone = basicInfo.kaptTel;
      }
      if (basicInfo.kaptUrl) {
        enhancedFields.website_url = basicInfo.kaptUrl;
      }
      if (basicInfo.codeHeatNm) {
        enhancedFields.heating_type = basicInfo.codeHeatNm;
      }
      if (basicInfo.codeAptNm) {
        enhancedFields.apartment_type = basicInfo.codeAptNm;
      }
      if (basicInfo.codeMgrNm) {
        enhancedFields.management_type = basicInfo.codeMgrNm;
      }
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
    
    // 데이터 소스 업데이트
    enhancedFields.data_source = 'government_api_upgraded';
    enhancedFields.updated_at = new Date().toISOString();
    
    return enhancedFields;
    
  } catch (error) {
    console.log(`❌ 67개 필드 수집 오류 (${kaptCode}): ${error.message}`);
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
    
    return true;
    
  } catch (error) {
    console.error(`❌ DB 업데이트 중 오류 (${kaptCode}):`, error.message);
    return false;
  }
}

/**
 * 메인 업그레이드 함수
 */
async function upgradeExistingData() {
  console.log('🚀 기존 291개 아파트 데이터 67개 필드로 업그레이드 시작');
  
  let totalProcessed = 0;
  let totalUpdated = 0;
  let totalErrors = 0;
  let offset = 0;
  const batchSize = 10; // 배치 크기
  
  while (true) {
    // 기존 데이터 조회
    const apartments = await getExistingApartments(batchSize, offset);
    
    if (apartments.length === 0) {
      console.log('📄 모든 데이터 처리 완료');
      break;
    }
    
    console.log(`\n📦 배치 ${Math.floor(offset / batchSize) + 1}: ${apartments.length}개 아파트 처리 중...`);
    
    for (let i = 0; i < apartments.length; i++) {
      const apt = apartments[i];
      console.log(`⚡ ${totalProcessed + 1}: ${apt.name} (${apt.kapt_code})`);
      
      try {
        // 67개 필드 수집
        const enhancedFields = await collectEnhancedFields(apt.kapt_code);
        
        if (enhancedFields) {
          // 데이터베이스 업데이트
          const updateSuccess = await updateApartmentData(apt.kapt_code, enhancedFields);
          
          if (updateSuccess) {
            console.log(`  ✅ 67개 필드 업그레이드 완료`);
            totalUpdated++;
          } else {
            console.log(`  ❌ DB 업데이트 실패`);
            totalErrors++;
          }
        } else {
          console.log(`  ⚠️ API 데이터 수집 실패`);
          totalErrors++;
        }
        
        totalProcessed++;
        
        // API 호출 제한 준수
        await new Promise(resolve => setTimeout(resolve, 800));
        
      } catch (error) {
        console.log(`  ❌ ${apt.name} 처리 오류: ${error.message}`);
        totalErrors++;
        totalProcessed++;
      }
    }
    
    console.log(`📊 배치 완료: 처리 ${apartments.length}개, 성공 ${totalUpdated - (totalUpdated - apartments.length + totalErrors)}개`);
    console.log(`📈 전체 진행률: ${totalProcessed}/291 (${((totalProcessed / 291) * 100).toFixed(1)}%)`);
    
    offset += batchSize;
  }
  
  console.log(`\n🎉 전체 업그레이드 완료!`);
  console.log(`📊 총 처리: ${totalProcessed}개`);
  console.log(`✅ 성공: ${totalUpdated}개`);
  console.log(`❌ 오류: ${totalErrors}개`);
  console.log(`📈 성공률: ${totalUpdated > 0 ? ((totalUpdated / totalProcessed) * 100).toFixed(1) : 0}%`);
  
  if (totalUpdated > 0) {
    console.log('\n🎯 이제 모든 아파트가 67개 상세 필드를 갖게 되었습니다!');
    console.log('📋 업그레이드된 필드: 세대수, 시공사, 주차대수, 승강기, CCTV, 편의시설, 교통정보 등');
  }
}

// 실행
upgradeExistingData().then(() => {
  console.log('✅ 업그레이드 스크립트 완료');
  process.exit(0);
}).catch(error => {
  console.error('❌ 업그레이드 스크립트 오류:', error);
  process.exit(1);
});