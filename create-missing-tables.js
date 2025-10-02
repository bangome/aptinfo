#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('환경변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createMissingTables() {
  try {
    console.log('🔧 누락된 테이블 생성 시작...');
    
    // 1. 편의시설 카테고리 테이블 생성
    console.log('📋 facility_categories 테이블 생성...');
    const facilityTableSQL = `
      CREATE TABLE IF NOT EXISTS public.facility_categories (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(100) NOT NULL UNIQUE,
          category VARCHAR(50) NOT NULL,
          description TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    
    const { error: facilityError } = await supabase.rpc('exec_sql', {
      sql: facilityTableSQL
    });
    
    if (facilityError) {
      console.log('facility_categories 테이블 생성 시도 실패, 다른 방법 시도...');
    } else {
      console.log('✅ facility_categories 테이블 생성 완료');
    }
    
    // 2. 아파트 시설 테이블 생성 
    console.log('🏢 apartment_facilities 테이블 생성...');
    const apartmentFacilitiesSQL = `
      CREATE TABLE IF NOT EXISTS public.apartment_facilities (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          complex_id UUID NOT NULL REFERENCES public.apartment_complexes(id) ON DELETE CASCADE,
          parking_total INTEGER,
          parking_surface INTEGER,
          parking_underground INTEGER,
          elevator_count INTEGER,
          elevator_management_type VARCHAR(50),
          cctv_count INTEGER,
          fire_alarm_type VARCHAR(50),
          emergency_power_capacity VARCHAR(50),
          electrical_contract_type VARCHAR(50),
          electrical_safety_manager BOOLEAN,
          water_supply_type VARCHAR(50),
          corridor_type VARCHAR(50),
          garbage_disposal_type VARCHAR(50),
          general_management_staff INTEGER,
          security_management_staff INTEGER,
          cleaning_management_staff INTEGER,
          disinfection_annual_count INTEGER,
          general_management_company VARCHAR(200),
          security_management_company VARCHAR(200),
          disinfection_management_type VARCHAR(50),
          disinfection_method VARCHAR(50),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    
    console.log('다른 방법으로 테이블 생성을 시도합니다...');
    
    // REST API를 사용해서 직접 테이블 생성 확인
    const { data: tableCheck, error: checkError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', [
        'apartment_facilities',
        'apartment_rent_transactions', 
        'facility_categories',
        'apartment_facility_mapping'
      ]);
    
    if (checkError) {
      console.log('테이블 확인 중 오류:', checkError.message);
    } else {
      console.log('현재 존재하는 테이블:', tableCheck.map(t => t.table_name));
    }
    
    // 간단한 삽입 테스트로 테이블 존재 여부 확인
    console.log('\n🧪 실제 테이블 접근 테스트:');
    
    // facility_categories 테스트
    try {
      const { data, error } = await supabase
        .from('facility_categories')
        .upsert([
          { name: '테스트시설', category: 'test', description: '테스트용' }
        ], { onConflict: 'name' });
      
      if (error) {
        console.log('❌ facility_categories 접근 불가:', error.message);
      } else {
        console.log('✅ facility_categories 접근 가능');
      }
    } catch (err) {
      console.log('❌ facility_categories 테이블 없음');
    }
    
  } catch (error) {
    console.error('❌ 작업 실패:', error.message);
  }
}

createMissingTables();