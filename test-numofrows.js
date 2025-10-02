/**
 * numOfRows 파라미터 테스트
 */

const axios = require('axios');

const SERVICE_KEY = 'EAl5DDYH6Ixz5ZpCY40/DTEDqkFXTG2Utgr5YJQkusuQyugyb80K+qVwRG2ZpceMiCIXqwFWmGpJRHeu7s8JUA==';
const API_BASE_URL = 'https://apis.data.go.kr/1613000';

async function testNumOfRows(numOfRows) {
  try {
    console.log(`🔍 numOfRows=${numOfRows} 테스트...`);
    
    const response = await axios.get(`${API_BASE_URL}/AptListService3/getTotalAptList3`, {
      params: {
        serviceKey: SERVICE_KEY,
        sigunguCd: '11110',
        numOfRows: numOfRows,
        pageNo: 1
      },
      timeout: 10000
    });
    
    const jsonData = response.data;
    const resultCode = jsonData.response?.header?.resultCode;
    const resultMsg = jsonData.response?.header?.resultMsg;
    const itemCount = Array.isArray(jsonData.response?.body?.items) ? jsonData.response.body.items.length : 0;
    
    console.log(`  📊 결과: ${resultCode} - ${resultMsg}`);
    console.log(`  📈 받은 아이템: ${itemCount}개`);
    
    return resultCode === '00';
    
  } catch (error) {
    console.log(`  ❌ 오류: ${error.message}`);
    return false;
  }
}

async function findMaxNumOfRows() {
  console.log('🚀 최대 numOfRows 찾기 테스트\n');
  
  const testValues = [1, 5, 10, 50, 100, 200, 500, 1000];
  
  for (const numOfRows of testValues) {
    const success = await testNumOfRows(numOfRows);
    
    if (!success) {
      console.log(`\n💡 결론: numOfRows 최대값은 ${testValues[testValues.indexOf(numOfRows) - 1]}인 것으로 보임`);
      break;
    }
    
    // API 호출 제한 준수
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n🎉 테스트 완료');
}

findMaxNumOfRows();