/**
 * 간소화된 스케줄러 테스트 스크립트
 */

const testSchedulerApis = async () => {
  console.log('🧪 간소화된 스케줄러 API 테스트 시작\n');

  const APIs = [
    {
      name: '스케줄러 상태 조회',
      url: 'http://localhost:3000/api/admin/scheduler',
      method: 'GET'
    },
    {
      name: '스케줄러 시작',
      url: 'http://localhost:3000/api/admin/scheduler',
      method: 'POST',
      body: { action: 'start' }
    },
    {
      name: '스케줄러 초기화 상태',
      url: 'http://localhost:3000/api/init-scheduler',
      method: 'GET'
    },
    {
      name: '관리비 스케줄러 상태',
      url: 'http://localhost:3000/api/management-fees/scheduler',
      method: 'GET'
    }
  ];

  const results = [];

  for (const api of APIs) {
    try {
      console.log(`📡 테스트 중: ${api.name}`);
      
      const options = {
        method: api.method,
        headers: {
          'Content-Type': 'application/json'
        }
      };

      if (api.body) {
        options.body = JSON.stringify(api.body);
      }

      const response = await fetch(api.url, options);
      const data = await response.json();
      
      const result = {
        name: api.name,
        status: response.status,
        success: response.ok,
        data: data
      };

      results.push(result);

      if (response.ok) {
        console.log(`✅ ${api.name}: ${response.status} OK`);
        console.log(`   응답:`, data.message || data.success);
      } else {
        console.log(`❌ ${api.name}: ${response.status} ERROR`);
        console.log(`   에러:`, data.error || data.message);
      }
      
    } catch (error) {
      console.log(`❌ ${api.name}: 네트워크 에러`);
      console.log(`   에러:`, error.message);
      
      results.push({
        name: api.name,
        status: 0,
        success: false,
        error: error.message
      });
    }
    
    console.log(''); // 줄바꿈
  }

  // 요약
  console.log('📊 테스트 결과 요약:');
  console.log(`성공: ${results.filter(r => r.success).length}/${results.length}`);
  console.log(`실패: ${results.filter(r => !r.success).length}/${results.length}`);
  
  if (results.every(r => r.success)) {
    console.log('🎉 모든 스케줄러 API가 정상 작동합니다!');
  } else {
    console.log('⚠️ 일부 스케줄러 API에 문제가 있습니다.');
  }

  return results;
};

// 서버가 실행 중인지 확인 후 테스트
const checkServerAndTest = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/health');
    if (response.ok) {
      console.log('✅ 서버가 실행 중입니다.\n');
      await testSchedulerApis();
    } else {
      throw new Error('서버 응답 불량');
    }
  } catch (error) {
    console.log('❌ 서버가 실행되지 않았습니다.');
    console.log('   npm run dev로 개발 서버를 먼저 시작해주세요.');
    console.log('   또는 포트 3000이 사용 중일 수 있습니다.\n');
    
    // 대신 간단한 연결성 테스트
    console.log('🔍 연결성 테스트만 진행합니다...');
    try {
      const testResponse = await fetch('http://localhost:3000');
      console.log('✅ 포트 3000에서 응답을 받았습니다.');
    } catch (e) {
      console.log('❌ 포트 3000에 연결할 수 없습니다.');
    }
  }
};

checkServerAndTest().catch(console.error);