const API_KEY = 'EAl5DDYH6Ixz5ZpCY40/DTEDqkFXTG2Utgr5YJQkusuQyugyb80K+qVwRG2ZpceMiCIXqwFWmGpJRHeu7s8JUA==';
const INDIVIDUAL_COST_BASE_URL = 'https://apis.data.go.kr/1613000/AptIndvdlzManageCostServiceV2';

async function testIndividualEndpoints() {
  const kaptCode = 'A13376906';
  const searchDate = '202301';
  const encodedKey = encodeURIComponent(API_KEY);
  
  const endpoints = [
    { name: '생활폐기물수수료', url: 'getHsmpDomesticWasteFeeInfoV2', service: 'individual' },
    { name: '입주자대표회의운영비', url: 'getHsmpMovingInRepresentationMtgInfoV2', service: 'individual' },
    { name: '건물보험료', url: 'getHsmpBuildingInsuranceFeeInfoV2', service: 'individual' },
    { name: '선거관리위원회운영비', url: 'getHsmpElectionOrpnsInfoV2', service: 'individual' },
    { name: '정화조오물수수료', url: 'getHsmpWaterPurifierTankFeeInfoV2', service: 'individual' }
  ];
  
  console.log('Testing endpoints in INDIVIDUAL service...\n');
  
  for (const endpoint of endpoints) {
    const url = `${INDIVIDUAL_COST_BASE_URL}/${endpoint.url}?serviceKey=${encodedKey}&kaptCode=${kaptCode}&searchDate=${searchDate}&type=json`;
    console.log(`Testing ${endpoint.name} in INDIVIDUAL service...`);
    
    try {
      const response = await fetch(url);
      const text = await response.text();
      console.log('Response status:', response.status);
      
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
          console.log(`   Values:`, values);
        } else if (json.response?.header) {
          console.log(`⚠️ ${endpoint.name} - Header:`, json.response.header);
        } else {
          console.log(`❌ ${endpoint.name} - No item data`);
        }
      } catch (parseError) {
        console.log(`❌ ${endpoint.name} - Response:`, text.substring(0, 200));
      }
    } catch (error) {
      console.log(`❌ ${endpoint.name} - Fetch error:`, error.message);
    }
    console.log('');
  }
}

testIndividualEndpoints();