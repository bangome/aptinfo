// 데이터베이스 기반 아파트 검색 테스트
const { realEstateApi } = require('./src/lib/api/real-estate-api');

async function testDbApartmentSearch() {
  console.log('🏢 데이터베이스 기반 아파트 검색 테스트 시작...');
  
  try {
    // 강남구 최근 3개월 전 실거래가 데이터로 테스트
    console.log('\n1️⃣ 강남구 실거래가 데이터 + DB 매칭 테스트');
    const startTime = Date.now();
    
    const apartmentData = await realEstateApi.getIntegratedApartmentDataWithDb({
      LAWD_CD: '11680', // 강남구
      DEAL_YMD: realEstateApi.getCurrentYearMonth(),
      numOfRows: 50 // 테스트용으로 50개만
    });

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    console.log(`\n📊 테스트 결과:`);
    console.log(`⏱️ 처리 시간: ${duration.toFixed(2)}초`);
    console.log(`🏢 조회된 실거래 데이터: ${apartmentData.length}개`);
    
    // 매칭 성공/실패 통계
    const matchedApartments = apartmentData.filter(apt => apt.kaptCode);
    const unmatchedApartments = apartmentData.filter(apt => !apt.kaptCode);
    
    console.log(`✅ DB 매칭 성공: ${matchedApartments.length}개`);
    console.log(`❌ DB 매칭 실패: ${unmatchedApartments.length}개`);
    
    if (matchedApartments.length > 0) {
      console.log(`\n🎯 매칭 성공 예시 (상위 3개):`);
      matchedApartments.slice(0, 3).forEach((apt, index) => {
        console.log(`  ${index + 1}. ${apt.name} (${apt.kaptCode})`);
        console.log(`     주소: ${apt.address}`);
        console.log(`     시설: 주차 ${apt.facilities?.parking?.total || 'N/A'}대, 엘리베이터 ${apt.facilities?.elevator || 'N/A'}대`);
        console.log(`     교통: ${apt.transportation?.subway?.line || 'N/A'} ${apt.transportation?.subway?.station || 'N/A'}`);
      });
    }
    
    if (unmatchedApartments.length > 0) {
      console.log(`\n❌ 매칭 실패 예시 (상위 3개):`);
      unmatchedApartments.slice(0, 3).forEach((apt, index) => {
        console.log(`  ${index + 1}. ${apt.name} (${apt.address})`);
      });
    }

    // 성능 비교를 위한 기존 API 방식 테스트
    console.log('\n2️⃣ 기존 API 방식과 성능 비교 (10개 데이터)');
    const apiStartTime = Date.now();
    
    try {
      const apiApartmentData = await realEstateApi.getIntegratedApartmentData({
        LAWD_CD: '11680',
        DEAL_YMD: realEstateApi.getCurrentYearMonth(),
        numOfRows: 10 // 적은 수로 테스트
      });
      
      const apiEndTime = Date.now();
      const apiDuration = (apiEndTime - apiStartTime) / 1000;
      
      console.log(`⏱️ API 방식 처리 시간: ${apiDuration.toFixed(2)}초`);
      console.log(`🏢 API 방식 조회된 데이터: ${apiApartmentData.length}개`);
      
      const speedup = apiDuration / duration;
      console.log(`🚀 DB 방식이 ${speedup.toFixed(1)}배 빠름!`);
      
    } catch (error) {
      console.log(`⚠️ API 방식 테스트 실패: ${error.message}`);
    }

    console.log('\n🎉 데이터베이스 기반 아파트 검색 테스트 완료!');
    
  } catch (error) {
    console.error('💥 테스트 실패:', error);
  }
}

// 테스트 실행
testDbApartmentSearch();