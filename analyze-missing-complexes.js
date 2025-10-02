#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// 환경변수 로드
require('dotenv').config({ path: path.resolve(__dirname, '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function analyzeData() {
  try {
    console.log('=== 데이터 비교 분석 ===');
    
    // 1. 단지 테이블의 모든 kapt_code 조회
    const { data: complexes, error: err1 } = await supabase
      .from('apartment_complexes')
      .select('kapt_code');
    
    if (err1) {
      console.error('단지 조회 에러:', err1);
      return;
    }

    // 2. 아파트 테이블의 모든 kapt_code 조회 (활성 상태만)
    const { data: apartments, error: err2 } = await supabase
      .from('apartments')
      .select('kapt_code, name')
      .eq('is_active', true);
      
    if (err2) {
      console.error('아파트 조회 에러:', err2);
      return;
    }

    console.log('단지 테이블 kapt_code 수:', complexes?.length || 0);
    console.log('아파트 테이블 kapt_code 수:', apartments?.length || 0);

    // 3. 누락된 아파트 단지 찾기
    const complexCodes = new Set(complexes?.map(c => c.kapt_code) || []);
    const missing = apartments?.filter(apt => !complexCodes.has(apt.kapt_code)) || [];

    console.log('\n=== 누락 분석 결과 ===');
    console.log('누락된 아파트 단지 수:', missing.length);
    
    if (missing.length > 0) {
      console.log('\n처음 10개 누락 예시:');
      missing.slice(0, 10).forEach((apt, idx) => {
        console.log(`${idx + 1}. ${apt.name} (${apt.kapt_code})`);
      });
      
      console.log('\n=== 샘플 데이터 테스트 ===');
      // 첫 번째 누락 아파트 정보 상세 조회
      const sample = missing[0];
      const { data: sampleData, error: sampleError } = await supabase
        .from('apartments')
        .select('*')
        .eq('kapt_code', sample.kapt_code)
        .single();
        
      if (!sampleError && sampleData) {
        console.log('샘플 아파트 정보:', {
          kapt_code: sampleData.kapt_code,
          name: sampleData.name,
          jibun_address: sampleData.jibun_address,
          is_active: sampleData.is_active
        });
      }
    } else {
      console.log('✅ 모든 아파트 단지 데이터가 이미 동기화되어 있습니다.');
    }
    
  } catch (error) {
    console.error('❌ 분석 실패:', error);
  }
}

// 실행
if (require.main === module) {
  analyzeData()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { analyzeData };