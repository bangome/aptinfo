// 면적 데이터 분석 스크립트
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function analyzeAreaData() {
  console.log('=== 데이터베이스 면적 정보 분석 ===\n');

  // 1. 몇 개 아파트의 면적 정보 조회
  const { data: complexes, error } = await supabase
    .from('apartment_complexes')
    .select('name, kapt_code, kapt_tarea, kapt_marea, priv_area, ho_cnt, kapt_mparea60, kapt_mparea85, kapt_mparea135, kapt_mparea136')
    .not('priv_area', 'is', null)
    .limit(10);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('샘플 아파트 면적 데이터:\n');

  complexes.forEach(complex => {
    const totalArea = parseFloat(complex.priv_area || 0);
    const households = parseInt(complex.ho_cnt || 1);
    const avgAreaPerHousehold = (totalArea / households).toFixed(2);

    // 면적별 세대수 합계
    const areaDistribution = (complex.kapt_mparea60 || 0) +
                            (complex.kapt_mparea85 || 0) +
                            (complex.kapt_mparea135 || 0) +
                            (complex.kapt_mparea136 || 0);

    console.log(`${complex.name} (${complex.kapt_code})`);
    console.log(`  대지면적: ${complex.kapt_tarea}㎡`);
    console.log(`  연면적: ${complex.kapt_marea}㎡`);
    console.log(`  전용면적 합계: ${complex.priv_area}㎡`);
    console.log(`  세대수: ${complex.ho_cnt}`);
    console.log(`  세대당 평균 전용면적: ${avgAreaPerHousehold}㎡`);
    console.log(`  면적별 세대수 분포:`);
    console.log(`    - 60㎡ 이하: ${complex.kapt_mparea60}`);
    console.log(`    - 60-85㎡: ${complex.kapt_mparea85}`);
    console.log(`    - 85-135㎡: ${complex.kapt_mparea135}`);
    console.log(`    - 135㎡ 초과: ${complex.kapt_mparea136}`);
    console.log(`  면적별 세대수 합계: ${areaDistribution} (총 세대수: ${complex.ho_cnt})`);

    // 면적별 세대수 분포가 공급면적 기준인지 전용면적 기준인지 추정
    if (avgAreaPerHousehold < 60 && complex.kapt_mparea60 > 0) {
      console.log(`  ⚠️ 세대당 평균 전용면적이 ${avgAreaPerHousehold}㎡인데 60㎡ 이하 세대가 ${complex.kapt_mparea60}개`);
      console.log(`     → 면적별 세대수는 공급면적 기준일 가능성이 높음`);
    }

    console.log('---');
  });

  // 2. 전용면적과 공급면적의 일반적인 비율 확인
  console.log('\n=== 전용면적/공급면적 비율 분석 ===\n');
  console.log('일반적으로 전용면적은 공급면적의 약 70-85% 수준입니다.');
  console.log('- 소형 아파트(60㎡ 이하): 전용율 약 70-75%');
  console.log('- 중형 아파트(85㎡): 전용율 약 75-80%');
  console.log('- 대형 아파트(135㎡ 이상): 전용율 약 80-85%');

  console.log('\n=== 결론 ===\n');
  console.log('DB의 면적별 세대수(kapt_mparea60, 85, 135, 136)는 공급면적 기준일 가능성이 높습니다.');
  console.log('실제 거래 데이터는 전용면적 기준이므로, 이 차이를 고려해야 합니다.');
  console.log('\n예시:');
  console.log('- 공급면적 85㎡ → 전용면적 약 64-68㎡');
  console.log('- 공급면적 60㎡ → 전용면적 약 42-45㎡');
  console.log('- 공급면적 135㎡ → 전용면적 약 108-115㎡');
}

analyzeAreaData();