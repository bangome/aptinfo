const API_KEY = 'EAl5DDYH6Ixz5ZpCY40/DTEDqkFXTG2Utgr5YJQkusuQyugyb80K+qVwRG2ZpceMiCIXqwFWmGpJRHeu7s8JUA==';
const COMMON_COST_BASE_URL = 'https://apis.data.go.kr/1613000/AptCmnuseManageCostServiceV2';

async function testNewEndpoints() {
  const kaptCode = 'A13376906';
  const searchDate = '202301';
  const encodedKey = encodeURIComponent(API_KEY);
  
  const endpoints = [
    { name: '재해예방비', url: 'getHsmpDisasterPreventionCostInfoV2' },
    { name: '생활폐기물수수료', url: 'getHsmpDomesticWasteFeeInfoV2' },
    { name: '입주자대표회의운영비', url: 'getHsmpMovingInRepresentationMtgInfoV2' },
    { name: '건물보험료', url: 'getHsmpBuildingInsuranceFeeInfoV2' },
    { name: '선거관리위원회운영비', url: 'getHsmpElectionOrpnsInfoV2' },
    { name: '정화조오물수수료', url: 'getHsmpWaterPurifierTankFeeInfoV2' }
  ];
  
  console.log('Testing new management fee endpoints...\n');
  
  for (const endpoint of endpoints) {
    const url = `${COMMON_COST_BASE_URL}/${endpoint.url}?serviceKey=${encodedKey}&kaptCode=${kaptCode}&searchDate=${searchDate}&type=json`;
    console.log(`Testing ${endpoint.name}...`);
    
    try {
      const response = await fetch(url);
      const text = await response.text();
      
      try {
        const json = JSON.parse(text);
        if (json.response?.body?.item) {
          console.log(`✅ ${endpoint.name} - Available fields:`, Object.keys(json.response.body.item));
          const values = {};
          for (const key of Object.keys(json.response.body.item)) {
            if (!['kaptCode', 'kaptName'].includes(key)) {
              values[key] = json.response.body.item[key];
            }
          }
          console.log(`   Cost values:`, values);
        } else if (json.response?.header?.resultCode !== '00') {
          console.log(`⚠️ ${endpoint.name} - API error:`, json.response?.header?.resultMsg);
        } else {
          console.log(`❌ ${endpoint.name} - No data available for this date`);
        }
      } catch (parseError) {
        if (text.includes('SERVICE_KEY_IS_NOT_REGISTERED_ERROR')) {
          console.log(`❌ ${endpoint.name} - API key error`);
        } else {
          console.log(`❌ ${endpoint.name} - Parse error or endpoint doesn't exist`);
        }
      }
    } catch (error) {
      console.log(`❌ ${endpoint.name} - Fetch error:`, error.message);
    }
    console.log('');
  }
}

testNewEndpoints();