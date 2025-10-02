const API_KEY = 'EAl5DDYH6Ixz5ZpCY40/DTEDqkFXTG2Utgr5YJQkusuQyugyb80K+qVwRG2ZpceMiCIXqwFWmGpJRHeu7s8JUA==';

async function testManagementAPI() {
  try {
    console.log('🔍 테스트용 관리비 API 호출...');

    // 샘플 단지코드들 (실제 존재하는 단지들)
    const testCodes = ['11110000001', '11170000002', '11710000001'];

    for (const kaptCode of testCodes) {
      console.log(`\n📋 단지코드: ${kaptCode} 테스트 중...`);

      // 공용관리비 API 테스트
      const url = `https://apis.data.go.kr/1613000/AptCmnuseManageCostServiceV2/getHsmpGeneralManageCostInfoV2?serviceKey=${API_KEY}&kaptCode=${kaptCode}&searchDate=202301&type=json`;

      const response = await fetch(url);
      const text = await response.text();

      console.log('응답 내용 (첫 200자):', text.substring(0, 200));

      if (text.includes('<')) {
        console.log('❌ XML 오류 응답');
      } else {
        try {
          const data = JSON.parse(text);
          console.log('✅ JSON 응답 성공');
          console.log('헤더:', data.response?.header);
          console.log('데이터:', data.response?.body?.item ? '데이터 있음' : '데이터 없음');
        } catch (e) {
          console.log('❌ JSON 파싱 실패');
        }
      }
    }

    // 개별사용료 API 테스트
    console.log('\n🔍 개별사용료 API 테스트...');
    const individualUrl = `https://apis.data.go.kr/1613000/AptIndvdlzManageCostServiceV2/getHsmpHeatCostInfoV2?serviceKey=${API_KEY}&kaptCode=11110000001&searchDate=202301&type=json`;

    const individualResponse = await fetch(individualUrl);
    const individualText = await individualResponse.text();

    console.log('개별사용료 응답 (첫 200자):', individualText.substring(0, 200));

  } catch (error) {
    console.error('❌ API 테스트 실패:', error.message);
  }
}

testManagementAPI();