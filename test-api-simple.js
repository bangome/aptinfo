/**
 * 간단한 API 테스트 - 다양한 방법으로 시도
 */

const axios = require('axios');

// 서비스 키
const SERVICE_KEY = 'EAl5DDYH6Ixz5ZpCY40/DTEDqkFXTG2Utgr5YJQkusuQyugyb80K+qVwRG2ZpceMiCIXqwFWmGpJRHeu7s8JUA==';
const API_BASE_URL = 'https://apis.data.go.kr/1613000';

async function testMultipleEndpoints() {
  const tests = [
    {
      name: '아파트 목록 API (시군구)',
      endpoint: '/AptListService3/getSigunguAptList3',
      params: { sigunguCd: '11110' } // 종로구
    },
    {
      name: '아파트 목록 API (전체)',
      endpoint: '/AptListService3/getTotalAptList3',
      params: { sigunguCd: '11110' }
    },
    {
      name: '아파트 목록 API (도로명)',
      endpoint: '/AptListService3/getRoadnameAptList3',
      params: { sigunguCd: '11110' }
    },
    {
      name: '공동주택 기본정보',
      endpoint: '/AptBasisInfoServiceV4/getAphusBassInfoV4',
      params: { kaptCode: 'A01010001' } // 예시 단지코드
    }
  ];

  for (const test of tests) {
    try {
      console.log(`\n🔍 ${test.name} 테스트 중...`);
      
      const response = await axios.get(`${API_BASE_URL}${test.endpoint}`, {
        params: {
          serviceKey: SERVICE_KEY,
          numOfRows: 5,
          ...test.params
        },
        timeout: 30000
      });

      console.log(`✅ 응답 상태: ${response.status}`);
      console.log(`📊 응답 데이터:`, JSON.stringify(response.data, null, 2));

    } catch (error) {
      console.log(`❌ ${test.name} 오류: ${error.message}`);
      if (error.response) {
        console.log(`📄 오류 응답:`, JSON.stringify(error.response.data, null, 2));
      }
    }
  }
}

// URL 인코딩 테스트
async function testUrlEncoding() {
  console.log('\n🔧 URL 인코딩 테스트...');
  
  const encodedKey = encodeURIComponent(SERVICE_KEY);
  console.log('원본 키:', SERVICE_KEY.substring(0, 20) + '...');
  console.log('인코딩된 키:', encodedKey.substring(0, 20) + '...');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/AptListService3/getTotalAptList3`, {
      params: {
        serviceKey: encodedKey,
        sigunguCd: '11110',
        numOfRows: 5
      }
    });
    
    console.log('✅ 인코딩 테스트 성공:', response.data);
  } catch (error) {
    console.log('❌ 인코딩 테스트 실패:', error.message);
  }
}

async function runAllTests() {
  console.log('🚀 API 종합 테스트 시작\n');
  
  await testMultipleEndpoints();
  await testUrlEncoding();
  
  console.log('\n🎉 테스트 완료');
}

runAllTests();