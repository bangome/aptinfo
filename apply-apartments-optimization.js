#!/usr/bin/env node

/**
 * apartments 테이블 최적화 스크립트
 * 검색 페이지에 필요한 최소 필드만 유지
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// 환경변수 로드
require('dotenv').config({ path: path.resolve(__dirname, '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function optimizeApartmentsTable() {
  try {
    console.log('🔧 apartments 테이블 최적화 시작...');
    
    // 1. 백업 테이블 생성
    console.log('📋 백업 테이블 생성 중...');
    const { error: backupError } = await supabase.rpc('sql', {
      query: 'CREATE TABLE IF NOT EXISTS apartments_backup AS SELECT * FROM apartments;'
    });
    
    if (backupError) {
      console.error('❌ 백업 테이블 생성 실패:', backupError);
      return;
    }
    console.log('✅ 백업 테이블 생성 완료');

    // 2. 불필요한 컬럼들 삭제
    console.log('🗑️ 불필요한 컬럼들 삭제 중...');
    const columnsToRemove = [
      'building_area',
      'total_parking_count', 
      'surface_parking_count',
      'underground_parking_count',
      'construction_company',
      'architecture_company', 
      'management_office_tel',
      'management_office_fax',
      'website_url',
      'management_type',
      'heating_type',
      'hall_type',
      'apartment_type',
      'elevator_count',
      'cctv_count',
      'welfare_facilities',
      'convenient_facilities',
      'education_facilities',
      'bus_station_distance',
      'subway_line',
      'subway_station',
      'subway_distance', 
      'surface_ev_charger_count',
      'underground_ev_charger_count'
    ];

    for (const column of columnsToRemove) {
      const { error } = await supabase.rpc('sql', {
        query: `ALTER TABLE apartments DROP COLUMN IF EXISTS ${column};`
      });
      
      if (error) {
        console.warn(`⚠️ ${column} 컬럼 삭제 실패:`, error.message);
      } else {
        console.log(`✅ ${column} 컬럼 삭제 완료`);
      }
    }

    // 3. 기존 인덱스 삭제
    console.log('🗑️ 기존 인덱스 삭제 중...');
    const oldIndexes = [
      'idx_apartments_name',
      'idx_apartments_sigungu', 
      'idx_apartments_eupmyeondong'
    ];

    for (const index of oldIndexes) {
      const { error } = await supabase.rpc('sql', {
        query: `DROP INDEX IF EXISTS ${index};`
      });
      
      if (error) {
        console.warn(`⚠️ ${index} 인덱스 삭제 실패:`, error.message);
      } else {
        console.log(`✅ ${index} 인덱스 삭제 완료`);
      }
    }

    // 4. 최적화된 인덱스 생성
    console.log('🚀 최적화된 인덱스 생성 중...');
    const newIndexes = [
      'CREATE INDEX IF NOT EXISTS idx_apartments_search ON apartments(name, sigungu, eupmyeondong);',
      'CREATE INDEX IF NOT EXISTS idx_apartments_kapt_code ON apartments(kapt_code);',
      'CREATE INDEX IF NOT EXISTS idx_apartments_is_active ON apartments(is_active);',
      'CREATE INDEX IF NOT EXISTS idx_apartments_use_approval ON apartments(use_approval_date);'
    ];

    for (const indexQuery of newIndexes) {
      const { error } = await supabase.rpc('sql', { query: indexQuery });
      
      if (error) {
        console.warn(`⚠️ 인덱스 생성 실패:`, error.message);
      } else {
        console.log(`✅ 인덱스 생성 완료`);
      }
    }

    // 5. 통계 업데이트
    console.log('📊 테이블 통계 업데이트 중...');
    const { error: analyzeError } = await supabase.rpc('sql', {
      query: 'ANALYZE apartments;'
    });
    
    if (analyzeError) {
      console.warn('⚠️ 통계 업데이트 실패:', analyzeError.message);
    } else {
      console.log('✅ 통계 업데이트 완료');
    }

    console.log('🎉 apartments 테이블 최적화 완료!');
    console.log('📝 최종 구조:');
    console.log('   - id, kapt_code, name (기본 정보)');
    console.log('   - sido, sigungu, eupmyeondong, ri, bjd_code (지역 정보)');
    console.log('   - zipcode, jibun_address, road_address (주소 정보)');
    console.log('   - total_area, total_dong_count, total_household_count (규모 정보)');
    console.log('   - use_approval_date (건축년도 정보)');
    console.log('   - is_active, data_source (시스템 정보)');
    console.log('   - created_at, updated_at, last_updated_at (시간 정보)');

  } catch (error) {
    console.error('❌ 최적화 실패:', error);
    process.exit(1);
  }
}

// 실행
if (require.main === module) {
  optimizeApartmentsTable()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { optimizeApartmentsTable };