/**
 * 데이터베이스 스키마 정합성 수정 스크립트
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://saucdbvjjwqgvbhcylhv.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhdWNkYnZqandxZ3ZiaGN5bGh2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODAxMDQyNCwiZXhwIjoyMDczNTg2NDI0fQ.nHI5FAi6l29fyhkVRDmOeT3FJBV4_UsmM5_V28Bl-VA'
);

async function fixDatabaseSchema() {
  console.log('🔧 데이터베이스 스키마 정합성 수정 시작...\n');

  // 1. 현재 apartment_complexes 테이블 구조 확인
  console.log('1️⃣ apartment_complexes 테이블 구조 확인');
  try {
    const { data: columns, error } = await supabase.rpc('get_table_columns', {
      table_name: 'apartment_complexes'
    });

    if (error) {
      console.log('   테이블 구조 직접 쿼리로 확인...');
      
      // 직접 쿼리로 확인
      const { data: sampleData, error: sampleError } = await supabase
        .from('apartment_complexes')
        .select('*')
        .limit(1);

      if (sampleError) {
        console.error('❌ 테이블 접근 에러:', sampleError.message);
        return;
      }

      if (sampleData && sampleData.length > 0) {
        console.log('✅ 현재 컬럼들:', Object.keys(sampleData[0]));
        
        const hasBuiltYear = 'build_year' in sampleData[0];
        console.log(`   build_year 컬럼 존재: ${hasBuiltYear ? '✅ 있음' : '❌ 없음'}`);
        
        if (!hasBuiltYear) {
          console.log('\n2️⃣ build_year 컬럼 추가 시작...');
          await addMissingColumns();
        } else {
          console.log('✅ build_year 컬럼이 이미 존재합니다.');
        }
      }
    }
  } catch (error) {
    console.error('❌ 스키마 확인 중 에러:', error.message);
  }

  // 3. 데이터 마이그레이션
  console.log('\n3️⃣ 데이터 마이그레이션 시작...');
  await migrateData();

  console.log('\n4️⃣ 수정 완료 후 검증...');
  await validateFix();
}

async function addMissingColumns() {
  const missingColumns = [
    'ALTER TABLE apartment_complexes ADD COLUMN IF NOT EXISTS build_year INTEGER',
    'ALTER TABLE apartment_complexes ADD COLUMN IF NOT EXISTS household_count INTEGER',
    'ALTER TABLE apartment_complexes ADD COLUMN IF NOT EXISTS floor_count INTEGER',
    'ALTER TABLE apartment_complexes ADD COLUMN IF NOT EXISTS dong_count INTEGER',
    'ALTER TABLE apartment_complexes ADD COLUMN IF NOT EXISTS total_area DECIMAL(15,2)',
    'ALTER TABLE apartment_complexes ADD COLUMN IF NOT EXISTS heating_type VARCHAR(50)',
    'ALTER TABLE apartment_complexes ADD COLUMN IF NOT EXISTS management_type VARCHAR(50)'
  ];

  for (const sql of missingColumns) {
    try {
      console.log(`   실행: ${sql}`);
      const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
      
      if (error) {
        console.log(`   ⚠️ SQL 실행 제한, 수동으로 처리 필요: ${error.message}`);
      } else {
        console.log('   ✅ 컬럼 추가 성공');
      }
    } catch (e) {
      console.log(`   ⚠️ 컬럼 추가 제한: ${e.message}`);
    }
  }
}

async function migrateData() {
  console.log('   apartments 테이블에서 데이터 마이그레이션...');
  
  try {
    // apartments 테이블의 데이터를 조회
    const { data: apartments, error: apartmentsError } = await supabase
      .from('apartments')
      .select('kapt_code, built_year, house_cnt, use_apr_day, heat_mthd')
      .limit(100);

    if (apartmentsError) {
      console.error('   ❌ apartments 데이터 조회 에러:', apartmentsError.message);
      return;
    }

    console.log(`   📊 마이그레이션할 데이터: ${apartments.length}개`);

    let successCount = 0;
    let errorCount = 0;

    // 배치로 업데이트 (제한된 권한으로 인해 개별 업데이트)
    for (const apt of apartments.slice(0, 10)) { // 테스트로 10개만
      try {
        const updateData = {};
        
        if (apt.built_year) updateData.build_year = parseInt(apt.built_year);
        if (apt.house_cnt) updateData.household_count = parseInt(apt.house_cnt);
        if (apt.heat_mthd) updateData.heating_type = apt.heat_mthd;

        const { error: updateError } = await supabase
          .from('apartment_complexes')
          .update(updateData)
          .eq('kapt_code', apt.kapt_code);

        if (updateError) {
          console.log(`   ⚠️ ${apt.kapt_code} 업데이트 실패: ${updateError.message}`);
          errorCount++;
        } else {
          successCount++;
        }
      } catch (e) {
        errorCount++;
      }
    }

    console.log(`   📈 마이그레이션 결과: 성공 ${successCount}, 실패 ${errorCount}`);
    
  } catch (error) {
    console.error('   ❌ 데이터 마이그레이션 에러:', error.message);
  }
}

async function validateFix() {
  try {
    // 수정된 스키마로 데이터 조회 테스트
    const { data, error } = await supabase
      .from('apartment_complexes')
      .select('name, kapt_code, build_year, household_count')
      .limit(5);

    if (error) {
      console.error('❌ 검증 실패:', error.message);
      
      if (error.message.includes('build_year does not exist')) {
        console.log('🔄 수동 스키마 수정이 필요합니다:');
        console.log('   1. Supabase 대시보드에서 apartment_complexes 테이블 열기');
        console.log('   2. 다음 컬럼들을 수동으로 추가:');
        console.log('      - build_year (INTEGER)');
        console.log('      - household_count (INTEGER)');
        console.log('      - floor_count (INTEGER)');
        console.log('      - total_area (DECIMAL)');
      }
    } else {
      console.log('✅ 스키마 수정 검증 성공!');
      console.log('📊 샘플 데이터:');
      data.forEach(item => {
        console.log(`   - ${item.name}: 건축년도 ${item.build_year || 'N/A'}, 세대수 ${item.household_count || 'N/A'}`);
      });
    }
  } catch (error) {
    console.error('❌ 검증 중 예상치 못한 에러:', error.message);
  }
}

fixDatabaseSchema().catch(console.error);