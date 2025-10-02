const API_KEY = 'EAl5DDYH6Ixz5ZpCY40/DTEDqkFXTG2Utgr5YJQkusuQyugyb80K+qVwRG2ZpceMiCIXqwFWmGpJRHeu7s8JUA==';
const INDIVIDUAL_BASE_URL = 'https://apis.data.go.kr/1613000/AptIndvdlzManageCostServiceV2';

async function testFebruaryCalculation() {
  const kaptCode = 'A13376906';
  const searchDate = '202302';  // February
  const encodedKey = encodeURIComponent(API_KEY);
  
  console.log('Testing February 2023 calculation...\n');
  
  // Quick test just summing the new categories
  const newCategories = [
    { name: '생활폐기물수수료', url: 'getHsmpDomesticWasteFeeInfoV2', field: 'scrap' },
    { name: '입주자대표회의운영비', url: 'getHsmpMovingInRepresentationMtgInfoV2', field: 'preMeet' },
    { name: '건물보험료', url: 'getHsmpBuildingInsuranceFeeInfoV2', field: 'buildInsu' },
    { name: '선거관리위원회운영비', url: 'getHsmpElectionOrpnsInfoV2', field: 'electionMng' },
    { name: '정화조오물수수료', url: 'getHsmpWaterPurifierTankFeeInfoV2', field: 'purifi' }
  ];
  
  let newCategoriesTotal = 0;
  
  for (const category of newCategories) {
    const url = `${INDIVIDUAL_BASE_URL}/${category.url}?serviceKey=${encodedKey}&kaptCode=${kaptCode}&searchDate=${searchDate}&type=json`;
    
    try {
      const response = await fetch(url);
      const json = await response.json();
      
      if (json.response?.body?.item) {
        const value = parseInt(json.response.body.item[category.field] || 0);
        console.log(`${category.name}: ${value.toLocaleString()}`);
        newCategoriesTotal += value;
      }
    } catch (error) {
      console.log(`${category.name}: Error`);
    }
  }
  
  console.log(`\\nTotal from new categories: ${newCategoriesTotal.toLocaleString()}`);
  console.log('February API individual fee: 73,023,872');
  console.log(`Difference to investigate: ${(73023872 + newCategoriesTotal - 73023872).toLocaleString()}`);
}

testFebruaryCalculation();