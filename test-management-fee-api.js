const API_KEY = 'EAl5DDYH6Ixz5ZpCY40/DTEDqkFXTG2Utgr5YJQkusuQyugyb80K+qVwRG2ZpceMiCIXqwFWmGpJRHeu7s8JUA==';
const COMMON_COST_BASE_URL = 'https://apis.data.go.kr/1613000/AptCmnuseManageCostServiceV2';

async function testAPI() {
  const kaptCode = 'A13376906';
  const searchDate = '202301';
  
  // Encode the API key properly
  const encodedKey = encodeURIComponent(API_KEY);
  const url = `${COMMON_COST_BASE_URL}/getHsmpCleaningCostInfoV2?serviceKey=${encodedKey}&kaptCode=${kaptCode}&searchDate=${searchDate}&type=json`;
  
  console.log('Testing URL:', url);
  
  try {
    const response = await fetch(url);
    const text = await response.text();
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    console.log('Response text (first 500 chars):', text.substring(0, 500));
    
    // Try to parse as JSON
    try {
      const json = JSON.parse(text);
      console.log('Parsed JSON:', JSON.stringify(json, null, 2));
    } catch (parseError) {
      console.log('Failed to parse as JSON:', parseError.message);
    }
  } catch (error) {
    console.error('Error fetching:', error);
  }
}

testAPI();