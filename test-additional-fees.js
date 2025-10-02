const API_KEY = 'EAl5DDYH6Ixz5ZpCY40/DTEDqkFXTG2Utgr5YJQkusuQyugyb80K+qVwRG2ZpceMiCIXqwFWmGpJRHeu7s8JUA==';
const COMMON_COST_BASE_URL = 'https://apis.data.go.kr/1613000/AptCmnuseManageCostServiceV2';

async function testAdditionalFees() {
  const kaptCode = 'A13376906';
  const searchDate = '202301';
  const encodedKey = encodeURIComponent(API_KEY);
  
  // 실제로 존재할 가능성이 높은 API 엔드포인트들
  const endpoints = [
    { name: '일반관리비', url: 'getHsmpGeneralMntncCostInfoV2' },
    { name: '안전관리비', url: 'getHsmpSafetyMntncCostInfoV2' },
    { name: '위탁관리비', url: 'getHsmpAgencyMntncCostInfoV2' },
    { name: '부대시설충당금', url: 'getHsmpFacilityProvisionCostInfoV2' },
    { name: '장기수선충당금', url: 'getHsmpLrepProvisionCostInfoV2' }
  ];
  
  console.log('Testing additional fee endpoints...\n');
  
  for (const endpoint of endpoints) {
    const url = `${COMMON_COST_BASE_URL}/${endpoint.url}?serviceKey=${encodedKey}&kaptCode=${kaptCode}&searchDate=${searchDate}&type=json`;
    console.log(`Testing ${endpoint.name}...`);
    
    try {
      const response = await fetch(url);
      const text = await response.text();
      
      try {
        const json = JSON.parse(text);
        if (json.response?.body?.item) {
          console.log(`✅ ${endpoint.name} - Fields:`, Object.keys(json.response.body.item));
          const values = {};
          for (const key of Object.keys(json.response.body.item)) {
            if (!['kaptCode', 'kaptName'].includes(key)) {
              values[key] = json.response.body.item[key];
            }
          }
          console.log(`   Values:`, values);
        } else {
          console.log(`❌ ${endpoint.name} - No data or error`);
        }
      } catch (parseError) {
        console.log(`❌ ${endpoint.name} - Not available`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint.name} - Fetch error:`, error.message);
    }
  }
  
  console.log('\n\nTesting already working endpoints to find all fields...');
  
  const workingEndpoints = [
    { name: '청소비', url: 'getHsmpCleaningCostInfoV2' },
    { name: '경비비', url: 'getHsmpGuardCostInfoV2' },
    { name: '소독비', url: 'getHsmpDisinfectionCostInfoV2' },
    { name: '수선비', url: 'getHsmpRepairsCostInfoV2' },
    { name: '시설유지비', url: 'getHsmpFacilityMntncCostInfoV2' }
  ];
  
  for (const endpoint of workingEndpoints) {
    const url = `${COMMON_COST_BASE_URL}/${endpoint.url}?serviceKey=${encodedKey}&kaptCode=${kaptCode}&searchDate=${searchDate}&type=json`;
    
    try {
      const response = await fetch(url);
      const json = await response.json();
      if (json.response?.body?.item) {
        console.log(`\n${endpoint.name} fields:`, Object.keys(json.response.body.item));
        const values = {};
        for (const key of Object.keys(json.response.body.item)) {
          if (!['kaptCode', 'kaptName'].includes(key)) {
            values[key] = json.response.body.item[key];
          }
        }
        console.log(`Values:`, values);
      }
    } catch (error) {
      console.log(`Error with ${endpoint.name}:`, error.message);
    }
  }
}

testAdditionalFees();