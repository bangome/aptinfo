// 데이터베이스 상태 확인 스크립트
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkDbStatus() {
  console.log('📊 데이터베이스 상태 확인 중...');
  
  try {
    // 총 아파트 수
    const { count: totalCount, error: totalError } = await supabase
      .from('apartments')
      .select('*', { count: 'exact', head: true });

    if (totalError) throw totalError;

    // 활성 아파트 수
    const { count: activeCount, error: activeError } = await supabase
      .from('apartments')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    if (activeError) throw activeError;

    // 구별 통계
    const { data: districtStats, error: districtError } = await supabase
      .from('apartments')
      .select('sigungu')
      .eq('is_active', true);

    if (districtError) throw districtError;

    const districtCounts = districtStats.reduce((acc, item) => {
      acc[item.sigungu] = (acc[item.sigungu] || 0) + 1;
      return acc;
    }, {});

    // 최근 동기화 로그 확인
    const { data: syncLogs, error: logError } = await supabase
      .from('apartment_sync_logs')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(5);

    if (logError) throw logError;

    console.log('\n📈 데이터베이스 현황');
    console.log('='.repeat(50));
    console.log(`🏢 총 아파트 수: ${totalCount?.toLocaleString()}개`);
    console.log(`✅ 활성 아파트 수: ${activeCount?.toLocaleString()}개`);
    console.log(`❌ 비활성 아파트 수: ${((totalCount || 0) - (activeCount || 0)).toLocaleString()}개`);

    console.log('\n📍 구별 아파트 분포:');
    Object.entries(districtCounts)
      .sort(([,a], [,b]) => b - a)
      .forEach(([district, count]) => {
        console.log(`  ${district}: ${count.toLocaleString()}개`);
      });

    console.log('\n📋 최근 동기화 로그 (최근 5건):');
    if (syncLogs && syncLogs.length > 0) {
      syncLogs.forEach((log, index) => {
        const startTime = new Date(log.started_at).toLocaleString('ko-KR');
        const status = log.status === 'completed' ? '✅' : 
                     log.status === 'failed' ? '❌' : '🔄';
        console.log(`  ${index + 1}. ${status} ${log.region_name || '전체'} - ${startTime}`);
        if (log.total_processed) {
          console.log(`     처리: ${log.total_processed}, 추가: ${log.total_inserted}, 업데이트: ${log.total_updated}, 오류: ${log.total_errors}`);
        }
      });
    } else {
      console.log('  동기화 로그가 없습니다.');
    }

    // 데이터 품질 확인
    console.log('\n🔍 데이터 품질 확인:');
    
    const { data: missingKaptCode } = await supabase
      .from('apartments')
      .select('kapt_code', { count: 'exact', head: true })
      .is('kapt_code', null);

    const { data: missingBasicInfo } = await supabase
      .from('apartments')
      .select('*', { count: 'exact', head: true })
      .is('total_household_count', null);

    console.log(`  단지코드 누락: ${missingKaptCode?.length || 0}개`);
    console.log(`  기본정보 누락: ${missingBasicInfo?.length || 0}개`);

  } catch (error) {
    console.error('❌ 상태 확인 실패:', error);
  }
}

checkDbStatus();