#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkRawData() {
  try {
    console.log('=== RAW 데이터 확인 (필터 없음) ===');
    
    const [apartments, complexes] = await Promise.all([
      supabase.from('apartments').select('kapt_code'),
      supabase.from('apartment_complexes').select('kapt_code')
    ]);
    
    if (apartments.error || complexes.error) {
      console.error('조회 에러:', apartments.error || complexes.error);
      return;
    }
    
    console.log('apartments 테이블 RAW count:', apartments.data?.length || 0);
    console.log('apartment_complexes 테이블 RAW count:', complexes.data?.length || 0);
    
    if (apartments.data && complexes.data) {
      const existingCodes = new Set(complexes.data.map(c => c.kapt_code));
      const missingApartments = apartments.data.filter(apt => !existingCodes.has(apt.kapt_code));
      
      console.log('실제 누락 카운트:', missingApartments.length);
      console.log('실제 커버리지:', Math.round((complexes.data.length / apartments.data.length) * 100) + '%');
      
      if (missingApartments.length > 0) {
        console.log('\n처음 10개 누락된 kapt_code:');
        missingApartments.slice(0, 10).forEach((apt, idx) => {
          console.log(`${idx + 1}. ${apt.kapt_code}`);
        });
      }
    }
    
  } catch (error) {
    console.error('에러:', error.message);
  }
}

checkRawData();