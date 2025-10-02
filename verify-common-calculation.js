const API_KEY = 'EAl5DDYH6Ixz5ZpCY40/DTEDqkFXTG2Utgr5YJQkusuQyugyb80K+qVwRG2ZpceMiCIXqwFWmGpJRHeu7s8JUA==';
const COMMON_COST_BASE_URL = 'https://apis.data.go.kr/1613000/AptCmnuseManageCostServiceV2';

async function verifyCommonCalculation() {
  const kaptCode = 'A13376906';
  const searchDate = '202301';
  const encodedKey = encodeURIComponent(API_KEY);
  
  console.log('Verifying January 2023 common fee calculation...\n');
  
  // Test both existing and new endpoints
  const endpoints = [
    // Existing endpoints
    { name: '청소비', url: 'getHsmpCleaningCostInfoV2', fields: ['cleanCost'] },
    { name: '경비비', url: 'getHsmpGuardCostInfoV2', fields: ['guardCost'] },
    { name: '소독비', url: 'getHsmpDisinfectionCostInfoV2', fields: ['disinfCost'] },
    { name: '승강기유지비', url: 'getHsmpElevatorMntncCostInfoV2', fields: ['elevCost'] },
    { name: '수선비', url: 'getHsmpRepairsCostInfoV2', fields: ['lrefCost1'] },
    { name: '시설유지비', url: 'getHsmpFacilityMntncCostInfoV2', fields: ['lrefCost2'] },
    { name: '차량유지비', url: 'getHsmpVhcleMntncCostInfoV2', fields: ['fuelCost', 'refairCost', 'carInsurance', 'carEtc'] },
    { name: '재해예방비', url: 'getHsmpDisasterPreventionCostInfoV2', fields: ['lrefCost4'] },
    // New endpoints
    { name: '인건비', url: 'getHsmpLaborCostInfoV2', fields: ['pay', 'sundryCost', 'bonus', 'pension', 'accidentPremium', 'employPremium', 'nationalPension', 'healthPremium', 'welfareBenefit'] },
    { name: '제세공과금', url: 'getHsmpTaxdueInfoV2', fields: ['electCost', 'telCost', 'postageCost', 'taxrestCost'] }
  ];
  
  let totalCommonFee = 0;
  
  for (const endpoint of endpoints) {
    const url = `${COMMON_COST_BASE_URL}/${endpoint.url}?serviceKey=${encodedKey}&kaptCode=${kaptCode}&searchDate=${searchDate}&type=json`;
    
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
        totalCommonFee += subtotal;
      } else {
        console.log(`${endpoint.name}: No data`);
      }
    } catch (error) {
      console.log(`${endpoint.name}: Error - ${error.message}`);
    }
    console.log('');
  }
  
  console.log(`Total calculated common fee: ${totalCommonFee.toLocaleString()}`);
  console.log('Current API common fee: 79,817,503');
  console.log(`Match: ${totalCommonFee === 79817503 ? '✅ YES' : '❌ NO - Difference: ' + (totalCommonFee - 79817503).toLocaleString()}`);
}

verifyCommonCalculation();