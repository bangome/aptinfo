/**
 * 향상된 데이터 수집 스크립트
 * 목록 + 기본정보 + 상세정보 API 모두 활용
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
async function getApartmentList(pageNo = 1, numOfRows = 50) {
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
 * 통합 데이터 수집
 */
async function collectCompleteData(apartments) {
  console.log(`🔄 ${apartments.length}개 아파트의 상세정보 수집 중...`);
  
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
        data_source: 'government_api_enhanced'
      };
      
      // 기본정보 API 호출
      const basicInfo = await getBasicInfo(apt.kaptCode);
      if (basicInfo) {
        // 기본정보 필드 매핑
        Object.assign(baseData, {
          kapt_addr: basicInfo.kaptAddr,
          bjd_code: basicInfo.bjdCode,
          zipcode: basicInfo.zipcode,
          kapt_tarea: parseFloat(basicInfo.kaptTarea) || null,
          kapt_marea: parseFloat(basicInfo.kaptMarea) || null,
          priv_area: parseFloat(basicInfo.privArea) || null,
          kapt_dong_cnt: parseInt(basicInfo.kaptDongCnt) || null,
          kapt_da_cnt: parseInt(basicInfo.kaptdaCnt) || null,
          ho_cnt: parseInt(basicInfo.hoCnt) || null,
          code_sale_nm: basicInfo.codeSaleNm,
          code_heat_nm: basicInfo.codeHeatNm,
          code_mgr_nm: basicInfo.codeMgrNm,
          code_apt_nm: basicInfo.codeAptNm,
          code_hall_nm: basicInfo.codeHallNm,
          kapt_bcompany: basicInfo.kaptBcompany,
          kapt_acompany: basicInfo.kaptAcompany,
          kapt_tel: basicInfo.kaptTel,
          kapt_fax: basicInfo.kaptFax,
          kapt_url: basicInfo.kaptUrl,
          kapt_base_floor: parseInt(basicInfo.kaptBaseFloor) || null,
          kapt_top_floor: parseInt(basicInfo.kaptTopFloor) || null,
          ktown_flr_no: parseInt(basicInfo.ktownFlrNo) || null,
          kapt_usedate: basicInfo.kaptUsedate,
          kaptd_ecntp: parseInt(basicInfo.kaptdEcntp) || null,
          kapt_mparea60: parseInt(basicInfo.kaptMparea60) || null,
          kapt_mparea85: parseInt(basicInfo.kaptMparea85) || null,
          kapt_mparea135: parseInt(basicInfo.kaptMparea135) || null,
          kapt_mparea136: parseInt(basicInfo.kaptMparea136) || null
        });
        
        console.log(`  ✅ 기본정보 수집 완료`);
      }
      
      // 상세정보 API 호출
      const detailInfo = await getDetailInfo(apt.kaptCode);
      if (detailInfo) {
        // 상세정보 필드 매핑
        Object.assign(baseData, {
          code_mgr: detailInfo.codeMgr,
          kapt_mgr_cnt: parseInt(detailInfo.kaptMgrCnt) || null,
          kapt_ccompany: detailInfo.kaptCcompany,
          code_sec: detailInfo.codeSec,
          kaptd_scnt: parseInt(detailInfo.kaptdScnt) || null,
          kaptd_sec_com: detailInfo.kaptdSecCom,
          code_clean: detailInfo.codeClean,
          kaptd_clcnt: parseInt(detailInfo.kaptdClcnt) || null,
          code_disinf: detailInfo.codeDisinf,
          kaptd_dcnt: parseInt(detailInfo.kaptdDcnt) || null,
          disposal_type: detailInfo.disposalType,
          code_garbage: detailInfo.codeGarbage,
          code_str: detailInfo.codeStr,
          kaptd_ecapa: parseInt(detailInfo.kaptdEcapa) || null,
          code_econ: detailInfo.codeEcon,
          code_emgr: detailInfo.codeEmgr,
          code_falarm: detailInfo.codeFalarm,
          code_wsupply: detailInfo.codeWsupply,
          code_net: detailInfo.codeNet,
          code_elev: detailInfo.codeElev,
          kaptd_ecnt: parseInt(detailInfo.kaptdEcnt) || null,
          kaptd_pcnt: parseInt(detailInfo.kaptdPcnt) || null,
          kaptd_pcntu: parseInt(detailInfo.kaptdPcntu) || null,
          kaptd_cccnt: parseInt(detailInfo.kaptdCccnt) || null,
          welfare_facility: detailInfo.welfareFacility,
          convenient_facility: detailInfo.convenientFacility,
          education_facility: detailInfo.educationFacility,
          kaptd_wtimebus: detailInfo.kaptdWtimebus,
          subway_line: detailInfo.subwayLine,
          subway_station: detailInfo.subwayStation,
          kaptd_wtimesub: detailInfo.kaptdWtimesub,
          ground_el_charger_cnt: parseInt(detailInfo.groundElChargerCnt) || null,
          underground_el_charger_cnt: parseInt(detailInfo.undergroundElChargerCnt) || null,
          use_yn: detailInfo.useYn
        });
        
        console.log(`  ✅ 상세정보 수집 완료`);
      }
      
      enhancedData.push(baseData);
      
      // API 호출 제한 준수 (각 아파트마다 3번의 API 호출)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
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
async function saveEnhancedData(apartments) {
  if (apartments.length === 0) return { success: 0, failed: 0 };
  
  console.log(`💾 ${apartments.length}개 아파트 향상된 데이터 저장 중...`);
  
  try {
    const { data, error } = await supabase
      .from('apartment_complexes')
      .upsert(apartments, { 
        onConflict: 'kapt_code',
        ignoreDuplicates: false 
      });
    
    if (error) {
      console.error('❌ DB 저장 오류:', error.message);
      return { success: 0, failed: apartments.length };
    }
    
    console.log(`✅ ${apartments.length}개 향상된 데이터 저장 완료`);
    return { success: apartments.length, failed: 0 };
    
  } catch (error) {
    console.error('❌ DB 저장 중 오류:', error.message);
    return { success: 0, failed: apartments.length };
  }
}

/**
 * 메인 수집 함수
 */
async function collectEnhancedData(maxPages = 2) {
  console.log('🚀 향상된 데이터 수집 시작 (목록+기본+상세정보)');
  
  let totalCollected = 0;
  let totalSaved = 0;
  let pageNo = 1;
  
  while (pageNo <= maxPages) {
    // 1. 목록 조회
    const listResult = await getApartmentList(pageNo, 10); // 테스트용으로 10개씩
    
    if (listResult.items.length === 0) {
      console.log('📄 더 이상 데이터가 없습니다.');
      break;
    }
    
    // 2. 상세정보 수집
    const enhancedData = await collectCompleteData(listResult.items);
    totalCollected += enhancedData.length;
    
    // 3. 데이터베이스 저장
    const saveResult = await saveEnhancedData(enhancedData);
    totalSaved += saveResult.success;
    
    console.log(`📊 페이지 ${pageNo} 완료: 수집 ${enhancedData.length}개, 저장 ${saveResult.success}개`);
    console.log(`📈 누적: 수집 ${totalCollected}개, 저장 ${totalSaved}개\n`);
    
    if (!listResult.hasMore) {
      console.log('📄 마지막 페이지 도달');
      break;
    }
    
    pageNo++;
  }
  
  console.log(`\n🎉 향상된 데이터 수집 완료!`);
  console.log(`📊 총 수집: ${totalCollected}개`);
  console.log(`💾 총 저장: ${totalSaved}개`);
  console.log(`📈 성공률: ${totalSaved > 0 ? ((totalSaved / totalCollected) * 100).toFixed(1) : 0}%`);
}

// 실행
collectEnhancedData(2).then(() => {
  console.log('✅ 스크립트 완료');
  process.exit(0);
}).catch(error => {
  console.error('❌ 스크립트 오류:', error);
  process.exit(1);
});