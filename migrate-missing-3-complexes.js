#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// 환경변수 로드
require('dotenv').config({ path: path.resolve(__dirname, '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function migrateMissingComplexes() {
  try {
    console.log('🚀 누락된 3개 아파트 단지 마이그레이션 시작');
    
    // 누락된 kapt_code 리스트
    const missingCodes = ['A13377703', 'A14272308', 'A13204406'];
    
    for (const kaptCode of missingCodes) {
      console.log(`\n처리 중: ${kaptCode}`);
      
      // 1. apartments 테이블에서 해당 데이터 조회
      const { data: apartment, error: fetchError } = await supabase
        .from('apartments')
        .select('*')
        .eq('kapt_code', kaptCode)
        .single();
        
      if (fetchError) {
        console.error(`❌ 조회 실패 (${kaptCode}):`, fetchError);
        continue;
      }
      
      if (!apartment) {
        console.log(`⚠️  데이터 없음 (${kaptCode})`);
        continue;
      }
      
      console.log(`📊 발견: ${apartment.name}`);
      
      // 2. apartment_complexes 형식으로 변환
      const complexData = {
        kapt_code: apartment.kapt_code,
        name: apartment.name,
        address: apartment.jibun_address,
        road_address: apartment.road_address,
        region_code: apartment.bjd_code,
        legal_dong: apartment.eupmyeondong,
        jibun: apartment.jibun_address?.split(' ').pop(), // 지번만 추출
        
        // API 필드들
        kapt_addr: apartment.jibun_address,
        bjd_code: apartment.bjd_code,
        zipcode: apartment.zipcode,
        kapt_tarea: apartment.total_area,
        kapt_dong_cnt: apartment.total_dong_count,
        ho_cnt: apartment.total_household_count,
        kapt_usedate: apartment.use_approval_date,
        
        // 시설 정보
        kapt_bcompany: apartment.construction_company,
        kapt_acompany: apartment.architecture_company,
        kapt_tel: apartment.management_office_tel,
        kapt_fax: apartment.management_office_fax,
        kapt_url: apartment.website_url,
        
        welfare_facility: apartment.welfare_facilities,
        convenient_facility: apartment.convenient_facilities,
        education_facility: apartment.education_facilities,
        
        subway_line: apartment.subway_line,
        subway_station: apartment.subway_station,
        kaptd_wtimesub: apartment.subway_distance,
        kaptd_wtimebus: apartment.bus_station_distance,
        
        kaptd_pcnt: apartment.surface_parking_count,
        kaptd_pcntu: apartment.underground_parking_count,
        
        ground_el_charger_cnt: apartment.surface_ev_charger_count,
        underground_el_charger_cnt: apartment.underground_ev_charger_cnt,
        
        // 추가 필드
        sigungu: apartment.sigungu,
        eupmyeondong: apartment.eupmyeondong,
        is_active: apartment.is_active,
        
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // NULL 값 제거
      Object.keys(complexData).forEach(key => {
        if (complexData[key] === undefined || complexData[key] === null) {
          delete complexData[key];
        }
      });

      // 3. INSERT 실행
      const { error: insertError } = await supabase
        .from('apartment_complexes')
        .insert(complexData);

      if (insertError) {
        console.error(`❌ 삽입 실패 (${apartment.name}):`, insertError);
      } else {
        console.log(`✅ 완료: ${apartment.name}`);
      }
    }

    console.log('\n🎉 누락된 아파트 단지 마이그레이션 완료!');
    
    // 최종 확인
    const { count: finalCount, error: countError } = await supabase
      .from('apartment_complexes')
      .select('*', { count: 'exact', head: true });
      
    if (!countError) {
      console.log(`📊 최종 아파트 단지 수: ${finalCount}개`);
    }
    
  } catch (error) {
    console.error('❌ 마이그레이션 실패:', error);
    process.exit(1);
  }
}

// 실행
if (require.main === module) {
  migrateMissingComplexes()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { migrateMissingComplexes };