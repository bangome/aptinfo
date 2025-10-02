/**
 * 실거래가 API 간단 디버그 스크립트
 */

async function debugTradeApi() {
  const API_KEY = process.env.NEXT_PUBLIC_DATA_GO_KR_SERVICE_KEY || 'EAl5DDYH6Ixz5ZpCY40/DTEDqkFXTG2Utgr5YJQkusuQyugyb80K+qVwRG2ZpceMiCIXqwFWmGpJRHeu7s8JUA==';
  
  console.log('🔍 실거래가 API 디버그 시작\n');

  const testCases = [
    {
      name: '아파트 매매 실거래가 (강남구, 2024년 9월)',
      url: `https://apis.data.go.kr/1613000/RTMSDataSvcAptTrade/getRTMSDataSvcAptTrade?serviceKey=${encodeURIComponent(API_KEY)}&LAWD_CD=11680&DEAL_YMD=202409&type=json`
    },
    {
      name: '아파트 전월세 실거래가 (강남구, 2024년 9월)', 
      url: `https://apis.data.go.kr/1613000/RTMSDataSvcAptRent/getRTMSDataSvcAptRent?serviceKey=${encodeURIComponent(API_KEY)}&LAWD_CD=11680&DEAL_YMD=202409&type=json`
    },
    {
      name: '아파트 매매 실거래가 (강남구, 2024년 8월)',
      url: `https://apis.data.go.kr/1613000/RTMSDataSvcAptTrade/getRTMSDataSvcAptTrade?serviceKey=${encodeURIComponent(API_KEY)}&LAWD_CD=11680&DEAL_YMD=202408&type=json`
    }
  ];

  for (const testCase of testCases) {
    console.log(`📡 테스트: ${testCase.name}`);
    console.log(`URL: ${testCase.url}\n`);
    
    try {
      const response = await fetch(testCase.url);
      const text = await response.text();
      
      console.log(`응답 상태: ${response.status}`);
      console.log(`Content-Type: ${response.headers.get('content-type')}`);
      console.log(`응답 길이: ${text.length}자`);
      
      // 응답이 너무 짧으면 전체 출력
      if (text.length < 500) {
        console.log(`전체 응답: ${text}`);
      } else {
        console.log(`응답 시작: ${text.substring(0, 300)}...`);
      }
      
      // JSON 파싱 시도
      try {
        const jsonData = JSON.parse(text);
        console.log('✅ JSON 파싱 성공');
        
        if (jsonData.response) {
          const header = jsonData.response.header;
          const body = jsonData.response.body;
          
          console.log(`결과 코드: ${header?.resultCode} - ${header?.resultMsg}`);
          
          if (header?.resultCode === '00') {
            const items = body?.items;
            
            if (items) {
              const itemsArray = Array.isArray(items) ? items : [items];
              console.log(`📊 데이터 항목: ${itemsArray.length}개`);
              
              if (itemsArray.length > 0) {
                console.log('\n📋 첫 번째 항목 샘플:');
                const firstItem = itemsArray[0];
                Object.keys(firstItem).forEach(key => {
                  console.log(`  ${key}: ${firstItem[key]}`);
                });
              }
            } else {
              console.log('📊 데이터 항목: 0개 (items가 없음)');
            }
          } else {
            console.log(`⚠️ API 에러: ${header?.resultCode} - ${header?.resultMsg}`);
          }
        } else {
          console.log('⚠️ 예상과 다른 응답 구조:', Object.keys(jsonData));
        }
        
      } catch (parseError) {
        console.error('❌ JSON 파싱 실패:', parseError.message);
        console.log('원본 응답 일부:', text.substring(0, 500));
      }
      
    } catch (error) {
      console.error(`❌ API 호출 실패:`, error.message);
    }
    
    console.log('\n' + '='.repeat(80) + '\n');
  }
}

debugTradeApi().catch(console.error);