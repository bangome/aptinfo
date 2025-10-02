const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://saucdbvjjwqgvbhcylhv.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhdWNkYnZqandxZ3ZiaGN5bGh2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODAxMDQyNCwiZXhwIjoyMDczNTg2NDI0fQ.nHI5FAi6l29fyhkVRDmOeT3FJBV4_UsmM5_V28Bl-VA'
);

async function checkDatabaseStatus() {
  console.log('🔍 데이터베이스 상태 확인 시작...\n');

  // 테이블별 데이터 수 확인
  const tables = [
    'apartment_complexes',
    'apartment_facilities', 
    'apartment_trade_transactions',
    'apartment_rent_transactions',
    'management_fees',
    'apartments'
  ];

  console.log('📊 테이블별 데이터 수:');
  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.error(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: ${count || 0}개 데이터`);
      }
    } catch (e) {
      console.error(`❌ ${table}: ${e.message}`);
    }
  }

  console.log('\n📈 최근 업데이트된 아파트 (상위 10개):');
  try {
    const { data, error } = await supabase
      .from('apartments')
      .select('kapt_code, name, updated_at')
      .order('updated_at', { ascending: false })
      .limit(10);
    
    if (error) {
      console.error('❌ 아파트 데이터 조회 에러:', error.message);
    } else if (data && data.length > 0) {
      data.forEach(apt => {
        console.log(`- ${apt.name} (${apt.kapt_code}) - ${apt.updated_at}`);
      });
    } else {
      console.log('데이터 없음');
    }
  } catch (e) {
    console.error('❌ 아파트 조회 에러:', e.message);
  }

  console.log('\n💰 최근 관리비 데이터 (상위 10개):');
  try {
    const { data, error } = await supabase
      .from('management_fees')
      .select('kapt_name, year, month, total_fee, collection_date')
      .order('collection_date', { ascending: false })
      .limit(10);
    
    if (error) {
      console.error('❌ 관리비 데이터 조회 에러:', error.message);
    } else if (data && data.length > 0) {
      data.forEach(fee => {
        console.log(`- ${fee.kapt_name} (${fee.year}-${fee.month}): ${fee.total_fee?.toLocaleString() || 0}원`);
      });
    } else {
      console.log('관리비 데이터 없음');
    }
  } catch (e) {
    console.error('❌ 관리비 조회 에러:', e.message);
  }

  console.log('\n🏢 아파트 복합단지 샘플 데이터 (상위 5개):');
  try {
    const { data, error } = await supabase
      .from('apartment_complexes')
      .select('name, kapt_code, address, kapt_usedate, ho_cnt')
      .limit(5);
    
    if (error) {
      console.error('❌ 복합단지 데이터 조회 에러:', error.message);
    } else if (data && data.length > 0) {
      data.forEach(complex => {
        const buildYear = complex.kapt_usedate ? 
          new Date(complex.kapt_usedate).getFullYear() : 'N/A';
          
        console.log(`- ${complex.name} (${complex.kapt_code})`);
        console.log(`  주소: ${complex.address}`);
        console.log(`  건축년도: ${buildYear}, 세대수: ${complex.ho_cnt || 'N/A'}`);
      });
    } else {
      console.log('복합단지 데이터 없음');
    }
  } catch (e) {
    console.error('❌ 복합단지 조회 에러:', e.message);
  }
}

checkDatabaseStatus().catch(console.error);