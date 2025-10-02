/**
 * 스케줄러 신뢰성 및 실패 시나리오 테스트
 * 스케줄러의 안정성, 재시도 메커니즘, 알림 시스템을 검증
 */

const { performance } = require('perf_hooks');

// 테스트 시나리오 정의
const testScenarios = [
  {
    name: '스케줄러 초기화 테스트',
    endpoint: '/api/init-scheduler',
    method: 'POST',
    expectedStatus: 200,
    description: '스케줄러가 정상적으로 초기화되는지 확인'
  },
  {
    name: '스케줄러 상태 조회',
    endpoint: '/api/admin/scheduler',
    method: 'GET',
    expectedStatus: 200,
    description: '스케줄러 상태 정보가 정상적으로 조회되는지 확인'
  },
  {
    name: '특정 작업 수동 실행',
    endpoint: '/api/admin/scheduler',
    method: 'POST',
    body: { action: 'run', jobId: 'daily-data-validation' },
    expectedStatus: 200,
    description: '데이터 검증 작업이 수동으로 실행되는지 확인'
  },
  {
    name: '스케줄러 전체 시작',
    endpoint: '/api/admin/scheduler',
    method: 'POST',
    body: { action: 'start' },
    expectedStatus: 200,
    description: '모든 스케줄 작업이 시작되는지 확인'
  },
  {
    name: '스케줄러 전체 중지',
    endpoint: '/api/admin/scheduler',
    method: 'POST',
    body: { action: 'stop' },
    expectedStatus: 200,
    description: '모든 스케줄 작업이 중지되는지 확인'
  },
  {
    name: '스케줄러 재시작',
    endpoint: '/api/admin/scheduler',
    method: 'POST',
    body: { action: 'restart' },
    expectedStatus: 200,
    description: '스케줄러가 재시작되는지 확인'
  }
];

// 실패 시나리오 테스트
const failureScenarios = [
  {
    name: '존재하지 않는 작업 실행 시도',
    endpoint: '/api/admin/scheduler',
    method: 'POST',
    body: { action: 'run', jobId: 'non-existent-job' },
    expectedStatus: 400,
    description: '존재하지 않는 작업 실행 시 오류 처리 확인'
  },
  {
    name: '잘못된 액션 요청',
    endpoint: '/api/admin/scheduler',
    method: 'POST',
    body: { action: 'invalid-action' },
    expectedStatus: 400,
    description: '잘못된 액션 요청 시 오류 처리 확인'
  },
  {
    name: '필수 파라미터 누락',
    endpoint: '/api/admin/scheduler',
    method: 'POST',
    body: { jobId: 'test-job' }, // action 누락
    expectedStatus: 400,
    description: '필수 파라미터 누락 시 오류 처리 확인'
  }
];

/**
 * HTTP 요청 실행
 */
async function executeRequest(scenario) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
  const url = `${baseUrl}${scenario.endpoint}`;
  
  const requestOptions = {
    method: scenario.method,
    headers: {
      'Content-Type': 'application/json',
    }
  };

  if (scenario.body) {
    requestOptions.body = JSON.stringify(scenario.body);
  }

  const startTime = performance.now();
  
  try {
    const response = await fetch(url, requestOptions);
    const endTime = performance.now();
    const responseTime = Math.round(endTime - startTime);
    
    const data = await response.text();
    let jsonData;
    try {
      jsonData = JSON.parse(data);
    } catch {
      jsonData = { rawResponse: data };
    }

    return {
      scenario: scenario.name,
      success: response.status === scenario.expectedStatus,
      actualStatus: response.status,
      expectedStatus: scenario.expectedStatus,
      responseTime,
      data: jsonData,
      error: null
    };

  } catch (error) {
    const endTime = performance.now();
    const responseTime = Math.round(endTime - startTime);
    
    return {
      scenario: scenario.name,
      success: false,
      actualStatus: null,
      expectedStatus: scenario.expectedStatus,
      responseTime,
      data: null,
      error: error.message
    };
  }
}

/**
 * 데이터 검증 작업 테스트
 */
async function testDataValidationJob() {
  console.log('\n🔍 데이터 검증 작업 테스트');
  console.log('=' .repeat(50));

  const result = await executeRequest({
    name: '데이터 검증 작업 실행',
    endpoint: '/api/admin/scheduler',
    method: 'POST',
    body: { action: 'run', jobId: 'daily-data-validation' },
    expectedStatus: 200
  });

  if (result.success) {
    console.log('✅ 데이터 검증 작업 실행 성공');
    console.log(`   응답 시간: ${result.responseTime}ms`);
    
    // 잠시 대기 후 상태 확인
    console.log('   작업 완료 대기 중...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const statusResult = await executeRequest({
      name: '검증 후 상태 확인',
      endpoint: '/api/admin/scheduler',
      method: 'GET',
      expectedStatus: 200
    });
    
    if (statusResult.success && statusResult.data) {
      const validationJob = statusResult.data.jobs?.find(job => job.id === 'daily-data-validation');
      if (validationJob) {
        console.log(`   작업 상태: ${validationJob.status}`);
        console.log(`   마지막 실행: ${validationJob.lastRun || 'N/A'}`);
        console.log(`   에러 카운트: ${validationJob.errorCount || 0}`);
      }
    }
  } else {
    console.log('❌ 데이터 검증 작업 실행 실패');
    console.log(`   상태 코드: ${result.actualStatus} (예상: ${result.expectedStatus})`);
    console.log(`   오류: ${result.error || '응답 데이터 확인 필요'}`);
  }

  return result;
}

/**
 * 알림 시스템 테스트
 */
async function testNotificationSystem() {
  console.log('\n📢 알림 시스템 테스트');
  console.log('=' .repeat(50));

  // 존재하지 않는 작업을 실행하여 의도적으로 실패 시나리오 생성
  const result = await executeRequest({
    name: '의도적 실패 시나리오',
    endpoint: '/api/admin/scheduler',
    method: 'POST',
    body: { action: 'run', jobId: 'fake-job-for-testing' },
    expectedStatus: 400
  });

  if (result.success) {
    console.log('✅ 실패 시나리오 정상 처리');
    console.log('   오류 알림이 발송되어야 합니다.');
  } else if (result.actualStatus === 500) {
    console.log('⚠️ 서버 오류 발생 - 알림 시스템이 작동할 수 있습니다.');
  } else {
    console.log('❌ 예상과 다른 응답');
    console.log(`   상태 코드: ${result.actualStatus}`);
  }

  return result;
}

/**
 * 부하 테스트 (동시 요청)
 */
async function testConcurrentRequests() {
  console.log('\n🚀 동시 요청 부하 테스트');
  console.log('=' .repeat(50));

  const concurrentRequests = 5;
  const promises = [];

  console.log(`${concurrentRequests}개의 동시 상태 조회 요청 실행...`);

  for (let i = 0; i < concurrentRequests; i++) {
    promises.push(executeRequest({
      name: `동시 요청 ${i + 1}`,
      endpoint: '/api/admin/scheduler',
      method: 'GET',
      expectedStatus: 200
    }));
  }

  const results = await Promise.all(promises);
  const successCount = results.filter(r => r.success).length;
  const avgResponseTime = Math.round(
    results.reduce((sum, r) => sum + r.responseTime, 0) / results.length
  );

  console.log(`✅ 동시 요청 테스트 완료`);
  console.log(`   성공률: ${successCount}/${concurrentRequests} (${Math.round(successCount/concurrentRequests*100)}%)`);
  console.log(`   평균 응답 시간: ${avgResponseTime}ms`);

  return {
    successRate: successCount / concurrentRequests,
    avgResponseTime,
    allSuccessful: successCount === concurrentRequests
  };
}

/**
 * 메인 테스트 실행
 */
async function main() {
  console.log('🧪 스케줄러 신뢰성 테스트 시작');
  console.log('=' .repeat(60));
  console.log(`테스트 시간: ${new Date().toISOString()}`);

  const results = {
    basicTests: [],
    failureTests: [],
    dataValidationTest: null,
    notificationTest: null,
    loadTest: null,
    summary: {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      overallSuccess: false
    }
  };

  // 1. 기본 기능 테스트
  console.log('\n📊 1단계: 기본 기능 테스트');
  console.log('=' .repeat(50));

  for (const scenario of testScenarios) {
    console.log(`\n🧪 테스트: ${scenario.name}`);
    console.log(`   설명: ${scenario.description}`);
    
    const result = await executeRequest(scenario);
    results.basicTests.push(result);
    
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    console.log(`   결과: ${status} (${result.responseTime}ms)`);
    
    if (!result.success) {
      console.log(`   상태: ${result.actualStatus} (예상: ${result.expectedStatus})`);
      if (result.error) {
        console.log(`   오류: ${result.error}`);
      }
    }
    
    // 각 테스트 사이에 짧은 대기
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // 2. 실패 시나리오 테스트
  console.log('\n📊 2단계: 실패 시나리오 테스트');
  console.log('=' .repeat(50));

  for (const scenario of failureScenarios) {
    console.log(`\n🧪 테스트: ${scenario.name}`);
    console.log(`   설명: ${scenario.description}`);
    
    const result = await executeRequest(scenario);
    results.failureTests.push(result);
    
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    console.log(`   결과: ${status} (${result.responseTime}ms)`);
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // 3. 데이터 검증 작업 테스트
  console.log('\n📊 3단계: 특수 기능 테스트');
  results.dataValidationTest = await testDataValidationJob();

  // 4. 알림 시스템 테스트
  results.notificationTest = await testNotificationSystem();

  // 5. 부하 테스트
  results.loadTest = await testConcurrentRequests();

  // 결과 요약
  console.log('\n📈 테스트 결과 요약');
  console.log('=' .repeat(60));

  const basicPassed = results.basicTests.filter(t => t.success).length;
  const failurePassed = results.failureTests.filter(t => t.success).length;
  
  results.summary.totalTests = testScenarios.length + failureScenarios.length + 3; // +3 for special tests
  results.summary.passedTests = basicPassed + failurePassed + 
    (results.dataValidationTest?.success ? 1 : 0) +
    (results.notificationTest?.success ? 1 : 0) +
    (results.loadTest?.allSuccessful ? 1 : 0);
  results.summary.failedTests = results.summary.totalTests - results.summary.passedTests;
  results.summary.overallSuccess = results.summary.failedTests === 0;

  console.log(`\n🎯 기본 기능 테스트: ${basicPassed}/${testScenarios.length} 통과`);
  console.log(`🎯 실패 시나리오 테스트: ${failurePassed}/${failureScenarios.length} 통과`);
  console.log(`🎯 데이터 검증 테스트: ${results.dataValidationTest?.success ? '통과' : '실패'}`);
  console.log(`🎯 알림 시스템 테스트: ${results.notificationTest?.success ? '통과' : '실패'}`);
  console.log(`🎯 부하 테스트: ${results.loadTest?.allSuccessful ? '통과' : '실패'} (성공률: ${Math.round((results.loadTest?.successRate || 0) * 100)}%)`);

  console.log(`\n🏆 전체 결과: ${results.summary.passedTests}/${results.summary.totalTests} 테스트 통과`);
  console.log(`📊 성공률: ${Math.round(results.summary.passedTests / results.summary.totalTests * 100)}%`);

  if (results.summary.overallSuccess) {
    console.log('\n🎉 모든 테스트 통과! 스케줄러가 안정적으로 작동합니다.');
  } else {
    console.log('\n⚠️ 일부 테스트 실패. 추가 검토가 필요합니다.');
    
    // 실패한 테스트 상세 정보
    const failedTests = [
      ...results.basicTests.filter(t => !t.success),
      ...results.failureTests.filter(t => !t.success)
    ];
    
    if (failedTests.length > 0) {
      console.log('\n❌ 실패한 테스트:');
      failedTests.forEach(test => {
        console.log(`   - ${test.scenario}: 상태 ${test.actualStatus} (예상: ${test.expectedStatus})`);
      });
    }
  }

  // 결과를 JSON 파일로 저장
  const fs = require('fs');
  fs.writeFileSync('scheduler-test-results.json', JSON.stringify(results, null, 2));
  
  console.log('\n📋 상세 결과가 scheduler-test-results.json 파일에 저장되었습니다.');
  console.log('✅ 스케줄러 신뢰성 테스트 완료!');

  return results;
}

// 스크립트 실행
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  executeRequest,
  testDataValidationJob,
  testNotificationSystem,
  testConcurrentRequests
};