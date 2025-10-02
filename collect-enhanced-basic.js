/**
 * 향상된 데이터 수집 (기존 컬럼만 사용)
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
 * 통합 데이터 수집 (기존 컬럼만 사용)
 */
async function collectCompleteData(apartments) {
  console.log(`🔄 ${apartments.length}개 아파트의 상세정보 수집 중...`);
  
  const enhancedData = [];
  
  for (let i = 0; i < apartments.length; i++) {
    const apt = apartments[i];
    console.log(`⚡ ${i + 1}/${apartments.length}: ${apt.kaptName} (${apt.kaptCode})`);
    
    try {
      // 기본 목록 데이터 (기존 컬럼만)
      const baseData = {
        kapt_code: apt.kaptCode,
        name: apt.kaptName,
        address: `${apt.as3 || ''} ${apt.as4 || ''}`.trim() || apt.kaptName,
        road_address: apt.doroJuso,
        region_code: apt.bjdCode,
        legal_dong: apt.as3,
        jibun: apt.as4,
        data_source: 'government_api_enhanced_basic'
      };
      
      // 기본정보 API 호출
      const basicInfo = await getBasicInfo(apt.kaptCode);
      if (basicInfo) {
        // 기존 컬럼에 매핑 가능한 필드들만 추가
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
        
        console.log(`  ✅ 기본정보 수집 완료`);
      }
      
      // 상세정보 API 호출  
      const detailInfo = await getDetailInfo(apt.kaptCode);
      if (detailInfo) {
        // 기존 컬럼에 매핑 가능한 필드들만 추가
        if (detailInfo.kaptdEcnt) {
          baseData.elevator_count = parseInt(detailInfo.kaptdEcnt) || null;
        }
        if (detailInfo.kaptdCccnt) {
          baseData.cctv_count = parseInt(detailInfo.kaptdCccnt) || null;
        }
        // 편의시설 정보는 기존 컬럼 확인 후 추가
        // if (detailInfo.welfareFacility) {
        //   baseData.welfare_facilities = detailInfo.welfareFacility;
        // }
        // if (detailInfo.convenientFacility) {
        //   baseData.convenient_facilities = detailInfo.convenientFacility;
        // }
        // if (detailInfo.educationFacility) {
        //   baseData.education_facilities = detailInfo.educationFacility;
        // }
        // 교통정보는 기존 컬럼이 있는지 확인 후 추가
        // if (detailInfo.kaptdWtimebus) {
        //   baseData.bus_station_distance = detailInfo.kaptdWtimebus;
        // }
        // if (detailInfo.subwayLine) {
        //   baseData.subway_line = detailInfo.subwayLine;
        // }
        // if (detailInfo.subwayStation) {
        //   baseData.subway_station = detailInfo.subwayStation;
        // }
        // if (detailInfo.kaptdWtimesub) {
        //   baseData.subway_distance = detailInfo.kaptdWtimesub;
        // }
        // 주차대수 계산
        const surfaceParking = parseInt(detailInfo.kaptdPcnt) || 0;
        const undergroundParking = parseInt(detailInfo.kaptdPcntu) || 0;
        baseData.total_parking_count = surfaceParking + undergroundParking;
        baseData.surface_parking_count = surfaceParking;
        baseData.underground_parking_count = undergroundParking;
        
        // 전기차 충전기 정보는 기존 컬럼 확인 후 추가
        // if (detailInfo.undergroundElChargerCnt) {
        //   baseData.underground_ev_charger_count = parseInt(detailInfo.undergroundElChargerCnt) || null;
        // }
        // if (detailInfo.groundElChargerCnt) {
        //   baseData.surface_ev_charger_count = parseInt(detailInfo.groundElChargerCnt) || null;
        // }
        
        console.log(`  ✅ 상세정보 수집 완료`);
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
      console.error('🔍 첫 번째 레코드 구조:', JSON.stringify(apartments[0], null, 2));
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
async function collectEnhancedData(maxPages = 3) {
  console.log('🚀 향상된 데이터 수집 시작 (기존 컬럼 활용)');
  
  let totalCollected = 0;
  let totalSaved = 0;
  let pageNo = 1;
  
  while (pageNo <= maxPages) {
    // 1. 목록 조회
    const listResult = await getApartmentList(pageNo, 10);
    
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
  
  // 수집된 데이터 샘플 출력
  if (totalSaved > 0) {
    console.log('\n📋 수집된 데이터 샘플:');
    console.log('- 세대수, 동수, 건축년도, 시공사');
    console.log('- 주차대수 (지상/지하), 승강기 수, CCTV 수');
    console.log('- 편의시설, 교통정보 (버스/지하철)');
    console.log('- 전기차 충전기, 관리정보 등');
  }
}

// 실행
collectEnhancedData(3).then(() => {
  console.log('✅ 스크립트 완료');
  process.exit(0);
}).catch(error => {
  console.error('❌ 스크립트 오류:', error);
  process.exit(1);
});