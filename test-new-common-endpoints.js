const API_KEY = 'EAl5DDYH6Ixz5ZpCY40/DTEDqkFXTG2Utgr5YJQkusuQyugyb80K+qVwRG2ZpceMiCIXqwFWmGpJRHeu7s8JUA==';
const COMMON_COST_BASE_URL = 'https://apis.data.go.kr/1613000/AptCmnuseManageCostServiceV2';

async function testNewCommonEndpoints() {
  const kaptCode = 'A13376906';
  const searchDate = '202301';
  const encodedKey = encodeURIComponent(API_KEY);
  
  const newEndpoints = [
    { name: '기타 부대비용', url: 'getHsmpEtcCostInfoV2' },
    { name: '제사무비', url: 'getHsmpOfcrkCostInfoV2' },
    { name: '피복비', url: 'getHsmpClothingCostInfoV2' },
    { name: '교육훈련비', url: 'getHsmpEduTraingCostInfoV2' },
    { name: '지능형 홈네트워크 설비 유지비', url: 'getHsmpHomeNetworkMntncCostInfoV2' },
    { name: '안전점검비', url: 'getHsmpSafetyCheckUpCostInfoV2' },
    { name: '위탁관리 수수료', url: 'getHsmpConsignManageFeeInfoV2' },
    { name: '인건비', url: 'getHsmpLaborCostInfoV2' },
    { name: '제세공과금', url: 'getHsmpTaxdueInfoV2' }
  ];
  
  console.log('Testing new common management fee endpoints...\n');
  
  for (const endpoint of newEndpoints) {
    const url = `${COMMON_COST_BASE_URL}/${endpoint.url}?serviceKey=${encodedKey}&kaptCode=${kaptCode}&searchDate=${searchDate}&type=json`;
    console.log(`Testing ${endpoint.name}...`);
    
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

testNewCommonEndpoints();