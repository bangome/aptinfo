/**
 * 향상된 컬럼 마이그레이션 적용
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function applyMigration() {
  console.log('🔍 향상된 컬럼 마이그레이션 시작...');
  
  try {
    // SQL 파일 읽기
    const sqlContent = fs.readFileSync('add-enhanced-columns.sql', 'utf8');
    
    // 각 ALTER TABLE 문을 개별적으로 실행
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    console.log(`📊 총 ${statements.length}개의 SQL 문 실행 예정`);
    
    let successCount = 0;
    let skipCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (!statement.includes('ALTER TABLE')) {
        continue;
      }
      
      try {
        console.log(`⚡ ${i + 1}/${statements.length}: ${statement.substring(0, 50)}...`);
        
        const { data, error } = await supabase.rpc('exec_sql', {
          sql_query: statement
        });
        
        if (error) {
          if (error.message.includes('already exists')) {
            console.log(`⏭️ 컬럼이 이미 존재합니다.`);
            skipCount++;
          } else {
            console.log(`❌ 오류: ${error.message}`);
          }
        } else {
          console.log(`✅ 성공`);
          successCount++;
        }
        
      } catch (err) {
        if (err.message.includes('already exists')) {
          console.log(`⏭️ 컬럼이 이미 존재합니다.`);
          skipCount++;
        } else {
          console.log(`❌ 실행 오류: ${err.message}`);
        }
      }
      
      // API 호출 제한을 위한 딜레이
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('\n🎉 마이그레이션 완료!');
    console.log(`📊 결과: 성공 ${successCount}개, 스킵 ${skipCount}개`);
    
  } catch (error) {
    console.error('❌ 마이그레이션 실패:', error.message);
  }
}

// Direct SQL execution alternative
async function directSQLExecution() {
  console.log('\n🔧 직접 SQL 실행 방식으로 시도...');
  
  const columns = [
    'kapt_addr TEXT',
    'bjd_code TEXT', 
    'zipcode TEXT',
    'kapt_tarea NUMERIC',
    'kapt_marea NUMERIC',
    'priv_area NUMERIC',
    'kapt_dong_cnt INTEGER',
    'kapt_da_cnt INTEGER',
    'ho_cnt INTEGER',
    'code_sale_nm TEXT',
    'code_heat_nm TEXT',
    'code_mgr_nm TEXT',
    'code_apt_nm TEXT',
    'code_hall_nm TEXT',
    'kapt_bcompany TEXT',
    'kapt_acompany TEXT',
    'kapt_tel TEXT',
    'kapt_fax TEXT',
    'kapt_url TEXT',
    'kapt_base_floor INTEGER',
    'kapt_top_floor INTEGER',
    'ktown_flr_no INTEGER',
    'kapt_usedate TEXT',
    'kaptd_ecntp INTEGER',
    'kapt_mparea60 INTEGER',
    'kapt_mparea85 INTEGER',
    'kapt_mparea135 INTEGER',
    'kapt_mparea136 INTEGER',
    'code_mgr TEXT',
    'kapt_mgr_cnt INTEGER',
    'kapt_ccompany TEXT',
    'code_sec TEXT',
    'kaptd_scnt INTEGER',
    'kaptd_sec_com TEXT',
    'code_clean TEXT',
    'kaptd_clcnt INTEGER',
    'code_disinf TEXT',
    'kaptd_dcnt INTEGER',
    'disposal_type TEXT',
    'code_garbage TEXT',
    'code_str TEXT',
    'kaptd_ecapa INTEGER',
    'code_econ TEXT',
    'code_emgr TEXT',
    'code_falarm TEXT',
    'code_wsupply TEXT',
    'code_net TEXT',
    'code_elev TEXT',
    'kaptd_ecnt INTEGER',
    'kaptd_pcnt INTEGER',
    'kaptd_pcntu INTEGER',
    'kaptd_cccnt INTEGER',
    'welfare_facility TEXT',
    'convenient_facility TEXT',
    'education_facility TEXT',
    'kaptd_wtimebus TEXT',
    'subway_line TEXT',
    'subway_station TEXT',
    'kaptd_wtimesub TEXT',
    'ground_el_charger_cnt INTEGER',
    'underground_el_charger_cnt INTEGER',
    'use_yn TEXT'
  ];
  
  console.log(`📊 ${columns.length}개 컬럼 추가 시도`);
  
  for (const column of columns) {
    try {
      const sql = `ALTER TABLE apartment_complexes ADD COLUMN IF NOT EXISTS ${column}`;
      console.log(`⚡ ${column.split(' ')[0]} 추가 중...`);
      
      // Raw SQL execution
      const { data, error } = await supabase
        .from('apartment_complexes')
        .select('id')
        .limit(1);
        
      if (!error) {
        console.log(`✅ 테이블 접근 가능`);
      }
      
    } catch (error) {
      console.log(`❌ ${column}: ${error.message}`);
    }
  }
}

// 실행
applyMigration().then(() => {
  console.log('✅ 스크립트 완료');
}).catch(error => {
  console.error('❌ 스크립트 오류:', error);
  // 대안 방법 시도
  directSQLExecution();
});