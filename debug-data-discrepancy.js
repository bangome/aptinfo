#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function debugDiscrepancy() {
  try {
    console.log('=== 데이터 불일치 디버깅 ===');
    
    // 1. 두 방식으로 count 확인
    console.log('\n1️⃣ SELECT count() 방식:');
    const [apartmentCount, complexCount] = await Promise.all([
      supabase.from('apartments').select('*', { count: 'exact', head: true }),
      supabase.from('apartment_complexes').select('*', { count: 'exact', head: true })
    ]);
    
    if (apartmentCount.error || complexCount.error) {
      console.error('카운트 에러:', apartmentCount.error || complexCount.error);
      return;
    }
    
    console.log(`apartments count: ${apartmentCount.count}`);
    console.log(`apartment_complexes count: ${complexCount.count}`);
    
    // 2. 실제 데이터 조회 방식
    console.log('\n2️⃣ SELECT data 방식:');
    const [apartmentData, complexData] = await Promise.all([
      supabase.from('apartments').select('kapt_code, name, is_active'),
      supabase.from('apartment_complexes').select('kapt_code, name')
    ]);
    
    if (apartmentData.error || complexData.error) {
      console.error('데이터 조회 에러:', apartmentData.error || complexData.error);
      return;
    }
    
    console.log(`apartments data length: ${apartmentData.data?.length || 0}`);
    console.log(`apartment_complexes data length: ${complexData.data?.length || 0}`);
    
    // 3. is_active 필터 확인
    if (apartmentData.data) {
      const activeCount = apartmentData.data.filter(apt => apt.is_active === true).length;
      const inactiveCount = apartmentData.data.filter(apt => apt.is_active === false).length;
      const nullCount = apartmentData.data.filter(apt => apt.is_active === null || apt.is_active === undefined).length;
      
      console.log('\n3️⃣ is_active 상태 분석:');
      console.log(`활성(true): ${activeCount}개`);
      console.log(`비활성(false): ${inactiveCount}개`);
      console.log(`null/undefined: ${nullCount}개`);
      console.log(`총계: ${activeCount + inactiveCount + nullCount}개`);
    }
    
    // 4. 실제 차이 분석
    if (apartmentData.data && complexData.data) {
      const apartmentCodes = new Set(apartmentData.data.map(apt => apt.kapt_code));
      const complexCodes = new Set(complexData.data.map(comp => comp.kapt_code));
      
      const onlyInApartments = apartmentData.data.filter(apt => !complexCodes.has(apt.kapt_code));
      const onlyInComplexes = complexData.data.filter(comp => !apartmentCodes.has(comp.kapt_code));
      
      console.log('\n4️⃣ 차이 분석:');
      console.log(`apartments에만 있는 항목: ${onlyInApartments.length}개`);
      console.log(`complexes에만 있는 항목: ${onlyInComplexes.length}개`);
      
      if (onlyInApartments.length > 0) {
        console.log('\napartments에만 있는 첫 5개:');
        onlyInApartments.slice(0, 5).forEach((apt, idx) => {
          console.log(`${idx + 1}. ${apt.kapt_code} - ${apt.name} (활성: ${apt.is_active})`);
        });
      }
      
      if (onlyInComplexes.length > 0) {
        console.log('\ncomplexes에만 있는 첫 5개:');
        onlyInComplexes.slice(0, 5).forEach((comp, idx) => {
          console.log(`${idx + 1}. ${comp.kapt_code} - ${comp.name}`);
        });
      }
    }
    
    // 5. 중복 확인
    if (apartmentData.data && complexData.data) {
      const apartmentCodeCounts = {};
      apartmentData.data.forEach(apt => {
        apartmentCodeCounts[apt.kapt_code] = (apartmentCodeCounts[apt.kapt_code] || 0) + 1;
      });
      
      const complexCodeCounts = {};
      complexData.data.forEach(comp => {
        complexCodeCounts[comp.kapt_code] = (complexCodeCounts[comp.kapt_code] || 0) + 1;
      });
      
      const apartmentDuplicates = Object.entries(apartmentCodeCounts).filter(([code, count]) => count > 1);
      const complexDuplicates = Object.entries(complexCodeCounts).filter(([code, count]) => count > 1);
      
      console.log('\n5️⃣ 중복 확인:');
      console.log(`apartments 테이블 중복: ${apartmentDuplicates.length}개`);
      console.log(`complexes 테이블 중복: ${complexDuplicates.length}개`);
      
      if (apartmentDuplicates.length > 0) {
        console.log('apartments 중복 항목:', apartmentDuplicates.slice(0, 3));
      }
      if (complexDuplicates.length > 0) {
        console.log('complexes 중복 항목:', complexDuplicates.slice(0, 3));
      }
    }
    
  } catch (error) {
    console.error('디버깅 에러:', error.message);
  }
}

debugDiscrepancy();