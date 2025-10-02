/**
 * 간단한 데이터 수집 스크립트 - 검증된 방식 사용
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

async function getApartmentList(pageNo = 1, numOfRows = 100) {
  try {
    console.log(`📡 페이지 ${pageNo} 조회 중... (${numOfRows}개씩)`);
    
    const response = await axios.get(`${API_BASE_URL}/AptListService3/getTotalAptList3`, {
      params: {
        serviceKey: SERVICE_KEY,
        sigunguCd: '11680', // 강남구 (검증된 코드)
        numOfRows: numOfRows,
        pageNo: pageNo
      },
      timeout: 30000
    });
    
    const jsonData = response.data;
    
    if (jsonData.response?.header?.resultCode !== '00') {
      throw new Error(`API 오류: ${jsonData.response?.header?.resultMsg}`);
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
    console.error(`❌ API 호출 오류: ${error.message}`);
    return { items: [], totalCount: 0, hasMore: false };
  }
}

async function saveToDatabase(apartments) {
  if (apartments.length === 0) return { success: 0, failed: 0 };
  
  console.log(`💾 ${apartments.length}개 아파트 DB 저장 중...`);
  
  try {
    // 실제 DB 스키마에 맞게 데이터 변환
    const transformedData = apartments.map(apt => ({
      kapt_code: apt.kaptCode,
      name: apt.kaptName,
      address: `${apt.as3 || ''} ${apt.as4 || ''}`.trim() || apt.kaptName,
      road_address: apt.doroJuso,
      region_code: apt.bjdCode,
      legal_dong: apt.as3,
      jibun: apt.as4,
      data_source: 'government_api_batch'
    }));
    
    const { data, error } = await supabase
      .from('apartment_complexes')
      .upsert(transformedData, { 
        onConflict: 'kapt_code',
        ignoreDuplicates: false 
      });
    
    if (error) {
      console.error('❌ DB 저장 오류:', error.message);
      return { success: 0, failed: apartments.length };
    }
    
    console.log(`✅ ${apartments.length}개 아파트 저장 완료`);
    return { success: apartments.length, failed: 0 };
    
  } catch (error) {
    console.error('❌ DB 저장 중 오류:', error.message);
    return { success: 0, failed: apartments.length };
  }
}

async function collectData(maxPages = 5) {
  console.log('🚀 간단한 데이터 수집 시작');
  
  let totalCollected = 0;
  let totalSaved = 0;
  let pageNo = 1;
  
  while (pageNo <= maxPages) {
    const result = await getApartmentList(pageNo, 100);
    
    if (result.items.length === 0) {
      console.log('📄 더 이상 데이터가 없습니다.');
      break;
    }
    
    totalCollected += result.items.length;
    
    // DB에 저장
    const saveResult = await saveToDatabase(result.items);
    totalSaved += saveResult.success;
    
    console.log(`📊 진행: ${pageNo}페이지 완료, 누적 수집: ${totalCollected}개, 저장: ${totalSaved}개`);
    
    if (!result.hasMore) {
      console.log('📄 마지막 페이지 도달');
      break;
    }
    
    pageNo++;
    
    // API 호출 제한 준수
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log(`\n🎉 수집 완료!`);
  console.log(`📊 총 수집: ${totalCollected}개`);
  console.log(`💾 총 저장: ${totalSaved}개`);
}

// 실행
collectData(3).then(() => {
  console.log('✅ 스크립트 완료');
  process.exit(0);
}).catch(error => {
  console.error('❌ 스크립트 오류:', error);
  process.exit(1);
});