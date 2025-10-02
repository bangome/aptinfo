#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkActualMissing() {
  try {
    console.log('🔍 실제 누락된 아파트 단지 확인...\n');
    
    const [apartments, complexes] = await Promise.all([
      supabase.from('apartments').select('kapt_code'),
      supabase.from('apartment_complexes').select('kapt_code')
    ]);
    
    console.log('📊 현재 상태:');
    console.log(`   apartments 테이블: ${apartments.data?.length || 0}개`);
    console.log(`   apartment_complexes 테이블: ${complexes.data?.length || 0}개`);
    
    if (apartments.data && complexes.data) {
      const existingCodes = new Set(complexes.data.map(c => c.kapt_code));
      const actualMissing = apartments.data.filter(apt => !existingCodes.has(apt.kapt_code));
      
      console.log(`   실제 누락: ${actualMissing.length}개\n`);
      
      if (actualMissing.length > 0) {
        console.log('📋 누락된 아파트 코드 (처음 10개):');
        actualMissing.slice(0, 10).forEach((apt, i) => {
          console.log(`   ${i+1}. ${apt.kapt_code}`);
        });
        
        console.log(`\n✅ ${actualMissing.length}개의 아파트 단지 정보를 정부 API에서 보완할 수 있습니다.`);
        return actualMissing;
      } else {
        console.log('🎉 모든 아파트 단지 정보가 이미 존재합니다!');
        console.log('👉 대신 기존 데이터의 품질을 개선할 수 있습니다.');
        return [];
      }
    }
  } catch (error) {
    console.error('❌ 오류:', error.message);
    return [];
  }
}

checkActualMissing();