/**
 * 실거래가 데이터 수집 테스트
 */

const testTradeTransactions = async () => {
  console.log('🧪 실거래가 데이터 수집 테스트 시작\n');

  // 1. 먼저 API 상태 확인
  console.log('1️⃣ 실거래가 API 상태 확인');
  try {
    const statusResponse = await fetch('http://localhost:3001/api/trade-transactions');
    const statusData = await statusResponse.json();
    
    console.log('✅ API 상태:', statusData.message);
    console.log('📍 지원 지역:', statusData.supported_regions?.map(r => `${r.name}(${r.code})`).join(', '));
    
  } catch (error) {
    console.error('❌ API 상태 확인 실패:', error.message);
    return;
  }

  // 2. 소규모 데이터 수집 테스트
  console.log('\n2️⃣ 소규모 실거래가 수집 테스트');
  try {
    const testResponse = await fetch('http://localhost:3001/api/trade-transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        regions: ['11680'], // 강남구만
        months: ['202401'], // 2024년 1월만
        collectTrade: true,
        collectRent: true
      })
    });

    const testData = await testResponse.json();
    
    console.log(`📊 수집 결과: ${testResponse.status}`);
    console.log(JSON.stringify(testData, null, 2));
    
    if (testResponse.ok && testData.success) {
      console.log('\n✅ 실거래가 수집 성공!');
      console.log(`📈 매매: ${testData.trade_transactions}건`);
      console.log(`🏠 전월세: ${testData.rent_transactions}건`);
      console.log(`📊 총합: ${testData.total_transactions}건`);
      console.log(`❌ 에러: ${testData.errors}건`);
      
      if (testData.total_transactions > 0) {
        console.log('🎉 실거래가 데이터 수집이 성공적으로 작동합니다!');
      } else {
        console.log('⚠️ 데이터가 수집되지 않았습니다. API 응답을 확인해주세요.');
      }
      
    } else {
      console.log('\n❌ 실거래가 수집 실패');
      console.log('에러:', testData.error || testData.message);
    }
    
  } catch (error) {
    console.log('\n❌ 실거래가 수집 중 네트워크 에러');
    console.log('에러:', error.message);
  }

  // 3. 데이터베이스 저장 확인
  console.log('\n3️⃣ 저장된 데이터 확인 (별도 스크립트로...)');
  console.log('   node check-database-status.js 를 실행해서 확인하세요.');
};

// 서버 연결 확인 후 테스트
const checkAndTest = async () => {
  try {
    const healthCheck = await fetch('http://localhost:3001/api/health');
    if (healthCheck.ok) {
      console.log('✅ 서버 연결 확인됨\n');
      await testTradeTransactions();
    } else {
      throw new Error('Server health check failed');
    }
  } catch (error) {
    console.log('❌ 서버에 연결할 수 없습니다.');
    console.log('   npm run dev로 개발 서버를 시작했는지 확인해주세요.');
  }
};

checkAndTest().catch(console.error);