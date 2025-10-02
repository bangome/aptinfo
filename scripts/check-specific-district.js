// 특정 구 데이터 확인 스크립트
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkSpecificDistrict(districtName) {
  console.log(`📊 ${districtName} 데이터 확인 중...`);
  
  try {
    // 해당 구의 아파트 수
    const { count, error } = await supabase
      .from('apartments')
      .select('*', { count: 'exact', head: true })
      .eq('sigungu', districtName);

    if (error) throw error;

    console.log(`🏢 ${districtName} 총 아파트 수: ${count?.toLocaleString()}개`);

    // 최근 추가된 아파트 10개
    const { data: recentApartments, error: recentError } = await supabase
      .from('apartments')
      .select('name, kapt_code, eupmyeondong, created_at')
      .eq('sigungu', districtName)
      .order('created_at', { ascending: false })
      .limit(10);

    if (recentError) throw recentError;

    console.log('\n📋 최근 추가된 아파트 (상위 10개):');
    recentApartments?.forEach((apt, index) => {
      const createdAt = new Date(apt.created_at).toLocaleString('ko-KR');
      console.log(`  ${index + 1}. ${apt.name} (${apt.kapt_code}) - ${apt.eupmyeondong} - ${createdAt}`);
    });

    // 읍면동별 분포
    const { data: dongStats, error: dongError } = await supabase
      .from('apartments')
      .select('eupmyeondong')
      .eq('sigungu', districtName);

    if (dongError) throw dongError;

    const dongCounts = dongStats?.reduce((acc, item) => {
      acc[item.eupmyeondong] = (acc[item.eupmyeondong] || 0) + 1;
      return acc;
    }, {});

    console.log('\n📍 읍면동별 분포:');
    Object.entries(dongCounts || {})
      .sort(([,a], [,b]) => b - a)
      .forEach(([dong, count]) => {
        console.log(`  ${dong}: ${count}개`);
      });

  } catch (error) {
    console.error('❌ 확인 실패:', error);
  }
}

const districtName = process.argv[2] || '강남구';
checkSpecificDistrict(districtName);