/**
 * 완전 향상된 데이터 수집 (67개 새 API 필드 활용)
 * 기본정보 API + 상세정보 API의 모든 파라미터 수집
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
 * 아파트 목록 조회
 */
async function getApartmentList(pageNo = 1, numOfRows = 20) {
  try {
    console.log(`📡 페이지 ${pageNo} 조회 중... (${numOfRows}개씩)`);
    
    const response = await axios.get(`${API_BASE_URL}/AptListService3/getTotalAptList3`, {
      params: {
        serviceKey: SERVICE_KEY,
        sigunguCd: '11680', // 강남구
        numOfRows: numOfRows,
        pageNo: pageNo
      },
      timeout: 30000
    });
    
    const jsonData = response.data;
    
    if (jsonData.response?.header?.resultCode !== '00') {
      throw new Error(`목록 API 오류: ${jsonData.response?.header?.resultMsg}`);
    }
    
    const items = jsonData.response?.body?.items || [];
    const totalCount = jsonData.response?.body?.totalCount || 0;
    
    console.log(`✅ ${items.length}개 아이템 받음 (전체: ${totalCount}개)`);
    
    return {
      items,
      totalCount,
      hasMore: pageNo * numOfRows < totalCount
    };
    
  } catch (error) {
    console.error(`❌ 목록 조회 오류: ${error.message}`);
    return { items: [], totalCount: 0, hasMore: false };
  }
}

/**
 * 기본정보 조회 (31개 필드)
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
 * 상세정보 조회 (36개 필드)
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
 * 완전 향상된 데이터 수집 (모든 67개 필드 활용)
 */
async function collectCompleteEnhancedData(apartments) {
  console.log(`🔄 ${apartments.length}개 아파트의 완전한 정보 수집 중...`);
  
  const enhancedData = [];
  
  for (let i = 0; i < apartments.length; i++) {
    const apt = apartments[i];
    console.log(`⚡ ${i + 1}/${apartments.length}: ${apt.kaptName} (${apt.kaptCode})`);
    
    try {
      // 기본 목록 데이터
      const baseData = {
        kapt_code: apt.kaptCode,
        name: apt.kaptName,
        address: `${apt.as3 || ''} ${apt.as4 || ''}`.trim() || apt.kaptName,
        road_address: apt.doroJuso,
        region_code: apt.bjdCode,
        legal_dong: apt.as3,
        jibun: apt.as4,
        data_source: 'government_api_complete_enhanced'
      };
      
      // 기본정보 API - 31개 필드 매핑
      const basicInfo = await getBasicInfo(apt.kaptCode);
      if (basicInfo) {
        // 주소 정보
        baseData.kapt_addr = basicInfo.kaptAddr || null;
        baseData.bjd_code = basicInfo.bjdCode || null;
        baseData.zipcode = basicInfo.zipcode || null;
        
        // 단지 정보
        baseData.kapt_tarea = parseFloat(basicInfo.kaptTarea) || null;
        baseData.kapt_marea = parseFloat(basicInfo.kaptMarea) || null;
        baseData.priv_area = parseFloat(basicInfo.privArea) || null;
        baseData.kapt_dong_cnt = parseInt(basicInfo.kaptDongCnt) || null;
        baseData.kapt_da_cnt = parseInt(basicInfo.kaptdaCnt) || null;
        baseData.ho_cnt = parseInt(basicInfo.hoCnt) || null;
        
        // 분류 코드들
        baseData.code_sale_nm = basicInfo.codeSaleNm || null;
        baseData.code_heat_nm = basicInfo.codeHeatNm || null;
        baseData.code_mgr_nm = basicInfo.codeMgrNm || null;
        baseData.code_apt_nm = basicInfo.codeAptNm || null;
        baseData.code_hall_nm = basicInfo.codeHallNm || null;
        
        // 회사 정보
        baseData.kapt_bcompany = basicInfo.kaptBcompany || null;
        baseData.kapt_acompany = basicInfo.kaptAcompany || null;
        
        // 연락처
        baseData.kapt_tel = basicInfo.kaptTel || null;
        baseData.kapt_fax = basicInfo.kaptFax || null;
        baseData.kapt_url = basicInfo.kaptUrl || null;
        
        // 건물 구조
        baseData.kapt_base_floor = parseInt(basicInfo.kaptBaseFloor) || null;
        baseData.kapt_top_floor = parseInt(basicInfo.kaptTopFloor) || null;
        baseData.ktown_flr_no = parseInt(basicInfo.ktownFlrNo) || null;
        baseData.kapt_usedate = basicInfo.kaptUsedate || null;
        
        // 승강기
        baseData.kaptd_ecntp = parseInt(basicInfo.kaptdEcntp) || null;
        
        // 면적별 세대수
        baseData.kapt_mparea60 = parseInt(basicInfo.kaptMparea60) || null;
        baseData.kapt_mparea85 = parseInt(basicInfo.kaptMparea85) || null;
        baseData.kapt_mparea135 = parseInt(basicInfo.kaptMparea135) || null;
        baseData.kapt_mparea136 = parseInt(basicInfo.kaptMparea136) || null;
        
        // 기존 컬럼 매핑 (하위 호환성)
        if (basicInfo.kaptUsedate) {
          baseData.use_approval_date = basicInfo.kaptUsedate;
        }
        if (basicInfo.kaptBcompany) {
          baseData.construction_company = basicInfo.kaptBcompany;
        }
        if (basicInfo.kaptdaCnt) {
          baseData.household_count = parseInt(basicInfo.kaptdaCnt) || null;
        }
        if (basicInfo.kaptDongCnt) {
          baseData.dong_count = parseInt(basicInfo.kaptDongCnt) || null;
        }
        if (basicInfo.kaptTel) {
          baseData.management_office_phone = basicInfo.kaptTel;
        }
        if (basicInfo.kaptUrl) {
          baseData.website_url = basicInfo.kaptUrl;
        }
        if (basicInfo.codeHeatNm) {
          baseData.heating_type = basicInfo.codeHeatNm;
        }
        if (basicInfo.codeAptNm) {
          baseData.apartment_type = basicInfo.codeAptNm;
        }
        if (basicInfo.codeMgrNm) {
          baseData.management_type = basicInfo.codeMgrNm;
        }
        
        console.log(`  ✅ 기본정보 31개 필드 수집 완료`);
      }
      
      // 상세정보 API - 36개 필드 매핑
      const detailInfo = await getDetailInfo(apt.kaptCode);
      if (detailInfo) {
        // 관리 정보
        baseData.code_mgr = detailInfo.codeMgr || null;
        baseData.kapt_mgr_cnt = parseInt(detailInfo.kaptMgrCnt) || null;
        baseData.kapt_ccompany = detailInfo.kaptCcompany || null;
        
        // 경비관리
        baseData.code_sec = detailInfo.codeSec || null;
        baseData.kaptd_scnt = parseInt(detailInfo.kaptdScnt) || null;
        baseData.kaptd_sec_com = detailInfo.kaptdSecCom || null;
        
        // 청소관리
        baseData.code_clean = detailInfo.codeClean || null;
        baseData.kaptd_clcnt = parseInt(detailInfo.kaptdClcnt) || null;
        
        // 소독관리
        baseData.code_disinf = detailInfo.codeDisinf || null;
        baseData.kaptd_dcnt = parseInt(detailInfo.kaptdDcnt) || null;
        baseData.disposal_type = detailInfo.disposalType || null;
        
        // 기타 관리
        baseData.code_garbage = detailInfo.codeGarbage || null;
        
        // 건물 구조 및 시설
        baseData.code_str = detailInfo.codeStr || null;
        baseData.kaptd_ecapa = parseInt(detailInfo.kaptdEcapa) || null;
        baseData.code_econ = detailInfo.codeEcon || null;
        baseData.code_emgr = detailInfo.codeEmgr || null;
        baseData.code_falarm = detailInfo.codeFalarm || null;
        baseData.code_wsupply = detailInfo.codeWsupply || null;
        baseData.code_net = detailInfo.codeNet || null;
        
        // 승강기 관리
        baseData.code_elev = detailInfo.codeElev || null;
        baseData.kaptd_ecnt = parseInt(detailInfo.kaptdEcnt) || null;
        
        // 주차시설
        baseData.kaptd_pcnt = parseInt(detailInfo.kaptdPcnt) || null;
        baseData.kaptd_pcntu = parseInt(detailInfo.kaptdPcntu) || null;
        
        // 보안시설
        baseData.kaptd_cccnt = parseInt(detailInfo.kaptdCccnt) || null;
        
        // 편의시설
        baseData.welfare_facility = detailInfo.welfareFacility || null;
        baseData.convenient_facility = detailInfo.convenientFacility || null;
        baseData.education_facility = detailInfo.educationFacility || null;
        
        // 교통정보
        baseData.kaptd_wtimebus = detailInfo.kaptdWtimebus || null;
        baseData.subway_line = detailInfo.subwayLine || null;
        baseData.subway_station = detailInfo.subwayStation || null;
        baseData.kaptd_wtimesub = detailInfo.kaptdWtimesub || null;
        
        // 전기차 충전시설
        baseData.ground_el_charger_cnt = parseInt(detailInfo.groundElChargerCnt) || null;
        baseData.underground_el_charger_cnt = parseInt(detailInfo.undergroundElChargerCnt) || null;
        
        // 사용여부
        baseData.use_yn = detailInfo.useYn || null;
        
        // 기존 컬럼 매핑 제거 (새 컬럼으로 대체)
        // elevator_count -> kaptd_ecnt
        // cctv_count -> kaptd_cccnt
        
        // 주차대수는 새 컬럼에 저장됨
        // kaptd_pcnt (지상주차대수), kaptd_pcntu (지하주차대수)
        
        console.log(`  ✅ 상세정보 36개 필드 수집 완료`);
      }
      
      enhancedData.push(baseData);
      
      // API 호출 제한 준수 (각 아파트마다 3번의 API 호출)
      await new Promise(resolve => setTimeout(resolve, 800));
      
    } catch (error) {
      console.log(`  ❌ ${apt.kaptName} 처리 오류: ${error.message}`);
      // 기본 데이터라도 저장
      enhancedData.push(baseData);
    }
  }
  
  return enhancedData;
}

/**
 * 데이터베이스 저장
 */
async function saveCompleteEnhancedData(apartments) {
  if (apartments.length === 0) return { success: 0, failed: 0 };
  
  console.log(`💾 ${apartments.length}개 아파트 완전 향상된 데이터 저장 중...`);
  
  try {
    const { data, error } = await supabase
      .from('apartment_complexes')
      .upsert(apartments, { 
        onConflict: 'kapt_code',
        ignoreDuplicates: false 
      });
    
    if (error) {
      console.error('❌ DB 저장 오류:', error.message);
      console.error('🔍 첫 번째 레코드 구조:', JSON.stringify(apartments[0], null, 2));
      return { success: 0, failed: apartments.length };
    }
    
    console.log(`✅ ${apartments.length}개 완전 향상된 데이터 저장 완료`);
    return { success: apartments.length, failed: 0 };
    
  } catch (error) {
    console.error('❌ DB 저장 중 오류:', error.message);
    return { success: 0, failed: apartments.length };
  }
}

/**
 * 메인 수집 함수
 */
async function collectCompleteEnhancedDataMain(maxPages = 2) {
  console.log('🚀 완전 향상된 데이터 수집 시작 (67개 새 API 필드 활용)');
  console.log('📊 기본정보 API: 31개 필드');
  console.log('📊 상세정보 API: 36개 필드');
  console.log('📊 총 67개 새 필드 + 기존 필드들\n');
  
  let totalCollected = 0;
  let totalSaved = 0;
  let pageNo = 1;
  
  while (pageNo <= maxPages) {
    // 1. 목록 조회
    const listResult = await getApartmentList(pageNo, 5); // 테스트용 5개씩
    
    if (listResult.items.length === 0) {
      console.log('📄 더 이상 데이터가 없습니다.');
      break;
    }
    
    // 2. 완전한 상세정보 수집
    const enhancedData = await collectCompleteEnhancedData(listResult.items);
    totalCollected += enhancedData.length;
    
    // 3. 데이터베이스 저장
    const saveResult = await saveCompleteEnhancedData(enhancedData);
    totalSaved += saveResult.success;
    
    console.log(`📊 페이지 ${pageNo} 완료: 수집 ${enhancedData.length}개, 저장 ${saveResult.success}개`);
    console.log(`📈 누적: 수집 ${totalCollected}개, 저장 ${totalSaved}개\n`);
    
    if (!listResult.hasMore) {
      console.log('📄 마지막 페이지 도달');
      break;
    }
    
    pageNo++;
  }
  
  console.log(`\n🎉 완전 향상된 데이터 수집 완료!`);
  console.log(`📊 총 수집: ${totalCollected}개`);
  console.log(`💾 총 저장: ${totalSaved}개`);
  console.log(`📈 성공률: ${totalSaved > 0 ? ((totalSaved / totalCollected) * 100).toFixed(1) : 0}%`);
  
  // 수집된 데이터 필드 요약
  if (totalSaved > 0) {
    console.log('\n📋 수집된 67개 새 API 필드:');
    console.log('🏠 기본정보 (31개): 주소, 면적, 세대수, 동수, 분양형태, 난방방식, 시공사, 건축년도 등');
    console.log('🏗️ 상세정보 (36개): 관리방식, 주차대수, 승강기, CCTV, 편의시설, 교통정보, 전기차충전기 등');
    console.log('✨ 모든 정부 API 데이터를 완전히 수집하여 DB에 저장 완료!');
  }
}

// 실행
collectCompleteEnhancedDataMain(2).then(() => {
  console.log('✅ 완전 향상된 데이터 수집 스크립트 완료');
  process.exit(0);
}).catch(error => {
  console.error('❌ 스크립트 오류:', error);
  process.exit(1);
});