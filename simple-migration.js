const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://mswmryeypbbotogxdozq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zd21yeWV5cGJib3RvZ3hkb3pxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY4MzMzNDAsImV4cCI6MjA1MjQwOTM0MH0.Jp_LW2JjOaOYU2iVe4yWtWWJCOsY_w4x1AplpvbTKNw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('Supabase 연결 테스트 중...');
    
    // apartments 테이블에서 하나의 레코드만 가져와서 현재 컬럼 구조 확인
    const { data, error } = await supabase
      .from('apartments')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('연결 오류:', error);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('현재 테이블 컬럼들:');
      console.log(Object.keys(data[0]).join(', '));
      
      // 주차 관련 컬럼 확인
      const apartment = data[0];
      console.log('\n주차 관련 데이터:');
      console.log('total_parking_count:', apartment.total_parking_count);
      console.log('surface_parking_count:', apartment.surface_parking_count);
      console.log('underground_parking_count:', apartment.underground_parking_count);
      
      // 새로 추가하려는 컬럼 중 일부가 이미 존재하는지 확인
      const newColumns = ['code_mgr', 'kapt_mgr_cnt', 'kaptd_ecnt', 'kaptd_cccnt'];
      console.log('\n새 컬럼 존재 여부:');
      newColumns.forEach(col => {
        console.log(`${col}: ${apartment.hasOwnProperty(col) ? '존재' : '없음'}`);
      });
    }
    
  } catch (error) {
    console.error('테스트 중 오류:', error);
  }
}

testConnection();