const API_KEY = 'EAl5DDYH6Ixz5ZpCY40/DTEDqkFXTG2Utgr5YJQkusuQyugyb80K+qVwRG2ZpceMiCIXqwFWmGpJRHeu7s8JUA==';
const COMMON_COST_BASE_URL = 'https://apis.data.go.kr/1613000/AptCmnuseManageCostServiceV2';
const INDIVIDUAL_COST_BASE_URL = 'https://apis.data.go.kr/1613000/AptIndvdlzManageCostServiceV2';

async function analyzeMonthlySuccessRates() {
  const kaptCode = 'A13376906';
  const year = 2024;
  const encodedKey = encodeURIComponent(API_KEY);
  
  console.log('응봉대림강변 2024년 월별 성공률 및 관리비 분석...\n');
  
  // 17개 공용관리비 엔드포인트
  const commonEndpoints = [
    { name: '청소비', url: 'getHsmpCleaningCostInfoV2', key: 'cleanCost' },
    { name: '경비비', url: 'getHsmpGuardCostInfoV2', key: 'guardCost' },
    { name: '소독비', url: 'getHsmpDisinfectionCostInfoV2', key: 'disinfCost' },
    { name: '승강기유지비', url: 'getHsmpElevatorMntncCostInfoV2', key: 'elevCost' },
    { name: '수선비', url: 'getHsmpRepairsCostInfoV2', key: 'lrefCost1' },
    { name: '시설유지비', url: 'getHsmpFacilityMntncCostInfoV2', key: 'lrefCost2' },
    { name: '차량유지비', url: 'getHsmpVhcleMntncCostInfoV2', key: 'fuelCost' },
    { name: '재해예방비', url: 'getHsmpDisasterPreventionCostInfoV2', key: 'lrefCost4' },
    { name: '기타부대비용', url: 'getHsmpEtcCostInfoV2', key: 'careItemCost' },
    { name: '제사무비', url: 'getHsmpOfcrkCostInfoV2', key: 'officeSupply' },
    { name: '피복비', url: 'getHsmpClothingCostInfoV2', key: 'clothesCost' },
    { name: '교육훈련비', url: 'getHsmpEduTraingCostInfoV2', key: 'eduCost' },
    { name: '지능형홈네트워크설비유지비', url: 'getHsmpHomeNetworkMntncCostInfoV2', key: 'hnetwCost' },
    { name: '안전점검비', url: 'getHsmpSafetyCheckUpCostInfoV2', key: 'lrefCost3' },
    { name: '위탁관리수수료', url: 'getHsmpConsignManageFeeInfoV2', key: 'manageCost' },
    { name: '인건비', url: 'getHsmpLaborCostInfoV2', key: 'pay' },
    { name: '제세공과금', url: 'getHsmpTaxdueInfoV2', key: 'telCost' }
  ];

  // 10개 개별사용료 엔드포인트
  const individualEndpoints = [
    { name: '난방비', url: 'getHsmpHeatCostInfoV2', key: 'heatC' },
    { name: '급탕비', url: 'getHsmpHotWaterCostInfoV2', key: 'waterHotC' },
    { name: '전기료', url: 'getHsmpElectricityCostInfoV2', key: 'electC' },
    { name: '수도료', url: 'getHsmpWaterCostInfoV2', key: 'waterCoolC' },
    { name: '가스사용료', url: 'getHsmpGasRentalFeeInfoV2', key: 'gasC' },
    { name: '생활폐기물수수료', url: 'getHsmpDomesticWasteFeeInfoV2', key: 'scrap' },
    { name: '입주자대표회의운영비', url: 'getHsmpMovingInRepresentationMtgInfoV2', key: 'preMeet' },
    { name: '건물보험료', url: 'getHsmpBuildingInsuranceFeeInfoV2', key: 'buildInsu' },
    { name: '선거관리위원회운영비', url: 'getHsmpElectionOrpnsInfoV2', key: 'electionMng' },
    { name: '정화조오물수수료', url: 'getHsmpWaterPurifierTankFeeInfoV2', key: 'purifi' }
  ];

  const monthlyResults = [];

  // 각 월별로 분석
  for (let month = 1; month <= 12; month++) {
    const searchDate = `${year}${month.toString().padStart(2, '0')}`;
    console.log(`\n=== ${month}월 (${searchDate}) ===`);
    
    let commonSuccessCount = 0;
    let commonTotal = 0;
    let individualSuccessCount = 0;
    let individualTotal = 0;
    let failedEndpoints = [];

    // 공용관리비 확인
    for (const endpoint of commonEndpoints) {
      const url = `${COMMON_COST_BASE_URL}/${endpoint.url}?serviceKey=${encodedKey}&kaptCode=${kaptCode}&searchDate=${searchDate}&type=json`;
      
      try {
        const response = await fetch(url);
        const json = await response.json();
        
        if (json.response?.body?.item && json.response?.header?.resultCode === '00') {
          const value = parseInt(json.response.body.item[endpoint.key] || 0);
          commonTotal += value;
          commonSuccessCount++;
          
          if (value > 0) {
            console.log(`  ✅ ${endpoint.name}: ${value.toLocaleString()}원`);
          }
        } else {
          console.log(`  ❌ ${endpoint.name}: 실패 (${json.response?.header?.resultMsg || '데이터없음'})`);
          failedEndpoints.push(`${endpoint.name}(공용)`);
        }
      } catch (error) {
        console.log(`  ❌ ${endpoint.name}: 네트워크 에러`);
        failedEndpoints.push(`${endpoint.name}(공용-네트워크)`);
      }
    }

    // 개별사용료 확인
    for (const endpoint of individualEndpoints) {
      const url = `${INDIVIDUAL_COST_BASE_URL}/${endpoint.url}?serviceKey=${encodedKey}&kaptCode=${kaptCode}&searchDate=${searchDate}&type=json`;
      
      try {
        const response = await fetch(url);
        const json = await response.json();
        
        if (json.response?.body?.item && json.response?.header?.resultCode === '00') {
          const value = parseInt(json.response.body.item[endpoint.key] || 0);
          individualTotal += value;
          individualSuccessCount++;
          
          if (value > 0) {
            console.log(`  ✅ ${endpoint.name}: ${value.toLocaleString()}원`);
          }
        } else {
          console.log(`  ❌ ${endpoint.name}: 실패 (${json.response?.header?.resultMsg || '데이터없음'})`);
          failedEndpoints.push(`${endpoint.name}(개별)`);
        }
      } catch (error) {
        console.log(`  ❌ ${endpoint.name}: 네트워크 에러`);
        failedEndpoints.push(`${endpoint.name}(개별-네트워크)`);
      }
    }

    const totalEndpoints = commonEndpoints.length + individualEndpoints.length;
    const successfulEndpoints = commonSuccessCount + individualSuccessCount;
    const successRate = ((successfulEndpoints / totalEndpoints) * 100).toFixed(1);
    const totalFee = commonTotal + individualTotal;

    console.log(`\n📊 ${month}월 결과:`);
    console.log(`  성공률: ${successRate}% (${successfulEndpoints}/${totalEndpoints})`);
    console.log(`  공용관리비: ${commonTotal.toLocaleString()}원 (${commonSuccessCount}/${commonEndpoints.length})`);
    console.log(`  개별사용료: ${individualTotal.toLocaleString()}원 (${individualSuccessCount}/${individualEndpoints.length})`);
    console.log(`  총 관리비: ${totalFee.toLocaleString()}원`);
    
    if (failedEndpoints.length > 0) {
      console.log(`  실패한 엔드포인트: ${failedEndpoints.join(', ')}`);
    }

    monthlyResults.push({
      month,
      searchDate,
      commonTotal,
      individualTotal,
      totalFee,
      successRate: parseFloat(successRate),
      commonSuccessCount,
      individualSuccessCount,
      failedEndpoints: failedEndpoints.length
    });
  }

  // 전체 요약
  console.log(`\n${'='.repeat(80)}`);
  console.log('🎯 전체 요약');
  console.log(`${'='.repeat(80)}`);
  
  monthlyResults.forEach(result => {
    console.log(`${result.month.toString().padStart(2)}월: ${result.totalFee.toLocaleString().padStart(12)}원 (성공률: ${result.successRate.toString().padStart(5)}%, 실패: ${result.failedEndpoints}개)`);
  });

  // 문제가 있는 월 식별
  const avgFee = monthlyResults.reduce((sum, r) => sum + r.totalFee, 0) / monthlyResults.length;
  const problematicMonths = monthlyResults.filter(r => r.totalFee < avgFee * 0.7 || r.successRate < 90);
  
  if (problematicMonths.length > 0) {
    console.log(`\n⚠️  문제가 있는 월들 (평균보다 30% 낮거나 성공률 90% 미만):`);
    problematicMonths.forEach(month => {
      console.log(`  ${month.month}월: ${month.totalFee.toLocaleString()}원 (성공률 ${month.successRate}%)`);
    });
  }
}

analyzeMonthlySuccessRates();