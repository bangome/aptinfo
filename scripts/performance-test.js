/**
 * 아파트 검색 API 성능 벤치마크 테스트
 * PRD 목표: 3초 이내 검색 응답
 */

const { performance } = require('perf_hooks');

// 테스트 시나리오 (실제 구현된 API 기준)
const testScenarios = [
  {
    name: '아파트 단지 목록 조회',
    endpoint: '/api/test-apartment-list',
    params: {}
  },
  {
    name: '아파트 ID 조회',
    endpoint: '/api/test-apartment-ids', 
    params: {}
  },
  {
    name: '정부 API 호출 테스트',
    endpoint: '/api/test-api',
    params: {}
  },
  {
    name: '데이터베이스 연결 테스트',
    endpoint: '/api/test-database',
    params: {}
  },
  {
    name: '모든 API 통합 테스트',
    endpoint: '/api/test-all-apis',
    params: {}
  }
];

/**
 * 단일 API 요청 성능 측정
 */
async function measureApiPerformance(scenario) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
  const url = new URL(scenario.endpoint, baseUrl);
  
  // URL 파라미터 추가
  Object.entries(scenario.params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });

  try {
    const startTime = performance.now();
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    const endTime = performance.now();
    const responseTime = endTime - startTime;
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    const dataSize = JSON.stringify(data).length;
    
    return {
      scenario: scenario.name,
      responseTime: Math.round(responseTime),
      dataSize,
      success: true,
      recordCount: Array.isArray(data.data) ? data.data.length : (data.data ? 1 : 0)
    };
    
  } catch (error) {
    return {
      scenario: scenario.name,
      responseTime: null,
      success: false,
      error: error.message
    };
  }
}

/**
 * 여러 번 테스트하여 평균 성능 측정
 */
async function runBenchmark(scenario, iterations = 5) {
  console.log(`\n🧪 테스트 시작: ${scenario.name}`);
  console.log(`🔄 반복 횟수: ${iterations}회`);
  
  const results = [];
  
  for (let i = 0; i < iterations; i++) {
    console.log(`   실행 ${i + 1}/${iterations}...`);
    const result = await measureApiPerformance(scenario);
    results.push(result);
    
    // 요청 간 간격 (서버 부하 방지)
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  const successfulResults = results.filter(r => r.success);
  
  if (successfulResults.length === 0) {
    console.log(`❌ 모든 요청 실패`);
    console.log(`   오류: ${results[0]?.error || '알 수 없는 오류'}`);
    return null;
  }
  
  const responseTimes = successfulResults.map(r => r.responseTime);
  const avgResponseTime = Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length);
  const minResponseTime = Math.min(...responseTimes);
  const maxResponseTime = Math.max(...responseTimes);
  const successRate = (successfulResults.length / results.length) * 100;
  
  const benchmark = {
    scenario: scenario.name,
    iterations,
    successRate: Math.round(successRate),
    avgResponseTime,
    minResponseTime,
    maxResponseTime,
    avgDataSize: successfulResults.length > 0 ? Math.round(successfulResults.reduce((a, b) => a + b.dataSize, 0) / successfulResults.length) : 0,
    avgRecordCount: successfulResults.length > 0 ? Math.round(successfulResults.reduce((a, b) => a + b.recordCount, 0) / successfulResults.length) : 0,
    meets3SecTarget: avgResponseTime <= 3000
  };
  
  console.log(`✅ 완료`);
  console.log(`   평균 응답시간: ${avgResponseTime}ms`);
  console.log(`   최소/최대: ${minResponseTime}ms / ${maxResponseTime}ms`);
  console.log(`   성공률: ${successRate}%`);
  console.log(`   3초 목표 달성: ${benchmark.meets3SecTarget ? '✅ Yes' : '❌ No'}`);
  
  return benchmark;
}

/**
 * 동시 요청 성능 테스트 (부하 테스트)
 */
async function runConcurrencyTest(scenario, concurrentUsers = 5) {
  console.log(`\n🚀 동시 요청 테스트: ${scenario.name}`);
  console.log(`👥 동시 사용자: ${concurrentUsers}명`);
  
  const startTime = performance.now();
  
  const promises = Array(concurrentUsers).fill().map(() => measureApiPerformance(scenario));
  const results = await Promise.all(promises);
  
  const endTime = performance.now();
  const totalTime = Math.round(endTime - startTime);
  
  const successfulResults = results.filter(r => r.success);
  const successRate = (successfulResults.length / results.length) * 100;
  
  if (successfulResults.length > 0) {
    const responseTimes = successfulResults.map(r => r.responseTime);
    const avgResponseTime = Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length);
    const maxResponseTime = Math.max(...responseTimes);
    
    console.log(`   총 소요시간: ${totalTime}ms`);
    console.log(`   평균 응답시간: ${avgResponseTime}ms`);
    console.log(`   최대 응답시간: ${maxResponseTime}ms`);
    console.log(`   성공률: ${successRate}%`);
    console.log(`   동시 처리 성능: ${maxResponseTime <= 5000 ? '✅ Good' : '⚠️ Needs improvement'}`);
    
    return {
      scenario: scenario.name,
      concurrentUsers,
      totalTime,
      avgResponseTime,
      maxResponseTime,
      successRate,
      performsWellUnderLoad: maxResponseTime <= 5000 && successRate >= 80
    };
  } else {
    console.log(`❌ 모든 동시 요청 실패`);
    return null;
  }
}

/**
 * 메인 벤치마크 실행
 */
async function main() {
  console.log('🏁 아파트 검색 API 성능 벤치마크 테스트 시작');
  console.log('=' .repeat(60));
  
  const benchmarkResults = [];
  const concurrencyResults = [];
  
  // 1. 기본 성능 테스트
  console.log('\n📊 1단계: 기본 성능 테스트');
  for (const scenario of testScenarios) {
    const result = await runBenchmark(scenario, 5);
    if (result) {
      benchmarkResults.push(result);
    }
  }
  
  // 2. 동시 요청 테스트 (중요한 시나리오만)
  console.log('\n📊 2단계: 동시 요청 성능 테스트');
  const criticalScenarios = testScenarios.slice(0, 3); // 처음 3개 시나리오만
  for (const scenario of criticalScenarios) {
    const result = await runConcurrencyTest(scenario, 3);
    if (result) {
      concurrencyResults.push(result);
    }
  }
  
  // 3. 결과 요약
  console.log('\n📈 성능 테스트 결과 요약');
  console.log('=' .repeat(60));
  
  console.log('\n🎯 기본 성능 결과:');
  benchmarkResults.forEach(result => {
    const status = result.meets3SecTarget ? '✅' : '❌';
    console.log(`   ${status} ${result.scenario}: ${result.avgResponseTime}ms (목표: 3000ms)`);
  });
  
  console.log('\n🚀 동시 요청 성능 결과:');
  concurrencyResults.forEach(result => {
    const status = result.performsWellUnderLoad ? '✅' : '⚠️';
    console.log(`   ${status} ${result.scenario}: 최대 ${result.maxResponseTime}ms (${result.concurrentUsers}명 동시)`);
  });
  
  // 4. 전체 성능 등급
  const allMeet3SecTarget = benchmarkResults.every(r => r.meets3SecTarget);
  const allPerformWellUnderLoad = concurrencyResults.every(r => r.performsWellUnderLoad);
  
  console.log('\n🏆 전체 성능 평가:');
  console.log(`   3초 목표 달성: ${allMeet3SecTarget ? '✅ 모든 API 달성' : '❌ 일부 API 미달성'}`);
  console.log(`   부하 처리 성능: ${allPerformWellUnderLoad ? '✅ 우수' : '⚠️ 개선 필요'}`);
  
  if (allMeet3SecTarget && allPerformWellUnderLoad) {
    console.log('\n🎉 성능 최적화 목표 달성! PRD 요구사항을 만족합니다.');
  } else {
    console.log('\n⚠️ 추가 최적화가 필요합니다.');
    
    // 개선 제안
    const slowApis = benchmarkResults.filter(r => !r.meets3SecTarget);
    if (slowApis.length > 0) {
      console.log('\n🔧 개선이 필요한 API:');
      slowApis.forEach(api => {
        console.log(`   - ${api.scenario}: ${api.avgResponseTime}ms`);
      });
    }
  }
  
  console.log('\n📋 상세 결과는 performance-results.json 파일에 저장됩니다.');
  
  // 결과를 JSON 파일로 저장
  const fullResults = {
    timestamp: new Date().toISOString(),
    summary: {
      allMeet3SecTarget,
      allPerformWellUnderLoad,
      totalScenarios: benchmarkResults.length,
      passedScenarios: benchmarkResults.filter(r => r.meets3SecTarget).length
    },
    benchmarkResults,
    concurrencyResults
  };
  
  const fs = require('fs');
  fs.writeFileSync('performance-results.json', JSON.stringify(fullResults, null, 2));
  
  console.log('✅ 성능 테스트 완료!');
}

// 스크립트 실행
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  measureApiPerformance,
  runBenchmark,
  runConcurrencyTest
};