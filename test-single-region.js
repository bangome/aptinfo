/**
 * 단일 지역 테스트 스크립트
 */

const axios = require('axios');

const SERVICE_KEY = 'EAl5DDYH6Ixz5ZpCY40/DTEDqkFXTG2Utgr5YJQkusuQyugyb80K+qVwRG2ZpceMiCIXqwFWmGpJRHeu7s8JUA==';
const API_BASE_URL = 'https://apis.data.go.kr/1613000';

async function testSingleRegion(sigunguCd, regionName) {
  try {
    console.log(`🔍 ${regionName} (${sigunguCd}) 테스트 중...`);
    
    const endpoint = '/AptListService3/getTotalAptList3';
    const url = `${API_BASE_URL}${endpoint}`;
    
    const response = await axios.get(url, {
      params: {
        serviceKey: SERVICE_KEY,
        sigunguCd: sigunguCd,
        numOfRows: 5,
        pageNo: 1
      },
      timeout: 10000
    });
    
    let jsonData = response.data;
    
    console.log(`📊 응답 코드: ${jsonData.response?.header?.resultCode}`);
    console.log(`📋 응답 메시지: ${jsonData.response?.header?.resultMsg}`);
    console.log(`📈 총 개수: ${jsonData.response?.body?.totalCount}`);
    
    if (jsonData.response?.header?.resultCode === '00') {
      const items = jsonData.response?.body?.items;
      if (Array.isArray(items) && items.length > 0) {
        console.log(`✅ 성공: ${items.length}개 아이템 받음`);
        console.log(`🏠 첫 번째: ${items[0].kaptName} (${items[0].kaptCode})`);
        return true;
      } else {
        console.log('❌ 아이템이 없음');
        return false;
      }
    } else {
      console.log(`❌ 실패: ${jsonData.response?.header?.resultMsg}`);
      return false;
    }
    
  } catch (error) {
    console.log(`❌ 오류: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('🚀 서울 지역별 API 테스트 시작\n');
  
  const testCases = [
    ['11680', '강남구'],      // 우리가 성공한 것
    ['11110', '종로구'],      // 배치에서 실패한 것  
    ['11140', '중구'],
    ['11170', '용산구'],
    ['11200', '성동구'],
    ['11230', '도봉구'],
    ['11000', '서울시 전체']  // 더 넓은 범위
  ];
  
  let successCount = 0;
  for (const [code, name] of testCases) {
    const success = await testSingleRegion(code, name);
    if (success) successCount++;
    console.log(''); // 빈 줄
    
    // API 호출 제한을 위한 딜레이
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log(`🎉 테스트 완료: ${successCount}/${testCases.length}개 성공`);
}

runTests();