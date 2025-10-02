const axios = require('axios');
const xml2js = require('xml2js');

async function checkAreaDataDetail() {
  const serviceKey = 'EAl5DDYH6Ixz5ZpCY40/DTEDqkFXTG2Utgr5YJQkusuQyugyb80K+qVwRG2ZpceMiCIXqwFWmGpJRHeu7s8JUA==';
  const kaptCode = 'A10026470'; // 힐스테이트서울숲리버

  // 면적 정보 API (getAphusAreaInfo)
  const areaUrl = 'http://apis.data.go.kr/1613000/AptInfoService3/getAphusAreaInfo';
  const areaParams = new URLSearchParams({
    serviceKey: serviceKey,
    kaptCode: kaptCode
  });

  try {
    console.log('=== 면적별 정보 API 호출 ===');
    console.log(`URL: ${areaUrl}?${areaParams}`);

    const response = await axios.get(`${areaUrl}?${areaParams}`, {
      headers: { 'Accept': 'application/xml' },
      responseType: 'text'
    });

    // XML 파싱
    const parser = new xml2js.Parser({ explicitArray: false });
    const result = await parser.parseStringPromise(response.data);

    const items = result?.response?.body?.items?.item;
    if (items) {
      const itemArray = Array.isArray(items) ? items : [items];

      console.log('\n=== 평형별 상세 정보 ===');
      itemArray.forEach((item, index) => {
        console.log(`\n평형 ${index + 1}:`);
        console.log('  전용면적:', item.privArea, '㎡');
        console.log('  공급면적:', item.supplyArea, '㎡');
        console.log('  평형:', item.areaPy, '평');
        console.log('  타입별칭:', item.areaAlias || '없음');
      });

      console.log('\n=== 면적 검증 ===');
      // 전용면적 60㎡는 약 18평
      // 전용면적 85㎡는 약 26평
      // 전용면적 135㎡는 약 41평

      itemArray.forEach((item) => {
        const privArea = parseFloat(item.privArea);
        const supplyArea = parseFloat(item.supplyArea);
        const py = parseFloat(item.areaPy);

        // 평형과 전용면적 관계 검증 (1평 = 3.3㎡)
        const calculatedPy = (privArea / 3.3).toFixed(1);
        console.log(`\n  전용 ${privArea}㎡ = ${calculatedPy}평 (API: ${py}평)`);
        console.log(`  전용율: ${(privArea / supplyArea * 100).toFixed(1)}%`);
      });
    }
  } catch (error) {
    if (error.response?.data) {
      console.log('Error response data:', error.response.data);
    }
    console.error('Error:', error.message);
  }
}

checkAreaDataDetail();