#!/usr/bin/env node

/**
 * 관리비 데이터 배치 수집 스크립트
 * 
 * 기능:
 * - 모든 아파트의 관리비 데이터를 수집
 * - 강화된 재시도 로직으로 안정적인 API 호출
 * - DB에 데이터 저장 (UPSERT)
 * - 상세한 로깅 및 에러 추적
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 환경변수 로드 (.env.local 파일 사용)
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const API_KEY = process.env.NEXT_PUBLIC_DATA_GO_KR_SERVICE_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const COMMON_COST_BASE_URL = 'https://apis.data.go.kr/1613000/AptCmnuseManageCostServiceV2';
const INDIVIDUAL_COST_BASE_URL = 'https://apis.data.go.kr/1613000/AptIndvdlzManageCostServiceV2';

// Supabase 클라이언트 초기화
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 로깅 설정
const logFile = path.join(__dirname, '..', `batch-collection-${new Date().toISOString().split('T')[0]}.log`);

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
async function fetchWithRetry(url, maxRetries = 5, delayMs = 1000) {
  let lastError = new Error('Unknown error');
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10초 타임아웃
      
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; ManagementFeeBot/1.0)',
          'Connection': 'keep-alive',
          'Cache-Control': 'no-cache'
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
        // 개선된 백오프 전략: 1초, 2초, 3초, 4초, 5초 대기
        const delay = Math.min(delayMs * attempt, 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw new Error(`Failed after ${maxRetries} attempts: ${lastError.message}`);
}

// 월별 관리비 데이터 수집
async function collectMonthData(kaptCode, kaptName, year, month) {
  const searchDate = `${year}${month.toString().padStart(2, '0')}`;
  const encodedApiKey = encodeURIComponent(API_KEY);
  
  // 17개 공용관리비 엔드포인트
  const commonEndpoints = [
    { name: '청소비', url: 'getHsmpCleaningCostInfoV2', key: 'cleanCost', dbField: 'cleaning_cost' },
    { name: '경비비', url: 'getHsmpGuardCostInfoV2', key: 'guardCost', dbField: 'guard_cost' },
    { name: '소독비', url: 'getHsmpDisinfectionCostInfoV2', key: 'disinfCost', dbField: 'disinfection_cost' },
    { name: '승강기유지비', url: 'getHsmpElevatorMntncCostInfoV2', key: 'elevCost', dbField: 'elevator_cost' },
    { name: '수선비', url: 'getHsmpRepairsCostInfoV2', key: 'lrefCost1', dbField: 'repairs_cost' },
    { name: '시설유지비', url: 'getHsmpFacilityMntncCostInfoV2', key: 'lrefCost2', dbField: 'facility_cost' },
    { name: '차량유지비', url: 'getHsmpVhcleMntncCostInfoV2', key: 'fuelCost', dbField: 'vehicle_cost' },
    { name: '재해예방비', url: 'getHsmpDisasterPreventionCostInfoV2', key: 'lrefCost4', dbField: 'disaster_cost' },
    { name: '기타부대비용', url: 'getHsmpEtcCostInfoV2', key: 'careItemCost', dbField: 'etc_cost' },
    { name: '제사무비', url: 'getHsmpOfcrkCostInfoV2', key: 'officeSupply', dbField: 'office_cost' },
    { name: '피복비', url: 'getHsmpClothingCostInfoV2', key: 'clothesCost', dbField: 'clothing_cost' },
    { name: '교육훈련비', url: 'getHsmpEduTraingCostInfoV2', key: 'eduCost', dbField: 'education_cost' },
    { name: '지능형홈네트워크설비유지비', url: 'getHsmpHomeNetworkMntncCostInfoV2', key: 'hnetwCost', dbField: 'home_network_cost' },
    { name: '안전점검비', url: 'getHsmpSafetyCheckUpCostInfoV2', key: 'lrefCost3', dbField: 'safety_cost' },
    { name: '위탁관리수수료', url: 'getHsmpConsignManageFeeInfoV2', key: 'manageCost', dbField: 'management_cost' },
    { name: '인건비', url: 'getHsmpLaborCostInfoV2', key: 'pay', dbField: 'labor_cost' },
    { name: '제세공과금', url: 'getHsmpTaxdueInfoV2', key: 'telCost', dbField: 'tax_cost' }
  ];

  // 10개 개별사용료 엔드포인트
  const individualEndpoints = [
    { name: '난방비', url: 'getHsmpHeatCostInfoV2', key: 'heatC', dbField: 'heating_cost' },
    { name: '급탕비', url: 'getHsmpHotWaterCostInfoV2', key: 'waterHotC', dbField: 'hot_water_cost' },
    { name: '전기료', url: 'getHsmpElectricityCostInfoV2', key: 'electC', dbField: 'electricity_cost' },
    { name: '수도료', url: 'getHsmpWaterCostInfoV2', key: 'waterCoolC', dbField: 'water_cost' },
    { name: '가스사용료', url: 'getHsmpGasRentalFeeInfoV2', key: 'gasC', dbField: 'gas_cost' },
    { name: '생활폐기물수수료', url: 'getHsmpDomesticWasteFeeInfoV2', key: 'scrap', dbField: 'waste_cost' },
    { name: '입주자대표회의운영비', url: 'getHsmpMovingInRepresentationMtgInfoV2', key: 'preMeet', dbField: 'meeting_cost' },
    { name: '건물보험료', url: 'getHsmpBuildingInsuranceFeeInfoV2', key: 'buildInsu', dbField: 'insurance_cost' },
    { name: '선거관리위원회운영비', url: 'getHsmpElectionOrpnsInfoV2', key: 'electionMng', dbField: 'election_cost' },
    { name: '정화조오물수수료', url: 'getHsmpWaterPurifierTankFeeInfoV2', key: 'purifi', dbField: 'purifier_cost' }
  ];

  // 데이터 수집 결과 저장
  const result = {
    kapt_code: kaptCode,
    kapt_name: kaptName,
    year,
    month,
    common_fee: 0,
    individual_fee: 0,
    total_fee: 0,
    success_rate: 0,
    successful_endpoints: 0,
    total_endpoints: 27,
    collection_date: new Date().toISOString()
  };

  let successCount = 0;
  let errorCount = 0;

  try {
    // 공용관리비 수집
    const commonPromises = commonEndpoints.map(endpoint => 
      fetchWithRetry(`${COMMON_COST_BASE_URL}/${endpoint.url}?serviceKey=${encodedApiKey}&kaptCode=${kaptCode}&searchDate=${searchDate}&type=json`)
    );

    // 배치 처리 (5개씩)
    for (let i = 0; i < commonPromises.length; i += 5) {
      const batch = commonPromises.slice(i, i + 5);
      const batchResults = await Promise.allSettled(batch);
      
      for (let j = 0; j < batchResults.length; j++) {
        const endpointIndex = i + j;
        const endpoint = commonEndpoints[endpointIndex];
        const promiseResult = batchResults[j];
        
        if (promiseResult.status === 'fulfilled') {
          try {
            const json = await promiseResult.value.json();
            if (json.response?.body?.item && json.response?.header?.resultCode === '00') {
              const value = parseInt(json.response.body.item[endpoint.key] || 0);
              result[endpoint.dbField] = value;
              result.common_fee += value;
              successCount++;
            } else {
              errorCount++;
            }
          } catch (parseError) {
            logError(parseError, `Parsing ${endpoint.name} for ${kaptCode}`);
            errorCount++;
          }
        } else {
          logError(promiseResult.reason, `Fetching ${endpoint.name} for ${kaptCode}`);
          errorCount++;
        }
      }
      
      if (i + 5 < commonPromises.length) {
        await new Promise(resolve => setTimeout(resolve, 500)); // 배치 간 대기
      }
    }

    // 개별사용료 수집 (동일한 패턴)
    const individualPromises = individualEndpoints.map(endpoint => 
      fetchWithRetry(`${INDIVIDUAL_COST_BASE_URL}/${endpoint.url}?serviceKey=${encodedApiKey}&kaptCode=${kaptCode}&searchDate=${searchDate}&type=json`)
    );

    for (let i = 0; i < individualPromises.length; i += 5) {
      const batch = individualPromises.slice(i, i + 5);
      const batchResults = await Promise.allSettled(batch);
      
      for (let j = 0; j < batchResults.length; j++) {
        const endpointIndex = i + j;
        const endpoint = individualEndpoints[endpointIndex];
        const promiseResult = batchResults[j];
        
        if (promiseResult.status === 'fulfilled') {
          try {
            const json = await promiseResult.value.json();
            if (json.response?.body?.item && json.response?.header?.resultCode === '00') {
              const value = parseInt(json.response.body.item[endpoint.key] || 0);
              result[endpoint.dbField] = value;
              result.individual_fee += value;
              successCount++;
            } else {
              errorCount++;
            }
          } catch (parseError) {
            logError(parseError, `Parsing ${endpoint.name} for ${kaptCode}`);
            errorCount++;
          }
        } else {
          logError(promiseResult.reason, `Fetching ${endpoint.name} for ${kaptCode}`);
          errorCount++;
        }
      }
      
      if (i + 5 < individualPromises.length) {
        await new Promise(resolve => setTimeout(resolve, 500)); // 배치 간 대기
      }
    }

    // 결과 계산
    result.total_fee = result.common_fee + result.individual_fee;
    result.successful_endpoints = successCount;
    result.success_rate = ((successCount / 27) * 100).toFixed(2);

    log(`${kaptCode} ${year}-${month}: ${result.total_fee.toLocaleString()}원 (성공률: ${result.success_rate}%)`);
    
    return result;

  } catch (error) {
    logError(error, `Collecting data for ${kaptCode} ${year}-${month}`);
    return null;
  }
}

// DB에 데이터 저장 (UPSERT)
async function saveToDatabase(data) {
  try {
    const { error } = await supabase
      .from('management_fees')
      .upsert(data, {
        onConflict: 'kapt_code,year,month'
      });

    if (error) {
      throw error;
    }

    log(`✅ DB 저장 완료: ${data.kapt_code} ${data.year}-${data.month}`);
    return true;
  } catch (error) {
    logError(error, `Saving to DB: ${data.kapt_code} ${data.year}-${data.month}`);
    return false;
  }
}

// 아파트 목록 조회
async function getApartmentList(limit = 10, offset = 0) {
  try {
    const { data, error } = await supabase
      .from('apartments')
      .select('kapt_code, name')
      .eq('is_active', true)
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    logError(error, 'Getting apartment list');
    return [];
  }
}

// 메인 배치 실행 함수
async function runBatchCollection(options = {}) {
  const {
    year = 2024,
    months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    limit = 50,
    offset = 0
  } = options;

  log(`🚀 배치 수집 시작: ${year}년 ${months.join(', ')}월`);
  log(`처리 대상: ${limit}개 아파트 (offset: ${offset})`);

  const apartments = await getApartmentList(limit, offset);
  log(`📊 조회된 아파트 수: ${apartments.length}개`);

  let totalProcessed = 0;
  let totalSaved = 0;
  let totalErrors = 0;

  for (const apartment of apartments) {
    log(`\n📍 처리 중: ${apartment.name} (${apartment.kapt_code})`);
    
    for (const month of months) {
      try {
        const monthData = await collectMonthData(apartment.kapt_code, apartment.name, year, month);
        
        if (monthData) {
          const saved = await saveToDatabase(monthData);
          if (saved) {
            totalSaved++;
          } else {
            totalErrors++;
          }
        } else {
          totalErrors++;
        }
        
        totalProcessed++;
        
        // 요청 간 대기 (API 서버 부하 방지)
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        logError(error, `Processing ${apartment.kapt_code} ${year}-${month}`);
        totalErrors++;
        totalProcessed++;
      }
    }
    
    log(`✅ 완료: ${apartment.name} - ${months.length}개월 처리`);
  }

  log(`\n🎯 배치 수집 완료`);
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
      case '--year':
        options.year = parseInt(args[++i]);
        break;
      case '--months':
        options.months = args[++i].split(',').map(m => parseInt(m.trim()));
        break;
      case '--limit':
        options.limit = parseInt(args[++i]);
        break;
      case '--offset':
        options.offset = parseInt(args[++i]);
        break;
    }
  }
  
  runBatchCollection(options)
    .then(() => {
      log('배치 수집 스크립트 완료');
      process.exit(0);
    })
    .catch((error) => {
      logError(error, 'Batch collection failed');
      process.exit(1);
    });
}

module.exports = {
  runBatchCollection,
  collectMonthData,
  saveToDatabase
};