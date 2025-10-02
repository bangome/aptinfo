#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// 환경변수 로드
require('dotenv').config({ path: path.resolve(__dirname, '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function completeMigration() {
  try {
    console.log('🚀 완전한 아파트 단지 마이그레이션 시작');
    
    // 1. 먼저 현재 상황 파악
    const [complexes, apartments] = await Promise.all([
      supabase.from('apartment_complexes').select('kapt_code'),
      supabase.from('apartments').select('kapt_code, name').eq('is_active', true)
    ]);
    
    if (complexes.error || apartments.error) {
      throw new Error('초기 데이터 조회 실패');
    }
    
    console.log(`📊 현재 상황:`);
    console.log(`   - 아파트 단지: ${complexes.data.length}개`);
    console.log(`   - 활성 아파트: ${apartments.data.length}개`);
    
    // 2. 누락된 kapt_code 찾기
    const existingCodes = new Set(complexes.data.map(c => c.kapt_code));
    const missingApartments = apartments.data.filter(apt => !existingCodes.has(apt.kapt_code));
    
    console.log(`📋 마이그레이션 필요: ${missingApartments.length}개 아파트`);
    
    if (missingApartments.length === 0) {
      console.log('✅ 모든 데이터가 이미 동기화되어 있습니다.');
      return;
    }
    
    // 3. 배치 단위로 마이그레이션 (100개씩)
    const batchSize = 100;
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < missingApartments.length; i += batchSize) {
      const batch = missingApartments.slice(i, i + batchSize);
      console.log(`\n🔄 배치 ${Math.floor(i / batchSize) + 1}/${Math.ceil(missingApartments.length / batchSize)} 처리 중... (${batch.length}개)`);
      
      // 배치의 모든 아파트 상세 정보 조회
      const batchCodes = batch.map(apt => apt.kapt_code);
      const { data: batchDetails, error: detailError } = await supabase
        .from('apartments')
        .select('*')
        .in('kapt_code', batchCodes);
        
      if (detailError) {
        console.error(`❌ 배치 상세 조회 실패:`, detailError);
        errorCount += batch.length;
        continue;
      }
      
      // 변환된 데이터 준비
      const complexDataList = batchDetails.map(apartment => {
        const complexData = {
          kapt_code: apartment.kapt_code,
          name: apartment.name,
          address: apartment.jibun_address,
          road_address: apartment.road_address,
          region_code: apartment.bjd_code,
          legal_dong: apartment.eupmyeondong,
          jibun: apartment.jibun_address?.split(' ').pop(),
          
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
        
        return complexData;
      });
      
      // 배치 삽입
      const { error: batchInsertError } = await supabase
        .from('apartment_complexes')
        .insert(complexDataList);

      if (batchInsertError) {
        console.error(`❌ 배치 삽입 실패:`, batchInsertError);
        errorCount += batch.length;
      } else {
        successCount += batch.length;
        console.log(`✅ 성공: ${batch.length}개 아파트 단지 추가`);
      }
      
      // 진행률 표시
      const progress = Math.round(((i + batch.length) / missingApartments.length) * 100);
      console.log(`📈 진행률: ${progress}% (성공: ${successCount}, 실패: ${errorCount})`);
    }

    console.log('\n🎉 마이그레이션 완료!');
    console.log(`📊 결과 요약:`);
    console.log(`   - 성공: ${successCount}개`);
    console.log(`   - 실패: ${errorCount}개`);
    
    // 최종 확인
    const { count: finalCount, error: countError } = await supabase
      .from('apartment_complexes')
      .select('*', { count: 'exact', head: true });
      
    if (!countError) {
      console.log(`📊 최종 아파트 단지 수: ${finalCount}개`);
      
      const finalCoverage = Math.round((finalCount / apartments.data.length) * 100);
      console.log(`📊 최종 커버리지: ${finalCoverage}%`);
    }
    
  } catch (error) {
    console.error('❌ 마이그레이션 실패:', error);
    process.exit(1);
  }
}

// 실행
if (require.main === module) {
  completeMigration()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { completeMigration };