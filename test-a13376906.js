const API_KEY = 'EAl5DDYH6Ixz5ZpCY40/DTEDqkFXTG2Utgr5YJQkusuQyugyb80K+qVwRG2ZpceMiCIXqwFWmGpJRHeu7s8JUA==';

async function testA13376906() {
  const kaptCode = 'A13376906';
  const searchDate = '202301';

  console.log('🔍 Testing A13376906 management fee data...');

  try {
    // Test cleaning cost API
    const cleaningUrl = `https://apis.data.go.kr/1613000/AptCmnuseManageCostServiceV2/getHsmpCleaningCostInfoV2?serviceKey=${encodeURIComponent(API_KEY)}&kaptCode=${kaptCode}&searchDate=${searchDate}&type=json`;

    console.log('Calling cleaning API:', cleaningUrl);

    const response = await fetch(cleaningUrl);
    const text = await response.text();

    console.log('Response status:', response.status);
    console.log('Response (first 500 chars):', text.substring(0, 500));

    if (!text.includes('<')) {
      try {
        const data = JSON.parse(text);
        console.log('JSON Response:');
        console.log('Header:', JSON.stringify(data.response?.header, null, 2));
        console.log('Body:', JSON.stringify(data.response?.body, null, 2));

        if (data.response?.body?.item) {
          console.log('✅ Data found!');
          console.log('Cleaning cost:', data.response.body.item.cleanC);
        } else {
          console.log('❌ No data in response');
        }
      } catch (e) {
        console.log('JSON parse error:', e.message);
      }
    }

    // Test individual heating cost API
    console.log('\n🔥 Testing heating cost API...');
    const heatUrl = `https://apis.data.go.kr/1613000/AptIndvdlzManageCostServiceV2/getHsmpHeatCostInfoV2?serviceKey=${encodeURIComponent(API_KEY)}&kaptCode=${kaptCode}&searchDate=${searchDate}&type=json`;

    console.log('Calling heating API:', heatUrl);

    const heatResponse = await fetch(heatUrl);
    const heatText = await heatResponse.text();

    console.log('Heat Response status:', heatResponse.status);
    console.log('Heat Response (first 500 chars):', heatText.substring(0, 500));

    if (!heatText.includes('<')) {
      try {
        const heatData = JSON.parse(heatText);
        console.log('Heat JSON Response:');
        console.log('Header:', JSON.stringify(heatData.response?.header, null, 2));
        console.log('Body:', JSON.stringify(heatData.response?.body, null, 2));

        if (heatData.response?.body?.item) {
          console.log('✅ Heat data found!');
          console.log('Heat cost:', heatData.response.body.item.heatC);
          console.log('Heat price:', heatData.response.body.item.heatP);
        } else {
          console.log('❌ No heat data in response');
        }
      } catch (e) {
        console.log('Heat JSON parse error:', e.message);
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testA13376906();