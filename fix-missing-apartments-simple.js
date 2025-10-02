#!/usr/bin/env node

/**
 * 단순히 apartments 테이블 데이터로 누락된 apartment_complexes 항목을 보완하는 스크립트
 * 정부 API가 작동하지 않으므로 기존 DB 데이터를 활용
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// 환경변수 로드
require('dotenv').config({ path: path.resolve(__dirname, '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * 누락된 아파트 단지 정보 간단히 보완
 */
async function fixMissingApartments() {
  try {
    console.log('🚀 누락된 아파트 단지 정보 간단 보완 시작');
    
    // 1. 현재 상태 확인
    const [apartmentCount, complexCount] = await Promise.all([
      supabase.from('apartments').select('*', { count: 'exact', head: true }),
      supabase.from('apartment_complexes').select('*', { count: 'exact', head: true })
    ]);
    
    console.log(`📊 현재 상태:`);
    console.log(`   - apartments: ${apartmentCount.count}개`);
    console.log(`   - apartment_complexes: ${complexCount.count}개`);
    console.log(`   - 차이: ${apartmentCount.count - complexCount.count}개 누락`);
    
    // 2. 기존 complex kapt_code들 조회
    const { data: existingComplexes } = await supabase
      .from('apartment_complexes')
      .select('kapt_code');
      
    const existingCodes = new Set(existingComplexes.map(c => c.kapt_code));
    
    console.log(`📋 기존 단지 코드: ${existingCodes.size}개`);
    
    // 3. 누락된 apartments 찾기 (작은 배치로)
    let missingApartments = [];
    let rangeStart = 0;
    const pageSize = 1000;
    
    while (true) {
      const { data: apartmentPage, error } = await supabase
        .from('apartments')
        .select('*')
        .range(rangeStart, rangeStart + pageSize - 1);
        
      if (error || !apartmentPage || apartmentPage.length === 0) {
        break;
      }
      
      const pageMissing = apartmentPage.filter(apt => !existingCodes.has(apt.kapt_code));
      missingApartments.push(...pageMissing);
      
      console.log(`   조회 중... ${rangeStart + apartmentPage.length}/${apartmentCount.count} (누락: ${missingApartments.length})`);
      
      if (apartmentPage.length < pageSize) {
        break;
      }
      rangeStart += pageSize;
    }
    
    console.log(`📋 실제 누락된 아파트: ${missingApartments.length}개`);
    
    if (missingApartments.length === 0) {
      console.log('✅ 누락된 데이터가 없습니다.');
      return;
    }
    
    // 4. 누락된 항목들을 apartment_complexes에 추가 (기본 정보로)
    console.log('\n🔄 누락된 아파트 단지 추가 시작...');
    
    let successCount = 0;
    let errorCount = 0;
    const batchSize = 25;
    
    for (let i = 0; i < missingApartments.length; i += batchSize) {
      const batch = missingApartments.slice(i, i + batchSize);
      
      console.log(`\n📦 배치 ${Math.floor(i / batchSize) + 1}/${Math.ceil(missingApartments.length / batchSize)} 처리 중... (${batch.length}개)`);
      
      const complexDataList = [];
      
      for (const apartment of batch) {
        try {
          // 기본 주소가 없는 경우 임시 주소 설정
          let address = apartment.jibun_address || apartment.road_address;
          if (!address) {
            address = `${apartment.sigungu || ''} ${apartment.eupmyeondong || ''}`.trim();
            if (!address) {
              address = '주소 정보 없음';
            }
          }
          
          const complexData = {
            kapt_code: apartment.kapt_code,
            name: apartment.name || '이름 없음',
            address: address,
            road_address: apartment.road_address || null,
            region_code: apartment.bjd_code,
            legal_dong: apartment.eupmyeondong,
            jibun: apartment.jibun_address?.split(' ').pop() || null,
            
            // 기본 정보
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
            
            // 추가 정보
            sigungu: apartment.sigungu,
            eupmyeondong: apartment.eupmyeondong,
            is_active: apartment.is_active !== false,
            
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          // NULL 값 정리
          Object.keys(complexData).forEach(key => {
            const value = complexData[key];
            if (value === undefined || value === null || value === '') {
              delete complexData[key];
            }
          });
          
          complexDataList.push(complexData);
          
        } catch (conversionError) {
          console.log(`    ❌ 데이터 변환 실패 (${apartment.kapt_code}): ${conversionError.message}`);
          errorCount++;
        }
      }
      
      // 배치 삽입
      if (complexDataList.length > 0) {
        const { error: insertError } = await supabase
          .from('apartment_complexes')
          .insert(complexDataList);

        if (insertError) {
          console.log(`    ❌ 삽입 실패: ${insertError.message}`);
          errorCount += complexDataList.length;
        } else {
          console.log(`    ✅ 성공: ${complexDataList.length}개 추가`);
          successCount += complexDataList.length;
        }
      }
      
      // 진행률
      const progress = Math.round(((i + batch.length) / missingApartments.length) * 100);
      console.log(`    📈 진행률: ${progress}% (성공: ${successCount}, 실패: ${errorCount})`);
    }
    
    // 5. 최종 결과
    const { count: finalCount } = await supabase
      .from('apartment_complexes')
      .select('*', { count: 'exact', head: true });
      
    console.log('\n🎉 누락 데이터 보완 완료!');
    console.log(`📊 최종 결과:`);
    console.log(`   - 처리 대상: ${missingApartments.length}개`);
    console.log(`   - 성공: ${successCount}개`);
    console.log(`   - 실패: ${errorCount}개`);
    console.log(`   - 최종 단지 수: ${finalCount}개`);
    console.log(`   - 최종 커버리지: ${Math.round((finalCount / apartmentCount.count) * 100)}%`);
    
    if (finalCount >= apartmentCount.count) {
      console.log('🎯 완성! 모든 아파트에 대한 단지 정보가 준비되었습니다.');
    }
    
  } catch (error) {
    console.error('❌ 보완 작업 중 오류:', error.message);
    process.exit(1);
  }
}

// 스크립트 실행
if (require.main === module) {
  fixMissingApartments()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { fixMissingApartments };