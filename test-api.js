/**
 * 국토교통부 API 테스트 스크립트
 */

const axios = require('axios');
const { XMLParser } = require('fast-xml-parser');

// 실제 서비스 키
const SERVICE_KEY = 'EAl5DDYH6Ixz5ZpCY40/DTEDqkFXTG2Utgr5YJQkusuQyugyb80K+qVwRG2ZpceMiCIXqwFWmGpJRHeu7s8JUA==';
const API_BASE_URL = 'https://apis.data.go.kr/1613000';

// XML 파서 설정
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text'
});

async function testAPI() {
  try {
    console.log('🔍 API 연결 테스트 중...');
    
    // 서울 강남구 단지 목록 조회 테스트
    const endpoint = '/AptListService3/getTotalAptList3';
    const url = `${API_BASE_URL}${endpoint}`;
    
    console.log('📡 요청 URL:', url);
    console.log('📋 파라미터:', {
      serviceKey: SERVICE_KEY.substring(0, 20) + '...',
      sigunguCd: '11680', // 강남구
      numOfRows: 5
    });
    
    const response = await axios.get(url, {
      params: {
        serviceKey: SERVICE_KEY,
        sigunguCd: '11110', // 종로구로 변경
        numOfRows: 10
      },
      timeout: 30000
    });
    
    console.log('✅ API 응답 상태:', response.status);
    console.log('📄 응답 데이터 타입:', typeof response.data);
    
    let xmlData;
    if (typeof response.data === 'string') {
      xmlData = response.data;
      console.log('📄 XML 데이터 (처음 500자):', xmlData.substring(0, 500));
    } else {
      xmlData = JSON.stringify(response.data);
      console.log('📄 JSON 응답:', JSON.stringify(response.data, null, 2));
    }
    
    // XML을 JSON으로 파싱
    const jsonData = parser.parse(xmlData);
    console.log('\n🔄 파싱된 JSON 구조:');
    console.log(JSON.stringify(jsonData, null, 2));
    
    // 실제 데이터 확인
    const items = jsonData.response?.body?.items?.item;
    if (items) {
      console.log(`\n📊 조회된 단지 수: ${Array.isArray(items) ? items.length : 1}`);
      
      const firstItem = Array.isArray(items) ? items[0] : items;
      console.log('\n🏠 첫 번째 단지 정보:');
      console.log('- 단지코드:', firstItem.kaptCode);
      console.log('- 단지명:', firstItem.kaptName);
      console.log('- 주소:', firstItem.doroJuso || '도로명주소 없음');
      
      // 상세정보 API 테스트
      if (firstItem.kaptCode) {
        console.log('\n🔍 상세정보 API 테스트...');
        await testDetailAPI(firstItem.kaptCode);
      }
    }
    
  } catch (error) {
    console.error('❌ API 테스트 오류:', error.message);
    if (error.response) {
      console.error('📄 응답 상태:', error.response.status);
      console.error('📄 응답 데이터:', String(error.response.data).substring(0, 500));
    }
  }
}

async function testDetailAPI(kaptCode) {
  try {
    const endpoint = '/AptBasisInfoServiceV4/getAphusDtlInfoV4';
    const url = `${API_BASE_URL}${endpoint}`;
    
    console.log('📡 상세정보 요청 중...', kaptCode);
    
    const response = await axios.get(url, {
      params: {
        serviceKey: SERVICE_KEY,
        kaptCode: kaptCode
      },
      timeout: 30000
    });
    
    const jsonData = parser.parse(response.data);
    const detailInfo = jsonData.response?.body?.items?.item;
    
    if (detailInfo) {
      const info = Array.isArray(detailInfo) ? detailInfo[0] : detailInfo;
      console.log('✅ 상세정보 조회 성공:');
      console.log('- 지상 주차대수:', info.kaptdPcnt);
      console.log('- 지하 주차대수:', info.kaptdPcntu);
      console.log('- 승강기 대수:', info.kaptdEcnt);
      console.log('- CCTV 대수:', info.kaptdCccnt);
      console.log('- 부대시설:', info.welfareFacility);
      console.log('- 편의시설:', info.convenientFacility);
      console.log('- 교육시설:', info.educationFacility);
    } else {
      console.log('❌ 상세정보 없음');
    }
    
  } catch (error) {
    console.error('❌ 상세정보 API 오류:', error.message);
  }
}

// 스크립트 실행
testAPI();