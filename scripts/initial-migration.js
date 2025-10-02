#!/usr/bin/env node

/**
 * 기존 데이터 마이그레이션 스크립트
 * 
 * 모든 아파트의 2024년 관리비 데이터를 배치로 수집하여 DB에 저장합니다.
 * 이 스크립트는 외부 API 호출에서 DB 조회로 전환하기 위한 일회성 마이그레이션입니다.
 */

const { runBatchCollection } = require('./batch-collect-management-fees');

async function initialMigration() {
  console.log('🚀 초기 데이터 마이그레이션 시작');
  console.log('📊 2024년 전체 관리비 데이터 수집');
  console.log('⚠️  이 작업은 시간이 오래 걸릴 수 있습니다.\n');

  try {
    // 2024년 모든 월 데이터 수집 (배치별로 처리)
    const totalApartments = 3000; // 예상 아파트 수
    const batchSize = 20; // 한 번에 처리할 아파트 수
    
    console.log(`📈 총 ${totalApartments}개 아파트 예상, ${batchSize}개씩 배치 처리`);
    
    for (let offset = 0; offset < totalApartments; offset += batchSize) {
      console.log(`\n🔄 배치 ${Math.floor(offset / batchSize) + 1} 시작 (${offset + 1} ~ ${Math.min(offset + batchSize, totalApartments)})`);
      
      const options = {
        year: 2024,
        months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        limit: batchSize,
        offset: offset
      };
      
      try {
        await runBatchCollection(options);
        console.log(`✅ 배치 ${Math.floor(offset / batchSize) + 1} 완료`);
        
        // 배치 간 대기 (API 서버 부하 방지)
        console.log('⏳ 다음 배치까지 30초 대기...');
        await new Promise(resolve => setTimeout(resolve, 30000));
        
      } catch (batchError) {
        console.error(`❌ 배치 ${Math.floor(offset / batchSize) + 1} 에러:`, batchError);
        console.log('⏳ 에러 발생, 60초 대기 후 계속...');
        await new Promise(resolve => setTimeout(resolve, 60000));
      }
    }
    
    console.log('\n🎉 초기 데이터 마이그레이션 완료!');
    console.log('✨ 이제 API가 DB에서 데이터를 빠르게 조회할 수 있습니다.');
    
  } catch (error) {
    console.error('❌ 마이그레이션 실패:', error);
    process.exit(1);
  }
}

// 선택적 데이터 마이그레이션 (특정 연도/월만)
async function selectiveMigration(year, months = []) {
  console.log(`🎯 선택적 마이그레이션: ${year}년 ${months.join(', ')}월`);
  
  const options = {
    year,
    months: months.length > 0 ? months : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    limit: 50, // 더 큰 배치 크기
    offset: 0
  };
  
  try {
    await runBatchCollection(options);
    console.log('✅ 선택적 마이그레이션 완료');
  } catch (error) {
    console.error('❌ 선택적 마이그레이션 실패:', error);
    throw error;
  }
}

// CLI 실행 처리
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--selective')) {
    // 선택적 마이그레이션
    const yearIndex = args.indexOf('--year');
    const monthsIndex = args.indexOf('--months');
    
    const year = yearIndex !== -1 ? parseInt(args[yearIndex + 1]) : 2024;
    const months = monthsIndex !== -1 ? 
      args[monthsIndex + 1].split(',').map(m => parseInt(m.trim())) : 
      [];
    
    selectiveMigration(year, months)
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
      
  } else {
    // 전체 마이그레이션
    initialMigration()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  }
}

module.exports = {
  initialMigration,
  selectiveMigration
};