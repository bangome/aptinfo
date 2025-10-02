/**
 * 실제 데이터베이스 테이블 스키마 확인
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkTableSchema() {
  console.log('🔍 apartment_complexes 테이블 스키마 확인...');
  
  try {
    // 테이블에서 하나의 레코드를 가져와서 컬럼 구조 확인
    const { data, error } = await supabase
      .from('apartment_complexes')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ 테이블 조회 오류:', error.message);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('✅ 테이블 스키마 (첫 번째 레코드 기준):');
      const record = data[0];
      const columns = Object.keys(record);
      
      console.log('\n📋 사용 가능한 컬럼들:');
      columns.forEach((col, index) => {
        const value = record[col];
        const type = typeof value;
        console.log(`${index + 1}. ${col} (${type}): ${value || 'null'}`);
      });
      
      console.log('\n📝 최소한 필요한 컬럼들 확인:');
      const requiredColumns = ['kapt_code', 'name', 'sido', 'sigungu'];
      requiredColumns.forEach(col => {
        if (columns.includes(col)) {
          console.log(`✅ ${col}: 존재`);
        } else {
          console.log(`❌ ${col}: 없음`);
        }
      });
      
    } else {
      console.log('❌ 테이블에 데이터가 없습니다.');
    }
    
  } catch (error) {
    console.error('❌ 스키마 확인 실패:', error.message);
  }
}

checkTableSchema();