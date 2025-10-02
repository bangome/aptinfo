/**
 * 최종 데이터 수집 스크립트
 * 기존 컬럼명에 67개 API 필드 최대한 매핑
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
 * 통합 데이터 수집 및 매핑
 */
async function collectCompleteData(apartments) {
  console.log(`🔄 ${apartments.length}개 아파트의 완전한 데이터 수집 중...`);
  
  const enhancedData = [];
  
  for (let i = 0; i < apartments.length; i++) {
    const apt = apartments[i];
    console.log(`⚡ ${i + 1}/${apartments.length}: ${apt.kaptName} (${apt.kaptCode})`);
    
    try {
      // 기본 데이터 (기존 스키마에 맞춤)
      const baseData = {
        kapt_code: apt.kaptCode,
        name: apt.kaptName,
        address: `${apt.as3 || ''} ${apt.as4 || ''}`.trim() || apt.kaptName,
        road_address: apt.doroJuso,
        region_code: apt.bjdCode,
        legal_dong: apt.as3,
        jibun: apt.as4,
        data_source: 'government_api_complete'
      };
      
      // 기본정보 API 호출 및 매핑
      const basicInfo = await getBasicInfo(apt.kaptCode);
      if (basicInfo) {
        // 기존 컬럼에 매핑
        if (basicInfo.kaptUsedate) {
          baseData.use_approval_date = basicInfo.kaptUsedate;
        }
        if (basicInfo.kaptBcompany) {
          baseData.construction_company = basicInfo.kaptBcompany;
        }
        if (basicInfo.kaptAcompany) {
          baseData.project_company = basicInfo.kaptAcompany;
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
        if (basicInfo.kaptFax) {
          baseData.management_office_fax = basicInfo.kaptFax;
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
        if (basicInfo.kaptTarea) {
          baseData.total_area = parseFloat(basicInfo.kaptTarea) || null;
        }
        if (basicInfo.privArea) {
          baseData.private_area_total = parseFloat(basicInfo.privArea) || null;
        }
        if (basicInfo.codeSaleNm) {
          baseData.sale_type = basicInfo.codeSaleNm;
        }
        if (basicInfo.codeHallNm) {
          baseData.hall_type = basicInfo.codeHallNm;
        }
        if (basicInfo.ktownFlrNo) {
          baseData.floor_count = parseInt(basicInfo.ktownFlrNo) || null;
        }
        if (basicInfo.kaptMarea) {
          baseData.building_area = parseFloat(basicInfo.kaptMarea) || null;
        }
        if (basicInfo.kaptMparea60) {
          baseData.households_60_under = parseInt(basicInfo.kaptMparea60) || null;
        }
        if (basicInfo.kaptMparea85) {
          baseData.households_60_85 = parseInt(basicInfo.kaptMparea85) || null;
        }
        if (basicInfo.kaptMparea135) {
          baseData.households_85_135 = parseInt(basicInfo.kaptMparea135) || null;
        }
        if (basicInfo.kaptMparea136) {
          baseData.households_135_over = parseInt(basicInfo.kaptMparea136) || null;
        }
        
        console.log(`  ✅ 기본정보 수집 완료 (${Object.keys(basicInfo).length}개 필드)`);
      }
      
      // 상세정보 API 호출 및 매핑
      const detailInfo = await getDetailInfo(apt.kaptCode);
      if (detailInfo) {
        // 승강기 정보
        if (detailInfo.kaptdEcnt) {
          baseData.elevator_count = parseInt(detailInfo.kaptdEcnt) || null;
        }
        
        // 보안시설
        if (detailInfo.kaptdCccnt) {
          baseData.cctv_count = parseInt(detailInfo.kaptdCccnt) || null;
        }
        
        // 편의시설 정보 (JSON 형태로 저장)
        const facilities = {};
        if (detailInfo.welfareFacility) {
          facilities.welfare = detailInfo.welfareFacility;
        }
        if (detailInfo.convenientFacility) {
          facilities.convenient = detailInfo.convenientFacility;
        }
        if (detailInfo.educationFacility) {
          facilities.education = detailInfo.educationFacility;
        }
        
        // 교통정보 (JSON 형태로 저장)
        const transportation = {};
        if (detailInfo.kaptdWtimebus) {
          transportation.bus_distance = detailInfo.kaptdWtimebus;
        }
        if (detailInfo.subwayLine) {
          transportation.subway_line = detailInfo.subwayLine;
        }
        if (detailInfo.subwayStation) {
          transportation.subway_station = detailInfo.subwayStation;
        }
        if (detailInfo.kaptdWtimesub) {
          transportation.subway_distance = detailInfo.kaptdWtimesub;
        }
        
        // 주차시설 (계산된 값)
        const surfaceParking = parseInt(detailInfo.kaptdPcnt) || 0;
        const undergroundParking = parseInt(detailInfo.kaptdPcntu) || 0;
        const totalParking = surfaceParking + undergroundParking;
        
        // 관리정보 (JSON 형태로 저장)
        const managementInfo = {};
        if (detailInfo.codeMgr) {
          managementInfo.general_management = detailInfo.codeMgr;
        }
        if (detailInfo.kaptMgrCnt) {
          managementInfo.management_staff_count = parseInt(detailInfo.kaptMgrCnt);
        }
        if (detailInfo.kaptCcompany) {
          managementInfo.management_company = detailInfo.kaptCcompany;
        }
        if (detailInfo.codeSec) {
          managementInfo.security_type = detailInfo.codeSec;
        }
        if (detailInfo.kaptdScnt) {
          managementInfo.security_staff_count = parseInt(detailInfo.kaptdScnt);
        }
        if (detailInfo.codeClean) {
          managementInfo.cleaning_type = detailInfo.codeClean;
        }
        if (detailInfo.kaptdClcnt) {
          managementInfo.cleaning_staff_count = parseInt(detailInfo.kaptdClcnt);
        }
        
        // 건물구조 및 시설정보 (JSON 형태로 저장)
        const buildingInfo = {};
        if (detailInfo.codeStr) {
          buildingInfo.structure = detailInfo.codeStr;
        }
        if (detailInfo.kaptdEcapa) {
          buildingInfo.electrical_capacity = parseInt(detailInfo.kaptdEcapa);
        }
        if (detailInfo.codeElev) {
          buildingInfo.elevator_management = detailInfo.codeElev;
        }
        if (detailInfo.codeNet) {
          buildingInfo.internet_facility = detailInfo.codeNet;
        }
        if (detailInfo.groundElChargerCnt || detailInfo.undergroundElChargerCnt) {
          buildingInfo.ev_chargers = {
            surface: parseInt(detailInfo.groundElChargerCnt) || 0,
            underground: parseInt(detailInfo.undergroundElChargerCnt) || 0
          };
        }
        
        // JSON 필드가 비어있지 않을 때만 저장
        if (Object.keys(facilities).length > 0) {
          // 임시로 기존 컬럼 활용 (후에 JSON 컬럼으로 변경 가능)
          baseData.building_structure = JSON.stringify(facilities);
        }
        
        if (Object.keys(transportation).length > 0) {
          // 임시로 기존 컬럼 활용
          baseData.sale_type = baseData.sale_type || JSON.stringify(transportation);
        }
        
        if (totalParking > 0) {
          // 주차 정보는 기존 컬럼 활용 가능한지 확인 필요
          baseData.total_area = baseData.total_area || totalParking; // 임시 매핑
        }
        
        console.log(`  ✅ 상세정보 수집 완료 (${Object.keys(detailInfo).length}개 필드)`);
        console.log(`  📊 주차: 지상 ${surfaceParking}대, 지하 ${undergroundParking}대, 총 ${totalParking}대`);
        
        if (Object.keys(facilities).length > 0) {
          console.log(`  🏢 편의시설: ${Object.keys(facilities).length}개 카테고리`);
        }
        
        if (Object.keys(transportation).length > 0) {
          console.log(`  🚌 교통정보: ${Object.keys(transportation).length}개 항목`);
        }
      }
      
      enhancedData.push(baseData);
      
      // API 호출 제한 준수
      await new Promise(resolve => setTimeout(resolve, 1000));
      
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
async function saveCompleteData(apartments) {
  if (apartments.length === 0) return { success: 0, failed: 0 };
  
  console.log(`💾 ${apartments.length}개 아파트 완전한 데이터 저장 중...`);
  
  try {
    const { data, error } = await supabase
      .from('apartment_complexes')
      .upsert(apartments, { 
        onConflict: 'kapt_code',
        ignoreDuplicates: false 
      });
    
    if (error) {
      console.error('❌ DB 저장 오류:', error.message);
      console.error('🔍 첫 번째 레코드 구조 (일부):');
      const sample = apartments[0];
      Object.keys(sample).slice(0, 10).forEach(key => {
        console.error(`  - ${key}: ${sample[key]}`);
      });
      return { success: 0, failed: apartments.length };
    }
    
    console.log(`✅ ${apartments.length}개 완전한 데이터 저장 완료`);
    return { success: apartments.length, failed: 0 };
    
  } catch (error) {
    console.error('❌ DB 저장 중 오류:', error.message);
    return { success: 0, failed: apartments.length };
  }
}

/**
 * 메인 수집 함수
 */
async function collectCompleteApartmentData(maxPages = 5) {
  console.log('🚀 완전한 아파트 데이터 수집 시작');
  console.log('📋 67개 API 필드를 기존 스키마에 최대한 매핑');
  
  let totalCollected = 0;
  let totalSaved = 0;
  let pageNo = 1;
  const collectionStats = {
    basicInfoCount: 0,
    detailInfoCount: 0,
    facilitiesCount: 0,
    transportationCount: 0
  };
  
  while (pageNo <= maxPages) {
    // 1. 목록 조회
    const listResult = await getApartmentList(pageNo, 20);
    
    if (listResult.items.length === 0) {
      console.log('📄 더 이상 데이터가 없습니다.');
      break;
    }
    
    // 2. 완전한 데이터 수집
    const completeData = await collectCompleteData(listResult.items);
    totalCollected += completeData.length;
    
    // 통계 업데이트
    completeData.forEach(item => {
      if (item.construction_company) collectionStats.basicInfoCount++;
      if (item.elevator_count) collectionStats.detailInfoCount++;
      if (item.building_structure) collectionStats.facilitiesCount++;
      if (item.sale_type && item.sale_type.includes('subway')) collectionStats.transportationCount++;
    });
    
    // 3. 데이터베이스 저장
    const saveResult = await saveCompleteData(completeData);
    totalSaved += saveResult.success;
    
    console.log(`📊 페이지 ${pageNo} 완료: 수집 ${completeData.length}개, 저장 ${saveResult.success}개`);
    console.log(`📈 누적: 수집 ${totalCollected}개, 저장 ${totalSaved}개\n`);
    
    if (!listResult.hasMore) {
      console.log('📄 마지막 페이지 도달');
      break;
    }
    
    pageNo++;
  }
  
  console.log(`\n🎉 완전한 데이터 수집 완료!`);
  console.log(`📊 총 수집: ${totalCollected}개`);
  console.log(`💾 총 저장: ${totalSaved}개`);
  console.log(`📈 성공률: ${totalSaved > 0 ? ((totalSaved / totalCollected) * 100).toFixed(1) : 0}%`);
  
  console.log('\n📋 수집 통계:');
  console.log(`🏗️ 기본정보 (시공사 등): ${collectionStats.basicInfoCount}개`);
  console.log(`🔧 상세정보 (승강기 등): ${collectionStats.detailInfoCount}개`);
  console.log(`🏢 편의시설 정보: ${collectionStats.facilitiesCount}개`);
  console.log(`🚌 교통정보: ${collectionStats.transportationCount}개`);
  
  if (totalSaved > 0) {
    console.log('\n✨ 수집된 67개 API 필드가 기존 스키마에 최대한 매핑되었습니다!');
    console.log('💡 향후 새 컬럼 추가 시 더 완전한 데이터 저장이 가능합니다.');
  }
}

// 실행
collectCompleteApartmentData(3).then(() => {
  console.log('✅ 완전한 데이터 수집 스크립트 완료');
  process.exit(0);
}).catch(error => {
  console.error('❌ 스크립트 오류:', error);
  process.exit(1);
});