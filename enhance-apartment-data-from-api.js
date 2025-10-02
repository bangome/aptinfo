#!/usr/bin/env node

/**
 * 부족한 아파트 단지 정보를 정부 API에서 보완하는 스크립트
 * 1. apartment_complexes 테이블의 부족한 정보 업데이트
 * 2. 누락된 175개 항목의 주소 정보 보완
 * 3. 전체적인 데이터 품질 향상
 */

const axios = require('axios');
const { XMLParser } = require('fast-xml-parser');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// 환경변수 로드
require('dotenv').config({ path: path.resolve(__dirname, '.env.local') });

const SERVICE_KEY = process.env.NEXT_PUBLIC_DATA_GO_KR_SERVICE_KEY;
const API_BASE_URL = 'https://apis.data.go.kr/1613000';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// XML 파서 설정
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text'
});

// API 엔드포인트
const ENDPOINTS = {
  BASIS_INFO: '/AptBasisInfoServiceV4/getAphusBassInfoV4', // 기본정보
  DETAIL_INFO: '/AptBasisInfoServiceV4/getAphusDtlInfoV4', // 상세정보
  LIST_BY_KAPT: '/AptListServiceV4/getAphusList', // 단지별 조회
};

/**
 * API 호출 공통 함수 (에러 핸들링 강화)
 */
async function callAPI(endpoint, params, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      const response = await axios.get(url, {
        params: {
          serviceKey: SERVICE_KEY,
          ...params
        },
        timeout: 15000
      });

      // API 응답이 이미 JSON 객체인 경우와 XML 문자열인 경우 모두 처리
      let result;
      
      if (typeof response.data === 'string' && response.data.includes('<?xml')) {
        // XML 응답인 경우
        const jsonData = parser.parse(response.data);
        result = jsonData.response;
      } else if (typeof response.data === 'object' && response.data.response) {
        // 이미 JSON 객체로 변환된 경우
        result = response.data.response;
      } else {
        console.log('알 수 없는 응답 형식:', typeof response.data);
        return null;
      }
      
      // 수정된 부분: items가 아닌 item으로 직접 접근
      if (result?.body?.item) {
        return result.body.item;
      } else {
        console.log(`API 응답 오류 또는 데이터 없음`);
        if (result?.header) {
          console.log(`결과 코드: ${result.header.resultCode}, 메시지: ${result.header.resultMsg}`);
        }
        return null;
      }
    } catch (error) {
      console.log(`API 호출 시도 ${attempt}/${retries} 실패:`, error.message);
      if (attempt === retries) {
        return null;
      }
      // 재시도 전 대기
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  return null;
}

/**
 * 단지 기본정보 가져오기
 */
async function getApartmentBasisInfo(kaptCode) {
  const data = await callAPI(ENDPOINTS.BASIS_INFO, { kaptCode });
  return Array.isArray(data) ? data[0] : data;
}

/**
 * 단지 상세정보 가져오기
 */
async function getApartmentDetailInfo(kaptCode) {
  const data = await callAPI(ENDPOINTS.DETAIL_INFO, { kaptCode });
  return Array.isArray(data) ? data[0] : data;
}

/**
 * apartment_complexes 테이블 업데이트
 */
async function updateApartmentComplex(kaptCode, apiData) {
  try {
    const updateData = {
      // 기본 정보
      name: apiData.kaptName || null,
      address: apiData.kaptAddr || null,
      road_address: apiData.doroJuso || null,
      zipcode: apiData.zipcode || null,
      
      // 위치 정보
      bjd_code: apiData.bjdCode || null,
      sigungu: apiData.as2 || null,
      eupmyeondong: apiData.as3 || null,
      legal_dong: apiData.as3 || null,
      
      // 면적 정보
      kapt_tarea: apiData.kaptTarea ? parseFloat(apiData.kaptTarea) : null,
      kapt_dong_cnt: apiData.kaptDongCnt ? parseInt(apiData.kaptDongCnt) : null,
      ho_cnt: apiData.kaptdaCnt ? parseInt(apiData.kaptdaCnt) : null,
      kapt_usedate: apiData.kaptUsedate || null,
      
      // 시설 정보
      kapt_bcompany: apiData.kaptBcompany || null,
      kapt_acompany: apiData.kaptAcompany || null,
      kapt_tel: apiData.kaptTel || null,
      kapt_fax: apiData.kaptFax || null,
      kapt_url: apiData.kaptUrl || null,
      
      welfare_facility: apiData.welfareFacility || null,
      convenient_facility: apiData.convenientFacility || null,
      education_facility: apiData.educationFacility || null,
      
      // 교통 정보
      subway_line: apiData.subwayLine || null,
      subway_station: apiData.subwayStation || null,
      kaptd_wtimesub: apiData.kaptdWtimesub ? parseInt(apiData.kaptdWtimesub) : null,
      kaptd_wtimebus: apiData.kaptdWtimebus ? parseInt(apiData.kaptdWtimebus) : null,
      
      // 주차 정보
      kaptd_pcnt: apiData.kaptdPcnt ? parseInt(apiData.kaptdPcnt) : null,
      kaptd_pcntu: apiData.kaptdPcntu ? parseInt(apiData.kaptdPcntu) : null,
      
      // 전기차 충전기
      ground_el_charger_cnt: apiData.groundElChargerCnt ? parseInt(apiData.groundElChargerCnt) : null,
      underground_el_charger_cnt: apiData.undergroundElChargerCnt ? parseInt(apiData.undergroundElChargerCnt) : null,
      
      // 메타데이터
      updated_at: new Date().toISOString()
    };

    // null이 아닌 값만 업데이트
    const filteredData = {};
    Object.entries(updateData).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        filteredData[key] = value;
      }
    });

    if (Object.keys(filteredData).length === 0) {
      return { success: false, error: 'No valid data to update' };
    }

    const { error } = await supabase
      .from('apartment_complexes')
      .update(filteredData)
      .eq('kapt_code', kaptCode);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, updatedFields: Object.keys(filteredData) };
    
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * 누락된 아파트 단지 정보 조회 및 삽입
 */
async function insertMissingComplex(apartmentData, apiData) {
  try {
    const complexData = {
      kapt_code: apartmentData.kapt_code,
      name: apiData.kaptName || apartmentData.name,
      address: apiData.kaptAddr || apartmentData.jibun_address,
      road_address: apiData.doroJuso || apartmentData.road_address,
      region_code: apiData.bjdCode || apartmentData.bjd_code,
      legal_dong: apiData.as3 || apartmentData.eupmyeondong,
      zipcode: apiData.zipcode || apartmentData.zipcode,
      
      // API에서 추가 정보
      kapt_addr: apiData.kaptAddr,
      bjd_code: apiData.bjdCode || apartmentData.bjd_code,
      kapt_tarea: apiData.kaptTarea ? parseFloat(apiData.kaptTarea) : apartmentData.total_area,
      kapt_dong_cnt: apiData.kaptDongCnt ? parseInt(apiData.kaptDongCnt) : apartmentData.total_dong_count,
      ho_cnt: apiData.kaptdaCnt ? parseInt(apiData.kaptdaCnt) : apartmentData.total_household_count,
      kapt_usedate: apiData.kaptUsedate || apartmentData.use_approval_date,
      
      // 시설 정보
      kapt_bcompany: apiData.kaptBcompany || apartmentData.construction_company,
      kapt_acompany: apiData.kaptAcompany || apartmentData.architecture_company,
      kapt_tel: apiData.kaptTel || apartmentData.management_office_tel,
      kapt_fax: apiData.kaptFax || apartmentData.management_office_fax,
      kapt_url: apiData.kaptUrl || apartmentData.website_url,
      
      welfare_facility: apiData.welfareFacility || apartmentData.welfare_facilities,
      convenient_facility: apiData.convenientFacility || apartmentData.convenient_facilities,
      education_facility: apiData.educationFacility || apartmentData.education_facilities,
      
      subway_line: apiData.subwayLine || apartmentData.subway_line,
      subway_station: apiData.subwayStation || apartmentData.subway_station,
      kaptd_wtimesub: apiData.kaptdWtimesub ? parseInt(apiData.kaptdWtimesub) : apartmentData.subway_distance,
      kaptd_wtimebus: apiData.kaptdWtimebus ? parseInt(apiData.kaptdWtimebus) : apartmentData.bus_station_distance,
      
      kaptd_pcnt: apiData.kaptdPcnt ? parseInt(apiData.kaptdPcnt) : apartmentData.surface_parking_count,
      kaptd_pcntu: apiData.kaptdPcntu ? parseInt(apiData.kaptdPcntu) : apartmentData.underground_parking_count,
      
      ground_el_charger_cnt: apiData.groundElChargerCnt ? parseInt(apiData.groundElChargerCnt) : apartmentData.surface_ev_charger_count,
      underground_el_charger_cnt: apiData.undergroundElChargerCnt ? parseInt(apiData.undergroundElChargerCnt) : apartmentData.underground_ev_charger_cnt,
      
      // 기타
      sigungu: apiData.as2 || apartmentData.sigungu,
      eupmyeondong: apiData.as3 || apartmentData.eupmyeondong,
      is_active: true,
      
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // null/undefined 값 정리
    Object.keys(complexData).forEach(key => {
      const value = complexData[key];
      if (value === undefined || value === null || value === '') {
        delete complexData[key];
      }
    });

    // address가 여전히 없으면 기본값 설정
    if (!complexData.address) {
      complexData.address = '주소 정보 없음';
    }

    const { error } = await supabase
      .from('apartment_complexes')
      .insert([complexData]);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
    
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * 메인 실행 함수
 */
async function enhanceApartmentData() {
  try {
    console.log('🚀 아파트 단지 정보 정부 API 보완 시작');
    
    // 1. 현재 상태 확인
    const [apartmentCount, complexCount] = await Promise.all([
      supabase.from('apartments').select('*', { count: 'exact', head: true }),
      supabase.from('apartment_complexes').select('*', { count: 'exact', head: true })
    ]);
    
    console.log(`📊 현재 상태:`);
    console.log(`   - apartments: ${apartmentCount.count}개`);
    console.log(`   - apartment_complexes: ${complexCount.count}개`);
    console.log(`   - 차이: ${apartmentCount.count - complexCount.count}개 누락`);
    
    // 2. 누락된 아파트 조회 (페이지네이션으로)
    console.log('\n🔍 누락된 아파트 단지 조회...');
    
    const { data: complexCodes } = await supabase
      .from('apartment_complexes')
      .select('kapt_code');
      
    const existingComplexCodes = new Set(complexCodes.map(c => c.kapt_code));
    
    // apartments 테이블에서 누락된 항목들 조회 (배치로)
    let rangeStart = 0;
    const pageSize = 500;
    const missingApartments = [];
    
    while (true) {
      const { data: apartmentPage, error } = await supabase
        .from('apartments')
        .select('*')
        .range(rangeStart, rangeStart + pageSize - 1);
        
      if (error || !apartmentPage || apartmentPage.length === 0) {
        break;
      }
      
      const pageMissing = apartmentPage.filter(apt => !existingComplexCodes.has(apt.kapt_code));
      missingApartments.push(...pageMissing);
      
      console.log(`   조회 중... ${rangeStart + apartmentPage.length}/${apartmentCount.count} (누락: +${pageMissing.length})`);
      
      if (apartmentPage.length < pageSize) {
        break;
      }
      rangeStart += pageSize;
    }
    
    console.log(`📋 누락된 아파트: ${missingApartments.length}개`);
    
    if (missingApartments.length === 0) {
      console.log('✅ 누락된 데이터가 없습니다.');
      return;
    }
    
    // 3. 누락된 아파트들을 API에서 보완
    console.log('\n🔄 정부 API에서 데이터 보완 시작...');
    
    let processedCount = 0;
    let successCount = 0;
    let errorCount = 0;
    
    // 작은 배치로 처리 (API 제한 고려)
    const batchSize = 10;
    
    for (let i = 0; i < missingApartments.length; i += batchSize) {
      const batch = missingApartments.slice(i, i + batchSize);
      
      console.log(`\n📦 배치 ${Math.floor(i / batchSize) + 1}/${Math.ceil(missingApartments.length / batchSize)} 처리 중...`);
      
      for (const apartment of batch) {
        processedCount++;
        
        console.log(`  [${processedCount}/${missingApartments.length}] ${apartment.name} (${apartment.kapt_code})`);
        
        try {
          // API에서 기본정보와 상세정보 조회
          const [basisInfo, detailInfo] = await Promise.all([
            getApartmentBasisInfo(apartment.kapt_code),
            getApartmentDetailInfo(apartment.kapt_code)
          ]);
          
          const mergedApiData = { ...basisInfo, ...detailInfo };
          
          if (!mergedApiData || Object.keys(mergedApiData).length === 0) {
            console.log(`    ❌ API에서 데이터 없음`);
            errorCount++;
            continue;
          }
          
          // apartment_complexes에 삽입
          const result = await insertMissingComplex(apartment, mergedApiData);
          
          if (result.success) {
            console.log(`    ✅ 성공`);
            successCount++;
          } else {
            console.log(`    ❌ 삽입 실패: ${result.error}`);
            errorCount++;
          }
          
          // API 호출 제한 준수
          await new Promise(resolve => setTimeout(resolve, 300));
          
        } catch (error) {
          console.log(`    ❌ 처리 오류: ${error.message}`);
          errorCount++;
        }
      }
      
      // 배치 간 휴식
      if (i + batchSize < missingApartments.length) {
        console.log(`  배치 완료, 5초 휴식...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
    // 4. 최종 결과
    const { count: finalComplexCount } = await supabase
      .from('apartment_complexes')
      .select('*', { count: 'exact', head: true });
      
    console.log('\n🎉 정부 API 데이터 보완 완료!');
    console.log(`📊 최종 결과:`);
    console.log(`   - 처리 대상: ${processedCount}개`);
    console.log(`   - 성공: ${successCount}개`);
    console.log(`   - 실패: ${errorCount}개`);
    console.log(`   - 최종 단지 수: ${finalComplexCount}개`);
    console.log(`   - 최종 커버리지: ${Math.round((finalComplexCount / apartmentCount.count) * 100)}%`);
    
  } catch (error) {
    console.error('❌ 데이터 보완 중 오류:', error);
    process.exit(1);
  }
}

// 스크립트 실행
if (require.main === module) {
  enhanceApartmentData()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { enhanceApartmentData };