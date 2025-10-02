/**
 * 기본정보 및 상세정보 API 테스트
 */

const axios = require('axios');

const SERVICE_KEY = 'EAl5DDYH6Ixz5ZpCY40/DTEDqkFXTG2Utgr5YJQkusuQyugyb80K+qVwRG2ZpceMiCIXqwFWmGpJRHeu7s8JUA==';
const API_BASE_URL = 'https://apis.data.go.kr/1613000';

// 테스트용 단지 코드들 (실제 수집된 데이터에서)
const TEST_CODES = [
  'A10021295', // 경희궁의아침4단지
  'A10021652', // 경희궁파크팰리스
  'A11007001', // 경희궁의아침3단지
  'A11087101', // 경희궁의아침2단지
  'A11005401'  // 광화문스페이스본 아파트
];

async function testBasicInfoAPI(kaptCode) {
  try {
    console.log(`🔍 기본정보 API 테스트: ${kaptCode}`);
    
    const response = await axios.get(`${API_BASE_URL}/AptBasisInfoServiceV4/getAphusBassInfoV4`, {
      params: {
        serviceKey: SERVICE_KEY,
        kaptCode: kaptCode
      },
      timeout: 10000
    });
    
    const jsonData = response.data;
    
    if (jsonData.response?.header?.resultCode === '00') {
      const item = jsonData.response?.body?.item;
      if (item) {
        console.log('✅ 기본정보 성공:');
        console.log('📋 사용 가능한 필드들:');
        Object.keys(item).forEach(key => {
          console.log(`  - ${key}: ${item[key] || 'null'}`);
        });
        return item;
      }
    } else {
      console.log(`❌ 기본정보 실패: ${jsonData.response?.header?.resultMsg}`);
    }
    
  } catch (error) {
    console.log(`❌ 기본정보 오류: ${error.message}`);
  }
  
  return null;
}

async function testDetailInfoAPI(kaptCode) {
  try {
    console.log(`\n🔍 상세정보 API 테스트: ${kaptCode}`);
    
    const response = await axios.get(`${API_BASE_URL}/AptBasisInfoServiceV4/getAphusDtlInfoV4`, {
      params: {
        serviceKey: SERVICE_KEY,
        kaptCode: kaptCode
      },
      timeout: 10000
    });
    
    const jsonData = response.data;
    
    if (jsonData.response?.header?.resultCode === '00') {
      const item = jsonData.response?.body?.item;
      if (item) {
        console.log('✅ 상세정보 성공:');
        console.log('📋 사용 가능한 필드들:');
        Object.keys(item).forEach(key => {
          console.log(`  - ${key}: ${item[key] || 'null'}`);
        });
        return item;
      }
    } else {
      console.log(`❌ 상세정보 실패: ${jsonData.response?.header?.resultMsg}`);
    }
    
  } catch (error) {
    console.log(`❌ 상세정보 오류: ${error.message}`);
  }
  
  return null;
}

async function runDetailAPITests() {
  console.log('🚀 기본정보 및 상세정보 API 필드 분석 시작\n');
  
  let basicInfoFields = new Set();
  let detailInfoFields = new Set();
  
  for (const kaptCode of TEST_CODES) {
    console.log(`\n🏠 단지코드: ${kaptCode}`);
    console.log('=' .repeat(50));
    
    // 기본정보 테스트
    const basicInfo = await testBasicInfoAPI(kaptCode);
    if (basicInfo) {
      Object.keys(basicInfo).forEach(field => basicInfoFields.add(field));
    }
    
    // 상세정보 테스트  
    const detailInfo = await testDetailInfoAPI(kaptCode);
    if (detailInfo) {
      Object.keys(detailInfo).forEach(field => detailInfoFields.add(field));
    }
    
    // API 호출 제한을 위한 딜레이
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 첫 번째 성공한 케이스만 상세 분석
    if (basicInfo || detailInfo) {
      break;
    }
  }
  
  console.log('\n📊 API 필드 분석 결과');
  console.log('=' .repeat(50));
  
  console.log('\n🔵 기본정보 API 필드들:');
  Array.from(basicInfoFields).sort().forEach(field => {
    console.log(`  - ${field}`);
  });
  
  console.log('\n🟡 상세정보 API 필드들:');
  Array.from(detailInfoFields).sort().forEach(field => {
    console.log(`  - ${field}`);
  });
  
  console.log(`\n📈 총 기본정보 필드: ${basicInfoFields.size}개`);
  console.log(`📈 총 상세정보 필드: ${detailInfoFields.size}개`);
  console.log(`📈 전체 필드: ${basicInfoFields.size + detailInfoFields.size}개`);
}

runDetailAPITests();