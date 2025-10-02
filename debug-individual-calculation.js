const API_KEY = 'EAl5DDYH6Ixz5ZpCY40/DTEDqkFXTG2Utgr5YJQkusuQyugyb80K+qVwRG2ZpceMiCIXqwFWmGpJRHeu7s8JUA==';
const INDIVIDUAL_BASE_URL = 'https://apis.data.go.kr/1613000/AptIndvdlzManageCostServiceV2';

async function debugCalculation() {
  const kaptCode = 'A13376906';
  const searchDate = '202301';
  const encodedKey = encodeURIComponent(API_KEY);
  
  console.log('Debugging individual fee calculation (exactly as in route.ts)...\n');
  
  // Fetch all data exactly like in the route
  const individualPromises = [
    fetch(`${INDIVIDUAL_BASE_URL}/getHsmpHeatCostInfoV2?serviceKey=${encodedKey}&kaptCode=${kaptCode}&searchDate=${searchDate}&type=json`), // 난방비
    fetch(`${INDIVIDUAL_BASE_URL}/getHsmpHotWaterCostInfoV2?serviceKey=${encodedKey}&kaptCode=${kaptCode}&searchDate=${searchDate}&type=json`), // 급탕비
    fetch(`${INDIVIDUAL_BASE_URL}/getHsmpElectricityCostInfoV2?serviceKey=${encodedKey}&kaptCode=${kaptCode}&searchDate=${searchDate}&type=json`), // 전기료
    fetch(`${INDIVIDUAL_BASE_URL}/getHsmpWaterCostInfoV2?serviceKey=${encodedKey}&kaptCode=${kaptCode}&searchDate=${searchDate}&type=json`), // 수도료
    fetch(`${INDIVIDUAL_BASE_URL}/getHsmpGasRentalFeeInfoV2?serviceKey=${encodedKey}&kaptCode=${kaptCode}&searchDate=${searchDate}&type=json`), // 가스사용료
    fetch(`${INDIVIDUAL_BASE_URL}/getHsmpDomesticWasteFeeInfoV2?serviceKey=${encodedKey}&kaptCode=${kaptCode}&searchDate=${searchDate}&type=json`), // 생활폐기물수수료
    fetch(`${INDIVIDUAL_BASE_URL}/getHsmpMovingInRepresentationMtgInfoV2?serviceKey=${encodedKey}&kaptCode=${kaptCode}&searchDate=${searchDate}&type=json`), // 입주자대표회의운영비
    fetch(`${INDIVIDUAL_BASE_URL}/getHsmpBuildingInsuranceFeeInfoV2?serviceKey=${encodedKey}&kaptCode=${kaptCode}&searchDate=${searchDate}&type=json`), // 건물보험료
    fetch(`${INDIVIDUAL_BASE_URL}/getHsmpElectionOrpnsInfoV2?serviceKey=${encodedKey}&kaptCode=${kaptCode}&searchDate=${searchDate}&type=json`), // 선거관리위원회운영비
    fetch(`${INDIVIDUAL_BASE_URL}/getHsmpWaterPurifierTankFeeInfoV2?serviceKey=${encodedKey}&kaptCode=${kaptCode}&searchDate=${searchDate}&type=json`) // 정화조오물수수료
  ];

  const individualResponses = await Promise.all(individualPromises);

  // Parse responses
  const parseResponse = async (response) => {
    try {
      const text = await response.text();
      return JSON.parse(text);
    } catch {
      return null;
    }
  };

  const [heatJson, hotWaterJson, electricityJson, waterJson, gasJson, wasteJson, meetingJson, insuranceJson, electionJson, purifierJson] = 
    await Promise.all(individualResponses.map(parseResponse));

  // Extract items
  const heatItem = heatJson?.response?.body?.item;
  const hotWaterItem = hotWaterJson?.response?.body?.item;
  const electricityItem = electricityJson?.response?.body?.item;
  const waterItem = waterJson?.response?.body?.item;
  const gasItem = gasJson?.response?.body?.item;
  const wasteItem = wasteJson?.response?.body?.item;
  const meetingItem = meetingJson?.response?.body?.item;
  const insuranceItem = insuranceJson?.response?.body?.item;
  const electionItem = electionJson?.response?.body?.item;
  const purifierItem = purifierJson?.response?.body?.item;

  // Calculate exactly as in route.ts
  console.log('Raw values:');
  console.log('heatItem?.heatC:', heatItem?.heatC, 'parsed:', parseInt(heatItem?.heatC || 0));
  console.log('heatItem?.heatP:', heatItem?.heatP, 'parsed:', parseInt(heatItem?.heatP || 0));
  console.log('hotWaterItem?.waterHotC:', hotWaterItem?.waterHotC, 'parsed:', parseInt(hotWaterItem?.waterHotC || 0));
  console.log('hotWaterItem?.waterHotP:', hotWaterItem?.waterHotP, 'parsed:', parseInt(hotWaterItem?.waterHotP || 0));
  console.log('electricityItem?.electC:', electricityItem?.electC, 'parsed:', parseInt(electricityItem?.electC || 0));
  console.log('electricityItem?.electP:', electricityItem?.electP, 'parsed:', parseInt(electricityItem?.electP || 0));
  console.log('waterItem?.waterCoolC:', waterItem?.waterCoolC, 'parsed:', parseInt(waterItem?.waterCoolC || 0));
  console.log('waterItem?.waterCoolP:', waterItem?.waterCoolP, 'parsed:', parseInt(waterItem?.waterCoolP || 0));
  console.log('gasItem?.gasC:', gasItem?.gasC, 'parsed:', parseInt(gasItem?.gasC || 0));
  console.log('gasItem?.gasP:', gasItem?.gasP, 'parsed:', parseInt(gasItem?.gasP || 0));
  console.log('wasteItem?.scrap:', wasteItem?.scrap, 'parsed:', parseInt(wasteItem?.scrap || 0));
  console.log('meetingItem?.preMeet:', meetingItem?.preMeet, 'parsed:', parseInt(meetingItem?.preMeet || 0));
  console.log('insuranceItem?.buildInsu:', insuranceItem?.buildInsu, 'parsed:', parseInt(insuranceItem?.buildInsu || 0));
  console.log('electionItem?.electionMng:', electionItem?.electionMng, 'parsed:', parseInt(electionItem?.electionMng || 0));
  console.log('purifierItem?.purifi:', purifierItem?.purifi, 'parsed:', parseInt(purifierItem?.purifi || 0));

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
    parseInt(gasItem?.gasP || 0) +
    parseInt(wasteItem?.scrap || 0) +
    parseInt(meetingItem?.preMeet || 0) +
    parseInt(insuranceItem?.buildInsu || 0) +
    parseInt(electionItem?.electionMng || 0) +
    parseInt(purifierItem?.purifi || 0);

  console.log('\nCalculated individual fee:', individualFee.toLocaleString());
  console.log('Expected from API:', '93,186,548');
  console.log(`Match: ${individualFee === 93186548 ? '✅ YES' : '❌ NO'}`);
}

debugCalculation();