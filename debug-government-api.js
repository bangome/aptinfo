#!/usr/bin/env node

/**
 * 정부 API 작동하지 않는 이유 종합 분석
 */

const axios = require('axios');
const { XMLParser } = require('fast-xml-parser');
require('dotenv').config({ path: '.env.local' });

const SERVICE_KEY = process.env.NEXT_PUBLIC_DATA_GO_KR_SERVICE_KEY;
const API_BASE_URL = 'https://apis.data.go.kr/1613000';

console.log('🔍 정부 API 문제 원인 분석 시작\n');

// 1. 기본 정보 확인
console.log('📋 1. 기본 설정 확인');
console.log(`API 키 존재: ${SERVICE_KEY ? 'YES' : 'NO'}`);
console.log(`API 키 길이: ${SERVICE_KEY ? SERVICE_KEY.length : 0}자`);
console.log(`API 키 샘플: ${SERVICE_KEY ? SERVICE_KEY.substring(0, 20) + '...' : 'N/A'}`);
console.log(`Base URL: ${API_BASE_URL}\n`);

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text'
});

/**
 * 다양한 API 테스트
 */
async function testAPI(description, endpoint, params = {}) {
  console.log(`🧪 ${description}`);
  
  try {
    const fullParams = {
      serviceKey: SERVICE_KEY,
      ...params
    };
    
    console.log(`   URL: ${API_BASE_URL}${endpoint}`);
    console.log(`   Params:`, fullParams);
    
    const response = await axios.get(`${API_BASE_URL}${endpoint}`, {
      params: fullParams,
      timeout: 15000,
      headers: {
        'Accept': 'application/xml, text/xml, */*',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    console.log(`   응답 상태: ${response.status}`);
    console.log(`   응답 타입: ${typeof response.data}`);
    console.log(`   응답 크기: ${JSON.stringify(response.data).length} bytes`);
    
    // 응답 형태별 처리
    if (typeof response.data === 'string') {
      console.log(`   응답 내용 (처음 200자):`);
      console.log(`   "${response.data.substring(0, 200)}..."`);
      
      if (response.data.includes('<?xml')) {
        try {
          const jsonData = parser.parse(response.data);
          const result = jsonData.response;
          console.log(`   결과 코드: ${result?.header?.resultCode}`);
          console.log(`   결과 메시지: ${result?.header?.resultMsg}`);
          
          if (result?.body?.items) {
            const items = result.body.items.item;
            if (Array.isArray(items)) {
              console.log(`   ✅ 데이터 ${items.length}개 조회 성공`);
              return { success: true, count: items.length, data: items };
            } else if (items) {
              console.log(`   ✅ 데이터 1개 조회 성공`);
              return { success: true, count: 1, data: [items] };
            } else {
              console.log(`   ⚠️ items가 비어있음`);
              return { success: false, error: 'No items' };
            }
          }
        } catch (parseError) {
          console.log(`   ❌ XML 파싱 오류: ${parseError.message}`);
          return { success: false, error: parseError.message };
        }
      } else {
        console.log(`   ⚠️ XML이 아닌 응답`);
        return { success: false, error: 'Not XML response' };
      }
    } else if (typeof response.data === 'object') {
      console.log(`   응답 구조:`, Object.keys(response.data));
      
      if (response.data.response) {
        const result = response.data.response;
        console.log(`   결과 코드: ${result?.header?.resultCode}`);
        console.log(`   결과 메시지: ${result?.header?.resultMsg}`);
        
        if (result?.body?.items) {
          const items = result.body.items.item;
          if (Array.isArray(items)) {
            console.log(`   ✅ 데이터 ${items.length}개 조회 성공`);
            return { success: true, count: items.length, data: items };
          } else if (items) {
            console.log(`   ✅ 데이터 1개 조회 성공`);
            return { success: true, count: 1, data: [items] };
          } else {
            console.log(`   ⚠️ items가 비어있음`);
            return { success: false, error: 'No items' };
          }
        }
      }
    }
    
    return { success: false, error: 'Unknown response format' };
    
  } catch (error) {
    console.log(`   ❌ 오류 발생:`);
    console.log(`      타입: ${error.name}`);
    console.log(`      메시지: ${error.message}`);
    
    if (error.response) {
      console.log(`      HTTP 상태: ${error.response.status}`);
      console.log(`      HTTP 메시지: ${error.response.statusText}`);
      if (error.response.data) {
        const errorData = typeof error.response.data === 'string' 
          ? error.response.data.substring(0, 200) 
          : JSON.stringify(error.response.data).substring(0, 200);
        console.log(`      응답 내용: "${errorData}..."`);
      }
    }
    
    return { success: false, error: error.message };
  }
  
  console.log('');
}

/**
 * 메인 분석 함수
 */
async function analyzeAPIIssues() {
  const results = [];
  
  // 테스트 1: 기본 아파트 정보 조회 (알려진 코드)
  results.push(await testAPI(
    '테스트 1: 기본정보 API (A10020455)',
    '/AptBasisInfoServiceV4/getAphusBassInfoV4',
    { kaptCode: 'A10020455' }
  ));
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 테스트 2: 상세 정보 조회
  results.push(await testAPI(
    '테스트 2: 상세정보 API (A10020455)',
    '/AptBasisInfoServiceV4/getAphusDtlInfoV4', 
    { kaptCode: 'A10020455' }
  ));
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 테스트 3: 다른 아파트 코드로 테스트
  results.push(await testAPI(
    '테스트 3: 기본정보 API (A10020494)',
    '/AptBasisInfoServiceV4/getAphusBassInfoV4',
    { kaptCode: 'A10020494' }
  ));
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 테스트 4: 아파트 목록 조회 (지역별)
  results.push(await testAPI(
    '테스트 4: 아파트 목록 API (서울 중구)',
    '/AptListServiceV4/getAphusList',
    { bjdCode: '11140', numOfRows: 5 }
  ));
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 테스트 5: 시도 코드 목록 조회
  results.push(await testAPI(
    '테스트 5: 시도 목록 API',
    '/AptCategoryServiceV4/getSidoList',
    {}
  ));
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 테스트 6: API 키 없이 테스트 (인증 오류 확인)
  console.log('🧪 테스트 6: API 키 없이 호출 (인증 확인)');
  try {
    const response = await axios.get(`${API_BASE_URL}/AptBasisInfoServiceV4/getAphusBassInfoV4`, {
      params: { kaptCode: 'A10020455' }, // serviceKey 제외
      timeout: 10000
    });
    console.log('   ⚠️ API 키 없이도 응답이 옴 - 인증이 필요하지 않을 수 있음');
    console.log(`   응답: ${JSON.stringify(response.data).substring(0, 100)}...`);
  } catch (error) {
    console.log('   ✅ API 키 없이는 실패 - 정상적인 인증 필요');
    console.log(`   오류: ${error.message}`);
  }
  
  console.log('\n📊 분석 결과 요약:');
  const successCount = results.filter(r => r.success).length;
  console.log(`성공한 테스트: ${successCount}/${results.length}`);
  
  if (successCount === 0) {
    console.log('\n❌ 모든 API 호출이 실패했습니다.');
    console.log('🔍 가능한 원인들:');
    console.log('   1. API 키가 유효하지 않음');
    console.log('   2. API 서비스가 일시적으로 중단됨');
    console.log('   3. 요청 형식이 잘못됨');
    console.log('   4. 네트워크 연결 문제');
    console.log('   5. API 엔드포인트가 변경됨');
  } else if (successCount < results.length) {
    console.log('\n⚠️ 일부 API 호출만 성공했습니다.');
    console.log('🔍 특정 API나 파라미터에 문제가 있을 수 있습니다.');
  } else {
    console.log('\n✅ 모든 API 호출이 성공했습니다.');
    console.log('🔍 API는 정상 작동하고 있습니다.');
  }
  
  console.log('\n💡 권장 해결방법:');
  console.log('   1. API 키 갱신 확인');
  console.log('   2. 공공데이터포털에서 서비스 상태 확인');
  console.log('   3. 다른 엔드포인트나 파라미터 시도');
  console.log('   4. API 문서 최신 버전 확인');
}

// 실행
analyzeAPIIssues();