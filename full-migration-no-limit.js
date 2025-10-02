#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// 환경변수 로드
require('dotenv').config({ path: path.resolve(__dirname, '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function fullMigrationWithoutLimit() {
  try {
    console.log('🚀 Supabase limit 우회한 전체 마이그레이션 시작');
    
    // 1. 실제 데이터 카운트 확인
    const [apartmentCount, complexCount] = await Promise.all([
      supabase.from('apartments').select('*', { count: 'exact', head: true }),
      supabase.from('apartment_complexes').select('*', { count: 'exact', head: true })
    ]);
    
    if (apartmentCount.error || complexCount.error) {
      throw new Error('카운트 조회 실패: ' + (apartmentCount.error?.message || complexCount.error?.message));
    }
    
    console.log(`📊 실제 현황:`);
    console.log(`   - apartments 테이블: ${apartmentCount.count}개`);
    console.log(`   - apartment_complexes 테이블: ${complexCount.count}개`);
    console.log(`   - 차이: ${apartmentCount.count - complexCount.count}개 부족`);
    
    // 2. 기존 apartment_complexes kapt_code 목록 조회 (페이지네이션)
    console.log('\n🔍 기존 apartment_complexes 데이터 조회 중...');
    let existingCodes = new Set();
    let rangeStart = 0;
    const pageSize = 1000;
    
    while (true) {
      const { data: complexPage, error: complexError } = await supabase
        .from('apartment_complexes')
        .select('kapt_code')
        .range(rangeStart, rangeStart + pageSize - 1);
        
      if (complexError) {
        throw new Error('복합체 데이터 조회 실패: ' + complexError.message);
      }
      
      if (!complexPage || complexPage.length === 0) {
        break;
      }
      
      complexPage.forEach(comp => existingCodes.add(comp.kapt_code));
      rangeStart += pageSize;
      
      console.log(`   조회됨: ${existingCodes.size}개...`);
      
      if (complexPage.length < pageSize) {
        break; // 마지막 페이지
      }
    }
    
    console.log(`✅ 기존 복합체 코드 ${existingCodes.size}개 조회 완료`);
    
    // 3. apartments 데이터 페이지네이션으로 조회하며 마이그레이션
    console.log('\n🔄 아파트 데이터 마이그레이션 시작...');
    let totalProcessed = 0;
    let totalSuccess = 0;
    let totalError = 0;
    rangeStart = 0;
    
    while (true) {
      console.log(`\n📄 페이지 ${Math.floor(rangeStart / pageSize) + 1} 처리 중 (${rangeStart + 1}~${rangeStart + pageSize})...`);
      
      const { data: apartmentPage, error: apartmentError } = await supabase
        .from('apartments')
        .select('*')
        .range(rangeStart, rangeStart + pageSize - 1);
        
      if (apartmentError) {
        console.error('❌ 아파트 데이터 조회 실패:', apartmentError.message);
        break;
      }
      
      if (!apartmentPage || apartmentPage.length === 0) {
        console.log('✅ 모든 페이지 처리 완료');
        break;
      }
      
      console.log(`   ${apartmentPage.length}개 아파트 데이터 조회됨`);
      totalProcessed += apartmentPage.length;
      
      // 누락된 항목만 필터링
      const missingApartments = apartmentPage.filter(apt => !existingCodes.has(apt.kapt_code));
      console.log(`   누락된 항목: ${missingApartments.length}개`);
      
      if (missingApartments.length > 0) {
        // 배치 크기를 작게 하여 안정성 확보
        const insertBatchSize = 25;
        
        for (let i = 0; i < missingApartments.length; i += insertBatchSize) {
          const insertBatch = missingApartments.slice(i, i + insertBatchSize);
          
          // 데이터 변환
          const complexDataList = insertBatch.map(apartment => {
            const complexData = {
              kapt_code: apartment.kapt_code,
              name: apartment.name,
              address: apartment.jibun_address,
              road_address: apartment.road_address,
              region_code: apartment.bjd_code,
              legal_dong: apartment.eupmyeondong,
              jibun: apartment.jibun_address?.split(' ').pop() || '',
              
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

            // NULL/undefined 값 정리
            Object.keys(complexData).forEach(key => {
              const value = complexData[key];
              if (value === undefined || value === null) {
                delete complexData[key];
              } else if (typeof value === 'string' && value.trim() === '') {
                delete complexData[key];
              }
            });
            
            return complexData;
          });
          
          // 삽입 시도
          const { error: insertError } = await supabase
            .from('apartment_complexes')
            .insert(complexDataList);

          if (insertError) {
            console.error(`❌ 삽입 실패 (배치 ${Math.floor(i / insertBatchSize) + 1}):`, insertError.message);
            totalError += insertBatch.length;
          } else {
            console.log(`✅ 삽입 성공: ${insertBatch.length}개`);
            totalSuccess += insertBatch.length;
            
            // 성공한 코드들을 existingCodes에 추가
            insertBatch.forEach(apt => existingCodes.add(apt.kapt_code));
          }
          
          // API 레이트 제한 방지
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }
      
      // 다음 페이지로
      rangeStart += pageSize;
      
      if (apartmentPage.length < pageSize) {
        break; // 마지막 페이지
      }
      
      // 진행률 표시
      const progress = Math.round((rangeStart / apartmentCount.count) * 100);
      console.log(`📈 전체 진행률: ${progress}% (처리: ${totalProcessed}, 성공: ${totalSuccess}, 실패: ${totalError})`);
    }

    console.log('\n🎉 마이그레이션 완료!');
    console.log(`📊 최종 결과:`);
    console.log(`   - 전체 처리: ${totalProcessed}개`);
    console.log(`   - 마이그레이션 성공: ${totalSuccess}개`);
    console.log(`   - 마이그레이션 실패: ${totalError}개`);
    
    // 최종 확인
    const { count: finalCount, error: finalCountError } = await supabase
      .from('apartment_complexes')
      .select('*', { count: 'exact', head: true });
      
    if (!finalCountError) {
      console.log(`📊 최종 아파트 단지 수: ${finalCount}개`);
      const finalCoverage = Math.round((finalCount / apartmentCount.count) * 100);
      console.log(`📊 최종 커버리지: ${finalCoverage}% (${finalCount}/${apartmentCount.count})`);
      
      if (finalCount >= apartmentCount.count * 0.99) { // 99% 이상이면 성공으로 간주
        console.log(`🎯 마이그레이션 성공! 거의 모든 데이터가 완성되었습니다.`);
      }
    }
    
  } catch (error) {
    console.error('❌ 마이그레이션 실패:', error.message);
    console.error('상세:', error);
    process.exit(1);
  }
}

// 실행
if (require.main === module) {
  fullMigrationWithoutLimit()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { fullMigrationWithoutLimit };