/**
 * 실제 알려진 단지코드로 테스트
 */

const axios = require('axios');
const { XMLParser } = require('fast-xml-parser');

const SERVICE_KEY = 'EAl5DDYH6Ixz5ZpCY40/DTEDqkFXTG2Utgr5YJQkusuQyugyb80K+qVwRG2ZpceMiCIXqwFWmGpJRHeu7s8JUA==';
const API_BASE_URL = 'https://apis.data.go.kr/1613000';

const parser = new XMLParser();

// 실제 알려진 단지코드들 (임의)
const KNOWN_KAPT_CODES = [
  'A10270000013',  // 더큰빌딩
  'A11110000001',  // 종로구의 한 단지
  'A11680000001',  // 강남구의 한 단지
  'A1023051',      // 성동구
  'A1026000'       // 중랑구
];

async function testWithRealCodes() {
  console.log('🏠 실제 단지코드로 기본정보 테스트\n');
  
  for (const kaptCode of KNOWN_KAPT_CODES) {
    try {
      console.log(`🔍 단지코드 ${kaptCode} 테스트 중...`);
      
      // 기본정보 API 테스트
      const basisResponse = await axios.get(`${API_BASE_URL}/AptBasisInfoServiceV4/getAphusBassInfoV4`, {
        params: {
          serviceKey: SERVICE_KEY,
          kaptCode: kaptCode
        }
      });
      
      const basisData = basisResponse.data.response;
      if (basisData.header.resultCode === '00' && basisData.body.item.kaptName) {
        console.log(`✅ 기본정보 성공: ${basisData.body.item.kaptName}`);
        console.log(`   주소: ${basisData.body.item.kaptAddr || basisData.body.item.doroJuso}`);
        console.log(`   세대수: ${basisData.body.item.kaptdaCnt}`);
        console.log(`   시공사: ${basisData.body.item.kaptBcompany}`);
        
        // 상세정보도 테스트
        await testDetailInfo(kaptCode);
        
        // 첫 번째 성공한 데이터만 보고 중단
        break;
      } else {
        console.log(`❌ 기본정보 실패: ${basisData.header.resultMsg}`);
      }
      
    } catch (error) {
      console.log(`❌ ${kaptCode} 오류: ${error.message}`);
    }
  }
}

async function testDetailInfo(kaptCode) {
  try {
    console.log(`🔍 상세정보 테스트 (${kaptCode})...`);
    
    const detailResponse = await axios.get(`${API_BASE_URL}/AptBasisInfoServiceV4/getAphusDtlInfoV4`, {
      params: {
        serviceKey: SERVICE_KEY,
        kaptCode: kaptCode
      }
    });
    
    const detailData = detailResponse.data.response;
    if (detailData.header.resultCode === '00') {
      const item = detailData.body.item;
      console.log(`✅ 상세정보 성공:`);
      console.log(`   지상 주차: ${item.kaptdPcnt}대`);
      console.log(`   지하 주차: ${item.kaptdPcntu}대`);
      console.log(`   승강기: ${item.kaptdEcnt}대`);
      console.log(`   CCTV: ${item.kaptdCccnt}대`);
      console.log(`   부대시설: ${item.welfareFacility}`);
      console.log(`   편의시설: ${item.convenientFacility}`);
      console.log(`   교육시설: ${item.educationFacility}`);
    } else {
      console.log(`❌ 상세정보 실패: ${detailData.header.resultMsg}`);
    }
    
  } catch (error) {
    console.log(`❌ 상세정보 오류: ${error.message}`);
  }
}

// 다른 방법으로 목록 API 테스트
async function testListWithDifferentParams() {
  console.log('\n📋 다른 파라미터로 목록 API 테스트\n');
  
  const testCases = [
    {
      name: '서울 강남구 (11680)',
      params: { sigunguCd: '11680' }
    },
    {
      name: '서울 전체 (11000)',
      params: { sigunguCd: '11000' }
    },
    {
      name: '부산 해운대구 (26440)',
      params: { sigunguCd: '26440' }
    }
  ];
  
  for (const testCase of testCases) {
    try {
      console.log(`🔍 ${testCase.name} 테스트 중...`);
      
      const response = await axios.get(`${API_BASE_URL}/AptListService3/getTotalAptList3`, {
        params: {
          serviceKey: SERVICE_KEY,
          numOfRows: 10,
          pageNo: 1,
          ...testCase.params
        }
      });
      
      const data = response.data.response;
      console.log(`📊 결과: ${data.header.resultCode} - ${data.header.resultMsg}`);
      if (data.body.totalCount > 0) {
        console.log(`✅ 총 ${data.body.totalCount}개 단지 발견!`);
      }
      
    } catch (error) {
      console.log(`❌ ${testCase.name} 오류: ${error.message}`);
    }
  }
}

async function runTests() {
  await testWithRealCodes();
  await testListWithDifferentParams();
  console.log('\n🎉 모든 테스트 완료');
}

runTests();