/**
 * 전국 아파트 단지 수집을 위한 API 엔드포인트 조사
 */

const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

const SERVICE_KEY = 'EAl5DDYH6Ixz5ZpCY40/DTEDqkFXTG2Utgr5YJQkusuQyugyb80K+qVwRG2ZpceMiCIXqwFWmGpJRHeu7s8JUA==';
const API_BASE_URL = 'https://apis.data.go.kr/1613000';

/**
 * 1. 아파트 단지 목록 조회 API 테스트
 */
async function testApartmentListAPI() {
  console.log('\n🔍 1. 아파트 단지 목록 조회 API 테스트');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/AptListServiceV4/getAphusList`, {
      params: {
        serviceKey: SERVICE_KEY,
        bjdCode: '11140',  // 서울시 중구 테스트
        numOfRows: 10
      },
      timeout: 10000
    });
    
    const result = response.data;
    
    if (result.response?.header?.resultCode === '00') {
      const items = result.response?.body?.items?.item || [];
      console.log(`✅ 서울 중구 아파트 ${items.length}개 조회 성공`);
      
      if (items.length > 0) {
        console.log('📋 샘플 데이터:');
        const sample = items[0];
        console.log(`  - 아파트명: ${sample.kaptName}`);
        console.log(`  - 아파트코드: ${sample.kaptCode}`);
        console.log(`  - 법정동코드: ${sample.bjdCode}`);
        console.log(`  - 사용승인일: ${sample.useAprDay}`);
      }
      
      return { success: true, count: items.length, data: items };
    } else {
      console.log(`❌ API 호출 실패: ${result.response?.header?.resultMsg}`);
      return { success: false, error: result.response?.header?.resultMsg };
    }
    
  } catch (error) {
    console.log(`❌ API 테스트 오류: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * 2. 시군구 코드 목록 조회 (지역별 수집을 위함)
 */
async function getSigunguCodes() {
  console.log('\n🔍 2. 시군구 코드 목록 조회');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/AptCategoryServiceV4/getSiguGunList`, {
      params: {
        serviceKey: SERVICE_KEY,
        sidoCode: '11'  // 서울시
      },
      timeout: 10000
    });
    
    const result = response.data;
    
    if (result.response?.header?.resultCode === '00') {
      const items = result.response?.body?.items?.item || [];
      console.log(`✅ 서울시 시군구 ${items.length}개 조회 성공`);
      
      items.slice(0, 5).forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.sigugunName} (${item.sigugunCode})`);
      });
      
      return { success: true, data: items };
    } else {
      console.log(`❌ 시군구 조회 실패: ${result.response?.header?.resultMsg}`);
      return { success: false, error: result.response?.header?.resultMsg };
    }
    
  } catch (error) {
    console.log(`❌ 시군구 조회 오류: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * 3. 시도 코드 목록 조회 (전국 수집을 위함)
 */
async function getSidoCodes() {
  console.log('\n🔍 3. 시도 코드 목록 조회');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/AptCategoryServiceV4/getSidoList`, {
      params: {
        serviceKey: SERVICE_KEY
      },
      timeout: 10000
    });
    
    const result = response.data;
    
    if (result.response?.header?.resultCode === '00') {
      const items = result.response?.body?.items?.item || [];
      console.log(`✅ 전국 시도 ${items.length}개 조회 성공`);
      
      items.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.sidoName} (${item.sidoCode})`);
      });
      
      return { success: true, data: items };
    } else {
      console.log(`❌ 시도 조회 실패: ${result.response?.header?.resultMsg}`);
      return { success: false, error: result.response?.header?.resultMsg };
    }
    
  } catch (error) {
    console.log(`❌ 시도 조회 오류: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * 4. 법정동 코드 목록 조회
 */
async function getBjdCodes(sigugunCode) {
  console.log(`\n🔍 4. 법정동 코드 목록 조회 (${sigugunCode})`);
  
  try {
    const response = await axios.get(`${API_BASE_URL}/AptCategoryServiceV4/getBjdList`, {
      params: {
        serviceKey: SERVICE_KEY,
        sigugunCode: sigugunCode
      },
      timeout: 10000
    });
    
    const result = response.data;
    
    if (result.response?.header?.resultCode === '00') {
      const items = result.response?.body?.items?.item || [];
      console.log(`✅ 법정동 ${items.length}개 조회 성공`);
      
      if (items.length > 0) {
        items.slice(0, 3).forEach((item, index) => {
          console.log(`  ${index + 1}. ${item.bjdName} (${item.bjdCode})`);
        });
        console.log(`  ... 총 ${items.length}개`);
      }
      
      return { success: true, data: items };
    } else {
      console.log(`❌ 법정동 조회 실패: ${result.response?.header?.resultMsg}`);
      return { success: false, error: result.response?.header?.resultMsg };
    }
    
  } catch (error) {
    console.log(`❌ 법정동 조회 오류: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * 5. API 제한 및 페이징 테스트
 */
async function testPagination() {
  console.log('\n🔍 5. API 페이징 및 제한 테스트');
  
  try {
    // 큰 지역에서 많은 데이터 조회 테스트
    const response = await axios.get(`${API_BASE_URL}/AptListServiceV4/getAphusList`, {
      params: {
        serviceKey: SERVICE_KEY,
        bjdCode: '11110',  // 서울시 종로구
        numOfRows: 100,
        pageNo: 1
      },
      timeout: 10000
    });
    
    const result = response.data;
    
    if (result.response?.header?.resultCode === '00') {
      const totalCount = result.response?.body?.totalCount || 0;
      const items = result.response?.body?.items?.item || [];
      
      console.log(`✅ 총 데이터: ${totalCount}개`);
      console.log(`✅ 현재 페이지: ${items.length}개`);
      console.log(`✅ 예상 페이지 수: ${Math.ceil(totalCount / 100)}페이지`);
      
      return { 
        success: true, 
        totalCount, 
        currentPageCount: items.length,
        estimatedPages: Math.ceil(totalCount / 100)
      };
    }
    
  } catch (error) {
    console.log(`❌ 페이징 테스트 오류: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * 메인 조사 함수
 */
async function researchAPIs() {
  console.log('🚀 전국 아파트 단지 수집을 위한 API 조사 시작\n');
  
  // 1. 아파트 목록 API 테스트
  const listTest = await testApartmentListAPI();
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 2. 시도 코드 조회 (전국)
  const sidoResult = await getSidoCodes();
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 3. 시군구 코드 조회 (서울 예시)
  const sigugunResult = await getSigunguCodes();
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 4. 법정동 코드 조회 (중구 예시)
  if (sigugunResult.success && sigugunResult.data.length > 0) {
    const firstSigungu = sigugunResult.data[0];
    const bjdResult = await getBjdCodes(firstSigungu.sigugunCode);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // 5. 페이징 테스트
  const pageTest = await testPagination();
  
  console.log('\n📊 조사 결과 요약:');
  console.log(`✅ 아파트 목록 API: ${listTest.success ? '성공' : '실패'}`);
  console.log(`✅ 시도 코드 API: ${sidoResult.success ? '성공' : '실패'}`);
  console.log(`✅ 시군구 코드 API: ${sigugunResult.success ? '성공' : '실패'}`);
  console.log(`✅ 페이징 기능: ${pageTest.success ? '성공' : '실패'}`);
  
  if (sidoResult.success) {
    console.log(`📍 전국 시도: ${sidoResult.data.length}개`);
  }
  
  if (pageTest.success) {
    console.log(`📄 예상 수집 규모: 매우 큰 데이터셋 (지역별 수백~수천개)`);
  }
  
  console.log('\n💡 수집 전략 권장사항:');
  console.log('1. 지역별 단계적 수집 (시도 → 시군구 → 법정동)');
  console.log('2. API 호출 제한 준수 (요청 간 1초 간격)');
  console.log('3. 배치 처리 및 중단점 관리');
  console.log('4. 중복 제거 및 데이터 검증');
  console.log('5. 진행상황 모니터링');
}

researchAPIs().then(() => {
  console.log('\n✅ API 조사 완료');
  process.exit(0);
}).catch(error => {
  console.error('❌ 조사 오류:', error);
  process.exit(1);
});