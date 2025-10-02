const API_KEY = 'EAl5DDYH6Ixz5ZpCY40/DTEDqkFXTG2Utgr5YJQkusuQyugyb80K+qVwRG2ZpceMiCIXqwFWmGpJRHeu7s8JUA==';

async function testFieldNames() {
  const kaptCode = 'A13376906';
  const searchDate = '202301';

  console.log('🔍 Testing field names for different APIs...');

  const apis = [
    {
      name: 'Cleaning',
      url: `https://apis.data.go.kr/1613000/AptCmnuseManageCostServiceV2/getHsmpCleaningCostInfoV2?serviceKey=${encodeURIComponent(API_KEY)}&kaptCode=${kaptCode}&searchDate=${searchDate}&type=json`
    },
    {
      name: 'Guard',
      url: `https://apis.data.go.kr/1613000/AptCmnuseManageCostServiceV2/getHsmpGuardCostInfoV2?serviceKey=${encodeURIComponent(API_KEY)}&kaptCode=${kaptCode}&searchDate=${searchDate}&type=json`
    },
    {
      name: 'Vehicle',
      url: `https://apis.data.go.kr/1613000/AptCmnuseManageCostServiceV2/getHsmpVhcleMntncCostInfoV2?serviceKey=${encodeURIComponent(API_KEY)}&kaptCode=${kaptCode}&searchDate=${searchDate}&type=json`
    },
    {
      name: 'Heat',
      url: `https://apis.data.go.kr/1613000/AptIndvdlzManageCostServiceV2/getHsmpHeatCostInfoV2?serviceKey=${encodeURIComponent(API_KEY)}&kaptCode=${kaptCode}&searchDate=${searchDate}&type=json`
    },
    {
      name: 'Water',
      url: `https://apis.data.go.kr/1613000/AptIndvdlzManageCostServiceV2/getHsmpWaterCostInfoV2?serviceKey=${encodeURIComponent(API_KEY)}&kaptCode=${kaptCode}&searchDate=${searchDate}&type=json`
    }
  ];

  for (const api of apis) {
    try {
      console.log(`\n📋 Testing ${api.name} API...`);
      const response = await fetch(api.url);
      const text = await response.text();

      if (!text.includes('<')) {
        try {
          const data = JSON.parse(text);
          console.log(`${api.name} fields:`, Object.keys(data.response?.body?.item || {}));
          console.log(`${api.name} data:`, JSON.stringify(data.response?.body?.item, null, 2));
        } catch (e) {
          console.log(`${api.name} JSON parse error:`, e.message);
        }
      } else {
        console.log(`${api.name} returned XML error`);
      }
    } catch (error) {
      console.log(`${api.name} error:`, error.message);
    }
  }
}

testFieldNames();