const API_KEY = 'EAl5DDYH6Ixz5ZpCY40/DTEDqkFXTG2Utgr5YJQkusuQyugyb80K+qVwRG2ZpceMiCIXqwFWmGpJRHeu7s8JUA==';
const INDIVIDUAL_BASE_URL = 'https://apis.data.go.kr/1613000/AptIndvdlzManageCostServiceV2';

async function verifyJanuaryCalculation() {
  const kaptCode = 'A13376906';
  const searchDate = '202301';
  const encodedKey = encodeURIComponent(API_KEY);
  
  console.log('Verifying January 2023 individual fee calculation...\n');
  
  // Test all individual endpoints
  const endpoints = [
    { name: '난방비', url: 'getHsmpHeatCostInfoV2', fields: ['heatC', 'heatP'] },
    { name: '급탕비', url: 'getHsmpHotWaterCostInfoV2', fields: ['waterHotC', 'waterHotP'] },
    { name: '전기료', url: 'getHsmpElectricityCostInfoV2', fields: ['electC', 'electP'] },
    { name: '수도료', url: 'getHsmpWaterCostInfoV2', fields: ['waterCoolC', 'waterCoolP'] },
    { name: '가스사용료', url: 'getHsmpGasRentalFeeInfoV2', fields: ['gasC', 'gasP'] },
    { name: '생활폐기물수수료', url: 'getHsmpDomesticWasteFeeInfoV2', fields: ['scrap'] },
    { name: '입주자대표회의운영비', url: 'getHsmpMovingInRepresentationMtgInfoV2', fields: ['preMeet'] },
    { name: '건물보험료', url: 'getHsmpBuildingInsuranceFeeInfoV2', fields: ['buildInsu'] },
    { name: '선거관리위원회운영비', url: 'getHsmpElectionOrpnsInfoV2', fields: ['electionMng'] },
    { name: '정화조오물수수료', url: 'getHsmpWaterPurifierTankFeeInfoV2', fields: ['purifi'] }
  ];
  
  let totalIndividualFee = 0;
  
  for (const endpoint of endpoints) {
    const url = `${INDIVIDUAL_BASE_URL}/${endpoint.url}?serviceKey=${encodedKey}&kaptCode=${kaptCode}&searchDate=${searchDate}&type=json`;
    
    try {
      const response = await fetch(url);
      const json = await response.json();
      
      if (json.response?.body?.item) {
        const item = json.response.body.item;
        let subtotal = 0;
        
        endpoint.fields.forEach(field => {
          const value = parseInt(item[field] || 0);
          subtotal += value;
          if (value > 0) {
            console.log(`  ${field}: ${value.toLocaleString()}`);
          }
        });
        
        console.log(`${endpoint.name}: ${subtotal.toLocaleString()}`);
        totalIndividualFee += subtotal;
      } else {
        console.log(`${endpoint.name}: No data`);
      }
    } catch (error) {
      console.log(`${endpoint.name}: Error - ${error.message}`);
    }
    console.log('');
  }
  
  console.log(`\nTotal calculated individual fee: ${totalIndividualFee.toLocaleString()}`);
  console.log('API returned individual fee: 93,186,548');
  console.log(`Match: ${totalIndividualFee === 93186548 ? '✅ YES' : '❌ NO'}`);
}

verifyJanuaryCalculation();