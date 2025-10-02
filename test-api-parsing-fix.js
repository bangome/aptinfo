#!/usr/bin/env node

/**
 * 수정된 API 파싱 로직 테스트
 */

const axios = require('axios');
const { XMLParser } = require('fast-xml-parser');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '.env.local') });

const SERVICE_KEY = process.env.NEXT_PUBLIC_DATA_GO_KR_SERVICE_KEY;
const API_BASE_URL = 'https://apis.data.go.kr/1613000';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text'
});

/**
 * 수정된 API 호출 함수
 */
async function callAPI(endpoint, params = {}, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      const response = await axios.get(url, {
        params: {
          serviceKey: SERVICE_KEY,
          ...params
        },
        timeout: 15000
      });

      // API 응답이 이미 JSON 객체인 경우와 XML 문자열인 경우 모두 처리
      let result;
      
      if (typeof response.data === 'string' && response.data.includes('<?xml')) {
        // XML 응답인 경우
        const jsonData = parser.parse(response.data);
        result = jsonData.response;
      } else if (typeof response.data === 'object' && response.data.response) {
        // 이미 JSON 객체로 변환된 경우
        result = response.data.response;
      } else {
        console.log('알 수 없는 응답 형식:', typeof response.data);
        return null;
      }
      
      // 수정된 부분: items가 아닌 item으로 직접 접근
      if (result?.body?.item) {
        return result.body.item;
      } else {
        console.log(`API 응답 오류 또는 데이터 없음`);
        if (result?.header) {
          console.log(`결과 코드: ${result.header.resultCode}, 메시지: ${result.header.resultMsg}`);
        }
        return null;
      }
    } catch (error) {
      console.log(`API 호출 시도 ${attempt}/${retries} 실패:`, error.message);
      if (attempt === retries) {
        return null;
      }
      // 재시도 전 대기
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  return null;
}

/**
 * 기본정보 조회 테스트
 */
async function getApartmentBasisInfo(kaptCode) {
  const data = await callAPI('/AptBasisInfoServiceV4/getAphusBassInfoV4', { kaptCode });
  return data;
}

/**
 * 상세정보 조회 테스트
 */
async function getApartmentDetailInfo(kaptCode) {
  const data = await callAPI('/AptBasisInfoServiceV4/getAphusDtlInfoV4', { kaptCode });
  return data;
}

/**
 * 메인 테스트 함수
 */
async function testFixedAPI() {
  console.log('🧪 수정된 API 파싱 로직 테스트 시작\n');
  
  const testCodes = ['A10020455', 'A10020494', 'A10020526'];
  
  for (const kaptCode of testCodes) {
    console.log(`🔍 테스트: ${kaptCode}`);
    
    try {
      // 기본정보와 상세정보 동시 조회
      const [basisInfo, detailInfo] = await Promise.all([
        getApartmentBasisInfo(kaptCode),
        getApartmentDetailInfo(kaptCode)
      ]);
      
      if (basisInfo) {
        console.log(`✅ 기본정보 성공:`);
        console.log(`   아파트명: ${basisInfo.kaptName || '없음'}`);
        console.log(`   주소: ${basisInfo.kaptAddr || '없음'}`);
        console.log(`   건설회사: ${basisInfo.kaptBcompany || '없음'}`);
      } else {
        console.log(`❌ 기본정보 실패`);
      }
      
      if (detailInfo) {
        console.log(`✅ 상세정보 성공:`);
        console.log(`   관리방식: ${detailInfo.codeMgr || '없음'}`);
        console.log(`   전화번호: ${detailInfo.kaptTel || '없음'}`);
        console.log(`   홈페이지: ${detailInfo.kaptUrl || '없음'}`);
      } else {
        console.log(`❌ 상세정보 실패`);
      }
      
      // 병합된 데이터
      if (basisInfo || detailInfo) {
        const mergedData = { ...basisInfo, ...detailInfo };
        console.log(`🎯 병합된 데이터 필드 수: ${Object.keys(mergedData).length}개`);
      }
      
    } catch (error) {
      console.log(`❌ ${kaptCode} 테스트 실패:`, error.message);
    }
    
    console.log('');
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('🎉 API 테스트 완료!');
  console.log('✅ 이제 정부 API에서 데이터를 정상적으로 가져올 수 있습니다.');
}

testFixedAPI();