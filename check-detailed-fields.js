/**
 * 특정 아파트의 상세 API 데이터 확인
 */

const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

const SERVICE_KEY = 'EAl5DDYH6Ixz5ZpCY40/DTEDqkFXTG2Utgr5YJQkusuQyugyb80K+qVwRG2ZpceMiCIXqwFWmGpJRHeu7s8JUA==';
const API_BASE_URL = 'https://apis.data.go.kr/1613000';

async function getDetailInfo(kaptCode, apartmentName) {
  try {
    console.log(`\n🔍 ${apartmentName} (${kaptCode}) 상세정보 조회 중...`);
    
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
        console.log(`✅ ${apartmentName} 상세정보 수집 성공\n`);
        
        // 편의시설 정보
        console.log('🏢 편의시설 정보:');
        console.log(`  복지시설: ${item.welfareFacility || '정보없음'}`);
        console.log(`  편의시설: ${item.convenientFacility || '정보없음'}`);
        console.log(`  교육시설: ${item.educationFacility || '정보없음'}`);
        
        // 교통정보
        console.log('\n🚌 교통정보:');
        console.log(`  버스 도보시간: ${item.kaptdWtimebus || '정보없음'}`);
        console.log(`  지하철 노선: ${item.subwayLine || '정보없음'}`);
        console.log(`  지하철 역명: ${item.subwayStation || '정보없음'}`);
        console.log(`  지하철 도보시간: ${item.kaptdWtimesub || '정보없음'}`);
        
        // 안전시설 정보
        console.log('\n🛡️ 안전시설 정보:');
        console.log(`  CCTV: ${item.kaptdCccnt || '정보없음'}대`);
        console.log(`  화재감지기: ${item.codeFalarm || '정보없음'}`);
        console.log(`  경비관리: ${item.codeSec || '정보없음'}`);
        console.log(`  경비원수: ${item.kaptdScnt || '정보없음'}명`);
        console.log(`  경비업체: ${item.kaptdSecCom || '정보없음'}`);
        
        // 인프라 정보
        console.log('\n🏗️ 인프라 정보:');
        console.log(`  급수방식: ${item.codeWsupply || '정보없음'}`);
        console.log(`  통신시설: ${item.codeNet || '정보없음'}`);
        console.log(`  승강기업체: ${item.codeElev || '정보없음'}`);
        console.log(`  승강기수: ${item.kaptdEcnt || '정보없음'}대`);
        console.log(`  승강기용량: ${item.kaptdEcapa || '정보없음'}kg`);
        
        // 기타 시설
        console.log('\n⚡ 기타 시설:');
        console.log(`  지상 전기차충전기: ${item.groundElChargerCnt || '정보없음'}대`);
        console.log(`  지하 전기차충전기: ${item.undergroundElChargerCnt || '정보없음'}대`);
        console.log(`  관리사무소: ${item.kaptMgrCnt || '정보없음'}개소`);
        console.log(`  청소관리: ${item.codeClean || '정보없음'}`);
        console.log(`  소독관리: ${item.codeDisinf || '정보없음'}`);
        
        return item;
      }
    } else {
      console.log(`❌ ${apartmentName} 상세정보 없음: ${jsonData.response?.header?.resultMsg}`);
    }
    
  } catch (error) {
    console.log(`❌ ${apartmentName} 상세정보 오류: ${error.message}`);
  }
  
  return null;
}

async function checkMultipleApartments() {
  const apartments = [
    { code: 'A10026207', name: '서울숲리버뷰자이아파트' },
    { code: 'A13307001', name: '행당두산' },
    { code: 'A13307002', name: '서울숲행당푸르지오' }
  ];
  
  for (const apt of apartments) {
    await getDetailInfo(apt.code, apt.name);
    
    // API 호출 간격
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

checkMultipleApartments().then(() => {
  console.log('\n🎉 모든 아파트 상세정보 확인 완료!');
  process.exit(0);
}).catch(error => {
  console.error('❌ 오류:', error);
  process.exit(1);
});