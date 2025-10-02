/**
 * 모든 아파트 단지의 67개 필드 일괄 업데이트
 * - 누락된 데이터 채우기
 * - 기존 데이터도 최신 정보로 업데이트
 * - API 호출 제한 고려 (초당 10회)
 * - 진행 상황 로깅
 */

const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// 설정
const SERVICE_KEY = process.env.NEXT_PUBLIC_DATA_GO_KR_SERVICE_KEY || 'EAl5DDYH6Ixz5ZpCY40/DTEDqkFXTG2Utgr5YJQkusuQyugyb80K+qVwRG2ZpceMiCIXqwFWmGpJRHeu7s8JUA==';
const API_BASE_URL = 'https://apis.data.go.kr/1613000';

// Supabase 클라이언트
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// 로그 파일 경로
const LOG_FILE = path.join(__dirname, `update-log-${new Date().toISOString().split('T')[0]}.json`);

// 통계
let stats = {
  total: 0,
  processed: 0,
  updated: 0,
  failed: 0,
  skipped: 0,
  errors: [],
  startTime: new Date(),
  endTime: null
};

// 진행 상황 저장
async function saveProgress() {
  try {
    await fs.writeFile(LOG_FILE, JSON.stringify(stats, null, 2));
  } catch (error) {
    console.error('진행 상황 저장 실패:', error.message);
  }
}

/**
 * 기본정보 조회 (getAphusBassInfoV4)
 */
async function getBasicInfo(kaptCode, retries = 3) {
  for (let i = 0; i < retries; i++) {
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
      } else if (jsonData.response?.header?.resultCode === '99') {
        // 서비스 키 오류
        console.error(`❌ 서비스 키 오류: ${jsonData.response?.header?.resultMsg}`);
        process.exit(1);
      } else {
        if (i === retries - 1) {
          console.log(`⚠️ 기본정보 없음 (${kaptCode}): ${jsonData.response?.header?.resultMsg}`);
        }
        return null;
      }
      
    } catch (error) {
      if (i === retries - 1) {
        console.log(`⚠️ 기본정보 오류 (${kaptCode}): ${error.message}`);
        return null;
      }
      // 재시도 전 대기
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  return null;
}

/**
 * 상세정보 조회 (getAphusDtlInfoV4)
 */
async function getDetailInfo(kaptCode, retries = 3) {
  for (let i = 0; i < retries; i++) {
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
        if (i === retries - 1) {
          console.log(`⚠️ 상세정보 없음 (${kaptCode}): ${jsonData.response?.header?.resultMsg}`);
        }
        return null;
      }
      
    } catch (error) {
      if (i === retries - 1) {
        console.log(`⚠️ 상세정보 오류 (${kaptCode}): ${error.message}`);
        return null;
      }
      // 재시도 전 대기
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  return null;
}

/**
 * 67개 필드 데이터 수집 및 변환
 */
async function collectEnhancedFields(apartment) {
  const kaptCode = apartment.kapt_code;
  const enhancedFields = {};
  
  try {
    // 기본정보 API 호출
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
    
    // API 호출 간격 (초당 10회 제한 고려)
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // 상세정보 API 호출
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
    
    // 데이터가 없으면 null 반환
    if (Object.keys(enhancedFields).length === 0) {
      return null;
    }
    
    // 메타 정보 추가
    enhancedFields.data_source = 'government_api_batch_update';
    enhancedFields.updated_at = new Date().toISOString();
    
    return enhancedFields;
    
  } catch (error) {
    console.error(`❌ 데이터 수집 오류 (${kaptCode}): ${error.message}`);
    stats.errors.push({
      kaptCode,
      name: apartment.name,
      error: error.message,
      timestamp: new Date().toISOString()
    });
    return null;
  }
}

/**
 * 데이터베이스 업데이트
 */
async function updateApartmentData(apartment, enhancedFields) {
  const kaptCode = apartment.kapt_code;
  
  try {
    const { data, error } = await supabase
      .from('apartment_complexes')
      .update(enhancedFields)
      .eq('kapt_code', kaptCode);
    
    if (error) {
      console.error(`❌ DB 업데이트 오류 (${kaptCode}):`, error.message);
      stats.errors.push({
        kaptCode,
        name: apartment.name,
        error: `DB: ${error.message}`,
        timestamp: new Date().toISOString()
      });
      return false;
    }
    
    return true;
    
  } catch (error) {
    console.error(`❌ DB 업데이트 중 오류 (${kaptCode}):`, error.message);
    stats.errors.push({
      kaptCode,
      name: apartment.name,
      error: `DB Exception: ${error.message}`,
      timestamp: new Date().toISOString()
    });
    return false;
  }
}

/**
 * 데이터가 업데이트가 필요한지 확인
 */
function needsUpdate(apartment) {
  // 1. kapt_code가 없으면 스킵
  if (!apartment.kapt_code) {
    return false;
  }
  
  // 2. 주요 필드가 하나라도 없으면 업데이트 필요
  const requiredFields = [
    'kapt_dong_cnt',
    'kapt_da_cnt',
    'kapt_tarea',
    'kapt_bcompany',
    'welfare_facility',
    'convenient_facility'
  ];
  
  for (const field of requiredFields) {
    if (!apartment[field]) {
      return true;
    }
  }
  
  // 3. 마지막 업데이트가 30일 이상 지났으면 업데이트
  if (apartment.updated_at) {
    const lastUpdate = new Date(apartment.updated_at);
    const daysSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceUpdate > 30) {
      return true;
    }
  }
  
  // 4. data_source가 government_api_batch_update가 아니면 업데이트
  if (apartment.data_source !== 'government_api_batch_update') {
    return true;
  }
  
  return false;
}

/**
 * 메인 실행 함수
 */
async function main() {
  console.log('🚀 아파트 단지 일괄 업데이트 시작');
  console.log(`📅 시작 시간: ${new Date().toLocaleString('ko-KR')}`);
  
  try {
    // 1. 모든 아파트 데이터 조회
    console.log('\n📊 데이터베이스에서 아파트 목록 조회 중...');
    const { data: apartments, error } = await supabase
      .from('apartment_complexes')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('❌ DB 조회 오류:', error.message);
      process.exit(1);
    }
    
    console.log(`✅ 총 ${apartments.length}개 아파트 조회 완료`);
    stats.total = apartments.length;
    
    // 2. 업데이트가 필요한 아파트 필터링
    const apartmentsToUpdate = apartments.filter(needsUpdate);
    console.log(`📋 업데이트 필요: ${apartmentsToUpdate.length}개`);
    console.log(`⏭️ 스킵: ${apartments.length - apartmentsToUpdate.length}개\n`);
    
    // 3. 배치 처리
    const BATCH_SIZE = 10; // 10개씩 처리
    const batches = [];
    for (let i = 0; i < apartmentsToUpdate.length; i += BATCH_SIZE) {
      batches.push(apartmentsToUpdate.slice(i, i + BATCH_SIZE));
    }
    
    console.log(`🔄 총 ${batches.length}개 배치로 처리 시작\n`);
    
    // 4. 각 배치 처리
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      console.log(`\n📦 배치 ${batchIndex + 1}/${batches.length} 처리 중...`);
      
      for (const apartment of batch) {
        stats.processed++;
        const progress = ((stats.processed / apartmentsToUpdate.length) * 100).toFixed(1);
        
        console.log(`\n[${stats.processed}/${apartmentsToUpdate.length}] (${progress}%) ${apartment.name}`);
        
        if (!apartment.kapt_code) {
          console.log('  ⏭️ KAPT 코드 없음 - 스킵');
          stats.skipped++;
          continue;
        }
        
        // API 데이터 수집
        console.log(`  📡 API 호출 중... (${apartment.kapt_code})`);
        const enhancedFields = await collectEnhancedFields(apartment);
        
        if (enhancedFields) {
          // 수집된 데이터 요약
          const summary = [];
          if (enhancedFields.kapt_da_cnt) summary.push(`세대:${enhancedFields.kapt_da_cnt}`);
          if (enhancedFields.kapt_dong_cnt) summary.push(`동:${enhancedFields.kapt_dong_cnt}`);
          if (enhancedFields.kaptd_pcnt !== null || enhancedFields.kaptd_pcntu !== null) {
            const total = (enhancedFields.kaptd_pcnt || 0) + (enhancedFields.kaptd_pcntu || 0);
            summary.push(`주차:${total}`);
          }
          if (enhancedFields.kaptd_ecnt) summary.push(`승강기:${enhancedFields.kaptd_ecnt}`);
          
          console.log(`  ✅ 데이터 수집 완료: ${summary.join(', ')}`);
          
          // DB 업데이트
          const updateSuccess = await updateApartmentData(apartment, enhancedFields);
          
          if (updateSuccess) {
            console.log(`  ✅ DB 업데이트 완료`);
            stats.updated++;
          } else {
            console.log(`  ❌ DB 업데이트 실패`);
            stats.failed++;
          }
        } else {
          console.log(`  ⚠️ API 데이터 없음`);
          stats.failed++;
        }
        
        // 진행 상황 저장
        if (stats.processed % 10 === 0) {
          await saveProgress();
        }
        
        // API 호출 제한을 위한 대기 (초당 약 6-7회)
        await new Promise(resolve => setTimeout(resolve, 150));
      }
      
      // 배치 간 추가 대기
      if (batchIndex < batches.length - 1) {
        console.log(`\n⏸️ 다음 배치 전 2초 대기...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    // 5. 최종 결과
    stats.endTime = new Date();
    const duration = (stats.endTime - stats.startTime) / 1000 / 60; // 분 단위
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 최종 결과');
    console.log('='.repeat(60));
    console.log(`✅ 성공: ${stats.updated}개`);
    console.log(`❌ 실패: ${stats.failed}개`);
    console.log(`⏭️ 스킵: ${stats.skipped + (apartments.length - apartmentsToUpdate.length)}개`);
    console.log(`⏱️ 소요 시간: ${duration.toFixed(1)}분`);
    console.log(`📅 종료 시간: ${stats.endTime.toLocaleString('ko-KR')}`);
    
    if (stats.errors.length > 0) {
      console.log(`\n⚠️ 오류 발생: ${stats.errors.length}건`);
      console.log('상세 내용은 로그 파일 확인:', LOG_FILE);
    }
    
    // 최종 진행 상황 저장
    await saveProgress();
    console.log(`\n📁 로그 파일 저장: ${LOG_FILE}`);
    
  } catch (error) {
    console.error('\n❌ 치명적 오류:', error.message);
    stats.endTime = new Date();
    stats.errors.push({
      type: 'FATAL',
      error: error.message,
      timestamp: new Date().toISOString()
    });
    await saveProgress();
    process.exit(1);
  }
}

// 실행
main().then(() => {
  console.log('\n✅ 일괄 업데이트 완료');
  process.exit(0);
}).catch(error => {
  console.error('❌ 스크립트 오류:', error);
  process.exit(1);
});