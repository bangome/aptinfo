const API_KEY = 'EAl5DDYH6Ixz5ZpCY40/DTEDqkFXTG2Utgr5YJQkusuQyugyb80K+qVwRG2ZpceMiCIXqwFWmGpJRHeu7s8JUA==';

async function testSingleMonth() {
  const kaptCode = 'A13376906';
  const year = 2023;
  const month = 1;
  const searchDate = `${year}${month.toString().padStart(2, '0')}`;

  console.log(`🔍 Testing single month data for ${kaptCode} - ${year}/${month}...`);

  try {
    const encodedApiKey = encodeURIComponent(API_KEY);

    // Test all APIs for one month
    const [cleaningRes, guardRes, disinfectionRes, elevatorRes, repairsRes, facilityRes, vehicleRes, heatRes, hotWaterRes, electricityRes, waterRes, gasRes] = await Promise.all([
      // 청소비
      fetch(`https://apis.data.go.kr/1613000/AptCmnuseManageCostServiceV2/getHsmpCleaningCostInfoV2?serviceKey=${encodedApiKey}&kaptCode=${kaptCode}&searchDate=${searchDate}&type=json`),
      // 경비비
      fetch(`https://apis.data.go.kr/1613000/AptCmnuseManageCostServiceV2/getHsmpGuardCostInfoV2?serviceKey=${encodedApiKey}&kaptCode=${kaptCode}&searchDate=${searchDate}&type=json`),
      // 소독비
      fetch(`https://apis.data.go.kr/1613000/AptCmnuseManageCostServiceV2/getHsmpDisinfectionCostInfoV2?serviceKey=${encodedApiKey}&kaptCode=${kaptCode}&searchDate=${searchDate}&type=json`),
      // 승강기유지비
      fetch(`https://apis.data.go.kr/1613000/AptCmnuseManageCostServiceV2/getHsmpElevatorMntncCostInfoV2?serviceKey=${encodedApiKey}&kaptCode=${kaptCode}&searchDate=${searchDate}&type=json`),
      // 수선비
      fetch(`https://apis.data.go.kr/1613000/AptCmnuseManageCostServiceV2/getHsmpRepairsCostInfoV2?serviceKey=${encodedApiKey}&kaptCode=${kaptCode}&searchDate=${searchDate}&type=json`),
      // 시설유지비
      fetch(`https://apis.data.go.kr/1613000/AptCmnuseManageCostServiceV2/getHsmpFacilityMntncCostInfoV2?serviceKey=${encodedApiKey}&kaptCode=${kaptCode}&searchDate=${searchDate}&type=json`),
      // 차량유지비
      fetch(`https://apis.data.go.kr/1613000/AptCmnuseManageCostServiceV2/getHsmpVhcleMntncCostInfoV2?serviceKey=${encodedApiKey}&kaptCode=${kaptCode}&searchDate=${searchDate}&type=json`),
      // 난방비
      fetch(`https://apis.data.go.kr/1613000/AptIndvdlzManageCostServiceV2/getHsmpHeatCostInfoV2?serviceKey=${encodedApiKey}&kaptCode=${kaptCode}&searchDate=${searchDate}&type=json`),
      // 급탕비
      fetch(`https://apis.data.go.kr/1613000/AptIndvdlzManageCostServiceV2/getHsmpHotWaterCostInfoV2?serviceKey=${encodedApiKey}&kaptCode=${kaptCode}&searchDate=${searchDate}&type=json`),
      // 전기료
      fetch(`https://apis.data.go.kr/1613000/AptIndvdlzManageCostServiceV2/getHsmpElectricityCostInfoV2?serviceKey=${encodedApiKey}&kaptCode=${kaptCode}&searchDate=${searchDate}&type=json`),
      // 수도료
      fetch(`https://apis.data.go.kr/1613000/AptIndvdlzManageCostServiceV2/getHsmpWaterCostInfoV2?serviceKey=${encodedApiKey}&kaptCode=${kaptCode}&searchDate=${searchDate}&type=json`),
      // 가스사용료
      fetch(`https://apis.data.go.kr/1613000/AptIndvdlzManageCostServiceV2/getHsmpGasRentalFeeInfoV2?serviceKey=${encodedApiKey}&kaptCode=${kaptCode}&searchDate=${searchDate}&type=json`)
    ]);

    // Parse all responses
    const results = await Promise.all([
      cleaningRes.json(),
      guardRes.json(),
      disinfectionRes.json(),
      elevatorRes.json(),
      repairsRes.json(),
      facilityRes.json(),
      vehicleRes.json(),
      heatRes.json(),
      hotWaterRes.json(),
      electricityRes.json(),
      waterRes.json(),
      gasRes.json()
    ]);

    const [cleaningJson, guardJson, disinfectionJson, elevatorJson, repairsJson, facilityJson, vehicleJson, heatJson, hotWaterJson, electricityJson, waterJson, gasJson] = results;

    // Extract data
    const cleaningItem = cleaningJson?.response?.body?.item;
    const guardItem = guardJson?.response?.body?.item;
    const disinfectionItem = disinfectionJson?.response?.body?.item;
    const elevatorItem = elevatorJson?.response?.body?.item;
    const repairsItem = repairsJson?.response?.body?.item;
    const facilityItem = facilityJson?.response?.body?.item;
    const vehicleItem = vehicleJson?.response?.body?.item;
    const heatItem = heatJson?.response?.body?.item;
    const hotWaterItem = hotWaterJson?.response?.body?.item;
    const electricityItem = electricityJson?.response?.body?.item;
    const waterItem = waterJson?.response?.body?.item;
    const gasItem = gasJson?.response?.body?.item;

    // Calculate fees using correct field names
    const commonFee =
      parseInt(cleaningItem?.cleanCost || 0) +
      parseInt(guardItem?.guardCost || 0) +
      parseInt(disinfectionItem?.disinfCost || 0) +
      parseInt(elevatorItem?.elevCost || 0) +
      parseInt(repairsItem?.lrefCost1 || 0) +
      parseInt(facilityItem?.lrefCost2 || 0) +
      parseInt(vehicleItem?.fuelCost || 0) +
      parseInt(vehicleItem?.refairCost || 0) +
      parseInt(vehicleItem?.carInsurance || 0) +
      parseInt(vehicleItem?.carEtc || 0);

    const individualFee =
      parseInt(heatItem?.heatC || 0) +
      parseInt(heatItem?.heatP || 0) +
      parseInt(hotWaterItem?.waterHotC || 0) +
      parseInt(hotWaterItem?.waterHotP || 0) +
      parseInt(electricityItem?.electC || 0) +
      parseInt(electricityItem?.electP || 0) +
      parseInt(waterItem?.waterCoolC || 0) +
      parseInt(waterItem?.waterCoolP || 0) +
      parseInt(gasItem?.gasC || 0) +
      parseInt(gasItem?.gasP || 0);

    console.log('\n📊 Management Fee Calculation Results:');
    console.log('공용관리비 항목:');
    console.log('  청소비:', parseInt(cleaningItem?.cleanCost || 0).toLocaleString());
    console.log('  경비비:', parseInt(guardItem?.guardCost || 0).toLocaleString());
    console.log('  소독비:', parseInt(disinfectionItem?.disinfCost || 0).toLocaleString());
    console.log('  승강기유지비:', parseInt(elevatorItem?.elevCost || 0).toLocaleString());
    console.log('  수선비:', parseInt(repairsItem?.lrefCost1 || 0).toLocaleString());
    console.log('  시설유지비:', parseInt(facilityItem?.lrefCost2 || 0).toLocaleString());
    console.log('  차량유지비 (연료):', parseInt(vehicleItem?.fuelCost || 0).toLocaleString());
    console.log('  차량유지비 (수리):', parseInt(vehicleItem?.refairCost || 0).toLocaleString());
    console.log('  차량유지비 (보험):', parseInt(vehicleItem?.carInsurance || 0).toLocaleString());
    console.log('  차량유지비 (기타):', parseInt(vehicleItem?.carEtc || 0).toLocaleString());
    console.log('  공용관리비 합계:', commonFee.toLocaleString());

    console.log('\n개별사용료 항목:');
    console.log('  난방비 (공급분):', parseInt(heatItem?.heatC || 0).toLocaleString());
    console.log('  난방비 (사용분):', parseInt(heatItem?.heatP || 0).toLocaleString());
    console.log('  급탕비 (공급분):', parseInt(hotWaterItem?.waterHotC || 0).toLocaleString());
    console.log('  급탕비 (사용분):', parseInt(hotWaterItem?.waterHotP || 0).toLocaleString());
    console.log('  전기료 (공급분):', parseInt(electricityItem?.electC || 0).toLocaleString());
    console.log('  전기료 (사용분):', parseInt(electricityItem?.electP || 0).toLocaleString());
    console.log('  수도료 (공급분):', parseInt(waterItem?.waterCoolC || 0).toLocaleString());
    console.log('  수도료 (사용분):', parseInt(waterItem?.waterCoolP || 0).toLocaleString());
    console.log('  가스비 (공급분):', parseInt(gasItem?.gasC || 0).toLocaleString());
    console.log('  가스비 (사용분):', parseInt(gasItem?.gasP || 0).toLocaleString());
    console.log('  개별사용료 합계:', individualFee.toLocaleString());

    console.log('\n💰 총 관리비 (월):', (commonFee + individualFee).toLocaleString());

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testSingleMonth();