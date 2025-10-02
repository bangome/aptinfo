#!/usr/bin/env node

const axios = require('axios');
const { XMLParser } = require('fast-xml-parser');
require('dotenv').config({ path: '.env.local' });

const SERVICE_KEY = process.env.NEXT_PUBLIC_DATA_GO_KR_SERVICE_KEY;

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text'
});

async function testAPI() {
  try {
    console.log('🔍 API 테스트 시작...');
    
    const response = await axios.get('https://apis.data.go.kr/1613000/AptBasisInfoServiceV4/getAphusBassInfoV4', {
      params: {
        serviceKey: SERVICE_KEY,
        kaptCode: 'A10020455'
      },
      timeout: 10000
    });
    
    console.log('응답 타입:', typeof response.data);
    console.log('응답 구조:', Object.keys(response.data || {}));
    
    // JSON 객체로 응답이 온 경우
    if (typeof response.data === 'object' && response.data.response) {
      const result = response.data.response;
      console.log('결과 코드:', result.header?.resultCode);
      console.log('결과 메시지:', result.header?.resultMsg);
      
      if (result.header?.resultCode === '00') {
        const items = result.body?.items?.item;
        if (items) {
          console.log('✅ 데이터 조회 성공');
          console.log('아파트명:', items.kaptName || '없음');
          console.log('주소:', items.kaptAddr || '없음');
          return items;
        } else {
          console.log('⚠️ 아이템이 없음');
        }
      }
    }
    
    return null;
    
  } catch (error) {
    console.error('❌ 테스트 실패:', error.message);
    return null;
  }
}

testAPI();