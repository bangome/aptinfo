const axios = require('axios');

async function checkAreaData() {
  const serviceKey = 'EAl5DDYH6Ixz5ZpCY40/DTEDqkFXTG2Utgr5YJQkusuQyugyb80K+qVwRG2ZpceMiCIXqwFWmGpJRHeu7s8JUA==';
  const kaptCode = 'A10026470'; // 힐스테이트서울숲리버

  // 기본 정보 API
  const basicUrl = 'http://apis.data.go.kr/1613000/AptInfoService3/getAphusBassInfo';
  const basicParams = new URLSearchParams({
    serviceKey: serviceKey,
    kaptCode: kaptCode
  });

  try {
    const response = await axios.get(`${basicUrl}?${basicParams}`, {
      headers: { 'Accept': 'application/json' }
    });

    const items = response.data?.response?.body?.items?.item;
    if (items) {
      const item = Array.isArray(items) ? items[0] : items;
      console.log('=== API 실제 데이터 ===');
      console.log('아파트명:', item.kaptName);
      console.log('대지면적(kaptTarea):', item.kaptTarea, '㎡');
      console.log('연면적(kaptMarea):', item.kaptMarea, '㎡');
      console.log('전용면적합(privArea):', item.privArea, '㎡');
      console.log('세대수:', item.hoCnt);
      console.log('');
      console.log('=== 면적별 세대수 분포 ===');
      console.log('60㎡이하 세대수:', item.kaptMparea60);
      console.log('60㎡초과~85㎡이하:', item.kaptMparea85);
      console.log('85㎡초과~135㎡이하:', item.kaptMparea135);
      console.log('135㎡초과:', item.kaptMparea136);
      console.log('');
      console.log('=== 평균 면적 계산 ===');
      const totalHouseholds = item.hoCnt;
      const privAreaPerHousehold = (parseFloat(item.privArea) / totalHouseholds).toFixed(2);
      console.log(`세대당 평균 전용면적: ${privAreaPerHousehold}㎡`);

      // 면적별 세대수가 맞는지 검증
      const totalByArea = (item.kaptMparea60 || 0) + (item.kaptMparea85 || 0) +
                         (item.kaptMparea135 || 0) + (item.kaptMparea136 || 0);
      console.log(`면적별 세대수 합계: ${totalByArea} (전체 세대수: ${totalHouseholds})`);
      console.log('');
      console.log('=== DB 데이터와 비교 ===');
      console.log('DB의 kapt_tarea:', 107556.86);
      console.log('DB의 kapt_marea:', 61808.7);
      console.log('DB의 priv_area:', 47242.38);
      console.log('');
      console.log('차이:');
      console.log('대지면적 차이:', (parseFloat(item.kaptTarea) - 107556.86).toFixed(2), '㎡');
      console.log('연면적 차이:', (parseFloat(item.kaptMarea) - 61808.7).toFixed(2), '㎡');
      console.log('전용면적 차이:', (parseFloat(item.privArea) - 47242.38).toFixed(2), '㎡');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkAreaData();