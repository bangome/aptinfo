// 빠른 아파트 수 확인
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function quickCount() {
  console.log('🔢 현재 아파트 수 확인 중...');
  
  try {
    const { count, error } = await supabase
      .from('apartments')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;

    console.log(`🏢 현재 총 아파트 수: ${count?.toLocaleString()}개`);

    // 최근 추가된 아파트들 (마지막 10개)
    const { data: recent, error: recentError } = await supabase
      .from('apartments')
      .select('name, sigungu, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (recentError) throw recentError;

    console.log('\n📋 최근 추가된 아파트 (상위 10개):');
    recent?.forEach((apt, index) => {
      const createdAt = new Date(apt.created_at).toLocaleString('ko-KR');
      console.log(`  ${index + 1}. ${apt.name} (${apt.sigungu}) - ${createdAt}`);
    });

  } catch (error) {
    console.error('❌ 확인 실패:', error);
  }
}

quickCount();