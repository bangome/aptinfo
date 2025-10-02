const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://mswmryeypbbotogxdozq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zd21yeWV5cGJib3RvZ3hkb3pxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY4MzMzNDAsImV4cCI6MjA1MjQwOTM0MH0.Jp_LW2JjOaOYU2iVe4yWtWWJCOsY_w4x1AplpvbTKNw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  try {
    console.log('마이그레이션 파일을 읽는 중...');
    const migrationSql = fs.readFileSync('add-api-columns-migration.sql', 'utf8');
    
    console.log('마이그레이션을 적용하는 중...');
    
    // SQL을 여러 문장으로 분리하여 실행
    const statements = migrationSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('COMMENT'));
    
    console.log(`총 ${statements.length}개의 SQL 문을 실행합니다.`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`${i + 1}/${statements.length}: ${statement.substring(0, 50)}...`);
        
        const { error } = await supabase.rpc('exec_sql', { 
          sql_query: statement + ';' 
        });
        
        if (error) {
          console.error(`문장 ${i + 1} 실행 중 오류:`, error);
          // 컬럼이 이미 존재하는 경우는 무시
          if (!error.message?.includes('already exists')) {
            throw error;
          }
        }
      }
    }
    
    console.log('마이그레이션이 성공적으로 완료되었습니다!');
    
  } catch (error) {
    console.error('마이그레이션 실행 중 오류 발생:', error);
  }
}

applyMigration();