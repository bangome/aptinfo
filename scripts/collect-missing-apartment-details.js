#!/usr/bin/env node

/**
 * apartments 테이블에서 apartment_complexes로 누락된 아파트 데이터 API 수집 스크립트
 * 
 * 기능:
 * - apartments 테이블에 있지만 apartment_complexes에 없는 아파트 조회
 * - 국토교통부 아파트 기본정보 API로 상세 데이터 수집
 * - apartment_complexes 테이블에 UPSERT
 * - 강화된 재시도 로직 및 배치 처리
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 환경변수 로드
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const API_KEY = process.env.NEXT_PUBLIC_DATA_GO_KR_SERVICE_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// API 엔드포인트 - 아파트 기본정보 조회서비스
const BASE_URL = 'https://apis.data.go.kr/1613000/AptBasisInfoService1';
const ENDPOINT = 'getAphusBassInfo'; // 아파트 기본정보 조회

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 로깅 설정
const logFile = path.join(__dirname, '..', `apartment-collection-${new Date().toISOString().split('T')[0]}.log`);

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage);
  fs.appendFileSync(logFile, logMessage + '\n');
}

function logError(error, context = '') {
  const timestamp = new Date().toISOString();
  const errorMessage = `[${timestamp}] ERROR ${context}: ${error.message || error}`;
  console.error(errorMessage);
  fs.appendFileSync(logFile, errorMessage + '\n');
}

// 강화된 재시도 로직을 가진 안정적인 fetch 함수
async function fetchWithRetry(url, maxRetries = 3, delayMs = 1000) {
  let lastError = new Error('Unknown error');
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15초 타임아웃
      
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; ApartmentBot/1.0)',
          'Connection': 'keep-alive'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response;
    } catch (error) {
      lastError = error;
      
      if (attempt < maxRetries) {
        const delay = delayMs * attempt;
        log(`재시도 ${attempt}/${maxRetries} - ${delay}ms 대기 후 재시도`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw new Error(`Failed after ${maxRetries} attempts: ${lastError.message}`);
}

// 아파트 기본정보 API 호출
async function fetchApartmentDetails(kaptCode, kaptName, sigunguCode, bjdCode) {
  try {
    const encodedApiKey = encodeURIComponent(API_KEY);
    
    // API URL 구성 - 필수 파라미터만 사용
    const params = new URLSearchParams({
      serviceKey: API_KEY,
      kaptCode: kaptCode,
      type: 'json',
      numOfRows: '1',
      pageNo: '1'
    });
    
    const url = `${BASE_URL}/${ENDPOINT}?${params.toString()}`;
    
    log(`API 호출: ${kaptName} (${kaptCode})`);
    const response = await fetchWithRetry(url);
    const json = await response.json();
    
    // API 응답 체크
    if (json.response?.header?.resultCode !== '00') {
      const resultMsg = json.response?.header?.resultMsg || 'Unknown error';
      throw new Error(`API Error: ${resultMsg}`);
    }
    
    const item = json.response?.body?.item;
    if (!item) {
      throw new Error('No data returned from API');
    }
    
    // API 응답 데이터를 apartment_complexes 테이블 형식으로 변환
    const complexData = {
      kapt_code: item.kaptCode || kaptCode,
      name: item.kaptName || kaptName,
      
      // 주소 정보
      address: item.kaptAddr,
      road_address: item.roadAddr,
      region_code: item.bjdCode || bjdCode,
      legal_dong: item.dongNm,
      jibun: item.jibun,
      
      // API에서 제공하는 기본 정보들
      kapt_addr: item.kaptAddr,
      kapt_da_cnt: parseInt(item.kaptdaCnt) || null,
      kapt_dong_cnt: parseInt(item.kaptDongCnt) || null,
      kapt_use_nt: item.kaptUseNt,
      kapt_usedate: item.kaptUsedate,
      kapt_mart_dscd: item.kaptMartDscd,
      kapt_mart_dscd_nm: item.kaptMartDscdNm,
      kapt_bcompany: item.kaptBcompany,
      kapt_acompany: item.kaptAcompany,
      kapt_tel: item.kaptTel,
      kapt_fax: item.kaptFax,
      kapt_url: item.kaptUrl,
      bjd_code: item.bjdCode || bjdCode,
      zipcode: item.zipcode,
      
      // 면적 정보
      kapt_tarea: parseFloat(item.kaptTarea) || null,
      kapt_build_area: parseFloat(item.kaptBarea) || null,
      
      // 주차 정보
      kaptd_pcnt: parseInt(item.kaptdPcnt) || null,
      kaptd_pcntu: parseInt(item.kaptdPcntu) || null,
      
      // 교통 정보
      kaptd_wtimesub: parseInt(item.kaptdWtimeSub) || null,
      kaptd_wtimebus: parseInt(item.kaptdWtimeBus) || null,
      
      // 편의시설
      convenient_facility: item.convenientFacility,
      welfare_facility: item.welfareFacility,
      education_facility: item.educationFacility,
      
      // 지하철 정보
      subway_line: item.subwayLine,
      subway_station: item.subwayStation,
      
      // 전기차 충전시설
      ground_el_charger_cnt: parseInt(item.groundElChargerCnt) || null,
      underground_el_charger_cnt: parseInt(item.undergroundElChargerCnt) || null,
      
      // 시스템 필드
      is_active: true,
      data_source: 'api_collection',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // NULL/undefined 값 제거
    Object.keys(complexData).forEach(key => {
      if (complexData[key] === undefined || complexData[key] === null || complexData[key] === '') {
        delete complexData[key];
      }
    });
    
    log(`✅ API 수집 완료: ${kaptName} - ${Object.keys(complexData).length}개 필드`);
    return complexData;
    
  } catch (error) {
    logError(error, `API 호출 실패: ${kaptName} (${kaptCode})`);
    return null;
  }
}

// apartment_complexes 테이블에 데이터 저장
async function saveToDatabase(complexData) {
  try {
    const { error } = await supabase
      .from('apartment_complexes')
      .upsert(complexData, {
        onConflict: 'kapt_code'
      });

    if (error) {
      throw error;
    }

    log(`💾 DB 저장 완료: ${complexData.name} (${complexData.kapt_code})`);
    return true;
  } catch (error) {
    logError(error, `DB 저장 실패: ${complexData.name} (${complexData.kapt_code})`);
    return false;
  }
}

// apartments에만 있는 아파트 목록 조회
async function getMissingApartments(limit = 50, offset = 0) {
  try {
    log(`📋 누락된 아파트 조회 중... (limit: ${limit}, offset: ${offset})`);
    
    // apartments 테이블에는 있지만 apartment_complexes에는 없는 아파트 조회
    const { data, error } = await supabase
      .from('apartments')
      .select('kapt_code, name, sigungu, bjd_code, is_active')
      .eq('is_active', true)
      .not('kapt_code', 'in', 
        `(SELECT kapt_code FROM apartment_complexes WHERE kapt_code IS NOT NULL)`
      )
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    log(`📊 조회 완료: ${data?.length || 0}개 아파트`);
    return data || [];
  } catch (error) {
    logError(error, '누락된 아파트 목록 조회');
    return [];
  }
}

// 메인 실행 함수
async function collectMissingApartments(options = {}) {
  const {
    limit = 100,
    offset = 0,
    batchSize = 10 // 배치 처리 크기
  } = options;

  log(`🚀 누락된 아파트 데이터 수집 시작`);
  log(`처리 대상: ${limit}개 아파트 (offset: ${offset})`);

  const missingApartments = await getMissingApartments(limit, offset);
  
  if (missingApartments.length === 0) {
    log('✅ 수집할 누락된 아파트가 없습니다.');
    return;
  }

  log(`📋 수집 대상: ${missingApartments.length}개 아파트`);

  let totalProcessed = 0;
  let totalSaved = 0;
  let totalErrors = 0;

  // 배치별로 처리
  for (let i = 0; i < missingApartments.length; i += batchSize) {
    const batch = missingApartments.slice(i, i + batchSize);
    
    log(`\n📦 배치 ${Math.floor(i / batchSize) + 1} 처리 중 (${batch.length}개 아파트)`);
    
    for (const apartment of batch) {
      try {
        log(`\n🏢 처리 중: ${apartment.name} (${apartment.kapt_code})`);
        
        // API로 상세 정보 수집
        const complexData = await fetchApartmentDetails(
          apartment.kapt_code,
          apartment.name,
          apartment.sigungu,
          apartment.bjd_code
        );
        
        if (complexData) {
          // DB에 저장
          const saved = await saveToDatabase(complexData);
          if (saved) {
            totalSaved++;
          } else {
            totalErrors++;
          }
        } else {
          totalErrors++;
        }
        
        totalProcessed++;
        
        // API 호출 간격 (2초 대기)
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        logError(error, `Processing ${apartment.name} (${apartment.kapt_code})`);
        totalErrors++;
        totalProcessed++;
      }
    }
    
    log(`✅ 배치 ${Math.floor(i / batchSize) + 1} 완료`);
    
    // 배치 간 대기 (5초)
    if (i + batchSize < missingApartments.length) {
      log('⏳ 배치 간 대기 중... (5초)');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  log(`\n🎯 데이터 수집 완료`);
  log(`📊 총 처리: ${totalProcessed}건`);
  log(`💾 저장 성공: ${totalSaved}건`);
  log(`❌ 에러: ${totalErrors}건`);
  log(`📁 로그 파일: ${logFile}`);
}

// CLI 실행 처리
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {};
  
  // 명령줄 인수 파싱
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--limit':
        options.limit = parseInt(args[++i]);
        break;
      case '--offset':
        options.offset = parseInt(args[++i]);
        break;
      case '--batch-size':
        options.batchSize = parseInt(args[++i]);
        break;
    }
  }
  
  collectMissingApartments(options)
    .then(() => {
      log('아파트 데이터 수집 스크립트 완료');
      process.exit(0);
    })
    .catch((error) => {
      logError(error, 'Collection failed');
      process.exit(1);
    });
}

module.exports = {
  collectMissingApartments,
  fetchApartmentDetails,
  saveToDatabase
};