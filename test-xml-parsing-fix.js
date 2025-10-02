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

async function testCorrectParsing() {
  try {
    console.log('🧪 올바른 XML 파싱 테스트');
    
    const response = await axios.get('https://apis.data.go.kr/1613000/AptBasisInfoServiceV4/getAphusBassInfoV4', {
      params: {
        serviceKey: SERVICE_KEY,
        kaptCode: 'A10020455'
      },
      timeout: 10000
    });
    
    console.log('1️⃣ 응답 타입:', typeof response.data);
    console.log('1️⃣ 응답 샘플:', JSON.stringify(response.data).substring(0, 300) + '...\n');
    
    let jsonData;
    if (typeof response.data === 'string') {
      jsonData = parser.parse(response.data);
    } else {
      jsonData = response.data;
    }
    
    console.log('2️⃣ 파싱된 JSON 구조:');
    console.log('최상위 키들:', Object.keys(jsonData));
    console.log('');
    
    // 올바른 경로 찾기
    if (jsonData.response) {
      console.log('✅ response 키 발견');
      if (jsonData.response.body) {
        console.log('✅ response.body 키 발견');
        if (jsonData.response.body.item) {
          console.log('✅ response.body.item 발견!');
          const item = jsonData.response.body.item;
          console.log('');
          console.log('3️⃣ 아파트 정보:');
          console.log('  아파트코드:', item.kaptCode);
          console.log('  아파트명:', item.kaptName);
          console.log('  주소:', item.kaptAddr);
          console.log('');
          console.log('🎯 올바른 파싱 경로: jsonData.response.body.item');
          console.log('🎯 이전 잘못된 경로: jsonData.response?.body?.items?.item');
          return item;
        }
      }
    }
    
    return null;
    
  } catch (error) {
    console.error('❌ 테스트 실패:', error.message);
    return null;
  }
}

testCorrectParsing();