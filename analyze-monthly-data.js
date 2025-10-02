const API_KEY = 'EAl5DDYH6Ixz5ZpCY40/DTEDqkFXTG2Utgr5YJQkusuQyugyb80K+qVwRG2ZpceMiCIXqwFWmGpJRHeu7s8JUA==';
const COMMON_COST_BASE_URL = 'https://apis.data.go.kr/1613000/AptCmnuseManageCostServiceV2';
const INDIVIDUAL_COST_BASE_URL = 'https://apis.data.go.kr/1613000/AptIndvdlzManageCostServiceV2';

async function analyzeMonthlyData() {
  const kaptCode = 'A13376906';
  const year = 2023;
  const encodedKey = encodeURIComponent(API_KEY);
  
  console.log('응봉대림강변 2023년 월별 데이터 가용성 분석...\n');
  
  // 공용관리비 엔드포인트
  const commonEndpoints = [
    { name: '청소비', url: 'getHsmpCleaningCostInfoV2', key: 'cleanCost' },
    { name: '경비비', url: 'getHsmpGuardCostInfoV2', key: 'guardCost' },
    { name: '소독비', url: 'getHsmpDisinfectionCostInfoV2', key: 'disinfCost' },
    { name: '승강기유지비', url: 'getHsmpElevatorMntncCostInfoV2', key: 'elevCost' },
    { name: '수선비', url: 'getHsmpRepairsCostInfoV2', key: 'lrefCost1' },
    { name: '시설유지비', url: 'getHsmpFacilityMntncCostInfoV2', key: 'lrefCost2' },
    { name: '차량유지비', url: 'getHsmpVhcleMntncCostInfoV2', key: 'fuelCost' },
    { name: '재해예방비', url: 'getHsmpDisasterPreventionCostInfoV2', key: 'lrefCost4' },
    { name: '인건비', url: 'getHsmpLaborCostInfoV2', key: 'pay' },
    { name: '제세공과금', url: 'getHsmpTaxdueInfoV2', key: 'telCost' }
  ];
  
  // 개별사용료 엔드포인트
  const individualEndpoints = [
    { name: '전기료', url: 'getHsmpElectricityCostInfoV2', key: 'electC', service: 'individual' },
    { name: '수도료', url: 'getHsmpWaterCostInfoV2', key: 'waterCoolC', service: 'individual' },
    { name: '난방비', url: 'getHsmpHeatCostInfoV2', key: 'heatC', service: 'individual' },
    { name: '가스사용료', url: 'getHsmpGasRentalFeeInfoV2', key: 'gasC', service: 'individual' },
    { name: '생활폐기물수수료', url: 'getHsmpDomesticWasteFeeInfoV2', key: 'scrap', service: 'individual' }
  ];
  
  // 월별 데이터 확인
  for (let month = 1; month <= 12; month++) {
    const searchDate = `${year}${month.toString().padStart(2, '0')}`;
    console.log(`\\n=== ${month}월 데이터 가용성 ===`);
    
    let commonTotal = 0;
    let individualTotal = 0;
    let availableCommon = 0;
    let availableIndividual = 0;
    
    // 공용관리비 확인
    console.log('\\n공용관리비:');
    for (const endpoint of commonEndpoints) {
      const url = `${COMMON_COST_BASE_URL}/${endpoint.url}?serviceKey=${encodedKey}&kaptCode=${kaptCode}&searchDate=${searchDate}&type=json`;
      
      try {
        const response = await fetch(url);
        const json = await response.json();
        
        if (json.response?.body?.item) {
          const value = parseInt(json.response.body.item[endpoint.key] || 0);
          if (value > 0) {
            console.log(`  ✅ ${endpoint.name}: ${value.toLocaleString()}원`);
            commonTotal += value;
            availableCommon++;
          } else {
            console.log(`  🔸 ${endpoint.name}: 0원`);
            availableCommon++;
          }
        } else {
          console.log(`  ❌ ${endpoint.name}: 데이터 없음`);
        }
      } catch (error) {
        console.log(`  ❌ ${endpoint.name}: 에러`);
      }
    }
    
    // 개별사용료 확인
    console.log('\\n개별사용료:');
    for (const endpoint of individualEndpoints) {
      const url = `${INDIVIDUAL_COST_BASE_URL}/${endpoint.url}?serviceKey=${encodedKey}&kaptCode=${kaptCode}&searchDate=${searchDate}&type=json`;
      
      try {
        const response = await fetch(url);
        const json = await response.json();
        
        if (json.response?.body?.item) {
          const value = parseInt(json.response.body.item[endpoint.key] || 0);
          if (value > 0) {
            console.log(`  ✅ ${endpoint.name}: ${value.toLocaleString()}원`);
            individualTotal += value;
            availableIndividual++;
          } else {
            console.log(`  🔸 ${endpoint.name}: 0원`);
            availableIndividual++;
          }
        } else {
          console.log(`  ❌ ${endpoint.name}: 데이터 없음`);
        }
      } catch (error) {
        console.log(`  ❌ ${endpoint.name}: 에러`);
      }
    }
    
    console.log(`\\n${month}월 요약:`);
    console.log(`- 공용관리비: ${commonTotal.toLocaleString()}원 (${availableCommon}/${commonEndpoints.length}개 엔드포인트)`);
    console.log(`- 개별사용료: ${individualTotal.toLocaleString()}원 (${availableIndividual}/${individualEndpoints.length}개 엔드포인트)`);
    console.log(`- 총합: ${(commonTotal + individualTotal).toLocaleString()}원`);
  }
}

analyzeMonthlyData();