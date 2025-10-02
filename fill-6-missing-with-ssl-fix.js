#!/usr/bin/env node

/**
 * 누락된 6개 아파트 단지 정보를 정부 API에서 보완 (SSL 우회)
 */

const axios = require('axios');
const https = require('https');
const { XMLParser } = require('fast-xml-parser');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SERVICE_KEY = process.env.NEXT_PUBLIC_DATA_GO_KR_SERVICE_KEY;
const API_BASE_URL = 'https://apis.data.go.kr/1613000';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// SSL 인증서 무시 설정
const httpsAgent = new https.Agent({  
  rejectUnauthorized: false
});

// XML 파서 설정
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text'
});

/**
 * SSL 문제 해결된 API 호출 함수
 */
async function callAPI(endpoint, params, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      const response = await axios.get(url, {
        params: {
          serviceKey: SERVICE_KEY,
          ...params
        },
        timeout: 15000,
        httpsAgent, // SSL 인증서 무시
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      // API 응답 처리
      let result;
      
      if (typeof response.data === 'string' && response.data.includes('<?xml')) {
        const jsonData = parser.parse(response.data);
        result = jsonData.response;
      } else if (typeof response.data === 'object' && response.data.response) {
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
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  return null;
}

/**
 * 아파트 기본정보 가져오기
 */
async function getApartmentBasisInfo(kaptCode) {
  const data = await callAPI('/AptBasisInfoServiceV4/getAphusBassInfoV4', { kaptCode });
  return Array.isArray(data) ? data[0] : data;
}

/**
 * 아파트 상세정보 가져오기
 */
async function getApartmentDetailInfo(kaptCode) {
  const data = await callAPI('/AptBasisInfoServiceV4/getAphusDtlInfoV4', { kaptCode });
  return Array.isArray(data) ? data[0] : data;
}

/**
 * 누락된 아파트 단지 목록 조회
 */
async function getMissingComplexes() {
  const [apartments, complexes] = await Promise.all([
    supabase.from('apartments').select('kapt_code'),
    supabase.from('apartment_complexes').select('kapt_code')
  ]);
  
  if (apartments.data && complexes.data) {
    const existingCodes = new Set(complexes.data.map(c => c.kapt_code));
    return apartments.data
      .filter(apt => !existingCodes.has(apt.kapt_code))
      .map(apt => apt.kapt_code);
  }
  return [];
}

/**
 * 아파트 단지 정보 삽입
 */
async function insertApartmentComplex(complexData) {
  const { data, error } = await supabase
    .from('apartment_complexes')
    .insert([complexData])
    .select();
    
  if (error) {
    throw error;
  }
  return data[0];
}

/**
 * 메인 실행 함수
 */
async function fillMissingComplexes() {
  console.log('🚀 누락된 6개 아파트 단지 정보 보완 시작 (SSL 우회)\n');
  
  // 누락된 단지 목록 조회
  const missingCodes = await getMissingComplexes();
  console.log(`📋 누락된 아파트 단지: ${missingCodes.length}개`);
  
  if (missingCodes.length === 0) {
    console.log('🎉 모든 아파트 단지 정보가 이미 존재합니다!');
    return;
  }
  
  console.log('누락된 코드:', missingCodes.join(', '), '\n');
  
  let successCount = 0;
  let failCount = 0;
  
  for (let i = 0; i < missingCodes.length; i++) {
    const kaptCode = missingCodes[i];
    console.log(`\n[${i+1}/${missingCodes.length}] 처리 중: ${kaptCode}`);
    
    try {
      // 정부 API에서 기본정보와 상세정보 조회
      const [basisInfo, detailInfo] = await Promise.all([
        getApartmentBasisInfo(kaptCode),
        getApartmentDetailInfo(kaptCode)
      ]);
      
      if (!basisInfo && !detailInfo) {
        console.log(`   ❌ API에서 데이터를 가져올 수 없음`);
        failCount++;
        continue;
      }
      
      // 데이터 병합
      const mergedData = { 
        kapt_code: kaptCode,
        ...basisInfo, 
        ...detailInfo,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // 데이터베이스에 삽입
      await insertApartmentComplex(mergedData);
      
      console.log(`   ✅ 성공: ${basisInfo?.kaptName || detailInfo?.kaptName || '이름 없음'}`);
      console.log(`   📍 주소: ${basisInfo?.kaptAddr || detailInfo?.kaptAddr || '주소 없음'}`);
      
      successCount++;
      
      // API 호출 간격 조절
      if (i < missingCodes.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
    } catch (error) {
      console.log(`   ❌ 실패: ${error.message}`);
      failCount++;
    }
  }
  
  console.log('\n🎯 작업 완료!');
  console.log(`✅ 성공: ${successCount}개`);
  console.log(`❌ 실패: ${failCount}개`);
  
  if (successCount > 0) {
    console.log('\n📊 최종 상태 확인...');
    const [apartments, complexes] = await Promise.all([
      supabase.from('apartments').select('kapt_code'),
      supabase.from('apartment_complexes').select('kapt_code')
    ]);
    
    const apartmentCount = apartments.data?.length || 0;
    const complexCount = complexes.data?.length || 0;
    const coverage = Math.round((complexCount / apartmentCount) * 100);
    
    console.log(`🏢 apartments: ${apartmentCount}개`);
    console.log(`🏘️ apartment_complexes: ${complexCount}개`);
    console.log(`📈 커버리지: ${coverage}%`);
    
    if (coverage === 100) {
      console.log('\n🎉 완벽! 모든 아파트에 대한 단지 정보가 완성되었습니다!');
    }
  }
}

fillMissingComplexes().catch(console.error);