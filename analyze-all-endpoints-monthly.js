const API_KEY = 'EAl5DDYH6Ixz5ZpCY40/DTEDqkFXTG2Utgr5YJQkusuQyugyb80K+qVwRG2ZpceMiCIXqwFWmGpJRHeu7s8JUA==';
const COMMON_COST_BASE_URL = 'https://apis.data.go.kr/1613000/AptCmnuseManageCostServiceV2';
const INDIVIDUAL_COST_BASE_URL = 'https://apis.data.go.kr/1613000/AptIndvdlzManageCostServiceV2';

async function analyzeAllEndpointsMonthly() {
  const kaptCode = 'A13376906';
  const year = 2023;
  const encodedKey = encodeURIComponent(API_KEY);
  
  console.log('전체 27개 엔드포인트 월별 데이터 가용성 분석...\n');
  
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
  
  console.log(`총 ${commonEndpoints.length + individualEndpoints.length}개 엔드포인트 분석`);
  console.log(`- 공용관리비: ${commonEndpoints.length}개`);
  console.log(`- 개별사용료: ${individualEndpoints.length}개\n`);
  
  // 월별 데이터 확인
  for (let month = 1; month <= 12; month++) {
    const searchDate = `${year}${month.toString().padStart(2, '0')}`;
    console.log(`=== ${month}월 데이터 가용성 (${searchDate}) ===`);
    
    let commonTotal = 0;
    let individualTotal = 0;
    let availableCommon = 0;
    let availableIndividual = 0;
    let errorCommon = 0;
    let errorIndividual = 0;
    
    // 공용관리비 확인
    console.log(`\\n📊 공용관리비 (${commonEndpoints.length}개):`);
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
          } else {
            console.log(`  🔸 ${endpoint.name}: 0원`);
          }
          availableCommon++;
        } else {
          console.log(`  ❌ ${endpoint.name}: 데이터 없음 (${json.response?.header?.resultMsg || '알 수 없음'})`);
          errorCommon++;
        }
      } catch (error) {
        console.log(`  ❌ ${endpoint.name}: 네트워크 에러`);
        errorCommon++;
      }
    }
    
    // 개별사용료 확인
    console.log(`\\n💡 개별사용료 (${individualEndpoints.length}개):`);
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
          } else {
            console.log(`  🔸 ${endpoint.name}: 0원`);
          }
          availableIndividual++;
        } else {
          console.log(`  ❌ ${endpoint.name}: 데이터 없음 (${json.response?.header?.resultMsg || '알 수 없음'})`);
          errorIndividual++;
        }
      } catch (error) {
        console.log(`  ❌ ${endpoint.name}: 네트워크 에러`);
        errorIndividual++;
      }
    }
    
    console.log(`\\n📈 ${month}월 요약:`);
    console.log(`- 공용관리비: ${commonTotal.toLocaleString()}원`);
    console.log(`  ✅ 성공: ${availableCommon}/${commonEndpoints.length}개 (${((availableCommon/commonEndpoints.length)*100).toFixed(1)}%)`);
    console.log(`  ❌ 실패: ${errorCommon}개`);
    console.log(`- 개별사용료: ${individualTotal.toLocaleString()}원`);
    console.log(`  ✅ 성공: ${availableIndividual}/${individualEndpoints.length}개 (${((availableIndividual/individualEndpoints.length)*100).toFixed(1)}%)`);
    console.log(`  ❌ 실패: ${errorIndividual}개`);
    console.log(`- 총 관리비: ${(commonTotal + individualTotal).toLocaleString()}원`);
    console.log(`- 전체 성공률: ${(((availableCommon + availableIndividual)/(commonEndpoints.length + individualEndpoints.length))*100).toFixed(1)}%`);
    console.log(`\n${'='.repeat(60)}\n`);
  }
}

analyzeAllEndpointsMonthly();