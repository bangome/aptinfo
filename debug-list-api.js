/**
 * 리스트 API 디버깅 스크립트
 */

const axios = require('axios');
const { XMLParser } = require('fast-xml-parser');

const SERVICE_KEY = 'EAl5DDYH6Ixz5ZpCY40/DTEDqkFXTG2Utgr5YJQkusuQyugyb80K+qVwRG2ZpceMiCIXqwFWmGpJRHeu7s8JUA==';
const API_BASE_URL = 'https://apis.data.go.kr/1613000';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text'
});

async function debugListAPI() {
  try {
    console.log('🔍 리스트 API 디버깅 시작...');
    
    // 강남구 API 호출
    const endpoint = '/AptListService3/getTotalAptList3';
    const url = `${API_BASE_URL}${endpoint}`;
    
    console.log('📡 요청 URL:', url);
    console.log('📋 파라미터:', {
      serviceKey: SERVICE_KEY.substring(0, 20) + '...',
      sigunguCd: '11680', // 강남구
      numOfRows: 5,
      pageNo: 1
    });
    
    const response = await axios.get(url, {
      params: {
        serviceKey: SERVICE_KEY,
        sigunguCd: '11680', // 강남구
        numOfRows: 5,
        pageNo: 1
      },
      timeout: 30000
    });
    
    console.log('✅ HTTP 상태:', response.status);
    console.log('📄 응답 타입:', typeof response.data);
    console.log('📄 응답 헤더:', response.headers['content-type']);
    
    // 데이터 처리 (JSON 응답인 경우)
    let jsonData;
    if (typeof response.data === 'object') {
      console.log('📄 JSON 응답 받음 - XML 파싱 불필요');
      jsonData = response.data;
    } else {
      console.log('📄 XML 응답 받음 - 파싱 진행');
      jsonData = parser.parse(response.data);
    }
    
    console.log('\n🔄 처리된 JSON:');
    console.log(JSON.stringify(jsonData, null, 2));
    
    // 응답 구조 분석
    const response_obj = jsonData.response;
    if (response_obj) {
      console.log('\n📊 응답 분석:');
      console.log('- resultCode:', response_obj.header?.resultCode);
      console.log('- resultMsg:', response_obj.header?.resultMsg);
      console.log('- totalCount:', response_obj.body?.totalCount);
      console.log('- pageNo:', response_obj.body?.pageNo);
      console.log('- numOfRows:', response_obj.body?.numOfRows);
      
      const items = response_obj.body?.items;
      if (items) {
        const itemArray = Array.isArray(items.item) ? items.item : [items.item];
        console.log('- 실제 아이템 수:', itemArray.length);
        
        if (itemArray.length > 0 && itemArray[0]) {
          console.log('\n🏠 첫 번째 아이템:');
          console.log('- kaptCode:', itemArray[0].kaptCode);
          console.log('- kaptName:', itemArray[0].kaptName);
          console.log('- doroJuso:', itemArray[0].doroJuso);
        }
      } else {
        console.log('❌ items가 없습니다');
      }
    }
    
  } catch (error) {
    console.error('❌ API 오류:', error.message);
    if (error.response) {
      console.error('📄 응답 상태:', error.response.status);
      console.error('📄 응답 데이터:', String(error.response.data).substring(0, 1000));
    }
  }
}

debugListAPI();