const API_KEY = 'EAl5DDYH6Ixz5ZpCY40/DTEDqkFXTG2Utgr5YJQkusuQyugyb80K+qVwRG2ZpceMiCIXqwFWmGpJRHeu7s8JUA==';
const COMMON_COST_BASE_URL = 'https://apis.data.go.kr/1613000/AptCmnuseManageCostServiceV2';

async function testAllManagementFees() {
  const kaptCode = 'A13376906';
  const searchDate = '202301';
  const encodedKey = encodeURIComponent(API_KEY);
  
  const endpoints = [
    { name: '인건비', url: 'getHsmpPersonnelCostInfoV2' },
    { name: '제세공과금', url: 'getHsmpTaxesUtilitiesCostInfoV2' },
    { name: '제사무비', url: 'getHsmpOfficeExpensesCostInfoV2' },
    { name: '피복비', url: 'getHsmpUniformCostInfoV2' },
    { name: '교육훈련비', url: 'getHsmpTrainingCostInfoV2' },
    { name: '지능형홈네트워크설비유지비', url: 'getHsmpSmartHomeCostInfoV2' },
    { name: '안전점검비', url: 'getHsmpSafetyInspectionCostInfoV2' },
    { name: '재해예방비', url: 'getHsmpDisasterPreventionCostInfoV2' },
    { name: '위탁관리수수료', url: 'getHsmpConsignmentCostInfoV2' },
    { name: '기타부대비용', url: 'getHsmpOtherExpensesCostInfoV2' }
  ];
  
  for (const endpoint of endpoints) {
    const url = `${COMMON_COST_BASE_URL}/${endpoint.url}?serviceKey=${encodedKey}&kaptCode=${kaptCode}&searchDate=${searchDate}&type=json`;
    console.log(`\nTesting ${endpoint.name}...`);
    console.log(`URL: ${endpoint.url}`);
    
    try {
      const response = await fetch(url);
      const text = await response.text();
      
      try {
        const json = JSON.parse(text);
        if (json.response?.body?.item) {
          console.log(`✅ Success - Available fields:`, Object.keys(json.response.body.item));
          console.log('Sample data:', json.response.body.item);
        } else if (json.response?.header?.resultCode !== '00') {
          console.log(`⚠️ API error:`, json.response?.header);
        } else {
          console.log('❌ No data available');
        }
      } catch (parseError) {
        if (text.includes('SERVICE_KEY_IS_NOT_REGISTERED_ERROR')) {
          console.log('❌ API key error');
        } else {
          console.log('❌ Parse error:', text.substring(0, 100));
        }
      }
    } catch (error) {
      console.log('❌ Fetch error:', error.message);
    }
  }
}

testAllManagementFees();