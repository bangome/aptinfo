#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('환경변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('🔗 Supabase 연결 테스트 중...');
    
    // 1. 기본 연결 테스트
    const { data, error } = await supabase
      .from('apartment_complexes')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ 연결 실패:', error.message);
      return;
    }
    
    console.log('✅ Supabase 연결 성공!');
    
    // 2. 테이블 존재 여부 확인
    const tables = [
      'apartment_complexes',
      'apartment_facilities', 
      'apartment_trade_transactions',
      'apartment_rent_transactions',
      'facility_categories',
      'apartment_facility_mapping'
    ];
    
    console.log('\n📋 테이블 존재 여부 확인:');
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`❌ ${table}: ${error.message}`);
        } else {
          console.log(`✅ ${table}: 정상`);
        }
      } catch (err) {
        console.log(`❌ ${table}: ${err.message}`);
      }
    }
    
    // 3. 기본 편의시설 데이터 확인
    console.log('\n🏢 편의시설 데이터 확인:');
    const { data: facilities, error: facilitiesError } = await supabase
      .from('facility_categories')
      .select('*')
      .limit(5);
    
    if (facilitiesError) {
      console.log('❌ 편의시설 데이터 조회 실패:', facilitiesError.message);
    } else {
      console.log(`✅ 편의시설 데이터: ${facilities.length}개 확인`);
      facilities.forEach(f => console.log(`  - ${f.name} (${f.category})`));
    }
    
  } catch (error) {
    console.error('❌ 테스트 실패:', error.message);
  }
}

testConnection();