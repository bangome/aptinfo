#!/usr/bin/env node

/**
 * apartments 테이블의 상세 정보를 apartment_complexes 테이블로 이관
 * 상세 페이지용 데이터는 apartment_complexes에 저장
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// 환경변수 로드
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function migrateData() {
  try {
    console.log('🚀 데이터 마이그레이션 시작');
    
    // 1. apartments 테이블에서 apartment_complexes에 없는 데이터 조회 (모든 데이터)
    const { data: apartmentsOnly, error: queryError } = await supabase
      .from('apartments')
      .select('*')
      .eq('is_active', true)
      .not('kapt_code', 'in', 
        '(SELECT kapt_code FROM apartment_complexes WHERE kapt_code IS NOT NULL)'
      );

    if (queryError) {
      throw queryError;
    }

    console.log(`📊 마이그레이션 대상: ${apartmentsOnly?.length || 0}개 아파트`);

    if (!apartmentsOnly || apartmentsOnly.length === 0) {
      console.log('✅ 모든 데이터가 이미 동기화되어 있습니다.');
      return;
    }

    // 2. apartment_complexes 테이블로 데이터 이관
    for (const apt of apartmentsOnly) {
      console.log(`처리 중: ${apt.name} (${apt.kapt_code})`);
      
      // apartment_complexes 테이블 형식으로 변환
      const complexData = {
        kapt_code: apt.kapt_code,
        name: apt.name,
        address: apt.jibun_address,
        road_address: apt.road_address,
        region_code: apt.bjd_code,
        legal_dong: apt.eupmyeondong,
        jibun: apt.jibun_address?.split(' ').pop(), // 지번만 추출
        
        // API 필드들 (apartments 테이블에서 가져올 수 있는 것들)
        kapt_addr: apt.jibun_address,
        bjd_code: apt.bjd_code,
        zipcode: apt.zipcode,
        kapt_tarea: apt.total_area,
        kapt_dong_cnt: apt.total_dong_count,
        ho_cnt: apt.total_household_count,
        kapt_usedate: apt.use_approval_date,
        
        // 시설 정보 (있는 경우만)
        kapt_bcompany: apt.construction_company,
        kapt_acompany: apt.architecture_company,
        kapt_tel: apt.management_office_tel,
        kapt_fax: apt.management_office_fax,
        kapt_url: apt.website_url,
        
        welfare_facility: apt.welfare_facilities,
        convenient_facility: apt.convenient_facilities,
        education_facility: apt.education_facilities,
        
        subway_line: apt.subway_line,
        subway_station: apt.subway_station,
        kaptd_wtimesub: apt.subway_distance,
        kaptd_wtimebus: apt.bus_station_distance,
        
        kaptd_pcnt: apt.surface_parking_count,
        kaptd_pcntu: apt.underground_parking_count,
        
        ground_el_charger_cnt: apt.surface_ev_charger_count,
        underground_el_charger_cnt: apt.underground_ev_charger_cnt,
        
        // 추가 필드
        sigungu: apt.sigungu,
        eupmyeondong: apt.eupmyeondong,
        is_active: apt.is_active,
        
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // NULL 값 제거 (undefined 필드 제거)
      Object.keys(complexData).forEach(key => {
        if (complexData[key] === undefined || complexData[key] === null) {
          delete complexData[key];
        }
      });

      // UPSERT 실행
      const { error: upsertError } = await supabase
        .from('apartment_complexes')
        .upsert(complexData, {
          onConflict: 'kapt_code'
        });

      if (upsertError) {
        console.error(`❌ 에러 (${apt.name}):`, upsertError);
      } else {
        console.log(`✅ 완료: ${apt.name}`);
      }
    }

    console.log('🎉 마이그레이션 완료!');
    
  } catch (error) {
    console.error('❌ 마이그레이션 실패:', error);
    process.exit(1);
  }
}

// 실행
if (require.main === module) {
  migrateData()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { migrateData };