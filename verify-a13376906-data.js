const API_KEY = 'EAl5DDYH6Ixz5ZpCY40/DTEDqkFXTG2Utgr5YJQkusuQyugyb80K+qVwRG2ZpceMiCIXqwFWmGpJRHeu7s8JUA==';
const COMMON_COST_BASE_URL = 'https://apis.data.go.kr/1613000/AptCmnuseManageCostServiceV2';
const INDIVIDUAL_COST_BASE_URL = 'https://apis.data.go.kr/1613000/AptIndvdlzManageCostServiceV2';

async function verifyA13376906Data() {
  const kaptCode = 'A13376906';
  const searchDate = '202401';
  const encodedKey = encodeURIComponent(API_KEY);
  
  console.log('응봉대림강변 2024년 1월 상세 계산 검증...\n');
  
  // 주요 엔드포인트들만 테스트
  const endpoints = [
    { name: '청소비', url: 'getHsmpCleaningCostInfoV2', key: 'cleanCost', service: 'common' },
    { name: '경비비', url: 'getHsmpGuardCostInfoV2', key: 'guardCost', service: 'common' },
    { name: '인건비', url: 'getHsmpLaborCostInfoV2', key: 'pay', service: 'common' },
    { name: '제세공과금', url: 'getHsmpTaxdueInfoV2', key: 'telCost', service: 'common' },
    { name: '전기료', url: 'getHsmpElectricityCostInfoV2', key: 'electC', service: 'individual' },
    { name: '수도료', url: 'getHsmpWaterCostInfoV2', key: 'waterCoolC', service: 'individual' },
    { name: '난방비', url: 'getHsmpHeatCostInfoV2', key: 'heatC', service: 'individual' }
  ];
  
  let totalCommon = 0;
  let totalIndividual = 0;
  
  for (const endpoint of endpoints) {
    const baseUrl = endpoint.service === 'common' ? COMMON_COST_BASE_URL : INDIVIDUAL_COST_BASE_URL;
    const url = `${baseUrl}/${endpoint.url}?serviceKey=${encodedKey}&kaptCode=${kaptCode}&searchDate=${searchDate}&type=json`;
    
    try {
      const response = await fetch(url);
      const json = await response.json();
      
      if (json.response?.body?.item) {
        const item = json.response.body.item;
        const value = parseInt(item[endpoint.key] || 0);
        
        console.log(`${endpoint.name} (${endpoint.service}): ${value.toLocaleString()}원`);
        console.log(`  - API URL: ${endpoint.url}`);
        console.log(`  - 필드명: ${endpoint.key}`);
        console.log(`  - 원시값: ${item[endpoint.key]}`);
        
        if (endpoint.service === 'common') {
          totalCommon += value;
        } else {
          totalIndividual += value;
        }
      } else {
        console.log(`${endpoint.name}: 데이터 없음 - ${json.response?.header?.resultMsg || '알수없음'}`);
      }
    } catch (error) {
      console.log(`${endpoint.name}: 에러 - ${error.message}`);
    }
    console.log('');
  }
  
  console.log('=== 2024년 1월 요약 ===');
  console.log(`공용관리비: ${totalCommon.toLocaleString()}원`);
  console.log(`개별사용료: ${totalIndividual.toLocaleString()}원`);
  console.log(`총 관리비: ${(totalCommon + totalIndividual).toLocaleString()}원`);
  
  // 현재 API가 반환하는 값과 비교
  console.log('\n=== API 비교 테스트 ===');
  try {
    const apiResponse = await fetch(`http://localhost:3002/api/management-fees/A13376906?year=2024`);
    const apiData = await apiResponse.json();
    
    if (apiData.monthlyData && apiData.monthlyData.length > 0) {
      const janData = apiData.monthlyData.find(m => m.month === 1);
      if (janData) {
        console.log(`API 공용관리비: ${janData.commonFee.toLocaleString()}원`);
        console.log(`API 개별사용료: ${janData.individualFee.toLocaleString()}원`);
        console.log(`API 총 관리비: ${janData.totalFee.toLocaleString()}원`);
        
        console.log('\n=== 차이 분석 ===');
        console.log(`공용관리비 차이: ${(janData.commonFee - totalCommon).toLocaleString()}원`);
        console.log(`개별사용료 차이: ${(janData.individualFee - totalIndividual).toLocaleString()}원`);
        console.log(`총 관리비 차이: ${(janData.totalFee - (totalCommon + totalIndividual)).toLocaleString()}원`);
      } else {
        console.log('API에서 1월 데이터를 찾을 수 없음');
      }
    } else {
      console.log('API에서 월별 데이터를 찾을 수 없음');
    }
  } catch (error) {
    console.log(`API 테스트 에러: ${error.message}`);
  }
}

verifyA13376906Data();