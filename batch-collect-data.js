/**
 * 대량 데이터 배치 처리를 위한 개선된 API 수집 스크립트
 */

const axios = require('axios');
const { XMLParser } = require('fast-xml-parser');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// 설정
const CONFIG = {
  SERVICE_KEY: process.env.DATA_GO_KR_SERVICE_KEY || process.env.NEXT_PUBLIC_DATA_GO_KR_SERVICE_KEY || 'EAl5DDYH6Ixz5ZpCY40/DTEDqkFXTG2Utgr5YJQkusuQyugyb80K+qVwRG2ZpceMiCIXqwFWmGpJRHeu7s8JUA==',
  API_BASE_URL: 'https://apis.data.go.kr/1613000',
  SUPABASE_URL: 'https://mswmryeypbbotogxdozq.supabase.co',
  SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zd21yeWV5cGJib3RvZ3hkb3pxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY4MzMzNDAsImV4cCI6MjA1MjQwOTM0MH0.Jp_LW2JjOaOYU2iVe4yWtWWJCOsY_w4x1AplpvbTKNw',
  
  // 배치 처리 설정
  BATCH_SIZE: 10, // 한 번에 처리할 아파트 수
  RETRY_COUNT: 3, // 재시도 횟수
  DELAY_MS: 500,  // API 호출 간 딜레이 (ms)
  MAX_CONCURRENT: 5, // 최대 동시 처리 수
  
  // 저장 설정
  SAVE_PROGRESS: true, // 진행 상황 저장 여부
  PROGRESS_FILE: 'collection-progress.json',
  LOG_FILE: 'collection-log.txt'
};

const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);

// XML 파서 설정
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text'
});

// 전국 주요 시군구 코드 확장
const REGION_CODES = {
  seoul: [
    '11110', '11140', '11170', '11200', '11215', '11230', '11260', '11290',
    '11305', '11320', '11350', '11380', '11410', '11440', '11470', '11500',
    '11530', '11545', '11560', '11590', '11620', '11650', '11680', '11710', '11740'
  ],
  busan: ['26110', '26140', '26170', '26200', '26230', '26260', '26290', '26320', '26350', '26380', '26410', '26440', '26470', '26500', '26530', '26710'],
  daegu: ['27110', '27140', '27170', '27200', '27230', '27260', '27290', '27710'],
  incheon: ['28110', '28140', '28177', '28185', '28200', '28237', '28245', '28260', '28710'],
  gwangju: ['29110', '29140', '29155', '29170', '29200'],
  daejeon: ['30110', '30140', '30170', '30200', '30230'],
  ulsan: ['31110', '31140', '31170', '31200', '31710'],
  gyeonggi: [
    '41110', '41130', '41150', '41170', '41190', '41210', '41220', '41250', '41270', '41280',
    '41290', '41310', '41360', '41370', '41390', '41410', '41430', '41450', '41460', '41480',
    '41500', '41550', '41570', '41590', '41610', '41630', '41650', '41670', '41800', '41820', '41830'
  ]
};

/**
 * 로그 기록 함수
 */
function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${level}: ${message}`;
  console.log(logMessage);
  
  if (CONFIG.LOG_FILE) {
    fs.appendFileSync(CONFIG.LOG_FILE, logMessage + '\\n');
  }
}

/**
 * 진행 상황 저장
 */
function saveProgress(progress) {
  if (CONFIG.SAVE_PROGRESS) {
    fs.writeFileSync(CONFIG.PROGRESS_FILE, JSON.stringify(progress, null, 2));
  }
}

/**
 * 진행 상황 로드
 */
function loadProgress() {
  if (CONFIG.SAVE_PROGRESS && fs.existsSync(CONFIG.PROGRESS_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(CONFIG.PROGRESS_FILE, 'utf8'));
    } catch (error) {
      log(`진행 상황 로드 실패: ${error.message}`, 'ERROR');
    }
  }
  return { processedRegions: [], processedApartments: [], lastUpdateTime: null };
}

/**
 * 재시도 로직이 포함된 API 호출
 */
async function callAPIWithRetry(endpoint, params, retryCount = CONFIG.RETRY_COUNT) {
  for (let attempt = 1; attempt <= retryCount; attempt++) {
    try {
      const url = `${CONFIG.API_BASE_URL}${endpoint}`;
      const response = await axios.get(url, {
        params: {
          serviceKey: CONFIG.SERVICE_KEY,
          ...params
        },
        timeout: 30000
      });

      // 응답 데이터 처리 (JSON인 경우 XML 파싱 불필요)
      let jsonData;
      if (typeof response.data === 'object') {
        jsonData = response.data;
      } else {
        jsonData = parser.parse(response.data);
      }
      
      // API 응답 상태 확인
      const resultCode = jsonData.response?.header?.resultCode;
      if (resultCode !== '00') {
        throw new Error(`API 오류: ${jsonData.response?.header?.resultMsg || 'Unknown error'}`);
      }
      
      // JSON 응답의 경우 items는 배열로 직접 반환됨
      const items = jsonData.response?.body?.items;
      if (Array.isArray(items)) {
        return items;
      } else if (items?.item) {
        // XML 파싱된 경우의 구조
        return Array.isArray(items.item) ? items.item : [items.item];
      }
      
      return [];
    } catch (error) {
      log(`API 호출 실패 (시도 ${attempt}/${retryCount}): ${error.message}`, 'WARN');
      
      if (attempt === retryCount) {
        throw error;
      }
      
      // 재시도 전 대기
      await new Promise(resolve => setTimeout(resolve, CONFIG.DELAY_MS * attempt));
    }
  }
}

/**
 * 지역별 단지 목록 수집
 */
async function collectApartmentsByRegion(regionName, sigunguCodes) {
  log(`🏙️ ${regionName} 지역 수집 시작 (${sigunguCodes.length}개 시군구)`);
  
  const allApartments = [];
  
  for (const sigunguCd of sigunguCodes) {
    try {
      log(`📍 시군구 코드 ${sigunguCd} 처리 중...`);
      
      const apartments = await callAPIWithRetry('/AptListService3/getTotalAptList3', {
        sigunguCd: sigunguCd,
        numOfRows: 1000
      });
      
      if (Array.isArray(apartments)) {
        allApartments.push(...apartments);
      } else if (apartments) {
        allApartments.push(apartments);
      }
      
      log(`✅ 시군구 ${sigunguCd}: ${Array.isArray(apartments) ? apartments.length : (apartments ? 1 : 0)}개 단지`);
      
      // API 호출 제한 준수
      await new Promise(resolve => setTimeout(resolve, CONFIG.DELAY_MS));
      
    } catch (error) {
      log(`❌ 시군구 ${sigunguCd} 처리 오류: ${error.message}`, 'ERROR');
    }
  }
  
  log(`🏠 ${regionName} 총 ${allApartments.length}개 단지 수집 완료`);
  return allApartments;
}

/**
 * 배치 단위로 아파트 상세정보 수집
 */
async function processBatch(apartments, batchIndex, totalBatches) {
  log(`📦 배치 ${batchIndex + 1}/${totalBatches} 처리 시작 (${apartments.length}개 단지)`);
  
  const results = {
    success: 0,
    failed: 0,
    errors: []
  };
  
  // 동시 처리를 위한 청크 분할
  const chunks = [];
  for (let i = 0; i < apartments.length; i += CONFIG.MAX_CONCURRENT) {
    chunks.push(apartments.slice(i, i + CONFIG.MAX_CONCURRENT));
  }
  
  for (const chunk of chunks) {
    const promises = chunk.map(async (apartment) => {
      try {
        const kaptCode = apartment.kaptCode;
        if (!kaptCode) {
          throw new Error('단지코드 없음');
        }
        
        // 기본정보와 상세정보 병렬 수집
        const [basisInfo, detailInfo] = await Promise.all([
          callAPIWithRetry('/AptBasisInfoServiceV4/getAphusBassInfoV4', { kaptCode }),
          callAPIWithRetry('/AptBasisInfoServiceV4/getAphusDtlInfoV4', { kaptCode })
        ]);
        
        // 데이터 병합
        const mergedData = {
          ...apartment,
          ...(Array.isArray(basisInfo) ? basisInfo[0] : basisInfo),
          ...(Array.isArray(detailInfo) ? detailInfo[0] : detailInfo)
        };
        
        // Supabase에 저장
        const saved = await saveToSupabaseEnhanced(mergedData);
        
        if (saved) {
          results.success++;
          log(`✅ ${apartment.kaptName || kaptCode} 저장 완료`);
        } else {
          results.failed++;
          results.errors.push(`${apartment.kaptName || kaptCode}: 저장 실패`);
        }
        
      } catch (error) {
        results.failed++;
        results.errors.push(`${apartment.kaptName || apartment.kaptCode}: ${error.message}`);
        log(`❌ ${apartment.kaptName || apartment.kaptCode} 오류: ${error.message}`, 'ERROR');
      }
    });
    
    await Promise.all(promises);
    
    // 청크 간 딜레이
    await new Promise(resolve => setTimeout(resolve, CONFIG.DELAY_MS));
  }
  
  log(`📦 배치 ${batchIndex + 1} 완료: 성공 ${results.success}, 실패 ${results.failed}`);
  return results;
}

/**
 * 향상된 Supabase 저장 함수
 */
async function saveToSupabaseEnhanced(apartmentData) {
  try {
    // 숫자 데이터 정리 함수
    const parseNumber = (value) => {
      if (value === null || value === undefined || value === '') return null;
      const num = parseInt(value);
      return isNaN(num) ? null : num;
    };
    
    const parseDecimal = (value) => {
      if (value === null || value === undefined || value === '') return null;
      const num = parseFloat(value);
      return isNaN(num) ? null : num;
    };
    
    const { data, error } = await supabase
      .from('apartments')
      .upsert({
        // 기본 정보
        kapt_code: apartmentData.kaptCode,
        name: apartmentData.kaptName,
        sido: apartmentData.as1,
        sigungu: apartmentData.as2,
        eupmyeondong: apartmentData.as3,
        ri: apartmentData.as4,
        bjd_code: apartmentData.bjdCode,
        zipcode: apartmentData.zipcode,
        jibun_address: apartmentData.kaptAddr,
        road_address: apartmentData.doroJuso,
        
        // 면적 정보
        total_area: parseDecimal(apartmentData.kaptTarea),
        building_area: parseDecimal(apartmentData.kaptMarea),
        priv_area: parseDecimal(apartmentData.privArea),
        kapt_marea: parseDecimal(apartmentData.kaptMarea),
        
        // 건물 정보
        total_dong_count: parseNumber(apartmentData.kaptDongCnt),
        total_household_count: parseNumber(apartmentData.kaptdaCnt),
        ho_cnt: parseNumber(apartmentData.hoCnt),
        use_approval_date: apartmentData.kaptUsedate,
        
        // 주차 정보
        surface_parking_count: parseNumber(apartmentData.kaptdPcnt),
        underground_parking_count: parseNumber(apartmentData.kaptdPcntu),
        total_parking_count: parseNumber(apartmentData.kaptdPcnt) + parseNumber(apartmentData.kaptdPcntu) || null,
        
        // 승강기 및 CCTV
        elevator_count: parseNumber(apartmentData.kaptdEcnt),
        cctv_count: parseNumber(apartmentData.kaptdCccnt),
        kaptd_ecnt: parseNumber(apartmentData.kaptdEcnt),
        kaptd_cccnt: parseNumber(apartmentData.kaptdCccnt),
        
        // 시설 정보
        welfare_facilities: apartmentData.welfareFacility,
        convenient_facilities: apartmentData.convenientFacility,
        education_facilities: apartmentData.educationFacility,
        
        // 교통 정보
        bus_station_distance: apartmentData.kaptdWtimebus,
        subway_line: apartmentData.subwayLine,
        subway_station: apartmentData.subwayStation,
        subway_distance: apartmentData.kaptdWtimesub,
        
        // 전기충전기
        surface_ev_charger_count: parseNumber(apartmentData.groundElChargerCnt),
        underground_ev_charger_count: parseNumber(apartmentData.undergroundElChargerCnt),
        ground_el_charger_cnt: parseNumber(apartmentData.groundElChargerCnt),
        underground_el_charger_cnt: parseNumber(apartmentData.undergroundElChargerCnt),
        
        // 업체 정보
        construction_company: apartmentData.kaptBcompany,
        architecture_company: apartmentData.kaptAcompany,
        kapt_bcompany: apartmentData.kaptBcompany,
        kapt_acompany: apartmentData.kaptAcompany,
        
        // 연락처
        management_office_tel: apartmentData.kaptTel,
        management_office_fax: apartmentData.kaptFax,
        website_url: apartmentData.kaptUrl,
        kapt_tel: apartmentData.kaptTel,
        kapt_fax: apartmentData.kaptFax,
        kapt_url: apartmentData.kaptUrl,
        
        // 층수 정보
        kapt_top_floor: parseNumber(apartmentData.kaptTopFloor),
        ktown_flr_no: parseNumber(apartmentData.ktownFlrNo),
        kapt_base_floor: parseNumber(apartmentData.kaptBaseFloor),
        
        // 전기 정보
        kaptd_ecntp: parseNumber(apartmentData.kaptdEcntp),
        kaptd_ecapa: parseNumber(apartmentData.kaptdEcapa),
        
        // 면적별 세대현황
        kapt_mparea60: parseNumber(apartmentData.kaptMparea60),
        kapt_mparea85: parseNumber(apartmentData.kaptMparea85),
        kapt_mparea135: parseNumber(apartmentData.kaptMparea135),
        kapt_mparea136: parseNumber(apartmentData.kaptMparea136),
        
        // 관리 정보
        code_mgr: apartmentData.codeMgr,
        kapt_mgr_cnt: parseNumber(apartmentData.kaptMgrCnt),
        kapt_c_company: apartmentData.kaptCcompany,
        
        // 기타 정보
        use_yn: apartmentData.useYn,
        code_sale_nm: apartmentData.codeSaleNm,
        code_heat_nm: apartmentData.codeHeatNm,
        code_apt_nm: apartmentData.codeAptNm,
        code_mgr_nm: apartmentData.codeMgrNm,
        code_hall_nm: apartmentData.codeHallNm,
        
        // 메타데이터
        is_active: true,
        data_source: 'government_api_batch',
        last_updated_at: new Date().toISOString()
      }, {
        onConflict: 'kapt_code'
      });

    if (error) {
      log(`Supabase 저장 오류: ${error.message}`, 'ERROR');
      return false;
    }
    
    return true;
  } catch (error) {
    log(`데이터 저장 중 오류: ${error.message}`, 'ERROR');
    return false;
  }
}

/**
 * 메인 배치 수집 함수
 */
async function batchCollectData(regions = ['seoul']) {
  log('🚀 대량 데이터 배치 수집 시작');
  
  try {
    const progress = loadProgress();
    const startTime = Date.now();
    
    let totalSuccess = 0;
    let totalFailed = 0;
    
    for (const regionName of regions) {
      if (progress.processedRegions.includes(regionName)) {
        log(`⏭️ ${regionName} 이미 처리됨, 건너뛰기`);
        continue;
      }
      
      const sigunguCodes = REGION_CODES[regionName];
      if (!sigunguCodes) {
        log(`❌ 알 수 없는 지역: ${regionName}`, 'ERROR');
        continue;
      }
      
      // 지역별 단지 목록 수집
      const apartments = await collectApartmentsByRegion(regionName, sigunguCodes);
      
      if (apartments.length === 0) {
        log(`⚠️ ${regionName}에서 수집할 단지가 없습니다.`);
        continue;
      }
      
      // 배치 단위로 분할 처리
      const batches = [];
      for (let i = 0; i < apartments.length; i += CONFIG.BATCH_SIZE) {
        batches.push(apartments.slice(i, i + CONFIG.BATCH_SIZE));
      }
      
      log(`📊 ${regionName}: ${apartments.length}개 단지를 ${batches.length}개 배치로 처리`);
      
      // 각 배치 처리
      for (let i = 0; i < batches.length; i++) {
        const result = await processBatch(batches[i], i, batches.length);
        totalSuccess += result.success;
        totalFailed += result.failed;
        
        // 진행 상황 저장
        progress.processedApartments.push(...batches[i].map(apt => apt.kaptCode).filter(Boolean));
        progress.lastUpdateTime = new Date().toISOString();
        saveProgress(progress);
        
        // 배치 간 휴식
        if (i < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, CONFIG.DELAY_MS * 2));
        }
      }
      
      // 지역 처리 완료 표시
      progress.processedRegions.push(regionName);
      saveProgress(progress);
      
      log(`✅ ${regionName} 지역 처리 완료`);
    }
    
    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);
    
    log(`🎉 배치 수집 완료!`);
    log(`📊 전체 결과: 성공 ${totalSuccess}개, 실패 ${totalFailed}개`);
    log(`⏱️ 소요 시간: ${duration}초`);
    
  } catch (error) {
    log(`❌ 배치 수집 중 전체 오류: ${error.message}`, 'ERROR');
  }
}

// 스크립트 실행
if (require.main === module) {
  const args = process.argv.slice(2);
  const regions = args.length > 0 ? args : ['seoul']; // 기본값: 서울만
  
  log(`📍 수집 대상 지역: ${regions.join(', ')}`);
  
  batchCollectData(regions)
    .then(() => {
      log('스크립트 실행 완료');
      process.exit(0);
    })
    .catch((error) => {
      log(`스크립트 실행 오류: ${error.message}`, 'ERROR');
      process.exit(1);
    });
}

module.exports = {
  batchCollectData,
  processBatch,
  saveToSupabaseEnhanced
};