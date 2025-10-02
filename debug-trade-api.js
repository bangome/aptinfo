/**
 * 실거래가 API 디버그 스크립트
 */

const { fetchWithRetryAndParsing, extractGovernmentApiData } = require('./src/lib/api/response-handler.ts');

async function debugTradeApi() {
  const API_KEY = process.env.NEXT_PUBLIC_DATA_GO_KR_SERVICE_KEY || 'EAl5DDYH6Ixz5ZpCY40/DTEDqkFXTG2Utgr5YJQkusuQyugyb80K+qVwRG2ZpceMiCIXqwFWmGpJRHeu7s8JUA==';
  
  console.log('🔍 실거래가 API 디버그 시작\n');

  const testCases = [
    {
      name: '아파트 매매 실거래가 (강남구, 2024년 1월)',
      url: `https://apis.data.go.kr/1613000/RTMSDataSvcAptTrade/getRTMSDataSvcAptTrade?serviceKey=${encodeURIComponent(API_KEY)}&LAWD_CD=11680&DEAL_YMD=202401&type=json`
    },
    {
      name: '아파트 전월세 실거래가 (강남구, 2024년 1월)', 
      url: `https://apis.data.go.kr/1613000/RTMSDataSvcAptRent/getRTMSDataSvcAptRent?serviceKey=${encodeURIComponent(API_KEY)}&LAWD_CD=11680&DEAL_YMD=202401&type=json`
    },
    {
      name: '아파트 매매 실거래가 (최근 데이터 - 2024년 8월)',
      url: `https://apis.data.go.kr/1613000/RTMSDataSvcAptTrade/getRTMSDataSvcAptTrade?serviceKey=${encodeURIComponent(API_KEY)}&LAWD_CD=11680&DEAL_YMD=202408&type=json`
    }
  ];

  for (const testCase of testCases) {
    console.log(`📡 테스트: ${testCase.name}`);
    console.log(`URL: ${testCase.url}\n`);
    
    try {
      // 직접 fetch로 먼저 테스트
      const response = await fetch(testCase.url);
      const text = await response.text();
      
      console.log(`응답 상태: ${response.status}`);
      console.log(`Content-Type: ${response.headers.get('content-type')}`);
      console.log(`응답 길이: ${text.length}자`);
      console.log(`응답 시작: ${text.substring(0, 200)}...`);
      
      // JSON 파싱 시도
      try {
        const jsonData = JSON.parse(text);
        console.log('✅ JSON 파싱 성공');
        
        if (jsonData.response) {
          const header = jsonData.response.header;
          const body = jsonData.response.body;
          
          console.log(`결과 코드: ${header?.resultCode} - ${header?.resultMsg}`);
          
          if (header?.resultCode === '00') {
            const items = body?.items || [];
            const itemsArray = Array.isArray(items) ? items : (items ? [items] : []);
            console.log(`데이터 항목: ${itemsArray.length}개`);
            
            if (itemsArray.length > 0) {
              console.log('첫 번째 항목 샘플:');
              const firstItem = itemsArray[0];
              console.log(`  아파트: ${firstItem.아파트 || 'N/A'}`);
              console.log(`  거래금액: ${firstItem.거래금액 || firstItem.보증금액 || 'N/A'}`);
              console.log(`  월세금액: ${firstItem.월세금액 || 'N/A'}`);
              console.log(`  전용면적: ${firstItem.전용면적 || 'N/A'}`);
              console.log(`  법정동: ${firstItem.법정동 || 'N/A'}`);
              console.log(`  거래일: ${firstItem.년}-${firstItem.월}-${firstItem.일}`);
            }
          } else {
            console.log(`⚠️ API 에러: ${header?.resultMsg}`);
          }
        } else {
          console.log('⚠️ 예상과 다른 응답 구조:', Object.keys(jsonData));
        }
        
      } catch (parseError) {
        console.error('❌ JSON 파싱 실패:', parseError.message);
      }
      
    } catch (error) {
      console.error(`❌ API 호출 실패:`, error.message);
    }
    
    console.log('\n' + '='.repeat(80) + '\n');
  }
}

debugTradeApi().catch(console.error);