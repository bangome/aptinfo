/**
 * 배치 스크립트와 동일한 방식으로 API 호출 디버깅
 */

const axios = require('axios');

const SERVICE_KEY = process.env.NEXT_PUBLIC_DATA_GO_KR_SERVICE_KEY || 'EAl5DDYH6Ixz5ZpCY40/DTEDqkFXTG2Utgr5YJQkusuQyugyb80K+qVwRG2ZpceMiCIXqwFWmGpJRHeu7s8JUA==';
const API_BASE_URL = 'https://apis.data.go.kr/1613000';

async function callAPILikeBatch() {
  try {
    console.log('🔍 배치 스크립트와 동일한 방식으로 API 호출...');
    console.log('📋 사용할 서비스 키:', SERVICE_KEY.substring(0, 20) + '...');
    
    const endpoint = '/AptListService3/getTotalAptList3';
    const url = `${API_BASE_URL}${endpoint}`;
    
    // 배치 스크립트와 동일한 파라미터
    const params = {
      serviceKey: SERVICE_KEY,
      sigunguCd: '11110',  // 종로구
      numOfRows: 1000
      // pageNo는 기본값 사용
    };
    
    console.log('📡 요청 URL:', url);
    console.log('📋 파라미터:', { ...params, serviceKey: params.serviceKey.substring(0, 20) + '...' });
    
    const response = await axios.get(url, {
      params: params,
      timeout: 30000
    });
    
    console.log('✅ HTTP 상태:', response.status);
    console.log('📄 응답 타입:', typeof response.data);
    
    // 응답 데이터 처리 (배치 스크립트와 동일한 로직)
    let jsonData;
    if (typeof response.data === 'object') {
      console.log('📄 JSON 응답 받음');
      jsonData = response.data;
    } else {
      console.log('📄 XML 응답 받음');
      const { XMLParser } = require('fast-xml-parser');
      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '@_',
        textNodeName: '#text'
      });
      jsonData = parser.parse(response.data);
    }
    
    // API 응답 상태 확인
    const resultCode = jsonData.response?.header?.resultCode;
    const resultMsg = jsonData.response?.header?.resultMsg;
    
    console.log('📊 결과 코드:', resultCode);
    console.log('📋 결과 메시지:', resultMsg);
    
    if (resultCode !== '00') {
      console.log(`❌ API 오류: ${resultMsg}`);
      return [];
    }
    
    // 아이템 추출 (배치 스크립트와 동일한 로직)
    const items = jsonData.response?.body?.items;
    if (Array.isArray(items)) {
      console.log(`✅ 배열로 받음: ${items.length}개 아이템`);
      return items;
    } else if (items?.item) {
      console.log('✅ XML 구조로 받음');
      return Array.isArray(items.item) ? items.item : [items.item];
    }
    
    console.log('❌ 아이템이 없음');
    return [];
    
  } catch (error) {
    console.error('❌ API 호출 오류:', error.message);
    if (error.response) {
      console.error('📄 응답 상태:', error.response.status);
      console.error('📄 응답 데이터:', JSON.stringify(error.response.data, null, 2));
    }
    return [];
  }
}

async function runTest() {
  console.log('🚀 배치 스크립트 방식 API 디버깅 시작\n');
  
  const result = await callAPILikeBatch();
  
  console.log('\n📊 최종 결과:');
  console.log('- 반환된 아이템 수:', result.length);
  
  if (result.length > 0) {
    console.log('🏠 첫 번째 아이템:');
    console.log('  - 코드:', result[0].kaptCode);
    console.log('  - 이름:', result[0].kaptName);
    console.log('  - 주소:', result[0].doroJuso || result[0].as1 + ' ' + result[0].as2);
  }
  
  console.log('\n🎉 테스트 완료');
}

runTest();