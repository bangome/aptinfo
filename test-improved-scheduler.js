/**
 * 개선된 스케줄러 테스트 (XML/JSON 파싱 개선 포함)
 */

const testImprovedScheduler = async () => {
  console.log('🧪 개선된 관리비 스케줄러 테스트 시작\n');

  const testUrl = 'http://localhost:3000/api/management-fees/scheduler';
  
  try {
    console.log('📡 관리비 스케줄러 실행 요청...');
    
    const response = await fetch(testUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        year: 2024,
        months: [1], // 1월만 테스트
        limit: 2,    // 2개 아파트만 테스트
        offset: 0
      })
    });

    const data = await response.json();
    
    console.log(`📊 응답 상태: ${response.status}`);
    console.log(`📊 응답 데이터:`, JSON.stringify(data, null, 2));
    
    if (response.ok && data.success) {
      console.log('\n✅ 개선된 스케줄러 테스트 성공!');
      console.log(`📈 처리: ${data.processed}, 성공: ${data.saved}, 에러: ${data.errors}`);
      
      if (data.errors === 0) {
        console.log('🎉 모든 데이터 수집이 성공적으로 완료되었습니다!');
      } else {
        console.log('⚠️ 일부 데이터 수집에서 에러가 발생했습니다.');
      }
      
    } else {
      console.log('\n❌ 스케줄러 테스트 실패');
      console.log('에러:', data.error || data.message);
    }
    
  } catch (error) {
    console.log('\n❌ 스케줄러 테스트 중 네트워크 에러');
    console.log('에러:', error.message);
  }
};

// 서버 연결 확인 후 테스트
const checkAndTest = async () => {
  try {
    const healthCheck = await fetch('http://localhost:3000/api/health');
    if (healthCheck.ok) {
      console.log('✅ 서버 연결 확인됨\n');
      await testImprovedScheduler();
    } else {
      throw new Error('Server health check failed');
    }
  } catch (error) {
    console.log('❌ 서버에 연결할 수 없습니다.');
    console.log('   npm run dev로 개발 서버를 시작했는지 확인해주세요.');
  }
};

checkAndTest().catch(console.error);